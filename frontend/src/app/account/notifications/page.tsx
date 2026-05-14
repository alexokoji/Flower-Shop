"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { pb } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import type { PbRecord } from "@/types";

interface Notification extends PbRecord {
  type: string;
  data: string | Record<string, unknown>;
  read_at: string | null;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const userId = useAuth((s) => s.user?.id);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: () => pb().collection("notifications").getFullList<Notification>({
      filter: `notifiable_id = "${userId}" && notifiable_type = "users"`,
      sort: "-created",
    }).catch(() => [] as Notification[]),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => pb().collection("notifications").update(id, { read_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (!data || data.length === 0) {
    return (
      <div className="surface-luxe p-12 text-center">
        <Bell className="size-10 mx-auto text-roseGold" />
        <p className="display-serif text-2xl mt-3">No notifications</p>
        <p className="text-sm text-muted-foreground mt-2">We'll quietly let you know when something matters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="display-serif text-2xl">Notifications</h2>
      <ul className="space-y-2">
        {data.map((n) => {
          const payload = typeof n.data === "string" ? safeJson(n.data) : n.data;
          const title = (payload as Record<string, unknown>)?.title as string | undefined;
          const body = (payload as Record<string, unknown>)?.body as string | undefined;
          const link = (payload as Record<string, unknown>)?.link as string | undefined;
          const unread = !n.read_at;
          return (
            <li key={n.id} className={"surface-luxe p-4 flex items-start gap-3 " + (unread ? "border-roseGold/40" : "")}>
              <div className={"size-2 rounded-full mt-2 shrink-0 " + (unread ? "bg-roseGold" : "bg-muted-foreground/30")} />
              <div className="flex-1 min-w-0">
                {title && <p className="font-medium text-sm">{title}</p>}
                {body && <p className="text-sm text-muted-foreground mt-1">{body}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created).toLocaleString()}</p>
                {link && (
                  <Link href={link} className="text-xs underline underline-offset-4 hover:text-roseGold inline-block mt-1">
                    View →
                  </Link>
                )}
              </div>
              {unread && (
                <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)} aria-label="Mark read">
                  <Check className="size-4" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return { body: s }; }
}