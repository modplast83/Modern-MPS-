"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../../lib/utils";

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />{t('components.ui.drawer.);_drawer.displayname_=_"drawer";_const_drawertrigger_=_drawerprimitive.trigger;_const_drawerportal_=_drawerprimitive.portal;_const_drawerclose_=_drawerprimitive.close;_const_draweroverlay_=_react.forwardref')}<
  React.ElementRef<typeof DrawerPrimitive.Overlay>{t('components.ui.drawer.,_react.componentpropswithoutref')}<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />{t('components.ui.drawer.));_draweroverlay.displayname_=_drawerprimitive.overlay.displayname;_const_drawercontent_=_react.forwardref')}<
  React.ElementRef<typeof DrawerPrimitive.Content>{t('components.ui.drawer.,_react.componentpropswithoutref')}<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Check if children includes a DrawerDescription component
  const hasDrawerDescription = React.Children.toArray(children).some(
    (child) => {
      if (React.isValidElement(child)) {
        // Check if it's a DrawerDescription by comparing displayName or type
        return (
          child.type === DrawerDescription ||
          (child.type as any)?.displayName === DrawerDescription.displayName
        );
      }
      return false;
    },
  );

  // Only generate fallback ID if no explicit aria-describedby and no DrawerDescription
  const needsFallback = !props["aria-describedby"] && !hasDrawerDescription;
  const descriptionId = needsFallback ? React.useId() : undefined;

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
          className,
        )}
        // Only set aria-describedby if fallback needed, let vaul handle DrawerDescription linkage
        {...(descriptionId && { "aria-describedby": descriptionId })}
        {...props}
      >
        <div className={t("components.ui.drawer.name.mx_auto_mt_4_h_2_w_100px_rounded_full_bg_muted")} />
        {children}

        {/* Hidden description for accessibility only when needed */}
        {needsFallback && (
          <span id={descriptionId} className={t("components.ui.drawer.name.sr_only")}>{t('components.ui.drawer.drawer_content')}</span>
        )}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName={t("components.ui.drawer.name.drawercontent")};

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
);
DrawerHeader.displayName={t("components.ui.drawer.name.drawerheader")};

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />{t('components.ui.drawer.);_drawerfooter.displayname_=_"drawerfooter";_const_drawertitle_=_react.forwardref')}<
  React.ElementRef<typeof DrawerPrimitive.Title>{t('components.ui.drawer.,_react.componentpropswithoutref')}<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />{t('components.ui.drawer.));_drawertitle.displayname_=_drawerprimitive.title.displayname;_const_drawerdescription_=_react.forwardref')}<
  React.ElementRef<typeof DrawerPrimitive.Description>{t('components.ui.drawer.,_react.componentpropswithoutref')}<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
