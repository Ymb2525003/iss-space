"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import type { Task, TaskPriority } from "@/types";

const priorityColors: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400",
};

function isOverdue(task: Task) {
  if (task.status === "done") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

export default function CalendarPage() {
  const { data, loading } = useAppData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const tasks = data?.tasks || [];

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const list: (Date | null)[] = [];

    for (let i = 0; i < first.getDay(); i += 1) list.push(null);
    for (let day = 1; day <= last.getDate(); day += 1) list.push(new Date(year, month, day));
    return list;
  }, [currentDate]);

  const selectedTasks = selectedDate ? tasks.filter((task) => task.dueDate === selectedDate) : [];

  const tasksForDate = (date: Date) => {
    const iso = date.toISOString().split("T")[0];
    return tasks.filter((task) => task.dueDate === iso);
  };

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="mt-1 text-muted-foreground">
          The calendar is generated automatically from task due dates and assigned names.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {monthLabel}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? <p className="text-muted-foreground">Loading calendar...</p> : null}
            <div className="mb-2 grid grid-cols-7">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square rounded-lg bg-secondary/30" />;
                }

                const iso = date.toISOString().split("T")[0];
                const dayTasks = tasksForDate(date);
                const hasOverdue = dayTasks.some(isOverdue);

                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    className={`aspect-square rounded-lg p-2 text-left transition-colors ${
                      selectedDate === iso ? "bg-primary/10 ring-1 ring-primary" : hasOverdue ? "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30" : "hover:bg-secondary/50"
                    }`}
                  >
                    <p className="text-sm font-medium">{date.getDate()}</p>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div key={task.id} className="truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">
                          {task.assignedTo}
                        </div>
                      ))}
                      {dayTasks.length > 2 ? <p className="text-[10px] text-muted-foreground">+{dayTasks.length - 2} more</p> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedDate ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString() : "Select a day"}</CardTitle>
            <CardDescription>
              {selectedDate ? `${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"} on this day` : "Pick a day to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedTasks.map((task) => {
              const overdue = isOverdue(task);
              const priority = (task.priority || "medium") as TaskPriority;
              return (
              <div key={task.id} className={`rounded-lg border p-3 ${overdue ? "border-red-400 dark:border-red-600" : "border-border"}`}>
                <p className="flex items-center gap-1.5 font-medium">
                  {task.title}
                  {overdue ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : null}
                </p>
                <p className="text-sm text-muted-foreground">{task.assignedTo}</p>
                <div className="mt-2 flex gap-2">
                  <Badge className={priorityColors[priority]}>{priority}</Badge>
                  <Badge variant="outline">{task.type}</Badge>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
              </div>
              );
            })}
            {selectedDate && selectedTasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks on this day.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
