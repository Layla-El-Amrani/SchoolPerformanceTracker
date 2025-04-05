import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { 
  ChartBarStacked, 
  BookOpen, 
  Building2, 
  ChevronRight, 
  FileUp, 
  FileDown, 
  LogOut,
  Menu,
  Settings,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState("w-64");
  
  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setCollapsed(savedState === "true");
      setSidebarWidth(savedState === "true" ? "w-20" : "w-64");
    }
  }, []);
  
  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    setSidebarWidth(!collapsed ? "w-20" : "w-64");
  };
  
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
      title: t('navigation.dashboard'),
      icon: <ChartBarStacked className="h-5 w-5" />,
      href: "/",
    },
    {
      title: t('navigation.schools'),
      icon: <Building2 className="h-5 w-5" />,
      href: "/schools",
    },
    {
      title: t('navigation.subjects'),
      icon: <BookOpen className="h-5 w-5" />,
      href: "/subjects",
    },
    {
      title: t('navigation.import'),
      icon: <FileUp className="h-5 w-5" />,
      href: "/import",
    },
    {
      title: t('navigation.export'),
      icon: <FileDown className="h-5 w-5" />,
      href: "/export",
    },
    {
      title: t('navigation.settings'),
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
    },
  ];
  
  const SidebarContent = () => (
    <div className="h-full flex flex-col relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        onClick={toggleSidebar}
      >
        {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
      </Button>
      
      <div className="p-4 border-b border-border flex items-center">
        {!collapsed ? (
          <>
            <h1 className="text-xl font-bold text-primary">{t('app.title')}</h1>
            <p className="text-sm text-muted-foreground hidden lg:block">{t('app.subtitle')}</p>
          </>
        ) : (
          <div className="flex justify-center w-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                AP
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex-1 overflow-auto">
        {!collapsed && (
          <div className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('navigation.main')}
          </div>
        )}
        <nav className="space-y-1">
          <TooltipProvider>
            {navItems.map((item) => (
              <Tooltip key={item.href} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center px-6 py-3 text-foreground hover:bg-muted transition-colors cursor-pointer",
                        location === item.href && "nav-item active font-semibold",
                        collapsed && "justify-center px-3"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <span className={cn(
                        collapsed ? "" : "mr-3",
                        location === item.href ? "text-primary" : "text-muted-foreground"
                      )}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <>
                          {item.title}
                          {location === item.href && (
                            <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </>
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {item.title}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </div>
      
      <div className="border-t border-border p-4">
        <div className={cn("flex items-center", collapsed && "justify-center")}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.username ? getInitials(user.username) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              {collapsed && user?.username && (
                <TooltipContent side="right">
                  {user.username} - {t('user.role')}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
          {!collapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{t('user.role')}</p>
            </div>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("text-muted-foreground hover:text-foreground", !collapsed && "ml-auto")}
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t('auth.logout')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
      <div className={cn(`${sidebarWidth} bg-card shadow-md z-10 flex-shrink-0 h-screen sticky top-0 hidden md:block transition-all duration-200`, className)}>
        <SidebarContent />
      </div>
    </>
  );
}
