"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster(props) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-green-500/10 group-[.toaster]:border-green-500/20",
          error: "group-[.toaster]:bg-red-500/10 group-[.toaster]:border-red-500/20",
          info: "group-[.toaster]:bg-blue-500/10 group-[.toaster]:border-blue-500/20",
        },
      }}
      {...props}
    />
  );
}
