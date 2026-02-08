import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

export default function VerificationSuccess() {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment");
        if (error) throw error;
        if (data?.verified) {
          setVerified(true);
          toast.success("You're now verified! 🎉");
        } else {
          toast.error("Payment not found. Please try again.");
        }
      } catch (err) {
        console.error("Verification error:", err);
        toast.error("Could not verify payment. Please contact support.");
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, []);

  return (
    <>
      <SEO title="Verification Success" description="Your verification status" />
      <div className="container py-16 max-w-lg mx-auto">
        <Card>
          <CardHeader className="text-center">
            {verifying ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            ) : verified ? (
              <BadgeCheck className="h-16 w-16 text-blue-500 fill-blue-500 stroke-white mx-auto" />
            ) : null}
            <CardTitle className="text-2xl mt-4">
              {verifying
                ? "Verifying your payment..."
                : verified
                ? "You're Verified!"
                : "Verification Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {verified && (
              <p className="text-muted-foreground">
                Your blue verification tick is now active. Enjoy your creative tools!
              </p>
            )}
            <Button onClick={() => navigate("/profile")}>
              Go to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
