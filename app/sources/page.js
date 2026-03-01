"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SourceCard } from "@/components/sources/SourceCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSourceStore } from "@/lib/store/sourceStore";
import Link from "next/link";

export default function SourcesPage() {
  const { sources } = useSourceStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sources"
        description="Manage your data sources and connections"
        action={
          <Link href="/sources/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Source
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>
    </div>
  );
}
