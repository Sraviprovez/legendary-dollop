"use client";

import { useParams } from "next/navigation";
import { useSourceStore } from "@/lib/store/sourceStore";
import { catalogSchemas } from "@/lib/mock-data/catalog";
import { SchemaBrowser } from "@/components/sources/SchemaBrowser";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Database, Server, HardDrive, FileSpreadsheet, Clock, Activity, Shield, Table2, GitMerge } from "lucide-react";

export default function SourceDetailPage() {
    const { id } = useParams();
    const { getSource } = useSourceStore();
    const source = getSource(id);
    const schema = catalogSchemas[id];

    if (!source) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Database className="w-12 h-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Source not found</h2>
                <p className="text-muted-foreground mb-4">The source you're looking for doesn't exist.</p>
                <Link href="/sources/list">
                    <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Sources</Button>
                </Link>
            </div>
        );
    }

    const typeIcons = { csv: FileSpreadsheet, mysql: Database, postgresql: Server, s3: HardDrive };
    const TypeIcon = typeIcons[source.type] || Database;

    const totalTables = (schema?.tables?.length || 0) + (schema?.views?.length || 0);
    const totalColumns = schema?.tables?.reduce((acc, t) => acc + (t.columns?.length || 0), 0) || 0;
    const avgQuality = schema?.tables?.length
        ? Math.round(schema.tables.reduce((acc, t) => acc + (t.qualityScore || 0), 0) / schema.tables.length)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/sources/list">
                    <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                </Link>
                <PageHeader
                    title={source.name}
                    description={`${source.type.toUpperCase()} source • ${source.status === 'active' ? '🟢 Active' : '🔴 Inactive'}`}
                />
            </div>

            <Tabs defaultValue="schema" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                    <TabsTrigger value="lineage">Lineage</TabsTrigger>
                </TabsList>

                {/* ━━━ OVERVIEW TAB ━━━ */}
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
                                <p className="text-2xl font-bold">{avgQuality}%</p>
                                <p className="text-xs text-muted-foreground">Avg Quality</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Connection Details</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {source.metadata.host && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Host</span>
                                    <span className="font-mono">{source.metadata.host}:{source.metadata.port}</span>
                                </div>
                            )}
                            {source.metadata.database && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Database</span>
                                    <span className="font-mono">{source.metadata.database}</span>
                                </div>
                            )}
                            {source.metadata.bucket && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Bucket</span>
                                    <span className="font-mono">s3://{source.metadata.bucket}/{source.metadata.prefix}</span>
                                </div>
                            )}
                            {source.metadata.size && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Size</span>
                                    <span>{source.metadata.size}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Last Ingested</span>
                                <span>{source.lastIngested ? new Date(source.lastIngested).toLocaleString() : "Never"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Created</span>
                                <span>{new Date(source.createdAt).toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ━━━ SCHEMA TAB ━━━ */}
                <TabsContent value="schema" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            {schema ? (
                                <SchemaBrowser schema={schema} />
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Database className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                    <p>No schema data available for this source.</p>
                                    <p className="text-xs mt-1">Connect and crawl this source to discover its schema.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ━━━ LINEAGE TAB ━━━ */}
                <TabsContent value="lineage" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12 text-muted-foreground">
                                <GitMerge className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                <p className="font-medium">Source Lineage</p>
                                <p className="text-xs mt-1 mb-4">See where this source is used across your pipelines.</p>
                                <div className="max-w-md mx-auto space-y-2">
                                    {schema?.tables?.filter(t => t.usedInPipelines > 0).map(t => (
                                        <div key={t.name} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                                            <div className="flex items-center gap-2">
                                                <Table2 className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-mono">{t.name}</span>
                                            </div>
                                            <Badge variant="secondary">{t.usedInPipelines} pipeline(s)</Badge>
                                        </div>
                                    )) || <p className="text-sm">No lineage data available.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
