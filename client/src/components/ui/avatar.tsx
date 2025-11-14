"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "../../lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>{t('components.ui.avatar.,_react.componentpropswithoutref')}<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className,
    )}
    {...props}
  />{t('components.ui.avatar.));_avatar.displayname_=_avatarprimitive.root.displayname;_const_avatarimage_=_react.forwardref')}<
  React.ElementRef<typeof AvatarPrimitive.Image>{t('components.ui.avatar.,_react.componentpropswithoutref')}<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />{t('components.ui.avatar.));_avatarimage.displayname_=_avatarprimitive.image.displayname;_const_avatarfallback_=_react.forwardref')}<
  React.ElementRef<typeof AvatarPrimitive.Fallback>{t('components.ui.avatar.,_react.componentpropswithoutref')}<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
