"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { mockTransformations } from "@/lib/mock-data/transformations";
import { NodePalette } from "@/components/canvas/NodePalette";
import { PromptTooltip } from "@/components/shared/PromptTooltip";

const nodeTypes = {
  source: ({ data }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-green-500 text-white node-source">
      <div className="font-bold">{data.label}</div>
      <div className="text-xs">{data.type}</div>
    </div>
  ),
  transform: ({ data }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-blue-500 text-white node-transform">
      <div className="font-bold">{data.label}</div>
      <div className="text-xs">{data.type}</div>
    </div>
  ),
  target: ({ data }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-purple-500 text-white node-target">
      <div className="font-bold">{data.label}</div>
      <div className="text-xs">{data.type}</div>
    </div>
  ),
};

function TransformationCanvas() {
  const params = useParams();
  const transformation = mockTransformations.find(t => t.id === params.id);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(transformation?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(transformation?.edges || []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = {
        x: event.clientX - 300,
        y: event.clientY - 100,
      };

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: `${type === 'source' ? 'New Source' : type === 'transform' ? 'New Transform' : 'New Target'}`,
          type: type === 'source' ? 'csv' : type === 'transform' ? 'pyspark' : 'snowflake'
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  if (!transformation) {
    return <div>Transformation not found</div>;
  }

  return (
    <div className="h-[calc(100vh-120px)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default function TransformationPage() {
  const params = useParams();
  const transformation = mockTransformations.find(t => t.id === params.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/transformations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{transformation?.name}</h1>
            <p className="text-muted-foreground">Drag and drop nodes to build your pipeline</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <PromptTooltip content="AI can help you design this transformation">
            <Button variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Assist
            </Button>
          </PromptTooltip>
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Run Pipeline
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Card className="w-64 p-4">
          <h3 className="font-medium mb-4">Components</h3>
          <NodePalette />
        </Card>
        
        <Card className="flex-1 h-[calc(100vh-200px)] overflow-hidden">
          <ReactFlowProvider>
            <TransformationCanvas />
          </ReactFlowProvider>
        </Card>
      </div>
    </div>
  );
}
