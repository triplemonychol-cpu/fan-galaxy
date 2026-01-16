import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function GroupHistory() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          public_profiles:created_by(username, avatar_url, display_name)
        `)
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Get first post
  const { data: firstPost } = useQuery({
    queryKey: ["firstPost", group?.id],
    queryFn: async () => {
      if (!group?.id) return null;
      const { data } = await supabase
        .from("posts")
        .select(`
          *,
          public_profiles:author_id(username, avatar_url, display_name)
        `)
        .eq("group_id", group.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!group?.id,
  });

  if (groupLoading) {
    return (
      <div className="container py-8 px-4 max-w-lg mx-auto">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
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

  const creator = group.public_profiles as any;
  const firstPostAuthor = firstPost?.public_profiles as any;

  const milestones = [
    {
      icon: Calendar,
      title: "Community Created",
      description: `${group.name} was created`,
      date: group.created_at,
      user: creator,
    },
    ...(firstPost
      ? [
          {
            icon: FileText,
            title: "First Post",
            description: firstPost.title,
            date: firstPost.created_at,
            user: firstPostAuthor,
          },
        ]
      : []),
  ];

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
          <h1 className="text-xl font-bold">History</h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{group.member_count || 0}</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{group.post_count || 0}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timeline */}
        <h2 className="text-lg font-bold mb-4">Timeline</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-4"
              >
                {/* Icon */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <milestone.icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {milestone.user && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={milestone.user.avatar_url} />
                          <AvatarFallback>
                            {milestone.user.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="font-medium">{milestone.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {milestone.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(milestone.date), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Growth stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Community Age</p>
                  <p className="text-sm text-muted-foreground">
                    Created {format(new Date(group.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
