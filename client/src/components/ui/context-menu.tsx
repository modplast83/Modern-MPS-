import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "../../lib/utils";

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuSub = ContextMenuPrimitive.Sub;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>{t('components.ui.context-menu.,_react.componentpropswithoutref')}<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className={t("components.ui.context-menu.name.ml_auto_h_4_w_4")} />
  </ContextMenuPrimitive.SubTrigger>{t('components.ui.context-menu.));_contextmenusubtrigger.displayname_=_contextmenuprimitive.subtrigger.displayname;_const_contextmenusubcontent_=_react.forwardref')}<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>{t('components.ui.context-menu.,_react.componentpropswithoutref')}<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
      className,
    )}
    {...props}
  />{t('components.ui.context-menu.));_contextmenusubcontent.displayname_=_contextmenuprimitive.subcontent.displayname;_const_contextmenucontent_=_react.forwardref')}<
  React.ElementRef<typeof ContextMenuPrimitive.Content>{t('components.ui.context-menu.,_react.componentpropswithoutref')}<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 max-h-[--radix-context-menu-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>{t('components.ui.context-menu.));_contextmenucontent.displayname_=_contextmenuprimitive.content.displayname;_const_contextmenuitem_=_react.forwardref')}<
  React.ElementRef<typeof ContextMenuPrimitive.Item>{t('components.ui.context-menu.,_react.componentpropswithoutref')}<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />{t('components.ui.context-menu.));_contextmenuitem.displayname_=_contextmenuprimitive.item.displayname;_const_contextmenucheckboxitem_=_react.forwardref')}<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>{t('components.ui.context-menu.,_react.componentpropswithoutref')}<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className={t("components.ui.context-menu.name.absolute_left_2_flex_h_3_5_w_3_5_items_center_justify_center")}>
      <ContextMenuPrimitive.ItemIndicator>
        <Check className={t("components.ui.context-menu.name.h_4_w_4")} />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>{t('components.ui.context-menu.));_contextmenucheckboxitem.displayname_=_contextmenuprimitive.checkboxitem.displayname;_const_contextmenuradioitem_=_react.forwardref')}<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>{t('components.ui.context-menu.,_react.componentpropswithoutref')}<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className={t("components.ui.context-menu.name.absolute_left_2_flex_h_3_5_w_3_5_items_center_justify_center")}>
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className={t("components.ui.context-menu.name.h_2_w_2_fill_current")} />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>{t('components.ui.context-menu.));_contextmenuradioitem.displayname_=_contextmenuprimitive.radioitem.displayname;_const_contextmenulabel_=_react.forwardref')}<
  React.ElementRef<typeof ContextMenuPrimitive.Label>{t('components.ui.context-menu.,_react.componentpropswithoutref')}<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  />{t('components.ui.context-menu.));_contextmenulabel.displayname_=_contextmenuprimitive.label.displayname;_const_contextmenuseparator_=_react.forwardref')}<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>{t('components.ui.context-menu.,_react.componentpropswithoutref')}<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

const ContextMenuShortcut = ({
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
ContextMenuShortcut.displayName={t("components.ui.context-menu.name.contextmenushortcut")};

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
