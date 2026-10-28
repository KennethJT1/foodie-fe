import { Button, Card, CardTitle } from '@/components/ui';

/**
 * Shell for one wizard step: title, body and a Back / Continue footer.
 * Pass `form` to make Continue submit that form; otherwise `onContinue` is called.
 */
export function StepCard({
  title,
  description,
  children,
  onBack,
  onContinue,
  form,
  continueLabel = 'Continue',
  isSaving = false,
  canContinue = true,
}) {
  return (
    <Card
      header={<CardTitle title={title} description={description} />}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {onBack ? (
            <Button variant="outline" onClick={onBack} disabled={isSaving}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button
            type={form ? 'submit' : 'button'}
            form={form}
            onClick={form ? undefined : onContinue}
            loading={isSaving}
            disabled={!canContinue}
          >
            {continueLabel}
          </Button>
        </div>
      }
    >
      {children}
    </Card>
  );
}
