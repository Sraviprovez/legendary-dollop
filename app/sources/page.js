"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, GitBranch, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSourceStore } from "@/lib/store/sourceStore";

export default function SourcesDashboardPage() {
  const { sources } = useSourceStore();

  const stats = {
    total: sources.length,
    active: sources.filter(s => s.status === 'active').length,
    csv: sources.filter(s => s.type === 'csv').length,
    databases: sources.filter(s => ['mysql', 'postgresql'].includes(s.type)).length,
    s3: sources.filter(s => s.type === 's3').length
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to SynKrasis.ai</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CSV Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.csv}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Databases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.databases + stats.s3}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/sources/list">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Database className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">View Sources</p>
                  <p className="text-sm text-muted-foreground">Manage your data sources</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/transformations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GitBranch className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">Transformations</p>
                  <p className="text-sm text-muted-foreground">Build data pipelines</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/lineage">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-medium">Data Lineage</p>
                  <p className="text-sm text-muted-foreground">Track data flow</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sources</CardTitle>
          <CardDescription>Recently added data sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sources.slice(0, 3).map(source => (
              <div key={source.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{source.name}</p>
                  <p className="text-sm text-muted-foreground">Type: {source.type}</p>
                </div>
                <Link href={`/sources/list`}>
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
