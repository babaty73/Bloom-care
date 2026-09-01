interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
