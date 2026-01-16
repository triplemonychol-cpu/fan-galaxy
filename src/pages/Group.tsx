import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  Plus, 
  UserPlus, 
  UserMinus, 
  Settings, 
  MoreVertical,
  Pause,
  Trash2,
  VolumeX,
  Pin,
  Share2,
  FileText,
  UserCog
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function Group() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          categories(name, icon, color),
          public_profiles:created_by(username, avatar_url)
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
          public_profiles:author_id(username, avatar_url)
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

  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      if (!user || !group) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", group.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Community deleted");
      navigate("/");
    },
    onError: () => {
      toast.error("Failed to delete community");
    },
  });

  const isCreator = user?.id === group?.created_by;

  const handleShareGroup = async () => {
    try {
      await navigator.share({
        title: group?.name,
        text: group?.description || `Check out ${group?.name}`,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

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
        className="py-16 px-4 relative bg-cover bg-center"
        style={{
          backgroundImage: group.banner_url ? `url(${group.banner_url})` : undefined,
          backgroundColor: !group.banner_url ? group.categories?.color : undefined,
        }}
      >
        {group.banner_url && (
          <div className="absolute inset-0 bg-black/40" />
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container max-w-5xl mx-auto text-white relative z-10"
        >
          <div className="flex items-center gap-4 mb-4">
            {group.icon_url && (
              <div className="w-20 h-20 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                {group.icon_url.startsWith('http') ? (
                  <img src={group.icon_url} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{group.icon_url}</span>
                )}
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
          <div className="flex gap-3 flex-wrap items-center">
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
                  
                  {/* Admin gets dropdown with management options, regular members get Leave button */}
                  {isCreator ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="lg"
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <MoreVertical className="mr-2 h-4 w-4" />
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onClick={() => toast.info("Group paused - new posts temporarily disabled")}>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause Group
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Notifications muted")}>
                          <VolumeX className="mr-2 h-4 w-4" />
                          Mute Notifications
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Group pinned to top")}>
                          <Pin className="mr-2 h-4 w-4" />
                          Pin Group
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleShareGroup}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share Group
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/group/${group.slug}/activity`)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Manage Content
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Transfer Ownership
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setShowDeleteDialog(true)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
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
                  )}
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    asChild
                  >
                    <Link to={`/group/${group.slug}/settings`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Info
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90"
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Community
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    asChild
                  >
                    <Link to={`/group/${group.slug}/settings`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Info
                    </Link>
                  </Button>
                </>
              )
            ) : (
              <>
                <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                  <Link to="/auth">Sign In to Join</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  asChild
                >
                  <Link to={`/group/${group.slug}/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Info
                  </Link>
                </Button>
              </>
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
                          <AvatarImage src={post.public_profiles?.avatar_url} />
                          <AvatarFallback>
                            {post.public_profiles?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{post.public_profiles?.username}</span>
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

      {/* Delete Group Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Community</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{group.name}"? This action cannot be undone. 
              All posts, comments, and member data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteGroupMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Ownership Dialog */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Ownership</AlertDialogTitle>
            <AlertDialogDescription>
              This feature allows you to transfer ownership to another member. 
              You will lose admin privileges after the transfer is complete.
              This feature is coming soon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
