import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Checkbox } from './Checkbox';
import { Combobox } from './Combobox';
import { Input } from './Input';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { Switch } from './Switch';
import { Textarea } from './Textarea';

describe('Input', () => {
  it('links its label, hint and error', () => {
    const { rerender } = render(<Input label="Email" hint="We never share it" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAccessibleDescription('We never share it');
    rerender(<Input label="Email" error="Enter a valid email address" />);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email address');
  });

  it('forwards refs', () => {
    const ref = { current: null };
    render(<Input label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe('Textarea', () => {
  it('counts characters when maxLength is set', () => {
    render(<Textarea label="Comment" maxLength={500} value="Sweet" onChange={() => {}} />);
    expect(screen.getByText('5/500')).toBeInTheDocument();
  });
});

describe('Select', () => {
  it('reports the chosen value', async () => {
    const onValueChange = vi.fn();
    render(
      <Select
        label="City"
        placeholder="Pick a city"
        options={[
          { value: 'lagos', label: 'Lagos' },
          { value: 'abuja', label: 'Abuja' },
        ]}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText('City'), 'abuja');
    expect(onValueChange).toHaveBeenCalledWith('abuja');
  });
});

describe('Combobox', () => {
  const banks = [
    { value: '058', label: 'Guaranty Trust Bank' },
    { value: '057', label: 'Zenith Bank' },
    { value: '044', label: 'Access Bank' },
  ];

  function Controlled() {
    const [value, setValue] = useState('');
    return <Combobox label="Bank" options={banks} value={value} onChange={setValue} />;
  }

  it('filters and picks with the keyboard', async () => {
    render(<Controlled />);
    const input = screen.getByRole('combobox', { name: 'Bank' });
    await userEvent.type(input, 'zen');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.keyboard('{Enter}');
    expect(input).toHaveValue('Zenith Bank');
  });

  it('shows the empty text', async () => {
    render(<Controlled />);
    await userEvent.type(screen.getByRole('combobox'), 'xyz');
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });
});

describe('Checkbox, Switch and RadioGroup', () => {
  it('toggles a checkbox by its label', async () => {
    render(<Checkbox label="I agree to the terms" />);
    await userEvent.click(screen.getByText('I agree to the terms'));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('toggles a switch with the keyboard', async () => {
    function S() {
      const [on, setOn] = useState(false);
      return <Switch label="Pause orders" checked={on} onChange={setOn} />;
    }
    render(<S />);
    const sw = screen.getByRole('switch', { name: 'Pause orders' });
    sw.focus();
    await userEvent.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('selects a radio option', async () => {
    const onChange = vi.fn();
    render(
      <RadioGroup
        label="Vendor type"
        options={[
          { value: 'restaurant', label: 'Registered restaurant' },
          { value: 'home_cook', label: 'Home cook' },
        ]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByLabelText('Home cook'));
    expect(onChange).toHaveBeenCalledWith('home_cook');
  });
});
