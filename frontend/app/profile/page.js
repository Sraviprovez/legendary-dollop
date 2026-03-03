'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { User, Mail, Shield, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <ProtectedRoute>
            <div className="h-full relative">
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                    <Sidebar />
                </div>
                <main className="md:pl-72 flex flex-col h-full">
                    <Header />
                    <div className="p-8 flex-1">
                        <h2 className="text-3xl font-bold tracking-tight mb-8">User Profile</h2>

                        <div className="max-w-2xl">
                            <Card>
                                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">{user?.first_name} {user?.last_name}</CardTitle>
                                        <Badge variant="outline" className="mt-1 capitalize">
                                            {user?.role?.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-center text-sm">
                                        <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                                        <span className="text-muted-foreground w-24">Email:</span>
                                        <span className="font-medium">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Shield className="h-4 w-4 mr-3 text-muted-foreground" />
                                        <span className="text-muted-foreground w-24">Role:</span>
                                        <span className="font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                                        <span className="text-muted-foreground w-24">Member Since:</span>
                                        <span className="font-medium">March 2025</span>
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
