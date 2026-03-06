"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Brain, Database, GitBranch, Home, FileJson, GitMerge, Send, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname } from "next/navigation";
import { Settings, ShieldCheck } from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-sky-500",
    roles: ["admin", "data_engineer"]
  },
  {
    label: "Data Sources",
    icon: Database,
    href: "/sources/list",
    color: "text-green-500",
    roles: ["admin", "data_engineer", "devops"]
  },
  {
    label: "Transformations",
    icon: GitBranch,
    href: "/transformations",
    color: "text-blue-500",
    roles: ["admin", "data_engineer", "developer"]
  },
  {
    label: "Samples",
    icon: FileJson,
    href: "/samples",
    color: "text-purple-500",
    roles: ["admin", "data_engineer"]
  },
  {
    label: "Data Catalog",
    icon: BookOpen,
    href: "/catalog",
    color: "text-amber-500",
    roles: ["admin", "data_engineer", "developer", "analyst"]
  },
  {
    label: "Data Lineage",
    icon: GitMerge,
    href: "/lineage",
    color: "text-orange-500",
    roles: ["admin", "data_engineer", "analyst"]
  },
  {
    label: "Admin",
    icon: ShieldCheck,
    href: "/admin/users",
    color: "text-red-500",
    roles: ["admin"]
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-slate-500",
    roles: ["admin", "devops"]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [aiInput, setAiInput] = useState("");

  const filteredRoutes = routes.filter(route =>
    !route.roles || (user && route.roles.includes(user.role))
  );

  const [isThinking, setIsThinking] = useState(false);

  const handleAISubmit = async (e) => {
    e?.preventDefault();
    if (!aiInput.trim()) return;

    const query = aiInput.trim();
    setIsThinking(true);
    setAiInput("");
    toast.info("Kaavya is thinking...", {
      description: `Analyzing: "${query}"`,
      duration: 3000,
    });

    // Dispatch custom event to trigger pipeline animations
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kaavya-thinking', { detail: { query } }));
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      toast.success(data.source === 'openrouter' ? "Kaavya (🤖 AI):" : "Kaavya:", {
        description: data.response,
        duration: 8000,
      });
    } catch (err) {
      toast.success("Kaavya suggests:", {
        description: "Consider reviewing your pipeline for join optimization and adding data quality checks on key columns.",
        duration: 6000,
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setAiInput(suggestion);
    toast.success("Suggestion selected", {
      description: "Click send or press Enter to ask Kaavya.",
    });
  };

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-card border-r">
      <div className="px-3 py-2 flex-1">
        <Link href="/sources" className="flex items-center pl-3 mb-8">
          <div className="relative h-8 w-8 mr-2 overflow-hidden rounded-md">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              sizes="(max-width: 768px) 32px, 32px"
              className="object-cover"
            />
          </div>
          <h1 className="text-xl font-bold">SynKrasis.ai</h1>
        </Link>
        <div className="space-y-1">
          {filteredRoutes.map((route) => (
            <Button
              key={route.href}
              variant={pathname === route.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                pathname === route.href && "bg-secondary"
              )}
              asChild
            >
              <Link href={route.href}>
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-3 rounded-lg border border-primary/20">
          <p className="text-xs font-semibold text-primary mb-2">Ask Kaavya for suggestions</p>
          <div className="text-xs text-muted-foreground space-y-1 mb-2">
            <p
              onClick={() => handleSuggestionClick("What joins should I use?")}
              className="hover:text-primary cursor-pointer transition-colors"
            >
              "What joins should I use?"
            </p>
            <p
              onClick={() => handleSuggestionClick("Optimize this pipeline")}
              className="hover:text-primary cursor-pointer transition-colors"
            >
              "Optimize this pipeline"
            </p>
            <p
              onClick={() => handleSuggestionClick("Add data quality checks")}
              className="hover:text-primary cursor-pointer transition-colors"
            >
              "Add data quality checks"
            </p>
          </div>
          <form onSubmit={handleAISubmit} className="relative mt-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask Kaavya..."
              className="w-full bg-background border rounded-md text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary pr-8"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
