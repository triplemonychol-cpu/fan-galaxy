import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MessageSquare,
  Image,
  UserPlus,
  Edit,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function GroupActivity() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent posts as activity
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["groupPosts", group?.id],
    queryFn: async () => {
      if (!group?.id) return [];
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          public_profiles:author_id(username, avatar_url, display_name)
        `)
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!group?.id,
  });

  // Fetch recent members who joined
  const { data: recentMembers, isLoading: membersLoading } = useQuery({
    queryKey: ["recentGroupMembers", group?.id],
    queryFn: async () => {
      if (!group?.id) return [];
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          *,
          public_profiles:user_id(username, avatar_url, display_name)
        `)
        .eq("group_id", group.id)
        .order("joined_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!group?.id,
  });

  const isCreator = user?.id === group?.created_by;
  const isLoading = groupLoading || postsLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="container py-8 px-4 max-w-lg mx-auto">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-20 w-full mb-2" />
        <Skeleton className="h-20 w-full mb-2" />
        <Skeleton className="h-20 w-full" />
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

  if (!isCreator) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          Only the community creator can view the activity log.
        </p>
        <Button asChild>
          <Link to={`/group/${slug}`}>Go Back</Link>
        </Button>
      </div>
    );
  }

  // Combine and sort activities
  const activities = [
    ...(posts?.map((post) => ({
      type: "post" as const,
      id: post.id,
      user: post.public_profiles as any,
      title: post.title,
      timestamp: post.created_at,
    })) || []),
    ...(recentMembers?.map((member) => ({
      type: "join" as const,
      id: member.id,
      user: member.public_profiles as any,
      title: "joined the community",
      timestamp: member.joined_at,
    })) || []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "post":
        return <MessageSquare className="h-4 w-4" />;
      case "join":
        return <UserPlus className="h-4 w-4" />;
      case "edit":
        return <Edit className="h-4 w-4" />;
      case "delete":
        return <Trash2 className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-4 px-4 sticky top-0 z-10">
        <div className="container max-w-lg mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate(`/group/${slug}/settings`)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Activity Log</h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Activity List */}
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={`${activity.type}-${activity.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-start gap-3 p-4 bg-card rounded-lg"
            >
              <div className="p-2 rounded-full bg-muted">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user?.avatar_url} />
                    <AvatarFallback>
                      {activity.user?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate">
                    {activity.user?.display_name || activity.user?.username}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.type === "post" ? (
                    <>
                      Posted: <span className="font-medium">{activity.title}</span>
                    </>
                  ) : (
                    activity.title
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}

          {activities.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No activity yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
