import { cn } from "@/lib/utils";

interface CharacterCountProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCount({ current, max, className }: CharacterCountProps) {
  const remaining = max - current;
  const percentage = (current / max) * 100;
  
  return (
    <div className={cn("text-xs text-muted-foreground text-right", className)}>
      <span
        className={cn(
          percentage >= 100 && "text-destructive font-medium",
          percentage >= 90 && percentage < 100 && "text-amber-500 dark:text-amber-400",
          percentage >= 75 && percentage < 90 && "text-muted-foreground"
        )}
      >
        {remaining.toLocaleString()} characters remaining
      </span>
    </div>
  );
}
