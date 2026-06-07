"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Calendar,
  Lightbulb,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Crown,
  Bell,
  User,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    {
      label: userProfile?.canAssignTasks ? "Assign Tasks" : "Tasks",
      href: "/dashboard/tasks",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    { label: "Messages", href: "/dashboard/messages", icon: <MessageSquare className="h-5 w-5" /> },
    { label: "Recommendations", href: "/dashboard/recommendations", icon: <Lightbulb className="h-5 w-5" /> },
    { label: "Calendar", href: "/dashboard/calendar", icon: <Calendar className="h-5 w-5" /> },
    { label: "Team", href: "/dashboard/team", icon: <Users className="h-5 w-5" /> },
    { label: "Notifications", href: "/dashboard/notifications", icon: <Bell className="h-5 w-5" /> },
    { label: "Profile", href: "/dashboard/profile", icon: <User className="h-5 w-5" /> },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getInitials = () =>
    (userProfile?.name || "U")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary shadow-md">
            <Users className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-sidebar-foreground">ISS Team Space</p>
            <p className="text-xs text-sidebar-foreground/60">Simple workflow for your team</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                isActive(item.href)
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {isActive(item.href) ? <ChevronRight className="ml-auto h-4 w-4" /> : null}
            </div>
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-2 flex items-center gap-3 px-4 py-3">
          <Avatar className="h-10 w-10 border-2 border-sidebar-accent">
            <AvatarFallback className="bg-sidebar-primary font-medium text-sidebar-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate text-sm font-medium text-sidebar-foreground">
              {userProfile?.name}
              {userProfile?.role !== "member" ? <Crown className="h-3 w-3 text-amber-500" /> : null}
            </p>
            <p className="text-xs capitalize text-sidebar-foreground/60">
              {userProfile?.role === "admin" ? "Admin leader" : userProfile?.role}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg bg-primary p-2 text-primary-foreground shadow-lg lg:hidden"
        onClick={() => setMobileMenuOpen((current) => !current)}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {mobileMenuOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar shadow-2xl lg:hidden">
            <SidebarContent />
          </aside>
        </>
      ) : null}

      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
