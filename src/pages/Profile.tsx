import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Users, MessageSquare, Calendar, Award, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { UserLevel } from "@/components/UserLevel";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { SEO } from "@/components/SEO";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile picture updated!");
    },
    onError: () => {
      toast.error("Failed to update profile picture");
    },
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
    <>
      <SEO 
        title={profile?.display_name || profile?.username || "Your Profile"}
        description={`View ${profile?.display_name || profile?.username || "user"}'s profile on FanHub. See their communities, posts, badges, and achievements.`}
        keywords="fan profile, user profile, community member, fan achievements, user badges"
      />
      <div className="container py-8 px-4 max-w-4xl mx-auto">
        <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start gap-6">
            <ImageUpload
              currentImageUrl={profile?.avatar_url}
              onUploadComplete={(url) => updateAvatarMutation.mutate(url)}
              folder="avatars"
              userId={user.id}
              variant="avatar"
              fallbackText={profile?.username || "?"}
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-3xl">
                  {profile?.display_name || profile?.username}
                </CardTitle>
                <UserLevel 
                  level={profile?.level || 1} 
                  points={profile?.points || 0} 
                  size="md"
                />
              </div>
              <p className="text-muted-foreground mb-2">@{profile?.username}</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-sm">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{profile?.points || 0}</span>
                  <span className="text-muted-foreground">points</span>
                </div>
              </div>
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

      {/* Badges Section */}
      {user && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Badges & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeDisplay userId={user.id} showAll />
          </CardContent>
        </Card>
      )}

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
    </>
  );
}
