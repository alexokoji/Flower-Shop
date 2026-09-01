"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldOff, BadgeCheck, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";

export default function AdminCustomersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | "customer" | "admin">("");

  const parts: string[] = [];
  if (q) parts.push(`(email ~ "${q.replace(/"/g, '\\"')}" || first_name ~ "${q.replace(/"/g, '\\"')}" || last_name ~ "${q.replace(/"/g, '\\"')}")`);
  if (role) parts.push(`role = "${role}"`);
  const filter = parts.join(" && ");

  const list = useQuery({
    queryKey: ["admin", "customers", page, q, role],
    queryFn: () => pb().collection("users").getList<User>(page, 20, {
      filter,
      sort: "-created",
    }),
  });

  const setRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User["role"] }) =>
      pb().collection("users").update(id, { role }),
    onSuccess: () => {
      toast.success("Role updated.");
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: () => toast.error("Update failed."),
  });

  const setVerifiedMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      pb().collection("users").update(id, { verified }),
    onSuccess: () => {
      toast.success("Verification updated.");
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: () => toast.error("Update failed."),
  });

  const del = useMutation({
    mutationFn: (id: string) => pb().collection("users").delete(id),
    onSuccess: () => {
      toast.success("User deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: () => toast.error("Delete failed."),
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">People</p>
        <h1 className="display-serif text-3xl lg:text-4xl mt-2">Customers</h1>
      </header>

      <div className="surface-luxe p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value as "" | "customer" | "admin"); setPage(1); }}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <section className="surface-luxe overflow-hidden">
        {list.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (list.data?.totalItems ?? 0) === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">No users match these filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground bg-cream-100/40 dark:bg-card/40">
              <tr className="text-left">
                <th className="p-3">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data?.items.map((u) => (
                <tr key={u.id} className="hover:bg-muted/40">
                  <td className="p-3">
                    <p className="font-medium">{u.first_name} {u.last_name}</p>
                    {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                  </td>
                  <td className="text-xs text-muted-foreground truncate max-w-[200px]">{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => setRoleMutation.mutate({ id: u.id, role: e.target.value as User["role"] })}
                      className="h-8 px-2 rounded border border-border bg-background text-xs"
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => setVerifiedMutation.mutate({ id: u.id, verified: !u.verified })}
                      className={
                        "inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full " +
                        (u.verified ? "bg-emerald-100 text-emerald-700" : "bg-muted hover:bg-muted-foreground/10")
                      }
                    >
                      {u.verified ? <BadgeCheck className="size-3" /> : null}
                      {u.verified ? "Verified" : "Unverified"}
                    </button>
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {new Date(u.created).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {u.role === "admin" ? (
                      <button
                        onClick={() => setRoleMutation.mutate({ id: u.id, role: "customer" })}
                        className="p-1.5 rounded hover:bg-muted text-roseGold-600"
                        title="Demote to customer"
                      >
                        <ShieldOff className="size-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setRoleMutation.mutate({ id: u.id, role: "admin" })}
                        className="p-1.5 rounded hover:bg-muted text-roseGold-600"
                        title="Promote to admin"
                      >
                        <Shield className="size-4" />
                      </button>
                    )}
                    <Link
                      href={`/admin/orders?user=${u.id}`}
                      className="p-1.5 rounded hover:bg-muted inline-block text-xs"
                      title="View orders"
                    >
                      Orders
                    </Link>
                    <button
                      onClick={() => { if (confirm(`Delete ${u.email}? This cannot be undone.`)) del.mutate(u.id); }}
                      className="p-1.5 rounded hover:bg-muted text-destructive"
                      title="Delete user"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {list.data && list.data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {list.data.page} of {list.data.totalPages} · {list.data.totalItems} total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= list.data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}