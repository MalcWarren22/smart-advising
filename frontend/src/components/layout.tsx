import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  GraduationCap, 
  CalendarDays, 
  Lightbulb, 
  Users, 
  LogOut,
  Menu,
  BookOpen
} from "lucide-react";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });
  
  const queryClient = useQueryClient();
  const logout = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/");
      }
    }
  });

  useEffect(() => {
    if (!isLoading && !user && location !== "/") {
      setLocation("/");
    }
  }, [isLoading, user, location, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <>{children}</>;
  }

  const role = user.role;

  const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/progress", label: "Degree Progress", icon: GraduationCap },
    { href: "/student/plan", label: "Course Plan", icon: CalendarDays },
    { href: "/student/recommendations", label: "Recommendations", icon: Lightbulb },
  ];

  const advisorLinks = [
    { href: "/advisor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/advisor/students", label: "My Students", icon: Users },
  ];

  const links = role === "student" ? studentLinks : advisorLinks;

  const Sidebar = () => (
    <div className="flex h-full w-full flex-col bg-[#006747] text-white">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#006747]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight">Smart Advisor</span>
            <span className="text-xs text-[#f6c042] font-medium uppercase tracking-wider">Norfolk State</span>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col gap-2 py-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href || location.startsWith(`${link.href}/`);
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-white/10 text-white shadow-sm" 
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="p-4 mt-auto border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-white/20">
            <AvatarFallback className="bg-[#004f36] text-white">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{user.name}</span>
            <span className="text-xs text-white/70 capitalize">{user.role}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-white/70 hover:bg-white/5 hover:text-white"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r md:block">
        <Sidebar />
      </div>
      
      <div className="flex flex-col">
        {/* Mobile Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#006747]" />
            <span className="font-bold text-[#006747]">NSU Smart Advisor</span>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 bg-gray-50/40 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
