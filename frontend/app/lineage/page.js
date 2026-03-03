"use client";

import { useState, useCallback, useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    MarkerType,
    Handle,
    Position,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { GitMerge, Database, GitBranch, Target, Eye, Network } from "lucide-react";

// Mock lineage data
const mockLineage = [
    {
        id: 1,
        name: "Sales Analytics Pipeline",
        status: "active",
        nodes: [
            { id: "s1", name: "sales.csv", type: "source", columns: ["transaction_id", "customer_id", "amount", "date"] },
            { id: "s2", name: "customers (MySQL)", type: "source", columns: ["customer_id", "name", "email", "segment"] },
            { id: "t1", name: "Join on customer_id", type: "transform", logic: "INNER JOIN" },
            { id: "t2", name: "Aggregate by country", type: "transform", logic: "GROUP BY country, SUM(amount)" },
            { id: "d1", name: "Snowflake", type: "target", columns: ["country", "total_sales", "customer_count"] }
        ],
        edges: [
            { from: "s1", to: "t1", fields: ["customer_id", "amount"] },
            { from: "s2", to: "t1", fields: ["customer_id", "name", "segment"] },
            { from: "t1", to: "t2", fields: ["all fields"] },
            { from: "t2", to: "d1", fields: ["country", "total_sales", "customer_count"] }
        ]
    },
    {
        id: 2,
        name: "Customer 360 Pipeline",
        status: "active",
        nodes: [
            { id: "s1", name: "orders (PostgreSQL)", type: "source", columns: ["order_id", "customer_id", "amount", "date"] },
            { id: "s2", name: "customers (MySQL)", type: "source", columns: ["customer_id", "name", "email"] },
            { id: "s3", name: "products (CSV)", type: "source", columns: ["product_id", "name", "category", "price"] },
            { id: "t1", name: "dbt staging", type: "transform", logic: "stg_orders, stg_customers, stg_products" },
            { id: "t2", name: "dbt mart", type: "transform", logic: "dim_customers, fct_orders" },
            { id: "d1", name: "Aurora", type: "target", columns: ["customer_id", "name", "lifetime_value", "order_count"] }
        ],
        edges: [
            { from: "s1", to: "t1", fields: ["order_id", "customer_id", "amount"] },
            { from: "s2", to: "t1", fields: ["customer_id", "name", "email"] },
            { from: "s3", to: "t1", fields: ["product_id", "name", "price"] },
            { from: "t1", to: "t2", fields: ["all fields"] },
            { from: "t2", to: "d1", fields: ["customer_id", "name", "lifetime_value", "order_count"] }
        ]
    }
];

function LineageNode({ data }) {
    const isSource = data.type === 'source';
    const isTransform = data.type === 'transform';
    const isTarget = data.type === 'target';

    let bg = "";
    let badgeBg = "";
    if (isSource) { bg = "linear-gradient(135deg, #16a34a, #22c55e)"; badgeBg = "#15803d"; }
    else if (isTransform) { bg = "linear-gradient(135deg, #2563eb, #3b82f6)"; badgeBg = "#1d4ed8"; }
    else { bg = "linear-gradient(135deg, #9333ea, #a855f7)"; badgeBg = "#7e22ce"; }

    const Icon = isSource ? Database : isTransform ? GitBranch : Target;

    return (
        <div style={{
            background: bg,
            padding: '12px 16px',
            borderRadius: '10px',
            color: 'white',
            minWidth: '200px',
            maxWidth: '260px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            position: 'relative',
        }}>
            {!isSource && <Handle type="target" position={Position.Left} style={{ background: '#fff', width: 10, height: 10, border: 'none' }} />}
            {!isTarget && <Handle type="source" position={Position.Right} style={{ background: '#fff', width: 10, height: 10, border: 'none' }} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.name}</span>
                </div>
                <span style={{ fontSize: 9, background: badgeBg, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', flexShrink: 0 }}>{data.type}</span>
            </div>

            <div style={{ fontSize: 11, opacity: 0.9 }}>
                {data.logic && <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '3px 6px', borderRadius: 4, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.logic}</div>}
                {data.columns && <div style={{ marginTop: 4 }}>{data.columns.length} columns: {data.columns.slice(0, 3).join(', ')}{data.columns.length > 3 ? '...' : ''}</div>}
            </div>
        </div>
    );
}

const nodeTypes = { lineageNode: LineageNode };

function buildGraph(pipeline) {
    let sourceCount = 0;
    let transformCount = 0;
    let targetCount = 0;

    const sourceNodes = pipeline.nodes.filter(n => n.type === 'source');
    const transformNodes = pipeline.nodes.filter(n => n.type === 'transform');
    const targetNodes = pipeline.nodes.filter(n => n.type === 'target');

    const totalSourceHeight = sourceNodes.length * 130;
    const totalTransformHeight = transformNodes.length * 130;
    const totalTargetHeight = targetNodes.length * 130;

    const nodes = pipeline.nodes.map((node) => {
        let x = 0, y = 0;
        if (node.type === 'source') {
            x = 50;
            y = sourceCount * 130 + (500 - totalSourceHeight) / 2;
            sourceCount++;
        } else if (node.type === 'transform') {
            x = 380;
            y = transformCount * 130 + (500 - totalTransformHeight) / 2;
            transformCount++;
        } else {
            x = 710;
            y = targetCount * 130 + (500 - totalTargetHeight) / 2;
            targetCount++;
        }
        return { id: node.id, type: 'lineageNode', position: { x, y }, data: node };
    });

    const edges = pipeline.edges.map((edge) => ({
        id: `${edge.from}-${edge.to}`,
        source: edge.from,
        target: edge.to,
        animated: true,
        label: edge.fields[0] === 'all fields' ? 'All' : `${edge.fields.length} cols`,
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelStyle: { fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: '#1e293b', stroke: '#334155', strokeWidth: 1 },
        style: { stroke: '#64748b', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b', width: 16, height: 16 },
    }));

    return { nodes, edges };
}

function LineageViewer({ pipeline }) {
    const graph = useMemo(() => buildGraph(pipeline), [pipeline]);
    const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

    // Update when pipeline changes
    useState(() => {
        setNodes(graph.nodes);
        setEdges(graph.edges);
    }, [graph]);

    return (
        <div style={{ width: '100%', height: '600px' }}>
            <ReactFlow
                nodes={graph.nodes}
                edges={graph.edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                attributionPosition="bottom-right"
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#334155" gap={20} size={1} />
                <Controls showInteractive={false} />
                <MiniMap
                    nodeColor={(node) => {
                        if (node.data?.type === 'source') return '#22c55e';
                        if (node.data?.type === 'transform') return '#3b82f6';
                        if (node.data?.type === 'target') return '#a855f7';
                        return '#94a3b8';
                    }}
                    maskColor="rgba(0, 0, 0, 0.15)"
                    style={{ background: '#0f172a', borderRadius: 8 }}
                />
            </ReactFlow>
        </div>
    );
}

export default function LineagePage() {
    const [selectedPipeline, setSelectedPipeline] = useState(mockLineage[0]);

    return (
        <ReactFlowProvider>
            <div className="space-y-6">
                <PageHeader
                    title="Data Lineage"
                    description="Visualize and track data flow from origin to destination across your data ecosystem."
                />

                <Tabs defaultValue="viewer" className="w-full">
                    <div className="flex justify-between items-center mb-4">
                        <TabsList className="grid w-full max-w-sm grid-cols-2">
                            <TabsTrigger value="viewer">
                                <Network className="h-4 w-4 mr-2" />
                                Graph View
                            </TabsTrigger>
                            <TabsTrigger value="pipelines">
                                <GitMerge className="h-4 w-4 mr-2" />
                                Pipelines
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex gap-2 ml-auto overflow-x-auto">
                            {mockLineage.map((pipeline) => (
                                <Button
                                    key={pipeline.id}
                                    variant={selectedPipeline.id === pipeline.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedPipeline(pipeline)}
                                    className="rounded-full px-4"
                                >
                                    {pipeline.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <TabsContent value="viewer">
                        <Card className="p-2 border shadow-sm overflow-hidden">
                            <LineageViewer key={selectedPipeline.id} pipeline={selectedPipeline} />
                        </Card>
                    </TabsContent>

                    <TabsContent value="pipelines">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mockLineage.map((pipeline) => (
                                <Card
                                    key={pipeline.id}
                                    className={`p-6 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all ${selectedPipeline.id === pipeline.id ? 'ring-2 ring-primary border-primary' : ''}`}
                                    onClick={() => {
                                        setSelectedPipeline(pipeline);
                                        document.querySelector('[data-value="viewer"]')?.click();
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{pipeline.name}</h3>
                                            <Badge variant={pipeline.status === 'active' ? 'default' : 'secondary'} className="mt-1 px-2 py-0 text-[10px] h-5">
                                                {pipeline.status}
                                            </Badge>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-4">
                                        {pipeline.nodes.length} nodes • {pipeline.edges.length} connections
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-2 rounded-md">
                                            <div className="font-bold text-lg">{pipeline.nodes.filter(n => n.type === 'source').length}</div>
                                            <div>Sources</div>
                                        </div>
                                        <div className="bg-blue-500/10 text-blue-700 dark:text-blue-400 p-2 rounded-md">
                                            <div className="font-bold text-lg">{pipeline.nodes.filter(n => n.type === 'transform').length}</div>
                                            <div>Transforms</div>
                                        </div>
                                        <div className="bg-purple-500/10 text-purple-700 dark:text-purple-400 p-2 rounded-md">
                                            <div className="font-bold text-lg">{pipeline.nodes.filter(n => n.type === 'target').length}</div>
                                            <div>Targets</div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </ReactFlowProvider>
    );
}
