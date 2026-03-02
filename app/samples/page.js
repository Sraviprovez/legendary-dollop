"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Database, GitBranch, Eye } from "lucide-react";

const sourceSamples = [
  {
    id: 1,
    name: "sales.csv",
    type: "CSV",
    rows: 1250,
    columns: ["transaction_id", "customer_id", "amount", "date", "product_id"],
    sampleData: [
      ["TXN001", "CUST123", "$150.00", "2026-03-01", "PROD001"],
      ["TXN002", "CUST456", "$275.50", "2026-03-01", "PROD002"],
      ["TXN003", "CUST123", "$89.99", "2026-03-02", "PROD003"],
      ["TXN004", "CUST789", "$420.00", "2026-03-02", "PROD001"],
      ["TXN005", "CUST456", "$125.30", "2026-03-03", "PROD004"],
    ]
  },
  {
    id: 2,
    name: "customers (MySQL)",
    type: "MySQL",
    rows: 850,
    columns: ["customer_id", "name", "email", "segment", "join_date"],
    sampleData: [
      ["CUST123", "Acme Corp", "billing@acme.com", "Enterprise", "2025-01-15"],
      ["CUST456", "Beta Ltd", "contact@beta.com", "SMB", "2025-02-20"],
      ["CUST789", "Gamma Inc", "info@gamma.com", "Enterprise", "2025-03-10"],
    ]
  },
  {
    id: 3,
    name: "products (PostgreSQL)",
    type: "PostgreSQL",
    rows: 450,
    columns: ["product_id", "name", "category", "price", "stock"],
    sampleData: [
      ["PROD001", "Laptop Pro", "Electronics", "$1299.99", 45],
      ["PROD002", "Office Chair", "Furniture", "$349.50", 120],
      ["PROD003", "Coffee Maker", "Appliances", "$89.99", 75],
      ["PROD004", "Monitor 4K", "Electronics", "$499.99", 30],
    ]
  }
];

const transformationSamples = [
  {
    id: 1,
    name: "Sales Analytics",
    type: "PySpark",
    input: "sales.csv + customers",
    output: "Snowflake",
    sampleOutput: [
      ["country", "total_sales", "customer_count"],
      ["USA", "$1,245,000", 245],
      ["UK", "$876,500", 187],
      ["Canada", "$543,200", 98],
    ]
  },
  {
    id: 2,
    name: "Customer 360",
    type: "dbt",
    input: "orders + customers + products",
    output: "Aurora",
    sampleOutput: [
      ["customer_id", "name", "total_spent", "order_count"],
      ["CUST123", "Acme Corp", "$15,780", 23],
      ["CUST456", "Beta Ltd", "$8,450", 15],
      ["CUST789", "Gamma Inc", "$12,340", 19],
    ]
  }
];

export default function SamplesPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Data Samples"
        description="Preview sample data from your sources and transformations"
      />

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sources">
            <Database className="h-4 w-4 mr-2" />
            Source Samples
          </TabsTrigger>
          <TabsTrigger value="transformations">
            <GitBranch className="h-4 w-4 mr-2" />
            Transformation Outputs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4 mt-6">
          {sourceSamples.map((source) => (
            <Card key={source.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {source.name}
                      <Badge variant="outline">{source.type}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {source.rows} rows • {source.columns.length} columns
                    </CardDescription>
                  </div>
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-2 text-sm font-medium">Columns: {source.columns.join(", ")}</div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {source.columns.map((col, i) => (
                          <TableHead key={i}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {source.sampleData.map((row, idx) => (
                        <TableRow key={idx}>
                          {row.map((cell, cellIdx) => (
                            <TableCell key={cellIdx}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Showing first {source.sampleData.length} of {source.rows} rows
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transformations" className="space-y-4 mt-6">
          {transformationSamples.map((trans) => (
            <Card key={trans.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {trans.name}
                      <Badge variant="outline">{trans.type}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Input: {trans.input} → Output: {trans.output}
                    </CardDescription>
                  </div>
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {trans.sampleOutput[0].map((col, i) => (
                          <TableHead key={i}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trans.sampleOutput.slice(1).map((row, idx) => (
                        <TableRow key={idx}>
                          {row.map((cell, cellIdx) => (
                            <TableCell key={cellIdx}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
