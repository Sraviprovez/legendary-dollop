"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransformationCard } from "@/components/transformations/TransformationCard";
import { mockTransformations } from "@/lib/mock-data/transformations";
import Link from "next/link";

export default function TransformationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Transformations"
        description="Build and manage your data transformation pipelines"
        action={
          <Link href="/transformations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Transformation
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockTransformations.map((transformation) => (
          <Link key={transformation.id} href={`/transformations/${transformation.id}`}>
            <TransformationCard transformation={transformation} />
          </Link>
        ))}
      </div>
    </div>
  );
}
