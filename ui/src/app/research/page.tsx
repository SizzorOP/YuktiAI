"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { MessageList } from "@/components/MessageList";
import { ChatMessage } from "@/types";
import { Scale } from "lucide-react";
import { ChatHistorySidebar, ChatSession } from "@/components/ChatHistorySidebar";

const STORAGE_KEY = "lawbot_chat_sessions";
const ACTIVE_KEY = "lawbot_active_session";

function generateId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createNewSession(): ChatSession {
  return {
    id: generateId(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }

  // Migrate old single-chat history if it exists
  try {
    const legacy = localStorage.getItem("lawbot_research_history");
    if (legacy) {
      const msgs = JSON.parse(legacy);
      if (Array.isArray(msgs) && msgs.length > 0) {
        const migrated: ChatSession = {
          id: generateId(),
          title: msgs[0]?.content?.slice(0, 40) || "Previous Chat",
          messages: msgs,
          createdAt: Date.now() - 60000,
          updatedAt: Date.now(),
        };
        localStorage.removeItem("lawbot_research_history");
        return [migrated];
      }
    }
  } catch { /* ignore */ }

  return [];
}

function ResearchContent() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const initialPromptFired = useRef(false);

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    const savedActive = localStorage.getItem(ACTIVE_KEY);
    if (savedActive && loaded.find((s) => s.id === savedActive)) {
      setActiveId(savedActive);
    } else if (loaded.length > 0) {
      setActiveId(loaded[0].id);
    }
    setIsLoaded(true);
  }, []);

  // Persist sessions
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, isLoaded]);

  // Persist active session id
  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  const activeSession = sessions.find((s) => s.id === activeId) || null;
  const messages = activeSession?.messages || [];
  const hasStarted = messages.length > 0;

  // ─── Chat Actions ───

  const handleNewChat = useCallback(() => {
    const newSession = createNewSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveId(newSession.id);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleRenameSession = useCallback((id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== id);
        if (activeId === id) {
          setActiveId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    },
    [activeId]
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      // Abort previous search if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // If no active session, create one
      let targetId = activeId;
      if (!targetId) {
        const newSession = createNewSession();
        setSessions((prev) => [newSession, ...prev]);
        targetId = newSession.id;
        setActiveId(targetId);
      }

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: query,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== targetId) return s;
          const isFirst = s.messages.length === 0;
          return {
            ...s,
            messages: [...s.messages, userMsg],
            title: isFirst ? query.slice(0, 50) : s.title,
            updatedAt: Date.now(),
          };
        })
      );

      setIsLoading(true);

      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          
        // prepare history containing only user and assistant messages for context
        const sessionHistory = activeSession ? activeSession.messages.filter(m => m.role === 'user' || m.role === 'assistant') : [];
        const payload = {
            query,
            history: sessionHistory.map(m => ({ role: m.role, content: m.content }))
        };

        const res = await fetch(`${API_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) throw new Error("API Request Failed");

        const data = await res.json();

        // Dynamically extract the actual readable text response based on the route
        let actualResponseText = "Here are your results:";
        if (data.route === "general_chat" && data.result?.answer) {
            actualResponseText = data.result.answer;
        } else if (data.route === "document_processor" && data.result?.summary) {
            actualResponseText = data.result.summary;
        } else if (data.route === "legal_search" && data.result?.results) {
             // For legal search, create a string representation of the results so LLM can read it
             const titles = data.result.results.slice(0, 3).map((r: any) => r.title).join(", ");
             actualResponseText = `I found these related judgments: ${titles}`;
        } else if (data.route === "procedural_navigator" && data.result?.steps) {
             actualResponseText = `Timeline steps generated: ${data.result.steps.length} steps.`;
        }

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message || actualResponseText,
          metadata: {
            type: data.route,
            results: data.result?.results || data.result,
          },
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetId
              ? { ...s, messages: [...s.messages, aiMsg], updatedAt: Date.now() }
              : s
          )
        );
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I encountered an error communicating with the YuktiAI backend. Please make sure the FastAPI server is running.",
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetId
              ? { ...s, messages: [...s.messages, errorMsg], updatedAt: Date.now() }
              : s
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeId]
  );

  // Auto-fire prompt from URL
  useEffect(() => {
    const promptFromUrl = searchParams.get("prompt");
    if (promptFromUrl && !initialPromptFired.current && isLoaded) {
      initialPromptFired.current = true;
      handleSearch(promptFromUrl);
    }
  }, [searchParams, handleSearch, isLoaded]);

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden font-sans text-zinc-900 selection:bg-blue-200 bg-white dark:bg-zinc-950">
      {/* History Sidebar - Hidden on mobile for now */}
      <div className="hidden md:flex h-full border-r border-zinc-100 dark:border-zinc-800">
        <ChatHistorySidebar
          sessions={sessions}
          activeSessionId={activeId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div
          className={`flex flex-col transition-all duration-700 ease-in-out w-full
          ${hasStarted
              ? "pt-6 flex-1 min-h-0"
              : "justify-center items-center h-full px-4"
            }`}
        >
          {/* Empty State */}
          {!hasStarted && (
            <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 max-w-3xl mx-auto w-full">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200">
                <Scale className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-center">
                What are you researching?
              </h1>
              <p className="text-lg text-zinc-500 mb-8 max-w-lg text-center">
                Search judgments, check procedures, or ask legal questions
                referencing Indian Kanoon.
              </p>
            </div>
          )}

          <div
            className={`w-full transition-all duration-500 overflow-hidden ${hasStarted
              ? "flex-1 flex flex-col min-h-0"
              : "max-w-3xl translate-y-0 mx-auto"
              }`}
          >
            {hasStarted && (
              <div className="flex-1 overflow-y-auto w-full">
                <MessageList messages={messages} />
                {isLoading && (
                  <div className="max-w-4xl mx-auto px-4 md:px-6 pb-4">
                    <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 shadow-sm mt-1">
                            <Scale className="w-4 h-4 text-blue-600 animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-400 mb-3 ml-1 flex items-center gap-2">
                                AI is researching...
                            </p>
                            <div className="flex flex-col gap-3 animate-pulse p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                                    <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={`w-full transition-all duration-500 
            ${hasStarted
                ? "sticky bottom-0 bg-gradient-to-t from-white via-white dark:from-zinc-950 dark:via-zinc-950 to-transparent pb-6 pt-4 px-4 z-40"
                : ""
              }`}
          >
            <div
              className={hasStarted ? "max-w-4xl mx-auto w-full" : "w-full"}
            >
              <SearchBar onSearch={handleSearch} onAbort={handleAbort} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-400">Loading...</p>
        </div>
      }
    >
      <ResearchContent />
    </Suspense>
  );
}
