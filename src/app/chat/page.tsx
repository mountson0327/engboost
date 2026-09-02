"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const { t } = useI18n();
  const [topic, setTopic] = useState("Daily life");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [source, setSource] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const [gText, setGText] = useState("");
  const [gResult, setGResult] = useState<{
    corrected: string;
    explanation: string;
  } | null>(null);
  const [gLoading, setGLoading] = useState(false);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, sessionId, message: text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "(no reply)" },
      ]);
      setSource(data.source ?? "");
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t("chat.connError") },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function checkGrammar() {
    if (!gText.trim()) return;
    setGLoading(true);
    setGResult(null);
    try {
      const res = await fetch("/api/ai/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: gText }),
      });
      setGResult(await res.json());
    } finally {
      setGLoading(false);
    }
  }

  function newSession() {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setSource("");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("chat.title")}</h1>

      {/* Conversation */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("chat.topic")}</span>
          <Input
            className="max-w-xs"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={newSession}>
            {t("chat.newChat")}
          </Button>
          {source && (
            <Badge variant="secondary" className="ml-auto">
              {source === "claude" ? "Claude ✨" : t("chat.fallback")}
            </Badge>
          )}
        </div>

        <div className="max-h-96 min-h-40 space-y-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("chat.intro")}</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="flex gap-2">
          <Input
            placeholder={t("chat.inputPlaceholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" disabled={sending} className="h-9 px-4">
            {sending ? "…" : t("chat.send")}
          </Button>
        </form>
      </Card>

      {/* Grammar checker */}
      <Card className="p-4">
        <h2 className="font-semibold">{t("chat.grammarTitle")}</h2>
        <Textarea
          rows={2}
          placeholder={t("chat.grammarPlaceholder")}
          value={gText}
          onChange={(e) => setGText(e.target.value)}
        />
        <Button
          onClick={checkGrammar}
          disabled={gLoading || !gText.trim()}
          className="h-9 w-fit px-4"
        >
          {gLoading ? t("chat.checking") : t("chat.check")}
        </Button>
        {gResult && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("chat.corrected")}</span>
              <b>{gResult.corrected}</b>
            </p>
            <p className="text-muted-foreground">{gResult.explanation}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
