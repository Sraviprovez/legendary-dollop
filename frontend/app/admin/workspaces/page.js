'use client';

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users, FolderKanban, Globe } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AdminWorkspacesPage() {
    const [workspaces, setWorkspaces] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWorkspaces = async () => {
        try {
            const res = await api.get('/api/admin/workspaces');
            setWorkspaces(res.data.data);
        } catch (err) {
            toast.error("Failed to fetch workspaces");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    return (
        <ProtectedRoute roles={["admin"]}>
            <div className="h-full relative">
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                    <Sidebar />
                </div>
                <main className="md:pl-72 flex flex-col h-full">
                    <Header />
                    <div className="p-8 flex-1">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">Workspaces</h2>
                                <p className="text-muted-foreground">Isolate pipelines and sources into collaborative environments.</p>
                            </div>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Workspace
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {workspaces.map((ws) => (
                                <Card key={ws.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                                                <FolderKanban className="h-5 w-5 text-primary" />
                                            </div>
                                            <Globe className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <CardTitle>{ws.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {ws.description || "No description provided."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                                            <div className="flex items-center">
                                                <Users className="h-4 w-4 mr-1 text-sky-500" />
                                                8 members
                                            </div>
                                            <div className="flex items-center">
                                                <Plus className="h-4 w-4 mr-1 text-green-500" />
                                                12 assets
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
