"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Mail, Shield, User } from "lucide-react";

interface ProfileData {
  name: string;
  role: string;
  email: string | null;
  stats: {
    assignedTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    createdTasks: number;
    messageThreads: number;
    recommendations: number;
  };
}

export default function ProfilePage() {
  const { userProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (res.ok) {
        setProfile(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getInitials = () =>
    (userProfile?.name || "U")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const roleBadgeVariant = userProfile?.role === "admin" ? "default" : userProfile?.role === "leader" ? "default" : "outline";
  const roleLabel = userProfile?.role === "admin" ? "Admin Leader" : userProfile?.role === "leader" ? "Leader" : "Member";

  if (loading) {
    return <p className="text-muted-foreground">Loading profile...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your account details and statistics</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:items-start">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <h2 className="flex items-center justify-center gap-2 text-2xl font-bold sm:justify-start">
                {userProfile?.name}
                {userProfile?.role !== "member" ? <Crown className="h-5 w-5 text-amber-500" /> : null}
              </h2>
              <Badge variant={roleBadgeVariant} className="mt-1">
                <Shield className="mr-1 h-3 w-3" />
                {roleLabel}
              </Badge>
            </div>
            {profile?.email ? (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {userProfile?.canAssignTasks
                ? "Full admin access — can assign tasks and manage the team."
                : userProfile?.role === "leader"
                  ? "Can review tasks, add comments, and guide members."
                  : "Can view assigned tasks, add notes, and send messages."}
            </p>
          </div>
        </CardContent>
      </Card>

      {profile?.stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Assigned Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{profile.stats.assignedTasks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{profile.stats.completedTasks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-500">{profile.stats.inProgressTasks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Tasks Created</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{profile.stats.createdTasks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Message Threads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{profile.stats.messageThreads}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{profile.stats.recommendations}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
