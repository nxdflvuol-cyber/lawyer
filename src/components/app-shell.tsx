"use client";

import { useMemo } from "react";
import { useNavStore, useAuthStore, useNotificationStore, useSettingsStore } from "@/lib/stores";
import { SECTIONS, SECTION_GROUPS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  X,
  Scale,
  Settings as SettingsIcon,
  LogOut,
  User,
  ChevronLeft,
  Building2,
  Gavel,
  Users,
  Eye,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { WorkModeSelector } from "@/components/work-mode-selector";
import { GlobalSearch } from "@/components/global-search";

export function AppShell() {
  const activeSection = useNavStore((s) => s.activeSection);
  const setSection = useNavStore((s) => s.setSection);
  const sidebarCollapsed = useNavStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useNavStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const lawFirmName = useSettingsStore((s) => s.lawFirmName);
  const privacyMode = useSettingsStore((s) => s.privacyMode);
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { toast } = useToast();
  // router removed - not used

  const activeDef = useMemo(
    () => SECTIONS.find((s) => s.id === activeSection),
    [activeSection]
  );

  const groupedSections = useMemo(() => {
    const groups: Record<string, typeof SECTIONS> = {};
    SECTIONS.forEach((s) => {
      if (!groups[s.group]) groups[s.group] = [];
      groups[s.group].push(s);
    });
    return groups;
  }, []);

  function handleSectionClick(sectionId: typeof activeSection) {
    if (sectionId === "logout") {
      logout();
      toast({ title: "تم تسجيل الخروج", description: "إلى اللقاء!" });
      return;
    }
    setSection(sectionId);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* الشعار */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Scale className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-sidebar-foreground truncate">
              المحامي الشامل
            </h1>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {lawFirmName}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-auto text-sidebar-foreground/70 hover:text-sidebar-foreground hidden lg:flex"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
      </div>

      {/* القوائم */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-4">
          {Object.entries(groupedSections).map(([groupKey, sections]) => (
            <div key={groupKey}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {SECTION_GROUPS[groupKey]}
                </p>
              )}
              <div className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <TooltipProvider key={section.id} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSectionClick(section.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                              sidebarCollapsed && "justify-center",
                              isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {!sidebarCollapsed && (
                              <span className="truncate">{section.label}</span>
                            )}
                          </button>
                        </TooltipTrigger>
                        {sidebarCollapsed && (
                          <TooltipContent side="left" className="font-arabic">
                            {section.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* حالة المستخدم */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
            <span>متصل محلياً • {user?.name}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* الشريط العلوي */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-30">
        {/* زر القائمة للجوال */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>

        {/* زر طي الشريط للكمبيوتر */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden lg:flex"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* عنوان القسم */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {activeDef && <activeDef.icon className="w-5 h-5 text-primary" />}
            <h2 className="font-bold text-foreground truncate">
              {activeDef?.label ?? "الرئيسية"}
            </h2>
          </div>
        </div>

        {/* وضع العمل */}
        <WorkModeSelector />

        {/* البحث */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          title="بحث شامل"
        >
          <Search className="w-5 h-5" />
        </Button>

        {/* الوضع الخاص */}
        {privacyMode && (
          <div className="hidden md:flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Eye className="w-3 h-3" />
            وضع الخصوصية
          </div>
        )}

        {/* السمة */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="تبديل السمة"
        >
          <Sun className="w-5 h-5 dark:hidden" />
          <Moon className="w-5 h-5 hidden dark:block" />
        </Button>

        {/* التنبيهات */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">التنبيهات</DropdownMenuLabel>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto text-xs"
                onClick={markAllRead}
              >
                تعليم الكل كمقروء
              </Button>
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                لا توجد تنبيهات
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                {notifications.slice(0, 20).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex flex-col items-start gap-1 p-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      <span className="font-medium text-sm flex-1">{n.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* المستخدم */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSection("settings")}>
              <SettingsIcon className="w-4 h-4 ml-2" />
              الإعدادات
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSection("security")}>
              <Shield className="w-4 h-4 ml-2" />
              الأمان والخصوصية
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                logout();
                toast({ title: "تم تسجيل الخروج" });
              }}
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* المحتوى الرئيسي */}
      <div className="flex flex-1 overflow-hidden">
        {/* الشريط الجانبي للكمبيوتر */}
        <aside
          className={cn(
            "hidden lg:block border-l border-sidebar-border transition-all duration-200",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          {sidebarContent}
        </aside>

        {/* منطقة المحتوى */}
        <main className="flex-1 overflow-auto bg-background legal-pattern">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            {renderSection(activeSection)}
          </div>
          <Footer />
        </main>
      </div>

      {/* البحث الشامل */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-card/50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-primary" />
          <span>المحامي الشامل © {new Date().getFullYear()} - جميع البيانات مخزنة محلياً</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            تشفير AES-256
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            يعمل دون إنترنت
          </span>
        </div>
      </div>
    </footer>
  );
}

function renderSection(section: string) {
  switch (section) {
    case "dashboard":
      return <DashboardSectionLazy />;
    case "cases":
      return <CasesSectionLazy />;
    case "clients":
      return <ClientsSectionLazy />;
    case "documents":
      return <DocumentsSectionLazy />;
    case "tasks":
      return <TasksSectionLazy />;
    case "appointments":
      return <AppointmentsSectionLazy />;
    case "finance":
      return <FinanceSectionLazy />;
    case "reports":
      return <ReportsSectionLazy />;
    case "memo-editor":
      return <MemoEditorSectionLazy />;
    case "calculators":
      return <CalculatorsSectionLazy />;
    case "pleading":
      return <PleadingSectionLazy />;
    case "maps":
      return <MapsSectionLazy />;
    case "ai-thinker":
      return <AiThinkerSectionLazy />;
    case "text-analyzer":
      return <TextAnalyzerSectionLazy />;
    case "performance":
      return <PerformanceSectionLazy />;
    case "development":
      return <DevelopmentSectionLazy />;
    case "settings":
      return <SettingsSectionLazy />;
    case "backup":
      return <BackupSectionLazy />;
    case "security":
      return <SecuritySectionLazy />;
    case "updates":
      return <UpdatesSectionLazy />;
    case "team":
      return <TeamSectionLazy />;
    case "research":
      return <ResearchSectionLazy />;
    default:
      return <DashboardSectionLazy />;
  }
}

// Lazy imports للأقسام - مع ssr: false لتقليل استهلاك الذاكرة على الخادم
import dynamic from "next/dynamic";
const DashboardSectionLazy = dynamic(() => import("@/components/sections/dashboard-section").then(m => ({ default: m.DashboardSection })), { loading: () => <SectionSkeleton />, ssr: false });
const CasesSectionLazy = dynamic(() => import("@/components/sections/cases-section").then(m => ({ default: m.CasesSection })), { loading: () => <SectionSkeleton />, ssr: false });
const ClientsSectionLazy = dynamic(() => import("@/components/sections/clients-section").then(m => ({ default: m.ClientsSection })), { loading: () => <SectionSkeleton />, ssr: false });
const DocumentsSectionLazy = dynamic(() => import("@/components/sections/documents-section").then(m => ({ default: m.DocumentsSection })), { loading: () => <SectionSkeleton />, ssr: false });
const TasksSectionLazy = dynamic(() => import("@/components/sections/tasks-section").then(m => ({ default: m.TasksSection })), { loading: () => <SectionSkeleton />, ssr: false });
const AppointmentsSectionLazy = dynamic(() => import("@/components/sections/appointments-section").then(m => ({ default: m.AppointmentsSection })), { loading: () => <SectionSkeleton />, ssr: false });
const FinanceSectionLazy = dynamic(() => import("@/components/sections/finance-section").then(m => ({ default: m.FinanceSection })), { loading: () => <SectionSkeleton />, ssr: false });
const ReportsSectionLazy = dynamic(() => import("@/components/sections/reports-section").then(m => ({ default: m.ReportsSection })), { loading: () => <SectionSkeleton />, ssr: false });
const MemoEditorSectionLazy = dynamic(() => import("@/components/sections/memo-editor-section").then(m => ({ default: m.MemoEditorSection })), { loading: () => <SectionSkeleton />, ssr: false });
const CalculatorsSectionLazy = dynamic(() => import("@/components/sections/calculators-section").then(m => ({ default: m.CalculatorsSection })), { loading: () => <SectionSkeleton />, ssr: false });
const PleadingSectionLazy = dynamic(() => import("@/components/sections/pleading-section").then(m => ({ default: m.PleadingSection })), { loading: () => <SectionSkeleton />, ssr: false });
const MapsSectionLazy = dynamic(() => import("@/components/sections/maps-section").then(m => ({ default: m.MapsSection })), { loading: () => <SectionSkeleton />, ssr: false });
const AiThinkerSectionLazy = dynamic(() => import("@/components/sections/ai-thinker-section").then(m => ({ default: m.AiThinkerSection })), { loading: () => <SectionSkeleton />, ssr: false });
const TextAnalyzerSectionLazy = dynamic(() => import("@/components/sections/text-analyzer-section").then(m => ({ default: m.TextAnalyzerSection })), { loading: () => <SectionSkeleton />, ssr: false });
const PerformanceSectionLazy = dynamic(() => import("@/components/sections/performance-section").then(m => ({ default: m.PerformanceSection })), { loading: () => <SectionSkeleton />, ssr: false });
const DevelopmentSectionLazy = dynamic(() => import("@/components/sections/development-section").then(m => ({ default: m.DevelopmentSection })), { loading: () => <SectionSkeleton />, ssr: false });
const SettingsSectionLazy = dynamic(() => import("@/components/sections/settings-section").then(m => ({ default: m.SettingsSection })), { loading: () => <SectionSkeleton />, ssr: false });
const BackupSectionLazy = dynamic(() => import("@/components/sections/backup-section").then(m => ({ default: m.BackupSection })), { loading: () => <SectionSkeleton />, ssr: false });
const SecuritySectionLazy = dynamic(() => import("@/components/sections/security-section").then(m => ({ default: m.SecuritySection })), { loading: () => <SectionSkeleton />, ssr: false });
const UpdatesSectionLazy = dynamic(() => import("@/components/sections/updates-section").then(m => ({ default: m.UpdatesSection })), { loading: () => <SectionSkeleton />, ssr: false });
const TeamSectionLazy = dynamic(() => import("@/components/sections/team-section").then(m => ({ default: m.TeamSection })), { loading: () => <SectionSkeleton />, ssr: false });
const ResearchSectionLazy = dynamic(() => import("@/components/sections/research-section").then(m => ({ default: m.ResearchSection })), { loading: () => <SectionSkeleton />, ssr: false });

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}
