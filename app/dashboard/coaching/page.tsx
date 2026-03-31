"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Brain, Send, Loader2, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "How should I integrate BPC-157 with my training schedule?",
  "What does my ACTN3 variant mean for my training program?",
  "Should I stack peptides during week 5-8?",
  "How does MTHFR affect my nutrition and supplement choices?",
  "What are the signs my protocol is working?",
];

export default function CoachingPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Welcome to AI Coaching${user?.firstName ? `, ${user.firstName}` : ""}!

I've reviewed your genetic profile and protocol phase. I'm here to help you optimize your 90-day journey — whether that's peptide timing, training adjustments, nutrition questions, or interpreting how you're responding.

**What would you like to explore today?**`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/coaching/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.slice(1).map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      // Read streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingContent(fullText);
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fullText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get AI response. Please try again.");
      // Remove the user message if the request failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setStreamingContent(null);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleSuggested(q: string) {
    setInput(q);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">AI Protocol Coach</h2>
            <p className="text-xs text-muted-foreground">
              Powered by your genetic blueprint &bull; Verify changes with your physician
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md whitespace-pre-wrap"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {streamingContent !== null && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block ml-1 animate-pulse">▌</span>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && streamingContent === null && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          {/* Suggested questions (only show when no history beyond welcome) */}
          {messages.length === 1 && !isLoading && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggested(q)}
                    className="text-left text-sm px-3 py-2 rounded-lg border bg-background hover:bg-muted hover:border-primary/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2 border-t bg-muted/30 shrink-0">
        <div className="max-w-3xl mx-auto flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          AI responses are for educational purposes only. Always verify protocol changes with your
          licensed physician. HelixForge does not sell, compound, or prescribe peptides.
        </div>
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 py-4 border-t bg-background shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your protocol, training, nutrition, or peptide timing..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-h-40 overflow-y-auto"
              style={{ minHeight: "48px" }}
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send &bull; Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
