import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  ChartBarStacked, 
  BookOpen, 
  Building2, 
  ChevronRight, 
  FileUp, 
  FileDown, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems = [
    {
      title: "Dashboard",
      icon: <ChartBarStacked className="h-5 w-5" />,
      href: "/",
    },
    {
      title: "School Analysis",
      icon: <Building2 className="h-5 w-5" />,
      href: "/schools",
    },
    {
      title: "Subject Performance",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/subjects",
    },
    {
      title: "Import Data",
      icon: <FileUp className="h-5 w-5" />,
      href: "/import",
    },
    {
      title: "Export Reports",
      icon: <FileDown className="h-5 w-5" />,
      href: "/export",
    },
  ];
  
  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">Academic Analysis</h1>
        <p className="text-sm text-muted-foreground">Provincial Dashboard</p>
      </div>
      
      <div className="mt-4 flex-1 overflow-auto">
        <div className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Main
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-6 py-3 text-foreground hover:bg-muted transition-colors",
                  location === item.href && "nav-item active font-semibold"
                )}
                onClick={() => setOpen(false)}
              >
                <span className={cn(
                  "mr-3",
                  location === item.href ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.icon}
                </span>
                {item.title}
                {location === item.href && (
                  <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                )}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="border-t border-border p-4">
        <div className="flex items-center">
          <Avatar>
            <AvatarFallback className="bg-primary text-white">
              {user?.username ? getInitials(user.username) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">School Director</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
  
  // Mobile sidebar
  const MobileSidebar = () => (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
  
  return (
    <>
      <MobileSidebar />
      <div className={cn("w-64 bg-card shadow-md z-10 flex-shrink-0 h-screen sticky top-0 hidden md:block", className)}>
        <SidebarContent />
      </div>
    </>
  );
}
