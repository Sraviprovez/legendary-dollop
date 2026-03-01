"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { GitBranch } from "lucide-react";

export function TransformationCard({ transformation }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <GitBranch className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">{transformation.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Badge variant="outline" className="mr-2">
                  {transformation.type.toUpperCase()}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nodes:</span>
            <span className="font-medium">{transformation.nodes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connections:</span>
            <span className="font-medium">{transformation.edges.length}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
        <div className="flex justify-between w-full">
          <span>Created: {formatDistanceToNow(new Date(transformation.createdAt))} ago</span>
        </div>
      </CardFooter>
    </Card>
  );
}
