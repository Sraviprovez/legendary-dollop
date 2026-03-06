import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({ children }) {
  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-background">
        <Sidebar />
      </div>
      <main className="md:pl-72">
        <Header />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
