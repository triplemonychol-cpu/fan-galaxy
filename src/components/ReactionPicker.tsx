import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "laugh", emoji: "😂", label: "Laugh" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
];

interface ReactionPickerProps {
  postId?: string;
  commentId?: string;
  size?: "sm" | "md";
}

export function ReactionPicker({ postId, commentId, size = "md" }: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query keys for cache invalidation
  const countsQueryKey = postId 
    ? ["reaction_counts", "post", postId] 
    : ["reaction_counts", "comment", commentId];
  
  const userReactionQueryKey = ["user_reaction", postId || commentId, user?.id];

  // Query aggregate reaction counts (from public view - no user_id exposed)
  const { data: reactionCountsData = [] } = useQuery({
    queryKey: countsQueryKey,
    queryFn: async () => {
      const query = supabase
        .from("reaction_counts")
        .select("*");
      
      if (postId) {
        query.eq("post_id", postId);
      } else if (commentId) {
        query.eq("comment_id", commentId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Query user's own reaction (restricted by RLS - only sees their own)
  const { data: userReaction } = useQuery({
    queryKey: userReactionQueryKey,
    queryFn: async () => {
      if (!user) return null;
      
      const query = supabase
        .from("reactions")
        .select("*");
      
      if (postId) {
        query.eq("post_id", postId);
      } else if (commentId) {
        query.eq("comment_id", commentId);
      }
      
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const reactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!user) throw new Error("Must be logged in");

      // If user already has this reaction, remove it
      if (userReaction?.reaction_type === reactionType) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("id", userReaction.id);
        if (error) throw error;
        return null;
      }

      // If user has a different reaction, update it
      if (userReaction) {
        const { error } = await supabase
          .from("reactions")
          .update({ reaction_type: reactionType })
          .eq("id", userReaction.id);
        if (error) throw error;
        return reactionType;
      }

      // Otherwise, create new reaction
      const { error } = await supabase.from("reactions").insert({
        user_id: user.id,
        post_id: postId || null,
        comment_id: commentId || null,
        reaction_type: reactionType,
      });
      if (error) throw error;
      return reactionType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countsQueryKey });
      queryClient.invalidateQueries({ queryKey: userReactionQueryKey });
      setShowPicker(false);
    },
    onError: () => {
      toast({ title: "Failed to react", variant: "destructive" });
    },
  });

  // Build reaction counts map from aggregate data
  const reactionCountsMap = REACTIONS.reduce((acc, r) => {
    const countData = reactionCountsData.find(
      (rc: { reaction_type: string; count: number }) => rc.reaction_type === r.type
    );
    acc[r.type] = countData ? Number(countData.count) : 0;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total reactions
  const totalReactions = reactionCountsData.reduce(
    (sum: number, rc: { count: number }) => sum + Number(rc.count), 
    0
  );
  
  // Get reactions that have counts > 0 for display
  const displayReactions = REACTIONS.filter(r => reactionCountsMap[r.type] > 0);

  return (
    <div className="relative inline-flex items-center gap-2">
      <div
        className="relative"
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
      >
        <button
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full transition-all",
            "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground",
            userReaction && "bg-primary/10 text-primary",
            size === "sm" && "text-xs px-1.5 py-0.5"
          )}
          onClick={() => !user && toast({ title: "Sign in to react", variant: "destructive" })}
        >
          {userReaction ? (
            <span className="text-lg">{REACTIONS.find(r => r.type === userReaction.reaction_type)?.emoji}</span>
          ) : (
            <Heart className={cn("w-4 h-4", size === "sm" && "w-3 h-3")} />
          )}
          <span className={cn(size === "sm" && "text-xs")}>{totalReactions || ""}</span>
        </button>

        <AnimatePresence>
          {showPicker && user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 bg-card border border-border rounded-full shadow-lg z-50"
            >
              {REACTIONS.map((reaction) => (
                <motion.button
                  key={reaction.type}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => reactionMutation.mutate(reaction.type)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                    "hover:bg-muted",
                    userReaction?.reaction_type === reaction.type && "bg-primary/20"
                  )}
                  title={reaction.label}
                >
                  <span className="text-xl">{reaction.emoji}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Display reaction summary */}
      {displayReactions.length > 0 && (
        <div className="flex items-center -space-x-1">
          {displayReactions.slice(0, 3).map((reaction) => (
            <span key={reaction.type} className="text-sm">
              {reaction.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
