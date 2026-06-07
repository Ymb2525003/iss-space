/**
 * Landing Page Component
 * ======================
 * Simple landing page for ISS Team Space
 * Shows a motivational message about working together
 * and provides access to the login
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Heart } from "lucide-react";

/**
 * LandingPage Component
 * Clean, casual landing with motivational message
 */
export default function LandingPage() {
  return (
    // Main container with gradient background
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background flex flex-col">
      {/* 
        =====================================
        NAVIGATION BAR
        =====================================
        Simple header with logo and sign in
      */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and brand name - place for your actual logo */}
            <Link href="/" className="flex items-center gap-3">
              {/* Logo placeholder - replace with actual logo image */}
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">ISS Team Space</span>
            </Link>

            {/* Sign in button */}
            <Link href="/login">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 
        =====================================
        HERO SECTION
        =====================================
        Casual motivational message about teamwork
      */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Friendly greeting */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Heart className="h-4 w-4" />
            <span>Welcome to the family</span>
          </div>

          {/* Main headline - casual and friendly */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground text-balance">
            Hey there,
            <br />
            <span className="text-primary">let&apos;s do great things together.</span>
          </h1>

          {/* Motivational message - casual tone */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            This is our space to collaborate, share ideas, and make cool stuff happen. 
            Whether you&apos;re here to work on tasks, share a recommendation, or just check in - 
            we&apos;re all in this together. Let&apos;s make it count!
          </p>

          {/* Another motivational quote */}
          <div className="bg-card border border-border rounded-xl p-6 max-w-xl mx-auto">
            <p className="text-foreground italic text-lg">
              &quot;Alone we can do so little; together we can do so much.&quot;
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              - The ISS Team
            </p>
          </div>

          {/* Call-to-action button */}
          <div className="pt-4">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
              >
                Let&apos;s Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Friendly note */}
          <p className="text-sm text-muted-foreground">
            Pick your name and jump right in - we&apos;ve been waiting for you!
          </p>
        </div>
      </section>

      {/* 
        =====================================
        FOOTER
        =====================================
        Simple footer
      */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Users className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">
              ISS Team Space - Built for the team
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
