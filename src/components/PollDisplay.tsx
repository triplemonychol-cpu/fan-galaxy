import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, BarChart3 } from "lucide-react";

interface PollDisplayProps {
  postId: string;
}

export function PollDisplay({ postId }: PollDisplayProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: poll } = useQuery({
    queryKey: ["poll", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*, poll_options(*)")
        .eq("post_id", postId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: userVotes = [] } = useQuery({
    queryKey: ["poll-votes", postId, user?.id],
    queryFn: async () => {
      if (!user || !poll) return [];
      const { data, error } = await supabase
        .from("poll_votes")
        .select("poll_option_id")
        .eq("user_id", user.id)
        .in("poll_option_id", poll.poll_options?.map((o: any) => o.id) || []);
      if (error) throw error;
      return data.map(v => v.poll_option_id);
    },
    enabled: !!user && !!poll,
  });

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase.from("poll_votes").insert({
        poll_option_id: optionId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll", postId] });
      queryClient.invalidateQueries({ queryKey: ["poll-votes", postId] });
      toast({ title: "Vote recorded!" });
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast({ title: "You already voted for this option", variant: "destructive" });
      } else {
        toast({ title: "Failed to vote", variant: "destructive" });
      }
    },
  });

  if (!poll) return null;

  const totalVotes = poll.poll_options?.reduce((sum: number, opt: any) => sum + (opt.vote_count || 0), 0) || 0;
  const hasVoted = userVotes.length > 0;

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm">{poll.question}</h4>
      </div>

      <div className="space-y-2">
        {poll.poll_options?.map((option: any) => {
          const percentage = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
          const isVoted = userVotes.includes(option.id);

          return (
            <motion.button
              key={option.id}
              whileHover={{ scale: hasVoted ? 1 : 1.01 }}
              whileTap={{ scale: hasVoted ? 1 : 0.99 }}
              onClick={() => !hasVoted && user && voteMutation.mutate(option.id)}
              disabled={hasVoted || !user}
              className={cn(
                "w-full relative overflow-hidden rounded-lg border transition-all text-left",
                hasVoted
                  ? "border-border/50 cursor-default"
                  : "border-border hover:border-primary/50 cursor-pointer",
                isVoted && "border-primary"
              )}
            >
              {/* Progress bar background */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: hasVoted ? `${percentage}%` : 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "absolute inset-y-0 left-0",
                  isVoted ? "bg-primary/20" : "bg-muted"
                )}
              />

              <div className="relative z-10 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isVoted && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  <span className={cn("text-sm", isVoted && "font-medium")}>
                    {option.option_text}
                  </span>
                </div>
                {hasVoted && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {percentage}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {!user && " • Sign in to vote"}
      </p>
    </div>
  );
}
