"use client";

import { useState } from "react";
import { Search, Filter, BookOpen, Clock, Tag, Database, Table2, ChevronRight, Server, HardDrive, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { catalogSchemas, recentAccess } from "@/lib/mock-data/catalog";
import Link from "next/link";

export default function CatalogPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");

    // Flatten catalog for search
    const allTables = Object.values(catalogSchemas).flatMap(source => {
        const tables = (source.tables || []).map(t => ({ ...t, sourceName: source.sourceName, sourceId: source.sourceId, sourceType: source.sourceType }));
        const views = (source.views || []).map(v => ({ ...v, sourceName: source.sourceName, sourceId: source.sourceId, sourceType: source.sourceType }));
        return [...tables, ...views];
    });

    const filteredTables = allTables.filter(table => {
        const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (table.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (table.columns?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())));
        const matchesType = selectedType === "all" || table.sourceType === selectedType;
        return matchesSearch && matchesType;
    });

    const typeIcons = {
        csv: FileSpreadsheet,
        mysql: Database,
        postgresql: Server,
        s3: HardDrive
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Data Catalog"
                description="Search and discover data assets across your entire organization."
            />

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tables, columns, or descriptions..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {["all", "mysql", "postgresql", "csv", "s3"].map(type => (
                        <Button
                            key={type}
                            variant={selectedType === type ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setSelectedType(type)}
                            className="capitalize"
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Catalog View */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Assets ({filteredTables.length})
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredTables.length > 0 ? filteredTables.map((table, idx) => {
                            const TypeIcon = typeIcons[table.sourceType] || Database;
                            return (
                                <Link key={`${table.sourceId}-${table.name}`} href={`/sources/${table.sourceId}?tab=schema`}>
                                    <Card className="hover:shadow-md transition-all border-border/50 group">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className="mt-1 p-2 rounded-lg bg-secondary/50 text-primary">
                                                        <TypeIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                                                                {table.name}
                                                            </h4>
                                                            <Badge variant="outline" className="text-[10px] h-4">
                                                                {table.sourceName}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                            {table.description || "No description available."}
                                                        </p>
                                                        <div className="flex gap-4 mt-3">
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Table2 className="w-3 h-3" />
                                                                {table.rowCountDisplay} rows
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <ShieldCheck className="w-3 h-3 text-green-500" />
                                                                {table.qualityScore || 95}% Quality
                                                            </div>
                                                            {table.tags?.map(tag => (
                                                                <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        }) : (
                            <div className="text-center py-12 border rounded-xl bg-secondary/10">
                                <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground">No assets found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Recently Accessed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentAccess.map((item, idx) => (
                                <Link key={idx} href={`/sources/${item.sourceId}?tab=schema`} className="block group">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                                {item.table}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                via {item.source}
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{item.accessedAgo}</span>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600">
                                <Tag className="w-4 h-4" />
                                Popular Tags
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {["finance", "PII", "core", "daily-refresh", "master-data", "streaming", "analytics"].map(tag => (
                                    <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-amber-500 hover:text-white transition-colors">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
