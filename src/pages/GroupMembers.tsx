import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  UserMinus,
  Shield,
  Crown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";

export default function GroupMembers() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["groupMembers", group?.id],
    queryFn: async () => {
      if (!group?.id) return [];
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          *,
          public_profiles:user_id(id, username, avatar_url, display_name)
        `)
        .eq("group_id", group.id)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!group?.id,
  });

  const isCreator = user?.id === group?.created_by;

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMembers", group?.id] });
      toast.success("Member removed");
    },
    onError: () => {
      toast.error("Failed to remove member");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from("group_members")
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMembers", group?.id] });
      toast.success("Role updated");
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });

  const filteredMembers = members?.filter((member) => {
    const profile = member.public_profiles as any;
    const name = profile?.display_name || profile?.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isLoading = groupLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="container py-8 px-4 max-w-lg mx-auto">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-20 w-full mb-2" />
        <Skeleton className="h-20 w-full mb-2" />
        <Skeleton className="h-20 w-full" />
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

  const getRoleBadge = (role: string | null, userId: string) => {
    if (userId === group.created_by) {
      return <Badge className="bg-amber-500 text-white">Creator</Badge>;
    }
    if (role === "admin") {
      return <Badge variant="default">Admin</Badge>;
    }
    if (role === "moderator") {
      return <Badge variant="secondary">Moderator</Badge>;
    }
    return null;
  };

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
          <h1 className="text-xl font-bold">Members ({members?.length || 0})</h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="pl-10"
          />
        </div>

        {/* Members List */}
        <div className="space-y-2">
          {filteredMembers?.map((member, index) => {
            const profile = member.public_profiles as any;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-card rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {profile?.display_name || profile?.username}
                    </p>
                    {profile?.username && profile?.display_name && (
                      <p className="text-sm text-muted-foreground">
                        @{profile.username}
                      </p>
                    )}
                  </div>
                  {getRoleBadge(member.role, profile?.id)}
                </div>

                {isCreator && profile?.id !== user?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          updateRoleMutation.mutate({
                            memberId: member.id,
                            role: "admin",
                          })
                        }
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateRoleMutation.mutate({
                            memberId: member.id,
                            role: "moderator",
                          })
                        }
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Make Moderator
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateRoleMutation.mutate({
                            memberId: member.id,
                            role: "member",
                          })
                        }
                      >
                        Remove Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            );
          })}

          {filteredMembers?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No members found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
