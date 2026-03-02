"use client";

import { Card } from "@/components/ui/card";
import { Database, GitBranch, Target, GripVertical, Sparkles } from "lucide-react";

const nodeTypes = [
  {
    type: "source",
    label: "Source",
    icon: Database,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-200 dark:border-green-800",
    description: "CSV, MySQL, PostgreSQL, S3"
  },
  {
    type: "transform",
    label: "Transform",
    icon: GitBranch,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-200 dark:border-blue-800",
    description: "PySpark, dbt, SQL"
  },
  {
    type: "target",
    label: "Target",
    icon: Target,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-200 dark:border-purple-800",
    description: "Snowflake, Aurora"
  },
];

export function NodePalette() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
    
    // Add a ghost image effect
    const ghost = document.createElement('div');
    ghost.className = 'w-32 h-16 bg-primary rounded-lg shadow-lg opacity-50 flex items-center justify-center text-white font-bold';
    ghost.textContent = nodeType.toUpperCase();
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    event.dataTransfer.setDragImage(ghost, 64, 32);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  return (
    <div className="space-y-3">
      {nodeTypes.map((node) => (
        <div
          key={node.type}
          draggable
          onDragStart={(e) => onDragStart(e, node.type)}
          className="cursor-grab active:cursor-grabbing transition-transform hover:scale-102"
        >
          <Card className={`p-3 hover:shadow-md transition-all border-2 ${node.borderColor} hover:border-primary`}>
            <div className="flex items-center space-x-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className={`p-2 rounded-lg ${node.bgColor}`}>
                <node.icon className={`h-4 w-4 ${node.color}`} />
              </div>
              <div>
                <p className="font-medium text-sm flex items-center">
                  {node.label}
                  {node.type === 'transform' && (
                    <Sparkles className="h-3 w-3 ml-1 text-yellow-500" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{node.description}</p>
              </div>
            </div>
          </Card>
        </div>
      ))}
      
      <div className="mt-4 p-2 bg-muted/50 rounded text-xs text-center">
        ✨ Drag me to canvas
      </div>
    </div>
  );
}
