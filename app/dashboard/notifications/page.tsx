"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { fetchNotifications, markNotificationsReadRequest } from "@/lib/api";
import type { Notification } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    await markNotificationsReadRequest();
    load();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        ) : null}
      </div>

      {loading ? <p className="text-muted-foreground">Loading notifications...</p> : null}

      <div className="space-y-3">
        {notifications.map((notif) => (
          <Card key={notif.id} className={!notif.read ? "border-primary/50 bg-primary/5" : ""}>
            <CardContent className="flex items-start gap-4 py-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bell className={`h-4 w-4 ${!notif.read ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${!notif.read ? "font-semibold" : ""}`}>{notif.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!notif.read ? <Badge variant="default" className="text-xs">New</Badge> : null}
                {notif.link ? (
                  <Link href={notif.link}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-10 text-center text-muted-foreground">
              <Bell className="mb-3 h-10 w-10" />
              No notifications yet.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
