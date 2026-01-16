import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronRight,
  Palette,
  Tag,
  Lock,
  Eye,
  EyeOff,
  Award,
  MessageSquare,
  UserCheck,
  Edit3,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ImageUpload } from "@/components/ImageUpload";
import { useState, useEffect } from "react";

const THEME_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
];

export default function GroupDeepSettings() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [requirePostApproval, setRequirePostApproval] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [requireEditApproval, setRequireEditApproval] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);

  const { data: group, isLoading } = useQuery({
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

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || "");
      setThemeColor((group as any).theme_color || null);
      setTags((group as any).tags || []);
      setIsPrivate((group as any).is_private || false);
      setIsHidden((group as any).is_hidden || false);
      setRequirePostApproval((group as any).require_post_approval || false);
      setAllowAnonymous((group as any).allow_anonymous || false);
      setRequireEditApproval((group as any).require_edit_approval || false);
    }
  }, [group]);

  const isCreator = user?.id === group?.created_by;

  const updateGroupMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase
        .from("groups")
        .update(updates)
        .eq("id", group?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", slug] });
      toast.success("Settings updated!");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const handleSave = (field: string, value: any) => {
    updateGroupMutation.mutate({ [field]: value });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      handleSave("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    handleSave("tags", newTags);
  };

  if (isLoading) {
    return (
      <div className="container py-8 px-4 max-w-lg mx-auto">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
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
        <p className="text-muted-foreground mb-4">Only the community creator can access these settings.</p>
        <Button asChild>
          <Link to={`/group/${slug}`}>Go Back</Link>
        </Button>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">Group settings</h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Basic Info Section */}
          <div>
            <h2 className="text-lg font-bold mb-4">Basic Info</h2>
            <div className="space-y-1">
              {/* Name */}
              <div className="py-4 border-b border-border">
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => name !== group.name && handleSave("name", name)}
                  className="mt-1 bg-transparent border-0 p-0 h-auto text-base focus-visible:ring-0"
                  placeholder="Community name"
                />
              </div>

              {/* Description */}
              <div className="py-4 border-b border-border">
                <label className="text-sm text-muted-foreground">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => description !== (group.description || "") && handleSave("description", description)}
                  className="mt-1 bg-transparent border-0 p-0 min-h-[60px] text-base focus-visible:ring-0 resize-none"
                  placeholder="Community description"
                />
              </div>

              {/* Cover Photo */}
              <button
                onClick={() => setShowCoverUpload(true)}
                className="w-full py-4 border-b border-border text-left hover:bg-muted/50 transition-colors"
              >
                <span>Cover photo</span>
              </button>

              {/* Color */}
              <button
                onClick={() => setShowColorPicker(true)}
                className="w-full py-4 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <span>Color</span>
                <div className="flex items-center gap-2">
                  {themeColor && (
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>

              {/* Tags */}
              <div className="py-4 border-b border-border">
                <label className="text-sm text-muted-foreground">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No tags</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    placeholder="Add tag"
                    className="flex-1"
                  />
                  <Button onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
              </div>

              {/* Privacy */}
              <div className="py-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span>Privacy</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isPrivate ? "Private" : "Public"}
                  </p>
                </div>
                <Switch
                  checked={isPrivate}
                  onCheckedChange={(checked) => {
                    setIsPrivate(checked);
                    handleSave("is_private", checked);
                  }}
                />
              </div>

              {/* Hide Group */}
              <div className="py-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {isHidden ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>Hide group</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isHidden ? "Hidden" : "Visible"}
                  </p>
                </div>
                <Switch
                  checked={isHidden}
                  onCheckedChange={(checked) => {
                    setIsHidden(checked);
                    handleSave("is_hidden", checked);
                  }}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Membership Section */}
          <div>
            <h2 className="text-lg font-bold mb-4">Membership</h2>
            <button className="w-full py-4 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>Group badges</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <Separator />

          {/* Manage Discussion Section */}
          <div>
            <h2 className="text-lg font-bold mb-4">Manage discussion</h2>

            {/* Anonymous Participation */}
            <div className="py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Anonymous participation</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Allow members to post anonymously
                </p>
              </div>
              <Switch
                checked={allowAnonymous}
                onCheckedChange={(checked) => {
                  setAllowAnonymous(checked);
                  handleSave("allow_anonymous", checked);
                }}
              />
            </div>

            {/* Post Approval */}
            <div className="py-4 border-b border-border flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>Post approval</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Turn this on if you want admins and moderators to approve each post
                </p>
              </div>
              <Switch
                checked={requirePostApproval}
                onCheckedChange={(checked) => {
                  setRequirePostApproval(checked);
                  handleSave("require_post_approval", checked);
                }}
              />
            </div>

            {/* Approve Edits */}
            <div className="py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-muted-foreground" />
                  <span>Approve edits</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {requireEditApproval ? "On" : "Off"}
                </p>
              </div>
              <Switch
                checked={requireEditApproval}
                onCheckedChange={(checked) => {
                  setRequireEditApproval(checked);
                  handleSave("require_edit_approval", checked);
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-lg p-6 max-w-sm w-full space-y-4"
          >
            <h3 className="text-lg font-bold">Choose Theme Color</h3>
            <div className="grid grid-cols-3 gap-3">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    setThemeColor(color.value);
                    handleSave("theme_color", color.value);
                    setShowColorPicker(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-transparent"
                    style={{
                      backgroundColor: color.value,
                      borderColor: themeColor === color.value ? "white" : "transparent",
                    }}
                  />
                  <span className="text-xs">{color.name}</span>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowColorPicker(false)}
            >
              Cancel
            </Button>
          </motion.div>
        </div>
      )}

      {/* Cover Upload Modal */}
      {showCoverUpload && user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-lg p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-lg font-bold">Change Cover Photo</h3>
            <ImageUpload
              onUploadComplete={(url) => {
                handleSave("banner_url", url);
                setShowCoverUpload(false);
              }}
              currentImageUrl={group.banner_url}
              variant="banner"
              folder="groups"
              userId={user.id}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCoverUpload(false)}
            >
              Cancel
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
