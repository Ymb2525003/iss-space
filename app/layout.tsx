/**
 * Root Layout Component
 * =====================
 * This is the main layout that wraps the entire application.
 * It provides:
 * - HTML structure with proper lang attribute
 * - Font configuration using Google Fonts
 * - AuthProvider for authentication state management
 * - Toaster for notifications
 * 
 * All pages in the app will be rendered as children of this layout.
 */

import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";

/**
 * Metadata Configuration
 * SEO and browser metadata for the application
 */
export const metadata: Metadata = {
  title: "ISS Team Space",
  description: "ISS team workspace for tasks, messages, recommendations, and calendar planning.",
  keywords: ["team management", "collaboration", "task management"],
  authors: [{ name: "ISS Team" }],
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

/**
 * Viewport Configuration
 * Controls how the page is displayed on different devices
 */
export const viewport: Viewport = {
  width: "device-width",     // Responsive width
  initialScale: 1,           // No initial zoom
  themeColor: "#8B4513",     // Brown theme color for browser UI
};

/**
 * RootLayout Component
 * The top-level layout component that wraps all pages
 * 
 * @param children - The page content to be rendered
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Set language for accessibility and SEO
    <html lang="en" suppressHydrationWarning>
      {/* Apply font variable to body for Tailwind access */}
      <body className="font-sans antialiased">
        {/* 
          AuthProvider wraps the entire app to provide authentication
          context to all components. Any component can use useAuth() hook.
        */}
        <AuthProvider>
          {/* Main content - pages are rendered here */}
          {children}
          
          {/* 
            Toaster component for displaying toast notifications
            Used for success/error messages throughout the app
          */}
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
