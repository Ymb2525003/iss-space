"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/hooks/use-app-data";
import { createRecommendationRequest, updateRecommendationRequest, deleteRecommendationRequest, createTaskRequest } from "@/lib/api";
import { type Recommendation, type TaskType, MEMBERS, type MemberName, isLeaderRole } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lightbulb, MessageSquare, ThumbsUp, Pencil, Trash2, ArrowRightCircle, X } from "lucide-react";

export default function RecommendationsPage() {
  const { userProfile } = useAuth();
  const { data, loading, refresh } = useAppData();
  const [formData, setFormData] = useState({
    title: "",
    type: "" as TaskType | "",
    description: "",
  });
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: "", type: "" as TaskType | "", description: "" });
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertData, setConvertData] = useState({ assignedTo: "" as MemberName | "", dueDate: "" });

  const canEditOrDelete = (rec: Recommendation) =>
    userProfile && (rec.createdBy === userProfile.name || userProfile.role === "admin");

  const canConvertToTask = () =>
    userProfile && isLeaderRole(userProfile.role);

  const createRecommendation = async () => {
    if (!userProfile || !formData.title || !formData.type || !formData.description) {
      toast.error("Fill the recommendation form.");
      return;
    }

    try {
      await createRecommendationRequest({
        title: formData.title,
        type: formData.type,
        description: formData.description,
        createdBy: userProfile.name,
      });
      setFormData({ title: "", type: "", description: "" });
      toast.success("Recommendation added.");
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not add recommendation.");
    }
  };

  const startEditing = (rec: Recommendation) => {
    setEditingId(rec.id);
    setEditData({ title: rec.title, type: rec.type, description: rec.description });
  };

  const saveEdit = async (rec: Recommendation) => {
    if (!userProfile || !editData.title || !editData.type || !editData.description) {
      toast.error("Fill all fields.");
      return;
    }

    try {
      await updateRecommendationRequest(rec.id, {
        actorName: userProfile.name,
        title: editData.title,
        type: editData.type as TaskType,
        description: editData.description,
      });
      setEditingId(null);
      toast.success("Recommendation updated.");
      refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Could not update.";
      toast.error(msg);
    }
  };

  const handleDelete = async (rec: Recommendation) => {
    if (!confirm(`Delete "${rec.title}"? This cannot be undone.`)) return;

    try {
      await deleteRecommendationRequest(rec.id);
      toast.success("Recommendation deleted.");
      refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Could not delete.";
      toast.error(msg);
    }
  };

  const handleConvertToTask = async (rec: Recommendation) => {
    if (!userProfile || !convertData.assignedTo || !convertData.dueDate) {
      toast.error("Select a member and due date.");
      return;
    }

    try {
      await createTaskRequest({
        title: rec.title,
        type: rec.type,
        description: rec.description,
        assignedTo: convertData.assignedTo,
        dueDate: convertData.dueDate,
        createdBy: userProfile.name,
      });
      setConvertingId(null);
      setConvertData({ assignedTo: "" as MemberName | "", dueDate: "" });
      toast.success(`Task created from "${rec.title}".`);
      refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Could not create task.";
      toast.error(msg);
    }
  };

  const toggleReaction = async (recommendation: Recommendation) => {
    if (!userProfile) return;

    try {
      await updateRecommendationRequest(recommendation.id, {
        actorName: userProfile.name,
        toggleReaction: true,
      });
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not update reaction.");
    }
  };

  const addComment = async (recommendation: Recommendation) => {
    if (!userProfile) return;

    const value = commentDrafts[recommendation.id]?.trim();
    if (!value) {
      toast.error("Write a note first.");
      return;
    }

    try {
      await updateRecommendationRequest(recommendation.id, {
        actorName: userProfile.name,
        commentBody: value,
      });
      setCommentDrafts((current) => ({ ...current, [recommendation.id]: "" }));
      toast.success("Note added.");
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not add note.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <p className="mt-1 text-muted-foreground">
          Anyone can add a recommendation, and the team can react and reply.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Add Recommendation
          </CardTitle>
          <CardDescription>Keep the idea advanced but still simple to review fast.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={formData.title}
            onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
            placeholder="Recommendation name"
          />
          <Select value={formData.type} onValueChange={(value: TaskType) => setFormData((current) => ({ ...current, type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="poster">Poster</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={formData.description}
            onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
            placeholder="Describe the idea and why it matters"
          />
          <Button onClick={createRecommendation}>Add Recommendation</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? <p className="text-muted-foreground">Loading recommendations...</p> : null}
        {data?.recommendations.map((recommendation) => {
          const reacted = userProfile ? recommendation.reactions.includes(userProfile.name) : false;
          const isEditing = editingId === recommendation.id;
          const isConverting = convertingId === recommendation.id;

          return (
            <Card key={recommendation.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={editData.title}
                          onChange={(e) => setEditData((c) => ({ ...c, title: e.target.value }))}
                          placeholder="Title"
                        />
                        <Select value={editData.type} onValueChange={(v: TaskType) => setEditData((c) => ({ ...c, type: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="workshop">Workshop</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="poster">Poster</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          value={editData.description}
                          onChange={(e) => setEditData((c) => ({ ...c, description: e.target.value }))}
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(recommendation)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="mr-1 h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle>{recommendation.title}</CardTitle>
                        <CardDescription>
                          {recommendation.type} • by {recommendation.createdBy} • {new Date(recommendation.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{recommendation.type}</Badge>
                    {canEditOrDelete(recommendation) && !isEditing && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => startEditing(recommendation)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(recommendation)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              {!isEditing && (
                <CardContent className="space-y-4">
                  <p className="text-sm text-card-foreground">{recommendation.description}</p>

                  <div className="flex flex-wrap gap-3">
                    <Button variant={reacted ? "default" : "outline"} size="sm" onClick={() => toggleReaction(recommendation)}>
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      {recommendation.reactions.length} reaction{recommendation.reactions.length === 1 ? "" : "s"}
                    </Button>
                    {canConvertToTask() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setConvertingId(isConverting ? null : recommendation.id);
                          setConvertData({ assignedTo: "" as MemberName | "", dueDate: "" });
                        }}
                      >
                        <ArrowRightCircle className="mr-2 h-4 w-4" />
                        {isConverting ? "Cancel" : "Convert to Task"}
                      </Button>
                    )}
                  </div>

                  {isConverting && (
                    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <p className="text-sm font-medium">Assign this as a task</p>
                      <Select
                        value={convertData.assignedTo}
                        onValueChange={(v) => setConvertData((c) => ({ ...c, assignedTo: v as MemberName }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Assign to member" />
                        </SelectTrigger>
                        <SelectContent>
                          {MEMBERS.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={convertData.dueDate}
                        onChange={(e) => setConvertData((c) => ({ ...c, dueDate: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => handleConvertToTask(recommendation)}>
                        Create Task
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Notes and replies</p>
                    {recommendation.comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-medium">{comment.authorName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{comment.body}</p>
                      </div>
                    ))}
                    {recommendation.comments.length === 0 ? <p className="text-sm text-muted-foreground">No replies yet.</p> : null}
                  </div>

                  <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Add a note
                    </div>
                    <Textarea
                      value={commentDrafts[recommendation.id] || ""}
                      onChange={(event) => setCommentDrafts((current) => ({ ...current, [recommendation.id]: event.target.value }))}
                      placeholder="Reply to this recommendation"
                    />
                    <Button size="sm" onClick={() => addComment(recommendation)}>
                      Add Note
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {!loading && !data?.recommendations.length ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No recommendations yet.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
