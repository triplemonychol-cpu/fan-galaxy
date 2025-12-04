import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Newspaper, Film, Tv, Clapperboard, Gamepad2, BookOpen, MessageSquare, Heart } from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  movies: <Film className="h-5 w-5" />,
  "tv-shows": <Tv className="h-5 w-5" />,
  anime: <Clapperboard className="h-5 w-5" />,
  games: <Gamepad2 className="h-5 w-5" />,
  books: <BookOpen className="h-5 w-5" />,
  comics: <BookOpen className="h-5 w-5" />,
};

export default function Updates() {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: latestPosts, isLoading } = useQuery({
    queryKey: ["latest-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          content,
          image_url,
          like_count,
          comment_count,
          created_at,
          author:profiles!posts_author_id_fkey(username, display_name, avatar_url),
          group:groups!posts_group_id_fkey(
            name,
            slug,
            icon_url,
            category:categories!groups_category_id_fkey(name, slug, icon, color)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const filterPostsByCategory = (categorySlug: string) => {
    if (!latestPosts) return [];
    if (categorySlug === "all") return latestPosts;
    return latestPosts.filter(
      (post) => post.group?.category?.slug === categorySlug
    );
  };

  const PostCard = ({ post, index }: { post: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/post/${post.id}`}>
        <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
          {post.image_url && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge
                className="absolute top-3 left-3"
                style={{ backgroundColor: post.group?.category?.color }}
              >
                {post.group?.category?.icon} {post.group?.category?.name}
              </Badge>
            </div>
          )}
          <CardHeader className={post.image_url ? "pt-4" : ""}>
            {!post.image_url && (
              <Badge
                className="w-fit mb-2"
                style={{ backgroundColor: post.group?.category?.color }}
              >
                {post.group?.category?.icon} {post.group?.category?.name}
              </Badge>
            )}
            <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
              {post.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.content}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {post.like_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {post.comment_count || 0}
                </span>
              </div>
              <span>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground">
                in <span className="font-medium text-foreground">{post.group?.name}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 px-4 bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Newspaper className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Entertainment Updates
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Stay up to date with the latest discussions about movies, TV shows, anime, games, and more
          </p>
        </motion.div>
      </section>

      {/* Content Section */}
      <section className="py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-2 bg-transparent justify-start mb-8">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Newspaper className="h-4 w-4 mr-2" />
                All Updates
              </TabsTrigger>
              {categories?.map((category) => (
                <TabsTrigger
                  key={category.slug}
                  value={category.slug}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {categoryIcons[category.slug] || <span className="mr-2">{category.icon}</span>}
                  <span className="ml-2">{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="all">
                  {filterPostsByCategory("all").length === 0 ? (
                    <div className="text-center py-16">
                      <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No updates yet</h3>
                      <p className="text-muted-foreground">
                        Be the first to share something with the community!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filterPostsByCategory("all").map((post, index) => (
                        <PostCard key={post.id} post={post} index={index} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {categories?.map((category) => (
                  <TabsContent key={category.slug} value={category.slug}>
                    {filterPostsByCategory(category.slug).length === 0 ? (
                      <div className="text-center py-16">
                        <span className="text-6xl mb-4 block">{category.icon}</span>
                        <h3 className="text-xl font-semibold mb-2">
                          No {category.name} updates yet
                        </h3>
                        <p className="text-muted-foreground">
                          Be the first to share {category.name.toLowerCase()} news!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filterPostsByCategory(category.slug).map((post, index) => (
                          <PostCard key={post.id} post={post} index={index} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </>
            )}
          </Tabs>
        </div>
      </section>
    </div>
  );
}
