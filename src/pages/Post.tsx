import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, ArrowLeft, Flag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { ReactionPicker } from "@/components/ReactionPicker";
import { PollDisplay } from "@/components/PollDisplay";
import { ReportDialog } from "@/components/ReportDialog";
import { CharacterCount } from "@/components/CharacterCount";

const COMMENT_MAX_LENGTH = 2000;

export default function Post() {
  const { postId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          public_profiles:author_id(username, avatar_url),
          groups(name, slug)
        `)
        .eq("id", postId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          public_profiles:author_id(username, avatar_url)
        `)
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!user || !commentContent.trim()) {
        throw new Error("Comment cannot be empty");
      }

      const { error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          author_id: user.id,
          content: commentContent.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      setCommentContent("");
      toast.success("Comment added!");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8 px-4 max-w-4xl mx-auto">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Post not found</h1>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 max-w-4xl mx-auto">
      <Button variant="ghost" asChild className="mb-4">
        <Link to={`/group/${post.groups?.slug}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {post.groups?.name}
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3 mb-4">
              <Avatar>
                <AvatarImage src={post.public_profiles?.avatar_url} />
                <AvatarFallback>
                  {post.public_profiles?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{post.public_profiles?.username}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl">{post.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>

            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="rounded-lg w-full mb-6"
              />
            )}

            {/* Poll Display */}
            <PollDisplay postId={post.id} />

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-6 text-muted-foreground">
                <ReactionPicker postId={post.id} />
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>{post.comment_count} comments</span>
                </div>
              </div>
              <ReportDialog postId={post.id} />
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>

          {user && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      rows={3}
                      maxLength={COMMENT_MAX_LENGTH}
                    />
                    <CharacterCount current={commentContent.length} max={COMMENT_MAX_LENGTH} />
                    <div className="mt-3 flex justify-end">
                      <Button
                        onClick={() => createCommentMutation.mutate()}
                        disabled={!commentContent.trim() || createCommentMutation.isPending}
                      >
                        {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarImage src={comment.public_profiles?.avatar_url} />
                          <AvatarFallback>
                            {comment.public_profiles?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {comment.public_profiles?.username}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        <p className="whitespace-pre-wrap text-sm">
                            {comment.content}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <ReactionPicker commentId={comment.id} size="sm" />
                            <ReportDialog commentId={comment.id} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {user ? "Be the first to comment!" : "Sign in to comment"}
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}
