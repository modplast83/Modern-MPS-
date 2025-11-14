"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>{t('components.ui.dialog.,_react.componentpropswithoutref')}<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      // اختيارية: لو تحب بلور الخلفية
      // "backdrop-blur-sm",
      className,
    )}
    {...props}
  />{t('components.ui.dialog.));_dialogoverlay.displayname_=_dialogprimitive.overlay.displayname;_const_dialogcontent_=_react.forwardref')}<
  React.ElementRef<typeof DialogPrimitive.Content>{t('components.ui.dialog.,_react.componentpropswithoutref')}<typeof DialogPrimitive.Content> & {
    hideCloseButton?: boolean;
  }
>(({ className, children, hideCloseButton = false, ...props }, ref) => {
  // Recursively check for DialogDescription in children tree
  const hasDescendantDescription = (element: React.ReactNode): boolean => {
    if (!React.isValidElement(element)) return false;

    if (
      element.type === DialogDescription ||
      element.type === DialogPrimitive.Description
    ) {
      return true;
    }

    if (element.props?.children) {
      const children = React.Children.toArray(element.props.children);
      return children.some(hasDescendantDescription);
    }

    return false;
  };

  const hasDescription = React.Children.toArray(children).some(
    hasDescendantDescription,
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4",
          "border bg-background p-6 shadow-lg sm:rounded-lg",
          "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className,
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            className={t("components.ui.dialog.name.absolute_right_4_top_4_rounded_sm_opacity_70_ring_offset_background_transition_opacity_hover_opacity_100_focus_outline_none_focus_ring_2_focus_ring_ring_focus_ring_offset_2_disabled_pointer_events_none")}
            aria-label="{t('components.ui.dialog.label.{t('components.ui.dialog.aria-label.close')}')}"
          >
            <X className={t("components.ui.dialog.name.h_4_w_4")} />
            <span className={t("components.ui.dialog.name.sr_only")}>{t('components.ui.dialog.close')}</span>
          </DialogPrimitive.Close>
        )}

        {/* Provide fallback DialogDescription only when none exists */}
        {!hasDescription && (
          <DialogDescription className={t("components.ui.dialog.name.sr_only")}>{t('components.ui.dialog.نافذة_حوار')}</DialogDescription>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName={t("components.ui.dialog.name.dialogheader")};

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />{t('components.ui.dialog.);_dialogfooter.displayname_=_"dialogfooter";_const_dialogtitle_=_react.forwardref')}<
  React.ElementRef<typeof DialogPrimitive.Title>{t('components.ui.dialog.,_react.componentpropswithoutref')}<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />{t('components.ui.dialog.));_dialogtitle.displayname_=_dialogprimitive.title.displayname;_const_dialogdescription_=_react.forwardref')}<
  React.ElementRef<typeof DialogPrimitive.Description>{t('components.ui.dialog.,_react.componentpropswithoutref')}<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
