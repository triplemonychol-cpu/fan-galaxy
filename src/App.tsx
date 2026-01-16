import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Category from "./pages/Category";
import Group from "./pages/Group";
import GroupSettings from "./pages/GroupSettings";
import GroupDeepSettings from "./pages/GroupDeepSettings";
import GroupMembers from "./pages/GroupMembers";
import GroupActivity from "./pages/GroupActivity";
import GroupPhotos from "./pages/GroupPhotos";
import GroupHistory from "./pages/GroupHistory";
import CreatePost from "./pages/CreatePost";
import CreateGroup from "./pages/CreateGroup";
import Post from "./pages/Post";
import Profile from "./pages/Profile";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import Updates from "./pages/Updates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/category/:slug" element={<Category />} />
                  <Route path="/group/:slug" element={<Group />} />
                  <Route path="/group/:slug/settings" element={<GroupSettings />} />
                  <Route path="/group/:slug/deep-settings" element={<GroupDeepSettings />} />
                  <Route path="/group/:slug/members" element={<GroupMembers />} />
                  <Route path="/group/:slug/activity" element={<GroupActivity />} />
                  <Route path="/group/:slug/photos" element={<GroupPhotos />} />
                  <Route path="/group/:slug/history" element={<GroupHistory />} />
                  <Route path="/group/:groupSlug/create-post" element={<CreatePost />} />
                  <Route path="/create-group" element={<CreateGroup />} />
                  <Route path="/post/:postId" element={<Post />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/guidelines" element={<CommunityGuidelines />} />
                  <Route path="/updates" element={<Updates />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
