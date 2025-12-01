import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Image, X } from "lucide-react";

export default function CreatePost() {
  const { groupSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: group } = useQuery({
    queryKey: ["group", groupSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("slug", groupSlug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user || !group) throw new Error("Not authenticated");
      if (!title.trim() || !content.trim()) {
        throw new Error("Title and content are required");
      }

      let imageUrl = null;

      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split(".").pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("uploads")
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
        setUploading(false);
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          group_id: group.id,
          author_id: user.id,
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Post created!");
      navigate(`/post/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create post");
      setUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPostMutation.mutate();
  };

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Please sign in to create a post</h1>
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container py-12 px-4 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Share your thoughts with the {group?.name} community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="What's on your mind?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts in detail..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                maxLength={5000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image (optional)</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Label htmlFor="image" className="cursor-pointer">
                    <Image className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload an image
                    </p>
                  </Label>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createPostMutation.isPending || uploading}
                className="flex-1"
              >
                {uploading ? "Uploading..." : createPostMutation.isPending ? "Creating..." : "Create Post"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={createPostMutation.isPending || uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
