import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, MessageSquare, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function TrendingPosts() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["trending-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          like_count,
          comment_count,
          created_at,
          group:groups(name, slug)
        `)
        .order("like_count", { ascending: false })
        .order("comment_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <p className="text-muted-foreground text-sm text-center py-4">
        No trending posts yet. Be the first to post!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link
            to={`/post/${post.id}`}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="truncate">
                  {(post.group as any)?.name || "Unknown"}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {post.like_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {post.comment_count || 0}
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
