"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Plus, CheckCircle, AlertCircle, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

const mockRules = [
  {
    id: 1,
    name: "Customer ID Not Null",
    type: "not_null",
    table: "customers",
    column: "customer_id",
    severity: "error",
    enabled: true,
    lastRun: "2026-03-02T10:30:00Z",
    status: "passed"
  },
  {
    id: 2,
    name: "Sales Amount Positive",
    type: "positive",
    table: "sales",
    column: "amount",
    severity: "error",
    enabled: true,
    lastRun: "2026-03-02T10:30:00Z",
    status: "passed"
  },
  {
    id: 3,
    name: "Email Format Valid",
    type: "regex",
    table: "customers",
    column: "email",
    pattern: "^[^@]+@[^@]+\\.[^@]+$",
    severity: "warning",
    enabled: true,
    lastRun: "2026-03-02T10:30:00Z",
    status: "warning",
    failureCount: 23
  },
  {
    id: 4,
    name: "Order Date in Range",
    type: "range",
    table: "orders",
    column: "order_date",
    min: "2025-01-01",
    max: "2026-12-31",
    severity: "error",
    enabled: false,
    lastRun: "2026-03-01T10:30:00Z",
    status: "failed",
    failureCount: 5
  },
  {
    id: 5,
    name: "Product Price > 0",
    type: "positive",
    table: "products",
    column: "price",
    severity: "error",
    enabled: true,
    lastRun: "2026-03-02T10:30:00Z",
    status: "passed"
  }
];

export default function QualityPage() {
  const [rules, setRules] = useState(mockRules);
  const [showNewRule, setShowNewRule] = useState(false);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'warning': return <Badge variant="secondary">Warning</Badge>;
      default: return <Badge variant="outline">Info</Badge>;
    }
  };

  const toggleRule = (ruleId) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
    toast.success('Rule updated');
  };

  const runAllRules = () => {
    toast.info('Running data quality checks...');
    setTimeout(() => {
      toast.success('Quality checks completed! 42 passed, 3 warnings, 2 failed');
    }, 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Data Quality"
        description="Define and monitor data quality rules for your pipelines"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={runAllRules}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Run All Checks
            </Button>
            <Button onClick={() => setShowNewRule(!showNewRule)}>
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </div>
        }
      />

      {showNewRule && (
        <Card className="mb-6 border-2 border-primary">
          <CardHeader>
            <CardTitle>Create New Quality Rule</CardTitle>
            <CardDescription>Define a data quality check for your pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input placeholder="e.g., Customer Email Format" />
              </div>
              <div className="space-y-2">
                <Label>Rule Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_null">Not Null</SelectItem>
                    <SelectItem value="unique">Unique</SelectItem>
                    <SelectItem value="positive">Positive Values</SelectItem>
                    <SelectItem value="range">Range Check</SelectItem>
                    <SelectItem value="regex">Regex Pattern</SelectItem>
                    <SelectItem value="in_set">Value in Set</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Table</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers">customers</SelectItem>
                    <SelectItem value="sales">sales</SelectItem>
                    <SelectItem value="products">products</SelectItem>
                    <SelectItem value="orders">orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Column</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">id</SelectItem>
                    <SelectItem value="email">email</SelectItem>
                    <SelectItem value="amount">amount</SelectItem>
                    <SelectItem value="date">date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error (blocks pipeline)</SelectItem>
                    <SelectItem value="warning">Warning (alert only)</SelectItem>
                    <SelectItem value="info">Info (logging only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Threshold (%)</Label>
                <Input type="number" placeholder="95" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewRule(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowNewRule(false);
                toast.success('Quality rule created');
              }}>
                <Save className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="rules">📋 Active Rules</TabsTrigger>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="history">📈 History</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(rule.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          {getSeverityBadge(rule.severity)}
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rule.table}.{rule.column} • Type: {rule.type}
                          {rule.failureCount && ` • ${rule.failureCount} failures`}
                        </p>
                        {rule.pattern && (
                          <p className="text-xs font-mono bg-muted p-1 rounded mt-1">
                            Pattern: {rule.pattern}
                          </p>
                        )}
                        {rule.min && rule.max && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Range: {rule.min} - {rule.max}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm">Last run</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rule.lastRun).toLocaleString()}
                        </p>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-green-50">
              <p className="text-sm text-muted-foreground">Passed</p>
              <p className="text-3xl font-bold text-green-600">42</p>
            </Card>
            <Card className="p-4 bg-yellow-50">
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-3xl font-bold text-yellow-600">3</p>
            </Card>
            <Card className="p-4 bg-red-50">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-3xl font-bold text-red-600">2</p>
            </Card>
            <Card className="p-4 bg-blue-50">
              <p className="text-sm text-muted-foreground">Overall</p>
              <p className="text-3xl font-bold text-blue-600">89%</p>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="font-medium mb-4">Quality by Table</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>customers</span>
                  <span>95%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>sales</span>
                  <span>88%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '88%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>products</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '100%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>orders</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{width: '78%'}}></div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="p-4">
            <h3 className="font-medium mb-4">Recent Quality Runs</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                <div>
                  <p className="font-medium">Mar 2, 2026 10:30 AM</p>
                  <p className="text-sm text-muted-foreground">42 passed • 3 warnings • 2 failed</p>
                </div>
                <Badge>Completed</Badge>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                <div>
                  <p className="font-medium">Mar 1, 2026 10:30 AM</p>
                  <p className="text-sm text-muted-foreground">44 passed • 1 warning • 2 failed</p>
                </div>
                <Badge>Completed</Badge>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                <div>
                  <p className="font-medium">Feb 28, 2026 10:30 AM</p>
                  <p className="text-sm text-muted-foreground">41 passed • 4 warnings • 2 failed</p>
                </div>
                <Badge>Completed</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
