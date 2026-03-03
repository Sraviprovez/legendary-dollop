import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SynKrasis.ai - Agentic Data Platform",
  description: "Build data pipelines with AI assistance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="synkrasis-theme"
        >
          <AuthProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                expand={true}
                visibleToasts={3}
              />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
