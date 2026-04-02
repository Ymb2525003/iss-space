"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/hooks/use-app-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskPriority } from "@/types";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckSquare,
  Crown,
  Lightbulb,
  MessageSquare,
  Plus,
  Users,
} from "lucide-react";

const priorityColors: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400",
};

function isOverdue(task: Task) {
  if (task.status === "done") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const { data, loading } = useAppData();

  const myTasks = useMemo(() => {
    if (!userProfile || !data) return [];
    if (userProfile.canAssignTasks || userProfile.role === "leader") return data.tasks;
    return data.tasks.filter((task) => task.assignedTo === userProfile.name);
  }, [data, userProfile]);

  const myThreads = useMemo(() => {
    if (!userProfile || !data) return [];
    return data.messageThreads.filter((thread) => thread.participants.includes(userProfile.name));
  }, [data, userProfile]);

  const recommendationCount = data?.recommendations.length || 0;
  const doneCount = myTasks.filter((task) => task.status === "done").length;
  const inProgressCount = myTasks.filter((task) => task.status === "in-progress").length;
  const todoCount = myTasks.filter((task) => task.status === "todo").length;
  const overdueCount = myTasks.filter(isOverdue).length;
  const highPriorityCount = myTasks.filter((t) => (t.priority || "medium") === "high" && t.status !== "done").length;
  const activityFeed = data?.activityFeed || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
            Welcome, {userProfile?.name}
            {userProfile?.role !== "member" ? <Crown className="h-6 w-6 text-amber-500" /> : null}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {userProfile?.canAssignTasks
              ? "You can assign tasks, review activity, and guide the whole team."
              : userProfile?.role === "leader"
                ? "You can review assigned work, add comments, and support the team."
                : "You can track your tasks, add notes, message anyone, and join recommendations."}
          </p>
        </div>

        <Link href={userProfile?.canAssignTasks ? "/dashboard/tasks/new" : "/dashboard/recommendations"}>
          <Button>
            {userProfile?.canAssignTasks ? <Plus className="mr-2 h-4 w-4" /> : <Lightbulb className="mr-2 h-4 w-4" />}
            {userProfile?.canAssignTasks ? "Assign Task" : "Add Recommendation"}
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "..." : myTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "..." : todoCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">{loading ? "..." : inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{loading ? "..." : doneCount}</p>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? "border-red-400 dark:border-red-600" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 text-sm text-muted-foreground">
              Overdue {overdueCount > 0 ? <AlertTriangle className="h-3 w-3 text-red-500" /> : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${overdueCount > 0 ? "text-red-500" : ""}`}>{loading ? "..." : overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${highPriorityCount > 0 ? "text-red-500" : ""}`}>{loading ? "..." : highPriorityCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "..." : myThreads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "..." : recommendationCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? "..." : myTasks.length > 0 ? `${Math.round((doneCount / myTasks.length) * 100)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{userProfile?.role === "member" ? "My Tasks" : "Team Tasks"}</CardTitle>
              <CardDescription>Latest work in the system</CardDescription>
            </div>
            <Link href="/dashboard/tasks">
              <Button variant="outline">Open Tasks</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {myTasks.slice(0, 5).map((task) => {
              const overdue = isOverdue(task);
              const priority = (task.priority || "medium") as TaskPriority;
              return (
                <div key={task.id} className={`rounded-lg border p-4 ${overdue ? "border-red-400 bg-red-50/50 dark:border-red-600 dark:bg-red-950/20" : "border-border bg-secondary/40"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-2 font-semibold text-card-foreground">
                        {task.title}
                        {overdue ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : null}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.type} for {task.assignedTo} • due{" "}
                        <span className={overdue ? "font-semibold text-red-500" : ""}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        {overdue ? " (overdue)" : ""}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge className={priorityColors[priority]}>{priority}</Badge>
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && myTasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks yet.</p> : null}
          </CardContent>
        </Card>

        {/* Quick Access + Activity Feed */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Jump to the main parts of the app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/tasks" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <CheckSquare className="mr-3 h-4 w-4" />
                  Tasks
                </Button>
              </Link>
              <Link href="/dashboard/messages" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-3 h-4 w-4" />
                  Messages
                </Button>
              </Link>
              <Link href="/dashboard/recommendations" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Lightbulb className="mr-3 h-4 w-4" />
                  Recommendations
                </Button>
              </Link>
              <Link href="/dashboard/calendar" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-3 h-4 w-4" />
                  Calendar
                </Button>
              </Link>
              <Link href="/dashboard/team" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-3 h-4 w-4" />
                  Team
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions from the team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityFeed.slice(0, 8).map((entry) => (
                <div key={entry.id} className="border-b border-border pb-2 last:border-0">
                  <p className="text-sm">
                    <span className="font-medium">{entry.actorName}</span>{" "}
                    <span className="text-muted-foreground">{entry.action}</span>{" "}
                    <span className="font-medium">{entry.targetTitle}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {activityFeed.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
