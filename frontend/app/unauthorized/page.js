'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
                You do not have the required permissions to view this page. Please contact your administrator if you believe this is an error.
            </p>
            <Button asChild>
                <Link href="/sources">Return to Dashboard</Link>
            </Button>
        </div>
    );
}
