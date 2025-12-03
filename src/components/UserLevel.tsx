import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserLevelProps {
  level: number;
  points: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

export function UserLevel({ level, points, size = "md", showProgress = false }: UserLevelProps) {
  const pointsInLevel = points % 100;
  const progressPercent = pointsInLevel;

  const getLevelColor = (level: number) => {
    if (level >= 50) return "from-amber-400 to-yellow-500";
    if (level >= 20) return "from-purple-400 to-pink-500";
    if (level >= 10) return "from-blue-400 to-cyan-500";
    if (level >= 5) return "from-green-400 to-emerald-500";
    return "from-slate-400 to-slate-500";
  };

  const getLevelTitle = (level: number) => {
    if (level >= 50) return "Legend";
    if (level >= 20) return "Super Fan";
    if (level >= 10) return "Rising Star";
    if (level >= 5) return "Contributor";
    return "Newcomer";
  };

  const sizeClasses = {
    sm: "w-5 h-5 text-[10px]",
    md: "w-7 h-7 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1.5">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn(
              "relative flex items-center justify-center rounded-full font-bold text-white",
              "bg-gradient-to-br shadow-lg",
              getLevelColor(level),
              sizeClasses[size]
            )}
          >
            {level}
            <motion.div
              className="absolute inset-0 rounded-full bg-white/20"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {showProgress && (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">
                {getLevelTitle(level)}
              </span>
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn("h-full bg-gradient-to-r", getLevelColor(level))}
                />
              </div>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <p className="font-medium">Level {level} - {getLevelTitle(level)}</p>
          <p className="text-xs text-muted-foreground">
            {points} points • {100 - pointsInLevel} to next level
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
