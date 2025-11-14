import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "../../lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>{t('components.ui.dropdown-menu.,_react.componentpropswithoutref')}<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className={t("components.ui.dropdown-menu.name.ml_auto")} />
  </DropdownMenuPrimitive.SubTrigger>{t('components.ui.dropdown-menu.));_dropdownmenusubtrigger.displayname_=_dropdownmenuprimitive.subtrigger.displayname;_const_dropdownmenusubcontent_=_react.forwardref')}<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>{t('components.ui.dropdown-menu.,_react.componentpropswithoutref')}<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className,
    )}
    {...props}
  />{t('components.ui.dropdown-menu.));_dropdownmenusubcontent.displayname_=_dropdownmenuprimitive.subcontent.displayname;_const_dropdownmenucontent_=_react.forwardref')}<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>{t('components.ui.dropdown-menu.,_react.componentpropswithoutref')}<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>{t('components.ui.dropdown-menu.));_dropdownmenucontent.displayname_=_dropdownmenuprimitive.content.displayname;_const_dropdownmenuitem_=_react.forwardref')}<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>{t('components.ui.dropdown-menu.,_react.componentpropswithoutref')}<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  />{t('components.ui.dropdown-menu.));_dropdownmenuitem.displayname_=_dropdownmenuprimitive.item.displayname;_const_dropdownmenucheckboxitem_=_react.forwardref')}<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>{t('components.ui.dropdown-menu.,_react.componentpropswithoutref')}<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className={t("components.ui.dropdown-menu.name.absolute_left_2_flex_h_3_5_w_3_5_items_center_justify_center")}>
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className={t("components.ui.dropdown-menu.name.h_4_w_4")} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>{t('components.ui.dropdown-menu.));_dropdownmenucheckboxitem.displayname_=_dropdownmenuprimitive.checkboxitem.displayname;_const_dropdownmenuradioitem_=_react.forwardref')}<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>{t('components.ui.dropdown-menu.,_react.componentpropswithoutref')}<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className={t("components.ui.dropdown-menu.name.absolute_left_2_flex_h_3_5_w_3_5_items_center_justify_center")}>
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className={t("components.ui.dropdown-menu.name.h_2_w_2_fill_current")} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>{t('components.ui.dropdown-menu.));_dropdownmenuradioitem.displayname_=_dropdownmenuprimitive.radioitem.displayname;_const_dropdownmenulabel_=_react.forwardref')}<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>{t('components.ui.dropdown-menu.,_react.componentpropswithoutref')}<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />{t('components.ui.dropdown-menu.));_dropdownmenulabel.displayname_=_dropdownmenuprimitive.label.displayname;_const_dropdownmenuseparator_=_react.forwardref')}<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>{t('components.ui.dropdown-menu.,_react.componentpropswithoutref')}<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName={t("components.ui.dropdown-menu.name.dropdownmenushortcut")};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
