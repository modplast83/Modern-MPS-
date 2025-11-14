import { CheckCircle, AlertCircle, Info, XCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "./alert";
import { Button } from "./button";

interface NotificationProps {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colorMap = {
  success: "border-success bg-success/10 text-success",
  error: "border-danger bg-danger/10 text-danger",
  warning: "border-warning bg-warning/10 text-warning",
  info: "border-primary bg-primary/10 text-primary",
};

export function Notification({
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
}: NotificationProps) {
  const Icon = iconMap[type];

  return (
    <Alert
      className={`fixed top-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50 ${colorMap[type]}`}
    >
      <div className={t("components.ui.notification.name.flex_items_center")}>
        <Icon className={t("components.ui.notification.name.h_4_w_4_flex_shrink_0")} />
        <div className={t("components.ui.notification.name.mr_3_flex_1")}>
          {title && <p className={t("components.ui.notification.name.font_medium_text_sm")}>{title}</p>}
          <AlertDescription className={t("components.ui.notification.name.text_sm")}>{message}</AlertDescription>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={t("components.ui.notification.name.mr_auto_p_1_h_auto")}
          >
            <X className={t("components.ui.notification.name.h_4_w_4")} />
          </Button>
        )}
      </div>
    </Alert>
  );
}
