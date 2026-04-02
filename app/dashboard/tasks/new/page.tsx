"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { createTaskRequest } from "@/lib/api";
import { MEMBERS, type TaskPriority, type TaskType } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, CheckSquare, Loader2 } from "lucide-react";

export default function CreateTaskPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "" as TaskType | "",
    description: "",
    dueDate: "",
    assignedTo: "",
    priority: "medium" as TaskPriority,
  });

  if (!userProfile?.canAssignTasks) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Only Yaseen can assign tasks from here.
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title || !formData.type || !formData.description || !formData.dueDate || !formData.assignedTo) {
      toast.error("Fill all task fields first.");
      return;
    }

    setIsLoading(true);

    try {
      await createTaskRequest({
        title: formData.title,
        type: formData.type,
        description: formData.description,
        dueDate: formData.dueDate,
        assignedTo: formData.assignedTo as (typeof MEMBERS)[number],
        createdBy: userProfile.name,
        priority: formData.priority,
      });
      toast.success("Task assigned successfully.");
      router.push("/dashboard/tasks");
    } catch (error) {
      console.error(error);
      toast.error("Could not create task.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Assign New Task</h1>
          <p className="text-muted-foreground">Yaseen can create tasks only for members, not for Azza or Ahmed.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Task Details
          </CardTitle>
          <CardDescription>Keep it simple and clear so the member can start quickly.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Task title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                placeholder="Example: Poster for workshop launch"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Task type</Label>
                <Select value={formData.type} onValueChange={(value: TaskType) => setFormData((current) => ({ ...current, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poster">Poster</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign to member</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData((current) => ({ ...current, assignedTo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBERS.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) => setFormData((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData((current) => ({ ...current, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[140px]"
                placeholder="Explain exactly what should be delivered."
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Task"
                )}
              </Button>
              <Link href="/dashboard/tasks">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
