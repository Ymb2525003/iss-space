"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";

export default function TeamPage() {
  const { userProfile } = useAuth();
  const { data, loading } = useAppData();
  const [search, setSearch] = useState("");

  const teamCards = useMemo(() => {
    if (!data) return [];
    return data.users
      .filter((user) => user.name.toLowerCase().includes(search.toLowerCase()))
      .map((user) => {
        const assignedTasks = data.tasks.filter((task) => task.assignedTo === user.name);
        return {
          ...user,
          totalTasks: assignedTasks.length,
          doneTasks: assignedTasks.filter((task) => task.status === "done").length,
          inboxCount: data.messageThreads.filter((thread) => thread.participants.includes(user.name)).length,
        };
      });
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="mt-1 text-muted-foreground">
          Fixed team list with leaders and members exactly as requested.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name"
          />
        </CardContent>
      </Card>

      {loading ? <p className="text-muted-foreground">Loading team...</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teamCards.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription>
                    {member.name === userProfile?.name ? "Current session" : "Team member profile"}
                  </CardDescription>
                </div>
                <Badge variant={member.role === "member" ? "outline" : "default"}>
                  {member.role === "admin" ? "Admin" : member.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Assigned tasks</p>
                <p className="text-2xl font-bold text-card-foreground">{member.totalTasks}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Completed tasks</p>
                <p className="text-2xl font-bold text-card-foreground">{member.doneTasks}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Message threads</p>
                <p className="text-2xl font-bold text-card-foreground">{member.inboxCount}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && teamCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <Users className="mb-3 h-10 w-10" />
            No matching team member.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
