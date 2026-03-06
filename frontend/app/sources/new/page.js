"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Database, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import axiosClient from "@/lib/axiosClient";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { toast } from "sonner";

export default function NewSourcePage() {
  const router = useRouter();
  const { data: workspaces } = useWorkspaces();
  const [workspaceId, setWorkspaceId] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [testMessage, setTestMessage] = useState("");
  const [previewSchema, setPreviewSchema] = useState(null);
  
  const [pg, setPg] = useState({
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: ""
  });

  const update = (field, value) => setPg(prev => ({ ...prev, [field]: value }));

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    setTestMessage("");
    setPreviewSchema(null);
    try {
      const payload = { type: "postgresql", connection_details: pg };
      const res = await axiosClient.post("/api/sources/test-direct", payload);
      setTestStatus("success");
      setTestMessage(res.data?.data?.message || "Connection successful");
      toast.success("Connection successful");
    } catch (e) {
      setTestStatus("failure");
      const msg = e.response?.data?.detail || e.message;
      setTestMessage(msg);
      toast.error("Connection failed", { description: msg });
    } finally {
      setIsTesting(false);
    }
  };

  const handleScan = async () => {
    setPreviewSchema(null);
    try {
      const payload = { type: "postgresql", connection_details: pg };
      const res = await axiosClient.post("/api/sources/discover-direct", payload);
      setPreviewSchema(res.data?.data || res.data);
      toast.success("Scan complete");
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      toast.error("Scan failed", { description: msg });
    }
  };

  const handleCreate = async () => {
    if (!workspaceId) {
      toast.error("Select a workspace");
      return;
    }
    try {
      const body = {
        name: `postgresql_${pg.database}`,
        type: "postgresql",
        connection_details: pg,
        is_private: true
      };
      const res = await axiosClient.post(`/api/sources`, body, { params: { workspace_id: workspaceId } });
      const newSource = res.data?.data || res.data;
      try {
        await axiosClient.post(`/api/sources/${newSource.id}/discover-schema`);
      } catch (_) {}
      router.push(`/sources/${newSource.id}`);
    } catch (e) {
      toast.error("Failed to create source", { description: e.response?.data?.detail || e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/sources">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add PostgreSQL Source</h1>
          <p className="text-muted-foreground">Connect to an existing PostgreSQL database and scan its schema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>Enter connection details</CardDescription>
        </CardHeader>
        <CardContent>
          {workspaces?.length > 0 && (
            <div className="mb-6">
              <Label>Workspace</Label>
              <select
                className="mt-2 w-full border rounded-md h-9 bg-background"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
              >
                <option value="">Select workspace</option>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Host</Label>
              <Input placeholder="db.example.com" value={pg.host} onChange={(e) => update("host", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input placeholder="5432" value={pg.port} onChange={(e) => update("port", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Database</Label>
              <Input placeholder="production" value={pg.database} onChange={(e) => update("database", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input placeholder="admin" value={pg.username} onChange={(e) => update("username", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={pg.password} onChange={(e) => update("password", e.target.value)} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test Connection"}
            </Button>
            <Button
              variant={testStatus === "success" ? "default" : "secondary"}
              onClick={handleScan}
              disabled={testStatus !== "success"}
              title={testStatus === "success" ? "Scan database schemas and tables" : "Test connection to enable scan"}
            >
              {testStatus === "success" ? "Scan Database" : "Scan Database (test first)"}
            </Button>
            {testStatus === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {testStatus === "failure" && <XCircle className="h-5 w-5 text-red-500" />}
          </div>
          {testMessage && (
            <div className="mt-2 text-xs text-muted-foreground break-all">{testMessage}</div>
          )}

          {previewSchema && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Discovered Objects</span>
                </div>
              </div>
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-72 overflow-auto">
                  {((previewSchema.tables || []).length + (previewSchema.views || []).length) === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      No tables/views found. Ensure your user has USAGE/SELECT on target schemas (e.g., public).
                    </div>
                  ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/30">
                      <tr>
                        <th className="text-left p-2">Schema</th>
                        <th className="text-left p-2">Table</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Columns</th>
                        <th className="text-left p-2">Rows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(previewSchema.tables || []).map((t) => (
                        <tr key={`${t.schema}.${t.name}`} className="border-t">
                          <td className="p-2 font-mono">{t.schema}</td>
                          <td className="p-2 font-mono">{t.name}</td>
                          <td className="p-2">{t.type}</td>
                          <td className="p-2">{t.columns?.length || 0}</td>
                          <td className="p-2">{t.rowCountDisplay || "unknown"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleCreate} disabled={testStatus !== "success"}>Create Source</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
