"use client";

import { Card } from "@/components/ui/card";
import { Database, GitBranch, Target, GripVertical } from "lucide-react";

const nodeTypes = [
  {
    type: "source",
    label: "Source",
    icon: Database,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "CSV, MySQL, PostgreSQL, S3"
  },
  {
    type: "transform",
    label: "Transform",
    icon: GitBranch,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "PySpark, dbt, SQL"
  },
  {
    type: "target",
    label: "Target",
    icon: Target,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Snowflake, Aurora"
  },
];

export function NodePalette() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="space-y-3">
      {nodeTypes.map((node) => (
        <div
          key={node.type}
          draggable
          onDragStart={(e) => onDragStart(e, node.type)}
          className="cursor-move"
        >
          <Card className="p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className={`p-2 rounded-lg ${node.bgColor}`}>
                <node.icon className={`h-4 w-4 ${node.color}`} />
              </div>
              <div>
                <p className="font-medium text-sm">{node.label}</p>
                <p className="text-xs text-muted-foreground">{node.description}</p>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
