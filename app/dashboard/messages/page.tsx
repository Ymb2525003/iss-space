"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useAppData } from "@/hooks/use-app-data";
import { sendMessageRequest } from "@/lib/api";
import { ALL_TEAM_MEMBERS, type TeamMemberName } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

export default function MessagesPage() {
  const { userProfile } = useAuth();
  const { data, loading, refresh } = useAppData();
  const [recipientName, setRecipientName] = useState<TeamMemberName | "">("");
  const [messageBody, setMessageBody] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const availableRecipients = ALL_TEAM_MEMBERS.filter((name) => name !== userProfile?.name);

  const myThreads = useMemo(() => {
    if (!data || !userProfile) return [];
    return data.messageThreads.filter((thread) => thread.participants.includes(userProfile.name));
  }, [data, userProfile]);

  const sendMessage = async (targetName?: TeamMemberName, threadId?: string) => {
    if (!userProfile) return;

    const body = threadId ? replyDrafts[threadId]?.trim() : messageBody.trim();
    const recipient = targetName || recipientName;

    if (!recipient || !body) {
      toast.error("Choose a person and write a message.");
      return;
    }

    try {
      await sendMessageRequest({
        senderName: userProfile.name,
        recipientName: recipient as TeamMemberName,
        body,
      });
      if (threadId) {
        setReplyDrafts((current) => ({ ...current, [threadId]: "" }));
      } else {
        setMessageBody("");
        setRecipientName("");
      }
      toast.success("Message sent.");
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not send message.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          Send direct messages to any member or leader, and reply inside each conversation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            New Message
          </CardTitle>
          <CardDescription>Messages are delivered to the exact selected person.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={recipientName} onValueChange={(value) => setRecipientName(value as TeamMemberName)}>
            <SelectTrigger>
              <SelectValue placeholder="Select the person" />
            </SelectTrigger>
            <SelectContent>
              {availableRecipients.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            placeholder="Write your direct message"
          />
          <Button onClick={() => sendMessage()}>
            <Send className="mr-2 h-4 w-4" />
            Send Message
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? <p className="text-muted-foreground">Loading messages...</p> : null}

        {myThreads.map((thread) => {
          const otherPerson = thread.participants.find((name) => name !== userProfile?.name) || thread.participants[0];
          return (
            <Card key={thread.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Conversation with {otherPerson}
                </CardTitle>
                <CardDescription>
                  Last update {new Date(thread.lastMessageAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {thread.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-lg border p-3 ${
                        message.senderName === userProfile?.name ? "bg-primary/5 border-primary/20" : "bg-secondary/40"
                      }`}
                    >
                      <p className="text-sm font-medium">
                        {message.senderName} to {message.recipientName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{message.body}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Textarea
                    value={replyDrafts[thread.id] || ""}
                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))}
                    placeholder={`Reply to ${otherPerson}`}
                  />
                  <Button size="sm" onClick={() => sendMessage(otherPerson, thread.id)}>
                    Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!loading && myThreads.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No messages yet.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
