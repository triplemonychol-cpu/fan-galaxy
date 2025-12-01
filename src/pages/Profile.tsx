import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Users, MessageSquare, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function Profile() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: groups } = useQuery({
    queryKey: ["userGroups", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          groups(*)
        `)
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((item: any) => item.groups);
    },
    enabled: !!user,
  });

  const { data: posts } = useQuery({
    queryKey: ["userPosts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          groups(name, slug)
        `)
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Please sign in to view your profile</h1>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="container py-8 px-4 max-w-4xl mx-auto">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-3xl">
                {profile?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">
                {profile?.display_name || profile?.username}
              </CardTitle>
              <p className="text-muted-foreground mb-4">@{profile?.username}</p>
              {profile?.bio && (
                <p className="text-sm mb-4">{profile.bio}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined {profile?.created_at && format(new Date(profile.created_at), "MMMM yyyy")}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Communities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groups && groups.length > 0 ? (
              <div className="space-y-2">
                {groups.map((group: any) => (
                  <Link
                    key={group.id}
                    to={`/group/${group.slug}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="font-semibold">{group.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {group.member_count} members
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No communities joined yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{posts?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Posts Created</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{groups?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Communities Joined</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="block p-4 rounded-lg border hover:shadow-medium transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold">{post.title}</div>
                    <Badge variant="outline">{post.groups?.name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>{post.comment_count} comments</span>
                    <span>{post.like_count} likes</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No posts yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
