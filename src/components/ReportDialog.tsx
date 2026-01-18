import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";

interface ReportDialogProps {
  postId?: string;
  commentId?: string;
  userId?: string;
  trigger?: React.ReactNode;
}

const reasons = [
  { value: "violence", label: "Violence or threats" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "spam", label: "Spam or misleading content" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other violation" },
];

export function ReportDialog({ postId, commentId, userId, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to report content.",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Select a reason",
        description: "Please select a reason for your report.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        post_id: postId || null,
        comment_id: commentId || null,
        reported_user_id: userId || null,
        reason,
        description: description || null,
      });

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });
      setOpen(false);
      setReason("");
      setDescription("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Flag className="h-4 w-4 mr-1" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us maintain a safe community. Review our{" "}
            <Link to="/guidelines" className="text-primary hover:underline" onClick={() => setOpen(false)}>
              Community Guidelines
            </Link>{" "}
            for more information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Reason for report</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !reason}>
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
