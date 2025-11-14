import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "../../lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>{t('components.ui.accordion.,_react.componentpropswithoutref')}<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />{t('components.ui.accordion.));_accordionitem.displayname_=_"accordionitem";_const_accordiontrigger_=_react.forwardref')}<
  React.ElementRef<typeof AccordionPrimitive.Trigger>{t('components.ui.accordion.,_react.componentpropswithoutref')}<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className={t("components.ui.accordion.name.flex")}>
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className={t("components.ui.accordion.name.h_4_w_4_shrink_0_transition_transform_duration_200")} />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>{t('components.ui.accordion.));_accordiontrigger.displayname_=_accordionprimitive.trigger.displayname;_const_accordioncontent_=_react.forwardref')}<
  React.ElementRef<typeof AccordionPrimitive.Content>{t('components.ui.accordion.,_react.componentpropswithoutref')}<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={t("components.ui.accordion.name.overflow_hidden_text_sm_transition_all_data_state_closed_animate_accordion_up_data_state_open_animate_accordion_down")}
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
