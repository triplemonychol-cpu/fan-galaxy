import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerifiedBadge({ size = "md", className }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <BadgeCheck
          className={cn(
            "text-blue-500 fill-blue-500 stroke-white shrink-0",
            sizeClasses[size],
            className
          )}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">Verified Creator</p>
      </TooltipContent>
    </Tooltip>
  );
}
