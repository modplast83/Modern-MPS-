import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "../../lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>{t('components.ui.select.,_react.componentpropswithoutref')}<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className={t("components.ui.select.name.h_4_w_4_opacity_50")} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>{t('components.ui.select.));_selecttrigger.displayname_=_selectprimitive.trigger.displayname;_const_selectscrollupbutton_=_react.forwardref')}<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>{t('components.ui.select.,_react.componentpropswithoutref')}<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronUp className={t("components.ui.select.name.h_4_w_4")} />
  </SelectPrimitive.ScrollUpButton>{t('components.ui.select.));_selectscrollupbutton.displayname_=_selectprimitive.scrollupbutton.displayname;_const_selectscrolldownbutton_=_react.forwardref')}<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>{t('components.ui.select.,_react.componentpropswithoutref')}<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <ChevronDown className={t("components.ui.select.name.h_4_w_4")} />
  </SelectPrimitive.ScrollDownButton>{t('components.ui.select.));_selectscrolldownbutton.displayname_=_selectprimitive.scrolldownbutton.displayname;_const_selectcontent_=_react.forwardref')}<
  React.ElementRef<typeof SelectPrimitive.Content>{t('components.ui.select.,_react.componentpropswithoutref')}<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>{t('components.ui.select.));_selectcontent.displayname_=_selectprimitive.content.displayname;_const_selectlabel_=_react.forwardref')}<
  React.ElementRef<typeof SelectPrimitive.Label>{t('components.ui.select.,_react.componentpropswithoutref')}<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />{t('components.ui.select.));_selectlabel.displayname_=_selectprimitive.label.displayname;_const_selectitem_=_react.forwardref')}<
  React.ElementRef<typeof SelectPrimitive.Item>{t('components.ui.select.,_react.componentpropswithoutref')}<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className={t("components.ui.select.name.absolute_left_2_flex_h_3_5_w_3_5_items_center_justify_center")}>
      <SelectPrimitive.ItemIndicator>
        <Check className={t("components.ui.select.name.h_4_w_4")} />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>{t('components.ui.select.));_selectitem.displayname_=_selectprimitive.item.displayname;_const_selectseparator_=_react.forwardref')}<
  React.ElementRef<typeof SelectPrimitive.Separator>{t('components.ui.select.,_react.componentpropswithoutref')}<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
