'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save, Key, Bell, Globe } from "lucide-react";

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <div className="h-full relative">
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                    <Sidebar />
                </div>
                <main className="md:pl-72 flex flex-col h-full">
                    <Header />
                    <div className="p-8 flex-1 max-w-4xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                                <p className="text-muted-foreground">Manage your account and platform preferences.</p>
                            </div>
                            <Button>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Key className="h-5 w-5 mr-2 text-blue-500" />
                                        Security
                                    </CardTitle>
                                    <CardDescription>Update your password and security settings.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current">Current Password</Label>
                                        <Input id="current" type="password" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new">New Password</Label>
                                        <Input id="new" type="password" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Globe className="h-5 w-5 mr-2 text-green-500" />
                                        Workspace Settings
                                    </CardTitle>
                                    <CardDescription>Configure default region and data residency.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="region">Default Cloud Region</Label>
                                        <Input id="region" placeholder="us-east-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
