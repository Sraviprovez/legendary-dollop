"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, Moon, Sun, User, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, FolderKanban } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeWorkspace, setActiveWorkspace] = useState("default-workspace");

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-8">
        <div className="flex flex-1 items-center space-x-4">
          <div className="flex items-center gap-2 mr-4 border-r pr-4">
            <FolderKanban className="h-4 w-4 text-primary" />
            <Select value={activeWorkspace} onValueChange={setActiveWorkspace}>
              <SelectTrigger className="w-[180px] h-8 bg-transparent border-none focus:ring-0">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default-workspace">Default Workspace</SelectItem>
                <SelectItem value="eng-team">Engineering Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search sources, transformations..." className="pl-8 h-9" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="flex flex-col">
                <span>{user?.email || "Guest User"}</span>
                {user?.role && (
                  <Badge variant="secondary" className="mt-1 text-[10px] w-fit capitalize">
                    {user.role.replace('_', ' ')}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
