"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Table2, Eye, Key, Link2, Columns3, CheckSquare, Square, FolderOpen, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function QualityDot({ score }) {
    let color = "bg-green-500";
    if (score < 80) color = "bg-red-500";
    else if (score < 90) color = "bg-yellow-500";
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-muted-foreground">{score}%</span>
        </div>
    );
}

function ColumnRow({ column }) {
    return (
        <div className="flex items-center gap-2 py-1.5 px-3 ml-10 text-xs hover:bg-secondary/50 rounded transition-colors group">
            <Columns3 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="font-mono font-medium text-foreground min-w-[120px]">{column.name}</span>
            <span className="text-muted-foreground min-w-[100px]">{column.type}</span>
            {column.isPK && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Key className="w-2.5 h-2.5 mr-0.5" />PK
                </Badge>
            )}
            {column.isFK && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <Link2 className="w-2.5 h-2.5 mr-0.5" />FK
                </Badge>
            )}
            {!column.nullable && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground">NOT NULL</Badge>
            )}
            {column.tags?.includes("PII") && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">PII</Badge>
            )}
            <div className="ml-auto flex items-center gap-3">
                <QualityDot score={column.qualityScore} />
                <span className="text-muted-foreground">{column.usedIn} jobs</span>
            </div>
        </div>
    );
}

function TableNode({ table, isSelected, onToggleSelect, onPreview }) {
    const [expanded, setExpanded] = useState(false);

    const icon = table.type === "directory" ? FolderOpen :
        table.type === "view" ? Eye : Table2;
    const Icon = icon;

    return (
        <div className="border-l border-border/50 ml-4">
            <div className="flex items-center gap-2 py-2 px-2 hover:bg-secondary/50 rounded-md transition-colors cursor-pointer group">
                <button onClick={() => onToggleSelect(table.name)} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                    {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                </button>
                <button onClick={() => setExpanded(!expanded)} className="flex-shrink-0 text-muted-foreground">
                    {table.columns ? (expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />) : <span className="w-3.5" />}
                </button>
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm">{table.name}</span>
                <span className="text-xs text-muted-foreground">({table.rowCountDisplay} rows)</span>
                {table.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{tag}</Badge>
                ))}
                <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {table.qualityScore && <QualityDot score={table.qualityScore} />}
                    {table.sampleData && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={(e) => { e.stopPropagation(); onPreview(table); }}>
                            <Eye className="w-3 h-3 mr-1" /> Preview
                        </Button>
                    )}
                </div>
            </div>
            {expanded && table.columns && (
                <div className="ml-2 border-l border-border/30">
                    {table.columns.map(col => (
                        <ColumnRow key={col.name} column={col} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function SchemaBrowser({ schema, onAddToCanvas }) {
    const [selectedTables, setSelectedTables] = useState(new Set());
    const [previewTable, setPreviewTable] = useState(null);
    const router = useRouter();

    const allTables = [...(schema?.tables || []), ...(schema?.views || [])];

    const toggleSelect = (tableName) => {
        setSelectedTables(prev => {
            const next = new Set(prev);
            if (next.has(tableName)) next.delete(tableName);
            else next.add(tableName);
            return next;
        });
    };

    const handleAddToCanvas = () => {
        if (selectedTables.size === 0) {
            toast.warning("Select at least one table");
            return;
        }
        const tables = allTables.filter(t => selectedTables.has(t.name));

        // Store in localStorage for the transformation page to pick up
        localStorage.setItem('pending_tables', JSON.stringify(tables.map(t => ({
            name: t.name,
            sourceId: schema.sourceId,
            sourceType: schema.sourceType
        }))));

        toast.success(`${tables.length} table(s) ready for canvas`);
        router.push("/transformations/new");
    };

    return (
        <div className="space-y-3">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{schema?.sourceName}</span>
                    <Badge variant="outline" className="text-xs">{schema?.sourceType?.toUpperCase()}</Badge>
                    <span className="text-xs text-muted-foreground">{allTables.length} objects</span>
                </div>
                {selectedTables.size > 0 && (
                    <Button size="sm" onClick={handleAddToCanvas} className="h-7 text-xs">
                        Use {selectedTables.size} table(s) in Transformation
                    </Button>
                )}
            </div>

            {/* Tables section */}
            {schema?.tables?.length > 0 && (
                <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <FolderOpen className="w-3 h-3" />
                        {schema.sourceType === "s3" ? "Directories" : "Tables"} ({schema.tables.length})
                    </div>
                    {schema.tables.map(table => (
                        <TableNode
                            key={table.name}
                            table={table}
                            isSelected={selectedTables.has(table.name)}
                            onToggleSelect={toggleSelect}
                            onPreview={setPreviewTable}
                        />
                    ))}
                </div>
            )}

            {/* Views section */}
            {schema?.views?.length > 0 && (
                <div className="mt-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Eye className="w-3 h-3" />
                        Views ({schema.views.length})
                    </div>
                    {schema.views.map(view => (
                        <TableNode
                            key={view.name}
                            table={view}
                            isSelected={selectedTables.has(view.name)}
                            onToggleSelect={toggleSelect}
                            onPreview={setPreviewTable}
                        />
                    ))}
                </div>
            )}

            {/* Sample Data Preview */}
            {previewTable && previewTable.sampleData && (
                <div className="mt-4 border rounded-lg p-4 bg-secondary/20">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">
                            Preview: <span className="font-mono">{previewTable.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">({previewTable.rowCountDisplay} rows)</span>
                        </h4>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setPreviewTable(null)}>Close</Button>
                    </div>
                    <div className="border rounded-md overflow-auto max-h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {previewTable.columns?.map(col => (
                                        <TableHead key={col.name} className="text-xs whitespace-nowrap">
                                            {col.name}
                                            {col.isPK && <Key className="w-3 h-3 inline ml-1 text-amber-500" />}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewTable.sampleData.map((row, i) => (
                                    <TableRow key={i}>
                                        {row.map((cell, j) => (
                                            <TableCell key={j} className="text-xs font-mono whitespace-nowrap">
                                                {cell === null ? <span className="text-muted-foreground italic">null</span> : String(cell)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
