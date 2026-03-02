"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Play, Sparkles, Loader2, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { mockTransformations } from "@/lib/mock-data/transformations";
import { NodePalette } from "@/components/canvas/NodePalette";
import { PromptTooltip } from "@/components/shared/PromptTooltip";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { AISuggestionPanel } from "@/components/ai/AISuggestionPanel";

const getNodeClasses = (selected, status) => {
  let base = selected ? 'ring-2 ring-yellow-400 ring-offset-2 ' : '';
  if (status === 'running') base += 'ring-4 ring-yellow-300 ring-offset-2 animate-pulse scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(253,224,71,0.5)] ';
  if (status === 'pending') base += 'opacity-50 grayscale transition-all duration-300 ';
  if (status === 'completed') base += 'ring-2 ring-green-400 ring-[3px] ring-offset-1 transition-all duration-300 ';
  return base;
};

const NodeStatusBadge = ({ status }) => {
  if (status === 'running') {
    return <div className="absolute -top-3 -right-3 bg-yellow-400 rounded-full p-1.5 shadow-lg animate-spin z-10"><Loader2 className="w-4 h-4 text-yellow-900" /></div>;
  }
  if (status === 'completed') {
    return <div className="absolute -top-3 -right-3 bg-green-500 rounded-full p-1.5 shadow-lg z-10"><Check className="w-4 h-4 text-white" /></div>;
  }
  return null;
};

const nodeTypes = {
  source: ({ data, selected }) => (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white node-source min-w-[180px] relative ${getNodeClasses(selected, data.status)
      }`}>
      <NodeStatusBadge status={data.status} />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-white !border-2 !border-green-700 !w-4 !h-4"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-white !border-2 !border-green-700 !w-4 !h-4"
      />

      <div className="font-bold text-base flex items-center justify-between">
        <span>{data.label}</span>
        <span className="text-xs bg-green-700 px-2 py-0.5 rounded-full">SOURCE</span>
      </div>
      <div className="text-xs opacity-90 mt-2 flex justify-between">
        <span>{data.type?.toUpperCase() || 'CSV'}</span>
        {data.sourceType && <span className="bg-green-700 px-2 rounded">{data.sourceType}</span>}
      </div>
    </div>
  ),
  transform: ({ data, selected }) => (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white node-transform min-w-[180px] relative ${getNodeClasses(selected, data.status)
      }`}>
      <NodeStatusBadge status={data.status} />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-white !border-2 !border-blue-700 !w-4 !h-4"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-white !border-2 !border-blue-700 !w-4 !h-4"
      />

      <div className="font-bold text-base flex items-center justify-between">
        <span>{data.label}</span>
        <span className="text-xs bg-blue-700 px-2 py-0.5 rounded-full">TRANSFORM</span>
      </div>
      <div className="text-xs opacity-90 mt-2">
        <Zap className="inline h-3 w-3 mr-1" />
        {data.type?.toUpperCase() || 'PYSPARK'}
      </div>
    </div>
  ),
  target: ({ data, selected }) => (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white node-target min-w-[180px] relative ${getNodeClasses(selected, data.status)
      }`}>
      <NodeStatusBadge status={data.status} />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-white !border-2 !border-purple-700 !w-4 !h-4"
      />

      <div className="font-bold text-base flex items-center justify-between">
        <span>{data.label}</span>
        <span className="text-xs bg-purple-700 px-2 py-0.5 rounded-full">TARGET</span>
      </div>
      <div className="text-xs opacity-90 mt-2">
        {data.type?.toUpperCase() || 'SNOWFLAKE'}
      </div>
    </div>
  ),
};

function TransformationCanvas() {
  const params = useParams();
  const transformation = mockTransformations.find(t => t.id === params.id);
  const reactFlowWrapper = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Listen for Kaavya thinking events and jiggle nodes
  useEffect(() => {
    const handleKaavyaThinking = () => {
      if (nodes.length === 0) return;
      const originals = nodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
      setNodes(nds => nds.map(n => ({
        ...n,
        position: {
          x: n.position.x + (Math.random() - 0.5) * 20,
          y: n.position.y + (Math.random() - 0.5) * 20,
        }
      })));
      setTimeout(() => {
        setNodes(nds => nds.map(n => {
          const orig = originals.find(o => o.id === n.id);
          return orig ? { ...n, position: { x: orig.x, y: orig.y } } : n;
        }));
      }, 600);
      setTimeout(() => {
        setNodes(nds => nds.map(n => ({
          ...n,
          position: {
            x: n.position.x + (Math.random() - 0.5) * 12,
            y: n.position.y + (Math.random() - 0.5) * 12,
          }
        })));
      }, 1200);
      setTimeout(() => {
        setNodes(nds => nds.map(n => {
          const orig = originals.find(o => o.id === n.id);
          return orig ? { ...n, position: { x: orig.x, y: orig.y } } : n;
        }));
      }, 1800);
    };
    window.addEventListener('kaavya-thinking', handleKaavyaThinking);
    return () => window.removeEventListener('kaavya-thinking', handleKaavyaThinking);
  }, [nodes, setNodes]);

  useEffect(() => {
    if (transformation) {
      const updatedNodes = transformation.nodes.map(node => ({
        ...node,
        id: node.id || `${node.type}-${uuidv4()}`,
        data: {
          ...node.data,
          label: node.data?.label || `${node.type} node`,
        }
      }));
      setNodes(updatedNodes);

      const updatedEdges = transformation.edges.map(edge => ({
        ...edge,
        id: edge.id || `edge-${uuidv4()}`,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#888',
        },
        style: { stroke: '#888', strokeWidth: 2 },
        animated: true,
        type: 'smoothstep',
      }));
      setEdges(updatedEdges);
    }
  }, [transformation, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => {
      // Prevent self-connection
      if (params.source === params.target) {
        toast.error('Cannot connect node to itself');
        return;
      }

      // Check if connection already exists
      const exists = edges.some(e =>
        e.source === params.source && e.target === params.target
      );

      if (exists) {
        toast.error('Connection already exists');
        return;
      }

      const edgeWithArrows = {
        ...params,
        id: `edge-${uuidv4()}`,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
        style: { stroke: '#3b82f6', strokeWidth: 3 },
        animated: true,
        type: 'smoothstep',
      };
      setEdges((eds) => addEdge(edgeWithArrows, eds));
      toast.success('Connection created!');
    },
    [setEdges, edges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${type}-${uuidv4()}`,
        type,
        position,
        data: {
          label: `${type === 'source' ? 'New Source' : type === 'transform' ? 'New Transform' : 'New Target'}`,
          type: type === 'source' ? 'csv' : type === 'transform' ? 'pyspark' : 'snowflake',
          sourceType: type === 'source' ? 'postgresql' : undefined
        },
      };

      setNodes((nds) => nds.concat(newNode));
      toast.success(`${type} node added to canvas`);
    },
    [setNodes, reactFlowInstance]
  );

  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
  }, []);

  const onDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
    toast.info('Selected items deleted');
  }, [setNodes, setEdges]);

  const handleRunPipeline = () => {
    if (nodes.length === 0) {
      toast.error('Add at least one node to run pipeline');
      return;
    }
    setIsPipelineRunning(true);

    // Set all nodes to pending
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'pending' } })));
    toast.info('🚀 Pipeline execution started...');

    // Stage 1: Extractor (Source)
    setTimeout(() => {
      setNodes(nds => nds.map(n => n.type === 'source' ? { ...n, data: { ...n.data, status: 'running' } } : n));
      toast.info('Extracting data from sources...', { duration: 1500 });
    }, 500);

    // Stage 2: Transform
    setTimeout(() => {
      setNodes(nds => nds.map(n => {
        if (n.type === 'source') return { ...n, data: { ...n.data, status: 'completed' } };
        if (n.type === 'transform') return { ...n, data: { ...n.data, status: 'running' } };
        return n;
      }));
      toast.info('Transforming data...', { duration: 1500 });
    }, 2000);

    // Stage 3: Load (Target)
    setTimeout(() => {
      setNodes(nds => nds.map(n => {
        if (n.type === 'transform') return { ...n, data: { ...n.data, status: 'completed' } };
        if (n.type === 'target') return { ...n, data: { ...n.data, status: 'running' } };
        return n;
      }));
      toast.info('Loading data to destination...', { duration: 1500 });
    }, 3500);

    // Stage 4: Finish
    setTimeout(() => {
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'completed' } })));
      setIsPipelineRunning(false);
      toast.success('✅ Pipeline completed successfully!', {
        description: 'All operations finished and data is loaded.',
        duration: 5000,
      });
      // clear status after a while
      setTimeout(() => {
        setNodes(nds => nds.map(n => {
          const { status, ...restData } = n.data;
          return { ...n, data: restData };
        }));
      }, 5000);
    }, 5000);
  };

  const handleSave = () => {
    toast.success('Pipeline saved successfully');
  };

  const handleAIAssist = () => {
    setShowAIPanel(true);
    toast.info('🤖 AI Assistant', {
      description: 'Opening AI suggestions panel...',
    });
  };

  const handleApplySuggestion = (suggestion) => {
    if (suggestion.left && suggestion.right) {
      // 1. Create the join node
      const joinNodeId = `transform-${uuidv4()}`;
      const joinNode = {
        id: joinNodeId,
        type: 'transform',
        position: { x: 400, y: 200 },
        data: {
          label: `Join: ${suggestion.left.split('.')[0]} & ${suggestion.right.split('.')[0]}`,
          type: 'join',
        },
      };

      setNodes((nds) => nds.concat(joinNode));

      // 2. Automatically connect to relevant sources if they exist on canvas
      const leftTableName = suggestion.left.split('.')[0].toLowerCase();
      const rightTableName = suggestion.right.split('.')[0].toLowerCase();

      const leftNode = nodes.find(n => n.data?.label?.toLowerCase().includes(leftTableName));
      const rightNode = nodes.find(n => n.data?.label?.toLowerCase().includes(rightTableName));

      const newEdges = [];
      if (leftNode) {
        newEdges.push({
          id: `edge-${uuidv4()}`,
          source: leftNode.id,
          target: joinNodeId,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
          style: { stroke: '#3b82f6', strokeWidth: 3 },
          animated: true,
          type: 'smoothstep',
        });
      }
      if (rightNode) {
        newEdges.push({
          id: `edge-${uuidv4()}`,
          source: rightNode.id,
          target: joinNodeId,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
          style: { stroke: '#3b82f6', strokeWidth: 3 },
          animated: true,
          type: 'smoothstep',
        });
      }

      if (newEdges.length > 0) {
        setEdges((eds) => eds.concat(newEdges));
        toast.success(`Join automatically connected to source nodes.`);
      }

      toast.success(`Join suggestion applied: ${suggestion.left} → ${suggestion.right}`);
    } else if (suggestion.name) {
      const nodeType = suggestion.type === 'snowflake' || suggestion.type === 'aurora' ? 'target' : 'transform';
      const newNode = {
        id: `${nodeType}-${uuidv4()}`,
        type: nodeType,
        position: { x: 400, y: 200 },
        data: {
          label: suggestion.name,
          type: suggestion.type
        },
      };
      setNodes((nds) => nds.concat(newNode));
      toast.success(`Added: ${suggestion.name}`);
    }
    setShowAIPanel(false);
  };

  if (!transformation) {
    return <div className="flex items-center justify-center h-full">Transformation not found</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/transformations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{transformation?.name}</h1>
            <p className="text-muted-foreground">Drag nodes from palette ➔ Connect with arrows ➔ Run pipeline</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <PromptTooltip content="AI can help you design this transformation">
            <Button variant="outline" onClick={handleAIAssist}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Assist
            </Button>
          </PromptTooltip>
          <Button variant="outline" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button onClick={handleRunPipeline} disabled={isPipelineRunning}>
            {isPipelineRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running (3s)...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Pipeline
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Card className="w-64 p-4 h-fit sticky top-20">
          <h3 className="font-medium mb-4 flex items-center justify-between">
            <span>Components</span>
            <span className="text-xs text-muted-foreground">Drag to canvas</span>
          </h3>
          <NodePalette />
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
            <p className="font-medium mb-1">💡 How to connect:</p>
            <p>1. Drag nodes to canvas</p>
            <p>2. Click and drag from node edge</p>
            <p>3. Drop on another node</p>
          </div>
        </Card>

        <Card className="flex-1 h-[calc(100vh-200px)] overflow-hidden" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onInit={onInit}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: isPipelineRunning,
              style: { stroke: '#888', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#888' },
            }}
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'source': return '#22c55e';
                  case 'transform': return '#3b82f6';
                  case 'target': return '#a855f7';
                  default: return '#aaa';
                }
              }}
            />
            <Panel position="top-right" className="bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg">
              <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </Panel>
          </ReactFlow>
        </Card>
      </div>

      {showAIPanel && (
        <AISuggestionPanel
          onClose={() => setShowAIPanel(false)}
          onApplySuggestion={handleApplySuggestion}
          nodes={nodes}
          edges={edges}
        />
      )}
    </div>
  );
}

export default function TransformationPage() {
  return (
    <ReactFlowProvider>
      <TransformationCanvas />
    </ReactFlowProvider>
  );
}
