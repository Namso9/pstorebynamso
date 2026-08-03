import { Button } from "./Button";

type LoadingStateProps = {
  label?: string;
};

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div className="status-state" role="status" aria-live="polite">
      <span className="status-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="status-state status-state--error" role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
