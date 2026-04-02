"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/hooks/use-app-data";
import { updateTaskRequest } from "@/lib/api";
import { ALL_TEAM_MEMBERS, isLeaderRole, type Task, type TaskPriority, type TaskStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, Download, Filter, MessageSquare, Plus, StickyNote } from "lucide-react";

const priorityColors: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400",
};

function isOverdue(task: Task) {
  if (task.status === "done") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

export default function TasksPage() {
  const { userProfile } = useAuth();
  const { data, loading, refresh } = useAppData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const visibleTasks = useMemo(() => {
    if (!data || !userProfile) return [];
    const base = userProfile.canAssignTasks || userProfile.role === "leader"
      ? data.tasks
      : data.tasks.filter((task) => task.assignedTo === userProfile.name);

    return base.filter((task) => {
      const query = search.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.assignedTo.toLowerCase().includes(query) ||
        task.type.toLowerCase().includes(query);
      const matchesStatus = filterStatus === "all" || task.status === filterStatus || (filterStatus === "overdue" && isOverdue(task));
      const matchesType = filterType === "all" || task.type === filterType;
      const matchesPriority = filterPriority === "all" || (task.priority || "medium") === filterPriority;
      const matchesAssignee = filterAssignee === "all" || task.assignedTo === filterAssignee;
      return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesAssignee;
    });
  }, [data, search, filterStatus, filterType, filterPriority, filterAssignee, userProfile]);

  const canComment = Boolean(userProfile && isLeaderRole(userProfile.role));

  const exportCSV = () => {
    const headers = ["Title", "Type", "Priority", "Status", "Assigned To", "Created By", "Due Date", "Overdue"];
    const rows = visibleTasks.map((t) => [
      t.title,
      t.type,
      t.priority || "medium",
      t.status,
      t.assignedTo,
      t.createdBy,
      t.dueDate,
      isOverdue(t) ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  };

  const changeStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskRequest(taskId, { status });
      toast.success("Task status updated.");
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not update status.");
    }
  };

  const addComment = async (task: Task) => {
    const value = commentDrafts[task.id]?.trim();
    if (!value || !userProfile) return;

    try {
      await updateTaskRequest(task.id, {
        commentBody: value,
        authorName: userProfile.name,
      });
      setCommentDrafts((current) => ({ ...current, [task.id]: "" }));
      toast.success("Comment added.");
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not add comment.");
    }
  };

  const addNote = async (task: Task) => {
    const value = noteDrafts[task.id]?.trim();
    if (!value) return;

    try {
      await updateTaskRequest(task.id, { noteBody: value });
      setNoteDrafts((current) => ({ ...current, [task.id]: "" }));
      toast.success("Note saved.");
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not save note.");
    }
  };

  const assignees = useMemo(() => {
    if (!data) return [];
    const names = new Set(data.tasks.map((t) => t.assignedTo));
    return ALL_TEAM_MEMBERS.filter((n) => names.has(n as typeof data.tasks[0]["assignedTo"]));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            {userProfile?.canAssignTasks
              ? "Assign work and follow up with every member."
              : userProfile?.role === "leader"
                ? "Review assigned tasks and comment on any item."
                : "See your assigned work, add notes, and update progress."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {userProfile?.canAssignTasks ? (
            <Link href="/dashboard/tasks/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, member, type, or description"
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={() => setShowFilters((v) => !v)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          {showFilters ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="poster">Poster</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {assignees.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {loading ? <p className="text-muted-foreground">Loading tasks...</p> : null}

      <div className="space-y-4">
        {visibleTasks.map((task) => {
          const overdue = isOverdue(task);
          const priority = task.priority || "medium";
          return (
          <Card key={task.id} className={overdue ? "border-red-400 dark:border-red-600" : ""}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    {task.title}
                    {overdue ? <AlertTriangle className="h-4 w-4 text-red-500" /> : null}
                  </CardTitle>
                  <CardDescription>
                    {task.type} • assigned to {task.assignedTo} • created by {task.createdBy} • due{" "}
                    <span className={overdue ? "font-semibold text-red-500" : ""}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    {overdue ? " (overdue)" : ""}
                  </CardDescription>
                  <p className="text-sm text-card-foreground">{task.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={priorityColors[priority]}>{priority}</Badge>
                  <Badge variant="outline">{task.type}</Badge>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {userProfile?.name === task.assignedTo ? (
                <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Select value={task.status} onValueChange={(value: TaskStatus) => changeStatus(task.id, value)}>
                      <SelectTrigger className="w-full md:w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <StickyNote className="h-4 w-4 text-primary" />
                      Add a member note
                    </div>
                    <Textarea
                      value={noteDrafts[task.id] || ""}
                      onChange={(event) => setNoteDrafts((current) => ({ ...current, [task.id]: event.target.value }))}
                      placeholder="Share progress, blockers, or a delivery note"
                    />
                    <Button size="sm" onClick={() => addNote(task)}>
                      Save Note
                    </Button>
                  </div>
                </div>
              ) : null}

              {canComment ? (
                <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Leader comment
                  </div>
                  <Textarea
                    value={commentDrafts[task.id] || ""}
                    onChange={(event) => setCommentDrafts((current) => ({ ...current, [task.id]: event.target.value }))}
                    placeholder="Add review notes or guidance"
                  />
                  <Button size="sm" onClick={() => addComment(task)}>
                    Add Comment
                  </Button>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium">Comments</p>
                  <div className="space-y-2">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg border border-border p-3 text-sm">
                        <p className="font-medium">{comment.authorName}</p>
                        <p className="mt-1 text-muted-foreground">{comment.body}</p>
                      </div>
                    ))}
                    {task.comments.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet.</p> : null}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Member Notes</p>
                  <div className="space-y-2">
                    {task.memberNotes.map((note, index) => (
                      <div key={`${task.id}-note-${index}`} className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                        {note}
                      </div>
                    ))}
                    {task.memberNotes.length === 0 ? <p className="text-sm text-muted-foreground">No notes yet.</p> : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}

        {!loading && visibleTasks.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No tasks found.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
