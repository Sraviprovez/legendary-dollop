"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(email, password);
    } catch (err) {
      // If unauthorized, login hook already shows toast
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInitialSetup = async () => {
    setIsSettingUp(true);
    try {
      const res = await authApi.registerAdmin();
      toast.success(res.data.message || "Admin setup complete!");
    } catch (err) {
      toast.error("Setup failed", {
        description: err.response?.data?.detail || "System already has users"
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <Card className="w-[400px] relative backdrop-blur-xl bg-background/95">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">SynKrasis.ai</CardTitle>
          <CardDescription className="text-base">Agentic Data Platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-background"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full group">
            {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Sign In"}
            {!isLoggingIn && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
          </Button>
          <Button
            variant="outline"
            onClick={handleInitialSetup}
            disabled={isSettingUp}
            className="w-full text-xs"
          >
            {isSettingUp ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : "First Run? Setup Admin Account"}
          </Button>
        </CardFooter>
        <div className="text-center pb-6">
          <p className="text-xs text-muted-foreground">
            Check your .env for ADMIN_EMAIL / ADMIN_PASSWORD
          </p>
        </div>
      </Card>
    </div>
  );
}
