"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-client";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  createdAt: string;
  _count: { decks: number };
};

export default function AdminUsersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setUsers(await api<AdminUser[]>("/api/admin/users"));
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(id: string, role: "admin" | "user") {
    try {
      await api(`/api/admin/users/${id}`, { method: "PATCH", json: { role } });
      load();
    } catch (e) {
      setError(String(e));
    }
  }

  async function remove(id: string) {
    if (!confirm(t("admin.confirmDelete"))) return;
    try {
      await api(`/api/admin/users/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="space-y-2">
        {users.map((u) => {
          const self = u.id === user?.id;
          return (
            <Card key={u.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {u.email}
                    {self && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {t("admin.you")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {u._count.decks} {t("admin.decks")} ·{" "}
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <NativeSelect
                    value={u.role}
                    disabled={self}
                    onChange={(e) =>
                      changeRole(u.id, e.target.value as "admin" | "user")
                    }
                    className="w-32"
                  >
                    <option value="user">{t("role.user")}</option>
                    <option value="admin">{t("role.admin")}</option>
                  </NativeSelect>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={self}
                    onClick={() => remove(u.id)}
                    className="text-danger hover:text-danger"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
