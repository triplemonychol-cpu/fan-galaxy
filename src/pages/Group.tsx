import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Plus, UserPlus, UserMinus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function Group() {
  const { slug } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          categories(name, icon, color),
          profiles:created_by(username, avatar_url)
        `)
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: isMember } = useQuery({
    queryKey: ["isMember", group?.id, user?.id],
    queryFn: async () => {
      if (!group?.id || !user?.id) return false;
      const { data, error } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!group?.id && !!user?.id,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["posts", group?.id],
    queryFn: async () => {
      if (!group?.id) return [];
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:author_id(username, avatar_url)
        `)
        .eq("group_id", group.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!group?.id,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user || !group) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isMember"] });
      queryClient.invalidateQueries({ queryKey: ["group"] });
      toast.success("Joined community!");
    },
    onError: () => {
      toast.error("Failed to join community");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !group) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isMember"] });
      queryClient.invalidateQueries({ queryKey: ["group"] });
      toast.success("Left community");
    },
    onError: () => {
      toast.error("Failed to leave community");
    },
  });

  if (groupLoading) {
    return (
      <div className="container py-8 px-4">
        <Skeleton className="h-48 w-full mb-8" />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Community not found</h1>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Group Header */}
      <div
        className="py-16 px-4 relative"
        style={{
          background: group.banner_url || `linear-gradient(135deg, ${group.categories?.color} 0%, ${group.categories?.color}cc 100%)`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container max-w-5xl mx-auto text-white"
        >
          <div className="flex items-center gap-4 mb-4">
            {group.icon_url && (
              <div className="w-20 h-20 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
                {group.icon_url}
              </div>
            )}
            <div>
              <h1 className="text-5xl font-bold mb-2">{group.name}</h1>
              <div className="flex items-center gap-4 text-white/80">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {group.member_count} members
                </span>
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {group.post_count} posts
                </span>
              </div>
            </div>
          </div>
          <p className="text-lg opacity-90 mb-6">{group.description}</p>
          <div className="flex gap-3">
            {user ? (
              isMember ? (
                <>
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90"
                    asChild
                  >
                    <Link to={`/group/${group.slug}/create-post`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Post
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Leave
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Community
                </Button>
              )
            ) : (
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link to="/auth">Sign In to Join</Link>
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Posts */}
      <div className="container py-12 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Recent Discussions</h2>

        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/post/${post.id}`}>
                  <Card className="hover:shadow-medium transition-all duration-300 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={post.profiles?.avatar_url} />
                          <AvatarFallback>
                            {post.profiles?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{post.profiles?.username}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {post.content}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {post.image_url && (
                      <div className="px-6 pb-4">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="rounded-lg w-full max-h-96 object-cover"
                        />
                      </div>
                    )}
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          {post.comment_count} comments
                        </span>
                        <span className="flex items-center gap-2">
                          ❤️ {post.like_count} likes
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No discussions yet</p>
              {isMember && (
                <Button asChild>
                  <Link to={`/group/${group.slug}/create-post`}>Create First Post</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
