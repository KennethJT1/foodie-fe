import { Form, FormSubmit, FormTextarea } from '@/components/forms';
import { Button } from '@/components/ui';

import { COMMENT_MAX, commentSchema } from '../schemas/comment.schema';

/** Plain-text comment box with a 500 character limit. */
export function CommentForm({
  onSubmit,
  defaultValue = '',
  label = 'Add a comment',
  submitLabel = 'Post comment',
  onCancel,
}) {
  return (
    <Form
      schema={commentSchema}
      defaultValues={{ body: defaultValue }}
      onSubmit={async (values, form) => {
        await onSubmit(values.body);
        form.reset({ body: '' });
      }}
      className="space-y-2"
    >
      <FormTextarea
        name="body"
        label={label}
        rows={2}
        maxLength={COMMENT_MAX}
        placeholder="Say something nice about this food"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <FormSubmit size="sm">{submitLabel}</FormSubmit>
      </div>
    </Form>
  );
}
