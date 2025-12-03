import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BadgeDisplayProps {
  userId: string;
  showAll?: boolean;
}

export function BadgeDisplay({ userId, showAll = false }: BadgeDisplayProps) {
  const { data: earnedBadges = [] } = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badge:badges(*)")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("points_required", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: showAll,
  });

  const earnedBadgeIds = earnedBadges.map(eb => (eb.badge as any)?.id);

  const displayBadges = showAll 
    ? allBadges.map(badge => ({
        ...badge,
        earned: earnedBadgeIds.includes(badge.id)
      }))
    : earnedBadges.map(eb => ({ ...(eb.badge as any), earned: true }));

  if (!displayBadges.length) {
    return (
      <p className="text-sm text-muted-foreground">No badges earned yet</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayBadges.map((badge: any, index) => (
        <Tooltip key={badge.id}>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.2, rotate: 5 }}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full text-xl",
                "border-2 shadow-md cursor-pointer transition-all",
                badge.earned
                  ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary/50"
                  : "bg-muted/50 border-border grayscale opacity-50"
              )}
            >
              {badge.icon}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
              {!badge.earned && (
                <p className="text-xs text-primary mt-1">
                  Requires {badge.points_required} points
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
