import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const APK_DOWNLOAD_URL = "https://storage.googleapis.com/codemagic-build-artifacts/bca0486b-279d-482a-8882-691c06d2d297/46499451-ec2e-4cf4-b321-ddfa320f216d/app-debug.apk?Expires=1768731758&GoogleAccessId=secure-uploader%40woven-voyage-217607.iam.gserviceaccount.com&Signature=bBR3C5XIkhEHPAj4EVB1ZPbowWba83f40OKZilLI%2BI2nwfXVV%2Bstf26zdO3RqtzB2ewzCnj2%2Br6RqaecfSxzKZCPJbyo8lIllhEZKGyQ52ihlp9nHa9CRcMBbOKRe4u1zb7vX4xBK6RWCU38f3QqE5wWDsDREt%2FX6PCRkLXye2nsqJK1nChf27E43rISPkz13uZE9Q6BgIGZz3FqX8qEiCSEc4BG719JjX2yur%2FGcDhV9f8O8bxppdus0YdoiBySoio3XzgLdNBjOHDdSKcD9TdrpkxDRWf66an4GoTKWMouQFEVKt65L0zO0u7SEMbw3Eaflziqsd3%2BzukTlg5GUg%3D%3D";

export function AppDownloadBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem("apk-banner-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show banner after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("apk-banner-dismissed", "true");
  };

  const handleDownload = () => {
    window.open(APK_DOWNLOAD_URL, "_blank");
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 p-4"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-none shadow-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white/20">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Get the FanHub App</h3>
                    <p className="text-sm text-primary-foreground/80">
                      Download our Android app for a better experience
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleDownload}
                    variant="secondary"
                    className="bg-white text-primary hover:bg-white/90 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download APK
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
