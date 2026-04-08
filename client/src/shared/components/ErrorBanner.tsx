interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="error-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="material-symbols-outlined">error</span>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
