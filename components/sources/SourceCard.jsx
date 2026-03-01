"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, FileText, HardDrive, MoreVertical, Play, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SampleDataPreview } from "./SampleDataPreview";
import { useState } from "react";

const typeIcons = {
  csv: FileText,
  mysql: Database,
  postgresql: Database,
  s3: HardDrive,
};

const typeColors = {
  csv: "text-orange-500",
  mysql: "text-blue-500",
  postgresql: "text-indigo-500",
  s3: "text-yellow-500",
};

export function SourceCard({ source }) {
  const Icon = typeIcons[source.type];
  const colorClass = typeColors[source.type];
  const [showSample, setShowSample] = useState(false);

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-secondary ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{source.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Badge variant="outline" className="mr-2">
                    {source.type.toUpperCase()}
                  </Badge>
                  <Badge variant={source.status === "active" ? "default" : "secondary"}>
                    {source.status}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSample(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Sample
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Play className="mr-2 h-4 w-4" />
                  Ingest Now
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {source.type === "csv" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rows:</span>
                  <span className="font-medium">{source.metadata.rows}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Columns:</span>
                  <span className="font-medium">{source.metadata.columns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">{source.metadata.size}</span>
                </div>
              </>
            )}
            {source.type === "mysql" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Host:</span>
                  <span className="font-medium">{source.metadata.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database:</span>
                  <span className="font-medium">{source.metadata.database}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tables:</span>
                  <span className="font-medium">{source.metadata.tables.join(", ")}</span>
                </div>
              </>
            )}
            {source.type === "postgresql" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Host:</span>
                  <span className="font-medium">{source.metadata.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database:</span>
                  <span className="font-medium">{source.metadata.database}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tables:</span>
                  <span className="font-medium">{source.metadata.tables.join(", ")}</span>
                </div>
              </>
            )}
            {source.type === "s3" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bucket:</span>
                  <span className="font-medium">{source.metadata.bucket}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region:</span>
                  <span className="font-medium">{source.metadata.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files:</span>
                  <span className="font-medium">{source.metadata.files}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
          <div className="flex justify-between w-full">
            <span>Last ingested: {source.lastIngested ? formatDistanceToNow(new Date(source.lastIngested)) + ' ago' : 'Never'}</span>
            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setShowSample(true)}>
              View Sample
            </Button>
          </div>
        </CardFooter>
      </Card>

      <SampleDataPreview
        open={showSample}
        onOpenChange={setShowSample}
        source={source}
      />
    </>
  );
}
