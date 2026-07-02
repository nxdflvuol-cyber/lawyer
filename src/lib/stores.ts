"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================
// متجر المصادقة
// ============================================================

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loginAt: number | null;
  idleTimeout: number; // minutes
  login: (user: AuthUser) => void;
  logout: () => void;
  setIdleTimeout: (minutes: number) => void;
  resetIdle: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      loginAt: null,
      idleTimeout: 30,
      login: (user) => set({ isAuthenticated: true, user, loginAt: Date.now() }),
      logout: () => set({ isAuthenticated: false, user: null, loginAt: null }),
      setIdleTimeout: (idleTimeout) => set({ idleTimeout }),
      resetIdle: () => set({ loginAt: Date.now() }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    { name: "shamel-auth" }
  )
);

// ============================================================
// متجر التنقل بين الأقسام
// ============================================================

export type SectionId =
  | "dashboard"
  | "cases"
  | "precases"
  | "clients"
  | "documents"
  | "legal-brain"
  | "tasks"
  | "appointments"
  | "finance"
  | "reports"
  | "memo-editor"
  | "calculators"
  | "pleading"
  | "maps"
  | "ai-thinker"
  | "text-analyzer"
  | "performance"
  | "development"
  | "settings"
  | "backup"
  | "security"
  | "updates"
  | "team"
  | "research"
  | "logout";

interface NavState {
  activeSection: SectionId;
  selectedCaseId: string | null;
  selectedClientId: string | null;
  sidebarCollapsed: boolean;
  workMode: "office" | "court" | "client-meeting" | "pleading" | "investigation";
  setSection: (section: SectionId) => void;
  selectCase: (id: string | null) => void;
  selectClient: (id: string | null) => void;
  toggleSidebar: () => void;
  setWorkMode: (mode: NavState["workMode"]) => void;
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      activeSection: "dashboard",
      selectedCaseId: null,
      selectedClientId: null,
      sidebarCollapsed: false,
      workMode: "office",
      setSection: (activeSection) => set({ activeSection }),
      selectCase: (selectedCaseId) => set({ selectedCaseId }),
      selectClient: (selectedClientId) => set({ selectedClientId }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setWorkMode: (workMode) => set({ workMode }),
    }),
    { name: "shamel-nav" }
  )
);

// ============================================================
// متجر الإعدادات
// ============================================================

interface AppSettings {
  theme: "light" | "dark";
  language: "ar" | "en";
  dateFormat: "gregorian" | "hijri";
  currency: string;
  lawFirmName: string;
  lawyerName: string;
  barNumber: string;
  privacyMode: boolean;
  camouflageMode: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  setSetting: <K extends keyof Omit<AppSettings, "setSetting">>(
    key: K,
    value: AppSettings[K]
  ) => void;
}

export const useSettingsStore = create<AppSettings>()(
  persist(
    (set) => ({
      theme: "light",
      language: "ar",
      dateFormat: "gregorian",
      currency: "ج.م",
      lawFirmName: "مكتب المحاماة",
      lawyerName: "",
      barNumber: "",
      privacyMode: false,
      camouflageMode: false,
      notificationsEnabled: true,
      soundEnabled: true,
      setSetting: (key, value) => set({ [key]: value } as Partial<AppSettings>),
    }),
    { name: "shamel-settings" }
  )
);

// ============================================================
// متجر التنبيهات
// ============================================================

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: number;
  actionUrl?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: Math.random().toString(36).slice(2), read: false, createdAt: Date.now() },
        ...s.notifications,
      ].slice(0, 50),
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clearAll: () => set({ notifications: [] }),
}));
