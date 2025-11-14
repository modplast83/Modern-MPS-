import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";

import { cn } from "../../lib/utils";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>{t('components.ui.input-otp.,_react.componentpropswithoutref')}<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />{t('components.ui.input-otp.));_inputotp.displayname_=_"inputotp";_const_inputotpgroup_=_react.forwardref')}<
  React.ElementRef<"div">{t('components.ui.input-otp.,_react.componentpropswithoutref')}<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />{t('components.ui.input-otp.));_inputotpgroup.displayname_=_"inputotpgroup";_const_inputotpslot_=_react.forwardref')}<
  React.ElementRef<"div">{t('components.ui.input-otp.,_react.componentpropswithoutref')}<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className={t("components.ui.input-otp.name.pointer_events_none_absolute_inset_0_flex_items_center_justify_center")}>
          <div className={t("components.ui.input-otp.name.h_4_w_px_animate_caret_blink_bg_foreground_duration_1000")} />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName={t("components.ui.input-otp.name.inputotpslot")};

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">{t('components.ui.input-otp.,_react.componentpropswithoutref')}<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
));
InputOTPSeparator.displayName={t("components.ui.input-otp.name.inputotpseparator")};

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
