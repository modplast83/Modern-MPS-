import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";

import { cn } from "../../lib/utils";

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>{t('components.ui.navigation-menu.,_react.componentpropswithoutref')}<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className,
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>{t('components.ui.navigation-menu.));_navigationmenu.displayname_=_navigationmenuprimitive.root.displayname;_const_navigationmenulist_=_react.forwardref')}<
  React.ElementRef<typeof NavigationMenuPrimitive.List>{t('components.ui.navigation-menu.,_react.componentpropswithoutref')}<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className,
    )}
    {...props}
  />{t('components.ui.navigation-menu.));_navigationmenulist.displayname_=_navigationmenuprimitive.list.displayname;_const_navigationmenuitem_=_navigationmenuprimitive.item;_const_navigationmenutriggerstyle_=_cva(_"group_inline-flex_h-10_w-max_items-center_justify-center_rounded-md_bg-background_px-4_py-2_text-sm_font-medium_transition-colors_hover:bg-accent_hover:text-accent-foreground_focus:bg-accent_focus:text-accent-foreground_focus:outline-none_disabled:pointer-events-none_disabled:opacity-50_data-[state=open]:text-accent-foreground_data-[state=open]:bg-accent/50_data-[state=open]:hover:bg-accent_data-[state=open]:focus:bg-accent",_);_const_navigationmenutrigger_=_react.forwardref')}<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>{t('components.ui.navigation-menu.,_react.componentpropswithoutref')}<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className={t("components.ui.navigation-menu.name.relative_top_1px_ml_1_h_3_w_3_transition_duration_200_group_data_state_open_rotate_180")}
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>{t('components.ui.navigation-menu.));_navigationmenutrigger.displayname_=_navigationmenuprimitive.trigger.displayname;_const_navigationmenucontent_=_react.forwardref')}<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>{t('components.ui.navigation-menu.,_react.componentpropswithoutref')}<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      className,
    )}
    {...props}
  />{t('components.ui.navigation-menu.));_navigationmenucontent.displayname_=_navigationmenuprimitive.content.displayname;_const_navigationmenulink_=_navigationmenuprimitive.link;_const_navigationmenuviewport_=_react.forwardref')}<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>{t('components.ui.navigation-menu.,_react.componentpropswithoutref')}<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  </div>{t('components.ui.navigation-menu.));_navigationmenuviewport.displayname_=_navigationmenuprimitive.viewport.displayname;_const_navigationmenuindicator_=_react.forwardref')}<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>{t('components.ui.navigation-menu.,_react.componentpropswithoutref')}<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className,
    )}
    {...props}
  >
    <div className={t("components.ui.navigation-menu.name.relative_top_60_h_2_w_2_rotate_45_rounded_tl_sm_bg_border_shadow_md")} />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName;

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
