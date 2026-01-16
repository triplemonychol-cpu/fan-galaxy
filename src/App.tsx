import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const Category = lazy(() => import("./pages/Category"));
const Group = lazy(() => import("./pages/Group"));
const GroupSettings = lazy(() => import("./pages/GroupSettings"));
const GroupDeepSettings = lazy(() => import("./pages/GroupDeepSettings"));
const GroupMembers = lazy(() => import("./pages/GroupMembers"));
const GroupActivity = lazy(() => import("./pages/GroupActivity"));
const GroupPhotos = lazy(() => import("./pages/GroupPhotos"));
const GroupHistory = lazy(() => import("./pages/GroupHistory"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const CreateGroup = lazy(() => import("./pages/CreateGroup"));
const Post = lazy(() => import("./pages/Post"));
const Profile = lazy(() => import("./pages/Profile"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const Updates = lazy(() => import("./pages/Updates"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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
                <Suspense fallback={<PageLoader />}>
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
                </Suspense>
              </main>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
