"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");

  const handleLogin = () => {
    router.push("/sources");
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
          <div className="text-sm text-muted-foreground text-center">
            Demo credentials: admin / admin
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleLogin} className="w-full group">
            Sign In
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardFooter>
        <div className="text-center pb-6">
          <a href="/signup" className="text-sm text-primary hover:underline">
            Don't have an account? Sign up
          </a>
        </div>
      </Card>
    </div>
  );
}
