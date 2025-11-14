import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "../../lib/utils";
import { Dialog, DialogContent, DialogDescription } from "./dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>{t('components.ui.command.,_react.componentpropswithoutref')}<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent
        className={t("components.ui.command.name.overflow_hidden_p_0_shadow_lg")}
        aria-describedby="command-dialog-description"
      >
        <DialogDescription id="command-dialog-description" className={t("components.ui.command.name.sr_only")}>{t('components.ui.command.قائمة_الأوامر_والخيارات_المتاحة')}</DialogDescription>
        <Command className={t("components.ui.command.name.___cmdk_group_heading_px_2___cmdk_group_heading_font_medium___cmdk_group_heading_text_muted_foreground___cmdk_group_not_hidden___cmdk_group_pt_0___cmdk_group_px_2___cmdk_input_wrapper__svg_h_5___cmdk_input_wrapper__svg_w_5___cmdk_input_h_12___cmdk_item_px_2___cmdk_item_py_3___cmdk_item__svg_h_5___cmdk_item__svg_w_5")}>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>{t('components.ui.command.,_react.componentpropswithoutref')}<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className={t("components.ui.command.name.flex_items_center_border_b_px_3")} cmdk-input-wrapper="">
    <Search className={t("components.ui.command.name.mr_2_h_4_w_4_shrink_0_opacity_50")} />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>{t('components.ui.command.));_commandinput.displayname_=_commandprimitive.input.displayname;_const_commandlist_=_react.forwardref')}<
  React.ElementRef<typeof CommandPrimitive.List>{t('components.ui.command.,_react.componentpropswithoutref')}<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />{t('components.ui.command.));_commandlist.displayname_=_commandprimitive.list.displayname;_const_commandempty_=_react.forwardref')}<
  React.ElementRef<typeof CommandPrimitive.Empty>{t('components.ui.command.,_react.componentpropswithoutref')}<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={t("components.ui.command.name.py_6_text_center_text_sm")}
    {...props}
  />{t('components.ui.command.));_commandempty.displayname_=_commandprimitive.empty.displayname;_const_commandgroup_=_react.forwardref')}<
  React.ElementRef<typeof CommandPrimitive.Group>{t('components.ui.command.,_react.componentpropswithoutref')}<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className,
    )}
    {...props}
  />{t('components.ui.command.));_commandgroup.displayname_=_commandprimitive.group.displayname;_const_commandseparator_=_react.forwardref')}<
  React.ElementRef<typeof CommandPrimitive.Separator>{t('components.ui.command.,_react.componentpropswithoutref')}<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />{t('components.ui.command.));_commandseparator.displayname_=_commandprimitive.separator.displayname;_const_commanditem_=_react.forwardref')}<
  React.ElementRef<typeof CommandPrimitive.Item>{t('components.ui.command.,_react.componentpropswithoutref')}<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
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
CommandShortcut.displayName={t("components.ui.command.name.commandshortcut")};

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
