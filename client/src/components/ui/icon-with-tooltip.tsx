import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface IconWithTooltipProps {
  icon: React.ReactNode;
  tooltip: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  onClick?: () => void;
}

export function IconWithTooltip({
  icon,
  tooltip,
  side = "top",
  className = "",
  onClick,
}: IconWithTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-pointer ${className}`} onClick={onClick}>
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="text-sm">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
