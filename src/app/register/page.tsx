"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-client";

export default function RegisterPage() {
  const { t } = useI18n();
  const { refresh } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Đăng ký thất bại");
        return;
      }
      await refresh();
      router.push("/");
      router.refresh();
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-3">
          <h1 className="text-xl font-bold">{t("auth.registerTitle")}</h1>
          <p className="text-xs text-muted-foreground">
            {t("auth.firstAdminNote")}
          </p>
          <div>
            <Label className="mb-1">{t("auth.email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label className="mb-1">{t("auth.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1">{t("auth.password")}</Label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              showLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} className="h-10 w-full">
            {loading ? t("auth.submitting") : t("auth.register")}
          </Button>
          <Link
            href="/login"
            className="block text-center text-sm text-primary"
          >
            {t("auth.haveAccount")}
          </Link>
        </form>
      </Card>
    </div>
  );
}
