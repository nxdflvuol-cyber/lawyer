// ============================================================
// نظام الصلاحيات - المحامي الشامل
// ============================================================

import type { SectionId } from "./stores";

// ============================================================
// تعريف الأدوار
// ============================================================

export type UserRole = "admin" | "lawyer" | "assistant" | "member" | "intern";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "مدير",
  lawyer: "محامي",
  assistant: "مساعد قانوني",
  member: "عضو",
  intern: "متدرب",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "صلاحيات كاملة على النظام بما في ذلك الإعدادات والأمان",
  lawyer: "محامي يحتاج لجميع الأقسام العملية عدا الإدارة العليا",
  assistant: "مساعد قانوني يركز على المهام والقضايا والمستندات",
  member: "عضو مكتب يرى البيانات الأساسية فقط",
  intern: "متدرب يرى البيانات للتعلم بدون تعديل",
};

// ============================================================
// تعريف الأقسام ومستويات الوصول
// ============================================================

export type AccessLevel = "full" | "view" | "none";

export interface SectionPermission {
  section: SectionId;
  level: AccessLevel;
}

// ============================================================
// الصلاحيات الافتراضية لكل دور
// ============================================================

export const DEFAULT_PERMISSIONS: Record<UserRole, Record<SectionId, AccessLevel>> = {
  admin: {
    dashboard: "full",
    cases: "full",
    precases: "full",
    clients: "full",
    documents: "full",
    "legal-brain": "full",
    tasks: "full",
    appointments: "full",
    finance: "full",
    reports: "full",
    "memo-editor": "full",
    calculators: "full",
    pleading: "full",
    maps: "full",
    "ai-thinker": "full",
    "text-analyzer": "full",
    performance: "full",
    development: "full",
    settings: "full",
    backup: "full",
    security: "full",
    updates: "full",
    team: "full",
    research: "full",
    logout: "full",
  },
  lawyer: {
    dashboard: "full",
    cases: "full",
    precases: "full",
    clients: "full",
    documents: "full",
    "legal-brain": "full",
    tasks: "full",
    appointments: "full",
    finance: "full",
    reports: "full",
    "memo-editor": "full",
    calculators: "full",
    pleading: "full",
    maps: "full",
    "ai-thinker": "full",
    "text-analyzer": "full",
    performance: "full",
    development: "full",
    settings: "view",
    backup: "none",
    security: "none",
    updates: "none",
    team: "view",
    research: "full",
    logout: "full",
  },
  assistant: {
    dashboard: "full",
    cases: "full",
    precases: "full",
    clients: "full",
    documents: "full",
    "legal-brain": "full",
    tasks: "full",
    appointments: "full",
    finance: "view",
    reports: "view",
    "memo-editor": "full",
    calculators: "full",
    pleading: "full",
    maps: "view",
    "ai-thinker": "full",
    "text-analyzer": "full",
    performance: "none",
    development: "view",
    settings: "view",
    backup: "none",
    security: "none",
    updates: "none",
    team: "none",
    research: "view",
    logout: "full",
  },
  member: {
    dashboard: "view",
    cases: "view",
    precases: "view",
    clients: "view",
    documents: "view",
    "legal-brain": "view",
    tasks: "full",
    appointments: "full",
    finance: "none",
    reports: "none",
    "memo-editor": "view",
    calculators: "view",
    pleading: "none",
    maps: "view",
    "ai-thinker": "none",
    "text-analyzer": "none",
    performance: "none",
    development: "none",
    settings: "view",
    backup: "none",
    security: "none",
    updates: "none",
    team: "none",
    research: "none",
    logout: "full",
  },
  intern: {
    dashboard: "view",
    cases: "view",
    precases: "view",
    clients: "view",
    documents: "view",
    "legal-brain": "view",
    tasks: "view",
    appointments: "view",
    finance: "none",
    reports: "none",
    "memo-editor": "view",
    calculators: "view",
    pleading: "none",
    maps: "view",
    "ai-thinker": "none",
    "text-analyzer": "none",
    performance: "none",
    development: "view",
    settings: "none",
    backup: "none",
    security: "none",
    updates: "none",
    team: "none",
    research: "view",
    logout: "full",
  },
};

// ============================================================
// دوال مساعدة
// ============================================================

/**
 * التحقق من صلاحية الوصول لقسم معين
 */
export function hasAccess(
  role: UserRole | string | undefined,
  section: SectionId,
  requiredLevel: AccessLevel = "view"
): boolean {
  if (!role) return false;
  const permissions = DEFAULT_PERMISSIONS[role as UserRole];
  if (!permissions) return false;
  const level = permissions[section];
  if (level === "none") return false;
  if (requiredLevel === "full" && level !== "full") return false;
  return true;
}

/**
 * الحصول على مستوى الوصول لقسم معين
 */
export function getAccessLevel(
  role: UserRole | string | undefined,
  section: SectionId
): AccessLevel {
  if (!role) return "none";
  const permissions = DEFAULT_PERMISSIONS[role as UserRole];
  if (!permissions) return "none";
  return permissions[section] ?? "none";
}

/**
 * الحصول على قائمة الأقسام المتاحة لدور معين
 */
export function getAccessibleSections(role: UserRole | string | undefined): SectionId[] {
  if (!role) return [];
  const permissions = DEFAULT_PERMISSIONS[role as UserRole];
  if (!permissions) return [];
  return (Object.keys(permissions) as SectionId[]).filter(
    (s) => permissions[s] !== "none"
  );
}

/**
 * التحقق من إمكانية التعديل
 */
export function canEdit(role: UserRole | string | undefined, section: SectionId): boolean {
  return hasAccess(role, section, "full");
}

/**
 * التحقق من صلاحيات الإدارة (admin فقط)
 */
export function isAdmin(role: UserRole | string | undefined): boolean {
  return role === "admin";
}

/**
 * التحقق من صلاحيات الإدارة العليا (admin أو lawyer)
 */
export function isManager(role: UserRole | string | undefined): boolean {
  return role === "admin" || role === "lawyer";
}
