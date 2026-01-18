import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MessageSquare, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function Category() {
  const { slug } = useParams();

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups", category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          public_profiles:created_by(username, avatar_url)
        `)
        .eq("category_id", category.id)
        .order("member_count", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  if (categoryLoading) {
    return (
      <div className="container py-8 px-4">
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Category not found</h1>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Category Header */}
      <div
        className="py-16 px-4"
        style={{
          background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}cc 100%)`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container max-w-4xl mx-auto text-center text-white"
        >
          <div className="text-6xl mb-4">{category.icon}</div>
          <h1 className="text-5xl font-bold mb-4">{category.name}</h1>
          <p className="text-xl opacity-90">{category.description}</p>
        </motion.div>
      </div>

      {/* Groups List */}
      <div className="container py-12 px-4 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Communities</h2>
          <Button asChild>
            <Link to="/create-group">
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Link>
          </Button>
        </div>

        {groupsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/group/${group.slug}`}>
                  <Card className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          {group.icon_url ? (
                            <img 
                              src={group.icon_url} 
                              alt={group.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl">
                              {category.icon}
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-2xl mb-2">{group.name}</CardTitle>
                            <CardDescription className="text-base">
                              {group.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{group.member_count} members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>{group.post_count} posts</span>
                        </div>
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
              <p className="text-muted-foreground mb-4">
                No communities yet in this category
              </p>
              <Button asChild>
                <Link to="/create-group">Create the First One</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
