import React, { Component, ErrorInfo, ReactNode } from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: "page" | "component" | "inline";
  title?: string;
  description?: string;
  showReload?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to production error tracking service if available
    if (import.meta.env.PROD && typeof window !== "undefined") {
      // In production, you might want to send to an error tracking service
      // window.gtag?.('event', 'exception', {
      //   description: error.message,
      //   fatal: false
      // });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    const { t } = this.props;
    
    if (this.state.hasError) {
      const fallback = this.props.fallback || "page";
      const title = this.props.title || t('errors.unexpectedError');
      const description =
        this.props.description ||
        t('errors.errorDescription');

      // Inline error display for small components
      if (fallback === "inline") {
        return (
          <Alert
            variant="destructive"
            className={t("components.errorboundary.name.my_2")}
            data-testid="error-inline"
          >
            <AlertTriangle className={t("components.errorboundary.name.h_4_w_4")} />
            <AlertTitle>{t('errors.error')}</AlertTitle>
            <AlertDescription>
              {description}
              <Button
                onClick={this.handleReset}
                variant="ghost"
                size="sm"
                className={t("components.errorboundary.name.mt_2_h_auto_p_1_text_xs")}
                data-testid="button-retry-inline"
              >
                <RefreshCw className={t("components.errorboundary.name.h_3_w_3_ml_1")} />
                {t('common.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        );
      }

      // Component-level error display
      if (fallback === "component") {
        return (
          <Card className={t("components.errorboundary.name.w_full")} data-testid="error-component">
            <CardContent className={t("components.errorboundary.name.p_4")}>
              <div className={t("components.errorboundary.name.flex_items_center_space_x_2_space_x_reverse_mb_2")}>
                <AlertTriangle className={t("components.errorboundary.name.h_5_w_5_text_destructive")} />
                <h3 className={t("components.errorboundary.name.font_medium_text_destructive")}>{title}</h3>
              </div>
              <p className={t("components.errorboundary.name.text_sm_text_muted_foreground_mb_3")}>
                {description}
              </p>
              {import.meta.env.DEV && this.state.error && (
                <details className={t("components.errorboundary.name.mb_3_text_xs")}>
                  <summary className={t("components.errorboundary.name.cursor_pointer_text_muted_foreground")}>
                    {t('errors.errorDetails')}
                  </summary>
                  <pre className={t("components.errorboundary.name.mt_1_p_2_bg_muted_rounded_text_xs_overflow_x_auto")}>
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <div className={t("components.errorboundary.name.flex_gap_2")}>
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  data-testid="button-retry-component"
                >
                  <RefreshCw className={t("components.errorboundary.name.h_4_w_4_ml_1")} />
                  {t('common.retry')}
                </Button>
                {this.props.showReload && (
                  <Button
                    onClick={this.handleReload}
                    size="sm"
                    data-testid="button-reload-component"
                  >
                    <Home className={t("components.errorboundary.name.h_4_w_4_ml_1")} />
                    {t('errors.goHome')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      }

      // Full page error display (default)
      return (
        <div
          className={t("components.errorboundary.name.min_h_screen_flex_items_center_justify_center_p_4_bg_background")}
          data-testid="error-page"
        >
          <Card className={t("components.errorboundary.name.w_full_max_w_lg")}>
            <CardHeader className={t("components.errorboundary.name.text_center")}>
              <div className={t("components.errorboundary.name.mx_auto_mb_4_w_12_h_12_rounded_full_bg_destructive_10_flex_items_center_justify_center")}>
                <AlertTriangle className={t("components.errorboundary.name.w_6_h_6_text_destructive")} />
              </div>
              <CardTitle className={t("components.errorboundary.name.text_xl")}>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {import.meta.env.DEV && this.state.error && (
                <div className={t("components.errorboundary.name.mt_4_p_3_bg_muted_rounded_md_text_sm")}>
                  <p className={t("components.errorboundary.name.font_semibold_text_destructive_mb_2")}>
                    {t('errors.errorDetails')}:
                  </p>
                  <code className={t("components.errorboundary.name.text_xs_break_all")}>
                    {this.state.error.message}
                  </code>
                  {this.state.errorInfo && (
                    <details className={t("components.errorboundary.name.mt_2_text_xs")}>
                      <summary className={t("components.errorboundary.name.cursor_pointer")}>
                        {t('errors.additionalInfo')}
                      </summary>
                      <pre className={t("components.errorboundary.name.mt_1_whitespace_pre_wrap_text_xs")}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className={t("components.errorboundary.name.flex_gap_2_justify_center")}>
              <Button
                onClick={this.handleReset}
                variant="outline"
                data-testid="button-retry-page"
              >
                <RefreshCw className={t("components.errorboundary.name.w_4_h_4_ml_2")} />
                {t('common.retry')}
              </Button>
              <Button
                onClick={this.handleReload}
                data-testid="button-reload-page"
              >
                {t('errors.reloadPage')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
