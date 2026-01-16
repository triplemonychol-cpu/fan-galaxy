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
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

const MAX_ADMINS = 3;

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

  // Role checks
  const isCreator = user?.id === group?.created_by;
  
  const currentUserMember = useMemo(() => 
    members?.find(m => (m.public_profiles as any)?.id === user?.id),
    [members, user?.id]
  );
  
  const isAdmin = currentUserMember?.role === "admin";
  const isModerator = currentUserMember?.role === "moderator";
  const canManageRoles = isCreator || isAdmin;

  // Count current admins
  const adminCount = useMemo(() => 
    members?.filter(m => m.role === "admin").length || 0,
    [members]
  );

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

  const handleMakeAdmin = (memberId: string) => {
    if (adminCount >= MAX_ADMINS) {
      toast.error(`Maximum of ${MAX_ADMINS} admins allowed`);
      return;
    }
    updateRoleMutation.mutate({ memberId, role: "admin" });
  };

  const filteredMembers = members?.filter((member) => {
    const profile = member.public_profiles as any;
    const name = profile?.display_name || profile?.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort members: creator first, then admins, then moderators, then members
  const sortedMembers = useMemo(() => {
    if (!filteredMembers || !group) return [];
    return [...filteredMembers].sort((a, b) => {
      const aProfile = a.public_profiles as any;
      const bProfile = b.public_profiles as any;
      
      // Creator always first
      if (aProfile?.id === group.created_by) return -1;
      if (bProfile?.id === group.created_by) return 1;
      
      // Then admins
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (b.role === "admin" && a.role !== "admin") return 1;
      
      // Then moderators
      if (a.role === "moderator" && b.role !== "moderator") return -1;
      if (b.role === "moderator" && a.role !== "moderator") return 1;
      
      return 0;
    });
  }, [filteredMembers, group]);

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

  const canManageMember = (memberRole: string | null, memberUserId: string) => {
    // Creator can manage anyone except themselves
    if (isCreator && memberUserId !== user?.id) return true;
    
    // Admins can manage moderators and regular members (not other admins or creator)
    if (isAdmin && memberUserId !== user?.id) {
      if (memberUserId === group.created_by) return false;
      if (memberRole === "admin") return false;
      return true;
    }
    
    return false;
  };

  const canPromoteToAdmin = (memberRole: string | null) => {
    // Only creator can promote to admin
    if (!isCreator) return false;
    if (adminCount >= MAX_ADMINS) return false;
    if (memberRole === "admin") return false;
    return true;
  };

  const canPromoteToModerator = (memberRole: string | null, memberUserId: string) => {
    // Creator and admins can promote to moderator
    if (!canManageRoles) return false;
    if (memberUserId === group.created_by) return false;
    if (memberRole === "moderator") return false;
    return true;
  };

  const canRemoveRole = (memberRole: string | null, memberUserId: string) => {
    if (memberUserId === group.created_by) return false;
    if (!memberRole || memberRole === "member") return false;
    
    // Creator can remove any role
    if (isCreator) return true;
    
    // Admins can only remove moderator role
    if (isAdmin && memberRole === "moderator") return true;
    
    return false;
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
          <div>
            <h1 className="text-xl font-bold">Members ({members?.length || 0})</h1>
            <p className="text-sm text-primary-foreground/70">
              {adminCount}/{MAX_ADMINS} admins
            </p>
          </div>
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

        {/* Role Legend */}
        {canManageRoles && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Role Permissions:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-white text-xs">Creator</Badge>
                <span>Full control, can add up to {MAX_ADMINS} admins</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Admin</Badge>
                <span>Can manage moderators & members</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Moderator</Badge>
                <span>Can moderate content</span>
              </li>
            </ul>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2">
          {sortedMembers?.map((member, index) => {
            const profile = member.public_profiles as any;
            const memberUserId = profile?.id;
            const memberRole = member.role;
            
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
                  {getRoleBadge(memberRole, memberUserId)}
                </div>

                {canManageMember(memberRole, memberUserId) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canPromoteToAdmin(memberRole) && (
                        <DropdownMenuItem
                          onClick={() => handleMakeAdmin(member.id)}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Make Admin
                          {adminCount >= MAX_ADMINS - 1 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({MAX_ADMINS - adminCount} slot left)
                            </span>
                          )}
                        </DropdownMenuItem>
                      )}
                      {canPromoteToModerator(memberRole, memberUserId) && memberRole !== "admin" && (
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
                      )}
                      {canRemoveRole(memberRole, memberUserId) && (
                        <DropdownMenuItem
                          onClick={() =>
                            updateRoleMutation.mutate({
                              memberId: member.id,
                              role: "member",
                            })
                          }
                        >
                          <User className="h-4 w-4 mr-2" />
                          Remove Role
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
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

          {sortedMembers?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No members found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
