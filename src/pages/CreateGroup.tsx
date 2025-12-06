import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreateGroup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(searchParams.get("category") || "");
  const [iconEmoji, setIconEmoji] = useState("👥");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
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

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in");
      
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      const { data, error } = await supabase
        .from("groups")
        .insert({
          name,
          slug,
          description,
          category_id: categoryId,
          created_by: user.id,
          icon_url: iconEmoji,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Auto-join the creator as admin
      await supabase.from("group_members").insert({
        group_id: data.id,
        user_id: user.id,
        role: "admin",
      });
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Community created successfully!");
      navigate(`/group/${data.slug}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create community");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to create a community");
      navigate("/auth");
      return;
    }
    
    if (!name.trim()) {
      toast.error("Please enter a community name");
      return;
    }
    
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    
    setIsSubmitting(true);
    createGroupMutation.mutate();
  };

  if (!user) {
    return (
      <div className="container max-w-2xl py-16 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to create a community
            </p>
            <Button asChild>
              <Link to="/auth">Login or Sign Up</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Button variant="ghost" className="mb-6" asChild>
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Create a Community</CardTitle>
          <CardDescription>
            Start a new community for fans to connect and share
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Community Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Attack on Titan Fans"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this community about?"
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Community Icon (Emoji)</Label>
              <Input
                id="icon"
                value={iconEmoji}
                onChange={(e) => setIconEmoji(e.target.value)}
                placeholder="👥"
                maxLength={2}
                className="w-24 text-2xl text-center"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Community"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}