import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "../../lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>{t('components.ui.slider.,_react.componentpropswithoutref')}<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className={t("components.ui.slider.name.relative_h_2_w_full_grow_overflow_hidden_rounded_full_bg_secondary")}>
      <SliderPrimitive.Range className={t("components.ui.slider.name.absolute_h_full_bg_primary")} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={t("components.ui.slider.name.block_h_5_w_5_rounded_full_border_2_border_primary_bg_background_ring_offset_background_transition_colors_focus_visible_outline_none_focus_visible_ring_2_focus_visible_ring_ring_focus_visible_ring_offset_2_disabled_pointer_events_none_disabled_opacity_50")} />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
