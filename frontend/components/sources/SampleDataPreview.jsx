"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function SampleDataPreview({ open, onOpenChange, source }) {
  const renderSampleData = () => {
    if (source.type === "csv") {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{source.metadata.columns} columns</Badge>
            <Badge variant="outline">{source.metadata.rows} rows</Badge>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {source.metadata.sampling.columns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {source.metadata.sampling.sampleRows.map((row, idx) => (
                  <TableRow key={idx}>
                    {row.map((cell, cellIdx) => (
                      <TableCell key={cellIdx}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    if (source.type === "mysql" || source.type === "postgresql") {
      return (
        <div className="space-y-6">
          {Object.entries(source.metadata.sampling.tables).map(([tableName, tableData]) => (
            <div key={tableName} className="space-y-2">
              <h4 className="font-medium">{tableName}</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableData.columns.map((col) => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.sampleRows.map((row, idx) => (
                      <TableRow key={idx}>
                        {row.map((cell, cellIdx) => (
                          <TableCell key={cellIdx}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (source.type === "s3") {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{source.metadata.files} files</Badge>
            <Badge variant="outline">{source.metadata.size}</Badge>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Recent Files</h4>
            <ul className="space-y-1">
              {source.metadata?.sampling?.recentFiles?.map((file, idx) => (
                <li key={idx} className="text-sm font-mono bg-secondary p-2 rounded">
                  {file}
                </li>
              )) || <li className="text-sm text-muted-foreground">No files available</li>}
            </ul>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sample Data - {source.name}</DialogTitle>
          <DialogDescription>
            Preview of actual data from your source
          </DialogDescription>
        </DialogHeader>
        {renderSampleData()}
      </DialogContent>
    </Dialog>
  );
}
