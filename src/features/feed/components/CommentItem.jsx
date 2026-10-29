import { MoreVertical } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog, toast } from '@/components/feedback';
import { Avatar, Badge, Dropdown, IconButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

import { CommentForm } from './CommentForm';
import { useDeleteComment, useEditComment } from '../hooks/useFeed';

/**
 * One comment. Text is rendered as plain text (links are not clickable). Removed comments
 * show "Comment removed"; edited ones show "Edited".
 */
export function CommentItem({
  comment,
  foodItemId,
  canReport,
  onReport,
  onReply,
  isReply = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const edit = useEditComment(foodItemId);
  const remove = useDeleteComment(foodItemId);

  if (comment.removed) {
    return (
      <div className={cn('py-2 text-sm italic text-ink-muted', isReply && 'pl-10')}>
        Comment removed
      </div>
    );
  }

  const actions = [
    ...(comment.isMine
      ? [
          { label: 'Edit', onSelect: () => setIsEditing(true) },
          { label: 'Delete', danger: true, onSelect: () => setConfirmDelete(true) },
        ]
      : []),
    ...(!comment.isMine && canReport
      ? [{ label: 'Report', onSelect: () => onReport(comment) }]
      : []),
  ];

  return (
    <article
      aria-label={`${isReply ? 'Reply' : 'Comment'} by ${comment.author.name}`}
      className={cn('flex gap-3 py-2', isReply && 'pl-10')}
    >
      <Avatar src={comment.author.avatar} name={comment.author.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold">{comment.author.name}</span>
          {comment.isVendorReply && <Badge tone="brand">Vendor</Badge>}
          <span className="text-xs text-ink-muted">{formatRelative(comment.createdAt)}</span>
          {comment.editedAt && <span className="text-xs text-ink-muted">Edited</span>}
        </div>
        {isEditing ? (
          <CommentForm
            label="Edit your comment"
            submitLabel="Save"
            defaultValue={comment.body}
            onCancel={() => setIsEditing(false)}
            onSubmit={async (body) => {
              await edit.mutateAsync({ id: comment.id, body });
              setIsEditing(false);
            }}
          />
        ) : (
          <p className="whitespace-pre-line break-words text-sm text-ink">{comment.body}</p>
        )}
        {onReply && !isEditing && (
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="mt-1 text-xs font-medium text-primary-700 hover:underline"
          >
            Reply
          </button>
        )}
      </div>
      {actions.length > 0 && !isEditing && (
        <Dropdown
          label="Comment actions"
          trigger={(p) => (
            <IconButton icon={MoreVertical} size="sm" {...p} label="Comment actions" />
          )}
          items={actions}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this comment?"
        message="It will show as “Comment removed”."
        confirmLabel="Delete comment"
        tone="danger"
        isLoading={remove.isPending}
        onConfirm={() =>
          remove.mutate(comment.id, {
            onSuccess: () => setConfirmDelete(false),
            onError: (e) => toast.error(e),
          })
        }
      />
    </article>
  );
}
