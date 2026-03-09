"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Country } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TaxChatProps {
  country: Country;
  taxYear: number;
  reportSummary: string;
}

export function TaxChat({ country, taxYear, reportSummary }: TaxChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          country,
          tax_year: taxYear,
          report_summary: reportSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: data.message },
      ]);
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-zinc-800/50">
        <MessageCircle className="h-5 w-5 text-emerald-400" />
        <h2 className="font-semibold">Ask your tax advisor</h2>
        <span className="text-xs text-zinc-500 ml-auto">
          AI has context of your portfolio & report
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[480px] min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 mb-4">
              Ask me anything about your tax report
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "How can I reduce my tax liability?",
                "When is the filing deadline?",
                "Are my staking rewards taxable?",
                "Explain the cost basis method used",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5">
                <Bot className="h-4 w-4 text-emerald-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-zinc-200"
                  : "bg-zinc-800/50 border border-zinc-800/50 text-zinc-300"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:text-zinc-300 prose-headings:text-zinc-100 prose-strong:text-zinc-200 prose-li:text-zinc-300 prose-code:text-emerald-400 prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center mt-0.5">
                <User className="h-4 w-4 text-zinc-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="bg-zinc-800/50 border border-zinc-800/50 rounded-xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your taxes..."
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
