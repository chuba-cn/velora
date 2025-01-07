import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TooltipWrapperProps = {
  children: React.ReactNode;
  tooltipHint: string;
  wrapperClassName?: string;
  contentClassName?: string;
  textClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  asChild?: boolean;
};

const TooltipWrapper = ({
  children,
  tooltipHint,
  wrapperClassName,
  contentClassName,
  textClassName,
  side = "top",
  align = "center",
  delayDuration = 200,
  asChild = false,
}: TooltipWrapperProps) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger
          asChild={asChild}
          className={cn("inline-block", wrapperClassName)}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn("z-50", contentClassName)}
        >
          <p className={cn("text-sm", textClassName)}>{tooltipHint}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TooltipWrapper;
