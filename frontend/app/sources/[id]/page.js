"use client";

import { useParams } from "next/navigation";
import { SchemaBrowser } from "@/components/sources/SchemaBrowser";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Database, Server, HardDrive, Activity, Shield, Table2, GitMerge, Loader2 } from "lucide-react";
import { useSource, useSourceSchema, useDiscoverSourceSchema } from "@/hooks/useSources";

export default function SourceDetailPage() {
  const { id } = useParams();
  const { data: source, isLoading: sourceLoading } = useSource(id);
  const { data: schema, isLoading: schemaLoading } = useSourceSchema(id);
  const { mutate: discoverSchema, isPending: discovering } = useDiscoverSourceSchema();

  if (sourceLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!source) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Database className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Source not found</h2>
        <p className="text-muted-foreground mb-4">The source you're looking for doesn't exist.</p>
        <Link href="/sources">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Sources</Button>
        </Link>
      </div>
    );
  }

  const typeIcons = { csv: Database, mysql: Database, postgresql: Server, s3: HardDrive };
  const TypeIcon = typeIcons[source.type] || Database;

  const totalTables = (schema?.tables?.length || 0) + (schema?.views?.length || 0);
  const totalColumns = schema?.tables?.reduce((acc, t) => acc + (t.columns?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sources">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <PageHeader
          title={source.name}
          description={`${source.type.toUpperCase()} source`}
        />
      </div>

      <Tabs defaultValue="schema" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="lineage">Lineage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <TypeIcon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{source.type.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">Source Type</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Table2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{totalTables}</p>
                <p className="text-xs text-muted-foreground">Tables/Objects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Activity className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{totalColumns}</p>
                <p className="text-xs text-muted-foreground">Total Columns</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-muted-foreground">Quality</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {schemaLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : schema && (schema.tables?.length || schema.views?.length) ? (
                <SchemaBrowser schema={schema} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No schema data available for this source.</p>
                  <p className="text-xs mt-1 mb-4">Discover the schema to view tables, columns, and sample data.</p>
                  <Button onClick={() => discoverSchema(id)} disabled={discovering}>
                    {discovering ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Discovering...</> : "Discover Schema"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lineage" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <GitMerge className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Source Lineage</p>
                <p className="text-xs mt-1 mb-4">See where this source is used across your pipelines.</p>
                <div className="max-w-md mx-auto space-y-2">
                  <p className="text-sm">No lineage data available.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
