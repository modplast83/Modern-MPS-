"use client";

import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "../../lib/utils";

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />;
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />;
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />;
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />;
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className,
    )}
    {...props}
  />{t('components.ui.menubar.));_menubar.displayname_=_menubarprimitive.root.displayname;_const_menubartrigger_=_react.forwardref')}<
  React.ElementRef<typeof MenubarPrimitive.Trigger>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className,
    )}
    {...props}
  />{t('components.ui.menubar.));_menubartrigger.displayname_=_menubarprimitive.trigger.displayname;_const_menubarsubtrigger_=_react.forwardref')}<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className={t("components.ui.menubar.name.ml_auto_h_4_w_4")} />
  </MenubarPrimitive.SubTrigger>{t('components.ui.menubar.));_menubarsubtrigger.displayname_=_menubarprimitive.subtrigger.displayname;_const_menubarsubcontent_=_react.forwardref')}<
  React.ElementRef<typeof MenubarPrimitive.SubContent>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
      className,
    )}
    {...props}
  />{t('components.ui.menubar.));_menubarsubcontent.displayname_=_menubarprimitive.subcontent.displayname;_const_menubarcontent_=_react.forwardref')}<
  React.ElementRef<typeof MenubarPrimitive.Content>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref,
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
          className,
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>{t('components.ui.menubar.),_);_menubarcontent.displayname_=_menubarprimitive.content.displayname;_const_menubaritem_=_react.forwardref')}<
  React.ElementRef<typeof MenubarPrimitive.Item>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />{t('components.ui.menubar.));_menubaritem.displayname_=_menubarprimitive.item.displayname;_const_menubarcheckboxitem_=_react.forwardref')}<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className={t("components.ui.menubar.name.absolute_left_2_flex_h_3_5_w_3_5_items_center_justify_center")}>
      <MenubarPrimitive.ItemIndicator>
        <Check className={t("components.ui.menubar.name.h_4_w_4")} />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>{t('components.ui.menubar.));_menubarcheckboxitem.displayname_=_menubarprimitive.checkboxitem.displayname;_const_menubarradioitem_=_react.forwardref')}<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className={t("components.ui.menubar.name.absolute_left_2_flex_h_3_5_w_3_5_items_center_justify_center")}>
      <MenubarPrimitive.ItemIndicator>
        <Circle className={t("components.ui.menubar.name.h_2_w_2_fill_current")} />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>{t('components.ui.menubar.));_menubarradioitem.displayname_=_menubarprimitive.radioitem.displayname;_const_menubarlabel_=_react.forwardref')}<
  React.ElementRef<typeof MenubarPrimitive.Label>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />{t('components.ui.menubar.));_menubarlabel.displayname_=_menubarprimitive.label.displayname;_const_menubarseparator_=_react.forwardref')}<
  React.ElementRef<typeof MenubarPrimitive.Separator>{t('components.ui.menubar.,_react.componentpropswithoutref')}<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
};
MenubarShortcut.displayname="{t('components.ui.menubar.name.menubarshortcut')}";

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};
