import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function GroupPhotos() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  // Fetch posts with images
  const { data: postsWithImages, isLoading: postsLoading } = useQuery({
    queryKey: ["groupPhotos", group?.id],
    queryFn: async () => {
      if (!group?.id) return [];
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          image_url,
          title,
          created_at,
          public_profiles:author_id(username)
        `)
        .eq("group_id", group.id)
        .not("image_url", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!group?.id,
  });

  const isLoading = groupLoading || postsLoading;

  if (isLoading) {
    return (
      <div className="container py-8 px-4 max-w-lg mx-auto">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
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
          <h1 className="text-xl font-bold">Photos ({postsWithImages?.length || 0})</h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto">
        {postsWithImages && postsWithImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {postsWithImages.map((post, index) => (
              <motion.button
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square relative overflow-hidden"
                onClick={() => setSelectedImage(post.image_url)}
              >
                <img
                  src={post.image_url!}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">No photos yet</h2>
            <p className="text-muted-foreground">
              Photos from posts will appear here
            </p>
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      )}
    </div>
  );
}
