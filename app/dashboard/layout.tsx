/**
 * Dashboard Layout Component for D&A Office
 * ==========================================
 * Wraps all dashboard pages with:
 * - Sidebar navigation
 * - Authentication protection (redirects if not logged in)
 * - Consistent layout structure
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loader2 } from "lucide-react";

/**
 * DashboardLayout Component
 * Provides auth protection and sidebar layout
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get auth state from context
  const { userProfile, loading } = useAuth();
  
  // Router for redirecting
  const router = useRouter();

  /**
   * Effect: Authentication Protection
   * Redirects to login if not authenticated
   */
  useEffect(() => {
    if (!loading && !userProfile) {
      router.push("/login");
    }
  }, [userProfile, loading, router]);

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  /**
   * Not Authenticated - Show nothing while redirecting
   */
  if (!userProfile) {
    return null;
  }

  /**
   * Authenticated - Render dashboard layout
   */
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content area - offset for sidebar on desktop */}
      <main className="lg:ml-72 min-h-screen">
        <div className="p-4 pt-16 lg:pt-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
