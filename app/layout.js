import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
