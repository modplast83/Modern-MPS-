import React from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: any; resetErrorBoundary: () => void }) {
  const { t } = useTranslation();
  
  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('errors.errorInLoading')}</AlertTitle>
      <AlertDescription className="mt-2">
        {t('dashboard.errorDescription')}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-2 text-xs">
            <summary>{t('common.details')}</summary>
            <pre className="mt-1 whitespace-pre-wrap">
              {error?.message}
            </pre>
          </details>
        )}
      </AlertDescription>
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={resetErrorBoundary}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t('common.refresh')}
        </Button>
      </div>
    </Alert>
  );
}

export function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ErrorFallback 
              error={error} 
              resetErrorBoundary={() => {
                reset();
                resetErrorBoundary();
              }} 
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallbackRender: ({ error, resetErrorBoundary }: any) => React.ReactElement;
  },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Query error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallbackRender({
        error: this.state.error,
        resetErrorBoundary: () =>
          this.setState({ hasError: false, error: null }),
      });
    }

    return this.props.children;
  }
}
