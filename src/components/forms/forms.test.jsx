import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

import { v } from '@/lib/validation';

import { FormInput } from './fields';
import { Form, FormSubmit } from './Form';
import { ImageUploadControl } from './ImageUpload';
import { OtpBoxes } from './OtpInput';

describe('Form', () => {
  const schema = z.object({ email: v.email() });

  it('shows client validation errors under the field', async () => {
    const onSubmit = vi.fn();
    render(
      <Form schema={schema} defaultValues={{ email: '' }} onSubmit={onSubmit}>
        <FormInput name="email" label="Email" />
        <FormSubmit>Continue</FormSubmit>
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Enter your email address')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('maps server fieldErrors onto inputs', async () => {
    render(
      <Form
        schema={schema}
        defaultValues={{ email: 'ada@example.com' }}
        onSubmit={() =>
          Promise.reject({
            response: {
              status: 422,
              data: {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Check the form',
                  fieldErrors: { email: 'That email is already registered' },
                },
              },
            },
          })
        }
      >
        <FormInput name="email" label="Email" />
        <FormSubmit>Continue</FormSubmit>
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('That email is already registered')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows non-field server errors above the form', async () => {
    render(
      <Form
        schema={schema}
        defaultValues={{ email: 'ada@example.com' }}
        onSubmit={() => Promise.reject({ response: { status: 500, data: {} } })}
      >
        <FormInput name="email" label="Email" />
        <FormSubmit>Continue</FormSubmit>
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/on our side/);
  });
});

describe('OtpBoxes', () => {
  it('fills boxes on paste and reports completion', async () => {
    const onComplete = vi.fn();
    let value = '';
    const { rerender } = render(
      <OtpBoxes value={value} onChange={(c) => (value = c)} onComplete={onComplete} />,
    );
    await userEvent.click(screen.getByLabelText('Digit 1 of 6'));
    await userEvent.paste('123456');
    rerender(<OtpBoxes value={value} onChange={(c) => (value = c)} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledWith('123456');
    expect(screen.getByLabelText('Digit 6 of 6')).toHaveValue('6');
  });
});

describe('ImageUploadControl', () => {
  it('rejects non-image files', async () => {
    render(<ImageUploadControl label="Photo" onChange={() => {}} />);
    const input = screen.getByLabelText('Photo');
    await userEvent.upload(input, new File(['x'], 'menu.pdf', { type: 'application/pdf' }), {
      applyAccept: false,
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Use a JPG, PNG or WebP image.');
  });

  it('uploads and previews images', async () => {
    const onChange = vi.fn();
    const onUpload = vi.fn().mockResolvedValue('https://cdn.example.com/jollof.webp');
    render(<ImageUploadControl label="Photos" max={3} onChange={onChange} onUpload={onUpload} />);
    await userEvent.upload(
      screen.getByLabelText('Photos'),
      new File(['x'], 'jollof.png', { type: 'image/png' }),
    );
    expect(onChange).toHaveBeenCalledWith(['https://cdn.example.com/jollof.webp']);
  });
});
