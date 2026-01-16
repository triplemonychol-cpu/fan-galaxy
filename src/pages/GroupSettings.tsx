import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  Bell,
  Calendar,
  Image,
  Clock,
  Settings,
  FileText,
  ImagePlus,
  Shield,
  Globe,
  Eye,
  CheckCircle2,
  EyeOff,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ImageUpload } from "@/components/ImageUpload";
import { useState } from "react";

export default function GroupSettings() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [showIconUpload, setShowIconUpload] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showGroupStatus, setShowGroupStatus] = useState(false);
  const [notificationSetting, setNotificationSetting] = useState("all");

  const { data: group, isLoading } = useQuery({
    queryKey: ["group", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          categories(name, icon, color)
        `)
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["groupMembers", group?.id],
    queryFn: async () => {
      if (!group?.id) return [];
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          *,
          public_profiles:user_id(username, avatar_url)
        `)
        .eq("group_id", group.id);
      if (error) throw error;
      return data;
    },
    enabled: !!group?.id,
  });

  const isCreator = user?.id === group?.created_by;

  const updateBannerMutation = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from("groups")
        .update({ banner_url: url })
        .eq("id", group?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", slug] });
      toast.success("Cover photo updated!");
      setShowCoverUpload(false);
    },
    onError: () => {
      toast.error("Failed to update cover photo");
    },
  });

  const updateIconMutation = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from("groups")
        .update({ icon_url: url })
        .eq("id", group?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", slug] });
      toast.success("Community icon updated!");
      setShowIconUpload(false);
    },
    onError: () => {
      toast.error("Failed to update icon");
    },
  });

  if (isLoading) {
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

  const isPrivate = (group as any).is_private || false;
  const isHidden = (group as any).is_hidden || false;

  const menuItems = [
    {
      icon: Users,
      label: "Members",
      value: group.member_count?.toString() || "0",
      onClick: () => navigate(`/group/${slug}/members`),
    },
    {
      icon: Bell,
      label: "Notifications",
      value: notificationSetting === "all" ? "All posts" : notificationSetting === "highlights" ? "Highlights" : "Off",
      onClick: () => setShowNotificationSettings(true),
    },
    {
      icon: Calendar,
      label: "Events",
      value: "Coming soon",
      onClick: () => toast.info("Events feature coming soon!"),
    },
    {
      icon: Image,
      label: "Photos",
      onClick: () => navigate(`/group/${slug}/photos`),
    },
    {
      icon: Clock,
      label: "History",
      onClick: () => navigate(`/group/${slug}/history`),
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => navigate(`/group/${slug}/deep-settings`),
      showIf: isCreator,
    },
    {
      icon: FileText,
      label: "Activity log",
      onClick: () => navigate(`/group/${slug}/activity`),
      showIf: isCreator,
    },
    {
      icon: ImagePlus,
      label: "Change cover photo",
      onClick: () => setShowCoverUpload(true),
      showIf: isCreator,
    },
    {
      icon: ImagePlus,
      label: "Change community icon",
      onClick: () => setShowIconUpload(true),
      showIf: isCreator,
    },
    {
      icon: Shield,
      label: "Group status",
      onClick: () => setShowGroupStatus(true),
    },
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
            onClick={() => navigate(`/group/${slug}`)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Community info</h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Group Name and Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{group.name}</h2>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>

            {/* Public/Private Group */}
            <div className="flex items-start gap-3">
              {isPrivate ? (
                <Lock className="h-5 w-5 mt-0.5 text-muted-foreground" />
              ) : (
                <Globe className="h-5 w-5 mt-0.5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{isPrivate ? "Private group" : "Public group"}</p>
                <p className="text-sm text-muted-foreground">
                  {isPrivate
                    ? "Only members can see who's in the group and what they post."
                    : "Anyone can see who's in the group and what they post."}
                </p>
              </div>
            </div>

            {/* Visible/Hidden */}
            <div className="flex items-start gap-3">
              {isHidden ? (
                <EyeOff className="h-5 w-5 mt-0.5 text-muted-foreground" />
              ) : (
                <Eye className="h-5 w-5 mt-0.5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{isHidden ? "Hidden" : "Visible"}</p>
                <p className="text-sm text-muted-foreground">
                  {isHidden ? "Only members can find this group." : "Anyone can find this group."}
                </p>
              </div>
            </div>

            {/* Description */}
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>

          <Separator />

          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems
              .filter((item) => item.showIf === undefined || item.showIf)
              .map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.value && (
                    <span className="text-muted-foreground">{item.value}</span>
                  )}
                </motion.button>
              ))}
          </div>

          {/* Cover Photo Upload Modal */}
          {showCoverUpload && user && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-background rounded-lg p-6 max-w-md w-full space-y-4"
              >
                <h3 className="text-lg font-bold">Change Cover Photo</h3>
                <ImageUpload
                  onUploadComplete={(url) => updateBannerMutation.mutate(url)}
                  currentImageUrl={group.banner_url}
                  variant="banner"
                  folder="groups"
                  userId={user.id}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowCoverUpload(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Icon Upload Modal */}
          {showIconUpload && user && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-background rounded-lg p-6 max-w-md w-full space-y-4"
              >
                <h3 className="text-lg font-bold">Change Community Icon</h3>
                <ImageUpload
                  onUploadComplete={(url) => updateIconMutation.mutate(url)}
                  currentImageUrl={group.icon_url}
                  variant="icon"
                  folder="groups"
                  userId={user.id}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowIconUpload(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Notification Settings Modal */}
          {showNotificationSettings && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-background rounded-lg p-6 max-w-md w-full space-y-4"
              >
                <h3 className="text-lg font-bold">Notification Settings</h3>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All posts", description: "Get notified about all new posts" },
                    { value: "highlights", label: "Highlights", description: "Only important posts and mentions" },
                    { value: "off", label: "Off", description: "No notifications from this group" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setNotificationSetting(option.value);
                        toast.success(`Notifications set to: ${option.label}`);
                        setShowNotificationSettings(false);
                      }}
                      className={`w-full p-4 rounded-lg text-left transition-colors ${
                        notificationSetting === option.value
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNotificationSettings(false)}
                >
                  Cancel
                </Button>
              </motion.div>
            </div>
          )}

          {/* Group Status Modal */}
          {showGroupStatus && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-background rounded-lg p-6 max-w-md w-full space-y-4"
              >
                <h3 className="text-lg font-bold">Group Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Active</span>
                    </div>
                    <Badge variant="default">Current</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {group.member_count || 0} members
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {group.post_count || 0} posts
                    </p>
                    <p className="flex items-center gap-2">
                      {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      {isPrivate ? "Private" : "Public"} group
                    </p>
                    <p className="flex items-center gap-2">
                      {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {isHidden ? "Hidden" : "Visible"} to everyone
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowGroupStatus(false)}
                >
                  Close
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
