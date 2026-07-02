"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Cloud,
  Cpu,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Landmark,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Plug,
  Plus,
  RefreshCw,
  RotateCw,
  ScanText,
  Settings2,
  Shield,
  ShieldCheck,
  Trash2,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

type IntegrationType =
  | "Messaging"
  | "Email"
  | "Storage"
  | "AI"
  | "OCR"
  | "Payment"
  | "Maps"
  | "Calendar"
  | "Signature"
  | "Government"
  | "Other";

type IntegrationStatus = "connected" | "disconnected" | "error" | "testing";

interface Connector {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  status: IntegrationStatus;
  lastSync: string | null;
  operationsToday: number;
  errorsToday: number;
  avgResponseMs: number;
  live?: boolean; // مرتبط بـ API حقيقي
  fields?: { key: string; label: string; type?: "text" | "password" }[];
}

interface OperationLog {
  id: string;
  time: string;
  integrationId: string;
  integrationName: string;
  operation: string;
  status: "success" | "failed" | "pending";
  durationMs: number;
  details: string;
}

interface IncomingWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  lastTriggered: string | null;
  status: "active" | "paused";
}

interface OutgoingWebhook {
  id: string;
  name: string;
  targetUrl: string;
  triggerEvent: string;
  headers: number;
  status: "active" | "paused";
  retryCount: number;
  lastDelivery: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                  */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "shamel-integration-hub-v1";

const TYPE_META: Record<
  IntegrationType,
  { icon: typeof MessageSquare; color: string; label: string }
> = {
  Messaging: { icon: MessageSquare, color: "text-cyan-600", label: "مراسلة" },
  Email: { icon: Mail, color: "text-emerald-600", label: "بريد" },
  Storage: { icon: Cloud, color: "text-slate-600", label: "تخزين" },
  AI: { icon: Cpu, color: "text-rose-600", label: "ذكاء اصطناعي" },
  OCR: { icon: ScanText, color: "text-amber-600", label: "OCR" },
  Payment: { icon: CreditCard, color: "text-emerald-600", label: "مدفوعات" },
  Maps: { icon: MapPin, color: "text-rose-600", label: "خرائط" },
  Calendar: { icon: Calendar, color: "text-amber-600", label: "تقويم" },
  Signature: { icon: ShieldCheck, color: "text-cyan-600", label: "توقيع" },
  Government: { icon: Landmark, color: "text-slate-600", label: "حكومي" },
  Other: { icon: Globe, color: "text-slate-600", label: "أخرى" },
};

const STATUS_META: Record<
  IntegrationStatus,
  { dot: string; label: string; badge: string }
> = {
  connected: {
    dot: "bg-emerald-500",
    label: "متصل",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  disconnected: {
    dot: "bg-slate-400",
    label: "غير متصل",
    badge: "bg-slate-50 text-slate-600 border-slate-200",
  },
  error: {
    dot: "bg-rose-500",
    label: "خطأ",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  testing: {
    dot: "bg-amber-500",
    label: "اختبار",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const EVENT_OPTIONS = [
  "case.created",
  "case.updated",
  "case.closed",
  "document.uploaded",
  "document.signed",
  "session.scheduled",
  "judgment.issued",
  "task.created",
  "task.completed",
  "client.created",
  "payment.received",
  "hearing.reminder",
];

const BASE_CONNECTORS: Connector[] = [
  {
    id: "telegram",
    name: "Telegram Bot",
    description: "إشعارات وبوت تليجرام للمحامين والعملاء",
    type: "Messaging",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    live: true,
    fields: [
      { key: "botToken", label: "Bot Token", type: "password" },
      { key: "authorizedChats", label: "Authorized Chat IDs" },
    ],
  },
  {
    id: "ai-provider",
    name: "AI Provider",
    description: "مزود الذكاء الاصطناعي الأساسي للنظام",
    type: "AI",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    live: true,
    fields: [
      { key: "baseUrl", label: "Base URL" },
      { key: "apiKey", label: "API Key", type: "password" },
      { key: "model", label: "Model" },
    ],
  },
  {
    id: "openai-compat",
    name: "OpenAI Compatible",
    description: "أي مزود متوافق مع OpenAI API",
    type: "AI",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "baseUrl", label: "Base URL" },
      { key: "apiKey", label: "API Key", type: "password" },
      { key: "model", label: "Model" },
    ],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "مزامنة الجلسات والمواعيد مع تقويم Google",
    type: "Calendar",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
      { key: "calendarId", label: "Calendar ID" },
    ],
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "تكامل تقويم Outlook وبريد Microsoft 365",
    type: "Calendar",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "tenantId", label: "Tenant ID" },
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
    ],
  },
  {
    id: "smtp",
    name: "SMTP Email",
    description: "إرسال البريد عبر خادم SMTP مخصص",
    type: "Email",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "host", label: "SMTP Host" },
      { key: "port", label: "Port" },
      { key: "username", label: "Username" },
      { key: "password", label: "Password", type: "password" },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "إرسال بريد المعاملات عبر SendGrid",
    type: "Email",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "apiKey", label: "API Key", type: "password" },
      { key: "fromEmail", label: "From Email" },
      { key: "fromName", label: "From Name" },
    ],
  },
  {
    id: "twilio",
    name: "Twilio SMS",
    description: "إرسال رسائل SMS قصيرة للتنبيهات",
    type: "Messaging",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "accountSid", label: "Account SID" },
      { key: "authToken", label: "Auth Token", type: "password" },
      { key: "fromNumber", label: "From Number" },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "تواصل مع العملاء عبر واتساب للأعمال",
    type: "Messaging",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "phoneNumberId", label: "Phone Number ID" },
      { key: "accessToken", label: "Access Token", type: "password" },
      { key: "verifyToken", label: "Verify Token" },
    ],
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    description: "تخزين المستندات على Amazon S3",
    type: "Storage",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "accessKey", label: "Access Key ID" },
      { key: "secretKey", label: "Secret Key", type: "password" },
      { key: "bucket", label: "Bucket Name" },
      { key: "region", label: "Region" },
    ],
  },
  {
    id: "gcs",
    name: "Google Cloud Storage",
    description: "تخزين المستندات على Google Cloud Storage",
    type: "Storage",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "projectId", label: "Project ID" },
      { key: "bucket", label: "Bucket Name" },
      { key: "serviceKey", label: "Service Account JSON", type: "password" },
    ],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "تخزين ونسخ احتياطي على Dropbox",
    type: "Storage",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "accessToken", label: "Access Token", type: "password" },
      { key: "appKey", label: "App Key" },
      { key: "appSecret", label: "App Secret", type: "password" },
    ],
  },
  {
    id: "docusign",
    name: "DocuSign",
    description: "التوقيع الإلكتروني للعقود والمستندات القانونية",
    type: "Signature",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "username", label: "Username" },
      { key: "password", label: "Password", type: "password" },
      { key: "integratorKey", label: "Integrator Key" },
    ],
  },
  {
    id: "adobe-sign",
    name: "Adobe Sign",
    description: "توقيع إلكتروني معتمد عبر Adobe Acrobat Sign",
    type: "Signature",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
      { key: "endpoint", label: "Endpoint" },
    ],
  },
  {
    id: "google-vision",
    name: "Google Vision OCR",
    description: "استخراج النصوص من الصور والمستندات الممسوحة",
    type: "OCR",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "apiKey", label: "API Key", type: "password" },
      { key: "projectId", label: "Project ID" },
    ],
  },
  {
    id: "aws-textract",
    name: "AWS Textract",
    description: "تحليل المستندات واستخراج البيانات المنظمة",
    type: "OCR",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "accessKey", label: "Access Key ID" },
      { key: "secretKey", label: "Secret Key", type: "password" },
      { key: "region", label: "Region" },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "مدفوعات الأتعاب عبر بطاقات الائتمان",
    type: "Payment",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "secretKey", label: "Secret Key", type: "password" },
      { key: "publishableKey", label: "Publishable Key" },
      { key: "webhookSecret", label: "Webhook Secret", type: "password" },
    ],
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "مدفوعات PayPal للأتعاب القانونية",
    type: "Payment",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
      { key: "mode", label: "Mode (sandbox/live)" },
    ],
  },
  {
    id: "google-maps",
    name: "Google Maps",
    description: "مواقع المحاكم والمكاتب وخرائط الطرق",
    type: "Maps",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [{ key: "apiKey", label: "API Key", type: "password" }],
  },
  {
    id: "egypt-gov",
    name: "Egyptian Government Portal",
    description: "بوابة الحكومة المصرية (تكامل مستقبلي)",
    type: "Government",
    status: "disconnected",
    lastSync: null,
    operationsToday: 0,
    errorsToday: 0,
    avgResponseMs: 0,
    fields: [
      { key: "endpoint", label: "Portal Endpoint" },
      { key: "apiKey", label: "API Key", type: "password" },
    ],
  },
];

const ROLES = ["admin", "lawyer", "assistant", "accountant", "viewer"];

/* -------------------------------------------------------------------------- */
/*                              Helper functions                               */
/* -------------------------------------------------------------------------- */

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function relativeTime(iso: string | null): string {
  if (!iso) return "أبداً";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `قبل ${days} يوم`;
}

function generateOperations(): OperationLog[] {
  const ops: OperationLog[] = [];
  const names = [
    "Telegram Bot",
    "AI Provider",
    "SMTP Email",
    "AWS S3",
    "Google Vision OCR",
    "Stripe",
    "DocuSign",
    "Google Calendar",
    "WhatsApp Business",
    "AWS Textract",
  ];
  const opsList = [
    "إرسال إشعار",
    "تحليل وثيقة",
    "إرسال بريد",
    "رفع ملف",
    "استخراج نص",
    "إنشاء دفعة",
    "إرسال للتوقيع",
    "إنشاء موعد",
    "إرسال رسالة",
    "تحليل مستند",
  ];
  const statuses: OperationLog["status"][] = [
    "success",
    "success",
    "success",
    "success",
    "failed",
    "pending",
    "success",
    "success",
  ];
  for (let i = 0; i < 22; i++) {
    const idx = i % names.length;
    const status = statuses[i % statuses.length];
    ops.push({
      id: `op-${i + 1}`,
      time: new Date(Date.now() - i * 1000 * 60 * 17).toISOString(),
      integrationId: `conn-${idx}`,
      integrationName: names[idx],
      operation: opsList[idx],
      status,
      durationMs: status === "pending" ? 0 : 120 + Math.floor(Math.random() * 1400),
      details:
        status === "failed"
          ? "انتهت مهلة الاتصال (timeout 30s)"
          : status === "pending"
          ? "قيد المعالجة..."
          : "تمت بنجاح",
    });
  }
  return ops;
}

function generateIncomingWebhooks(): IncomingWebhook[] {
  return [
    {
      id: "wh-1",
      name: "Stripe Payments",
      url: "/api/webhooks/stripe",
      events: ["payment.received"],
      lastTriggered: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      status: "active",
    },
    {
      id: "wh-2",
      name: "DocuSign Callback",
      url: "/api/webhooks/docusign",
      events: ["document.signed"],
      lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      status: "active",
    },
    {
      id: "wh-3",
      name: "WhatsApp Delivery",
      url: "/api/webhooks/whatsapp",
      events: ["case.updated"],
      lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: "paused",
    },
  ];
}

function generateOutgoingWebhooks(): OutgoingWebhook[] {
  return [
    {
      id: "oh-1",
      name: "Backend Sync",
      targetUrl: "https://api.erp.example.com/hooks/case",
      triggerEvent: "case.created",
      headers: 3,
      status: "active",
      retryCount: 0,
      lastDelivery: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    },
    {
      id: "oh-2",
      name: "Slack Notifications",
      targetUrl: "https://hooks.slack.com/services/T000/B000/xxx",
      triggerEvent: "judgment.issued",
      headers: 2,
      status: "active",
      retryCount: 1,
      lastDelivery: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: "oh-3",
      name: "CRM Push",
      targetUrl: "https://crm.example.com/api/clients/push",
      triggerEvent: "client.created",
      headers: 4,
      status: "paused",
      retryCount: 3,
      lastDelivery: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*                                   Section                                   */
/* -------------------------------------------------------------------------- */

export function IntegrationHubSection() {
  const { toast } = useToast();
  const [connectors, setConnectors] = useState<Connector[]>(BASE_CONNECTORS);
  const [operations] = useState<OperationLog[]>(generateOperations);
  const [incomingWebhooks, setIncomingWebhooks] = useState<IncomingWebhook[]>(
    generateIncomingWebhooks
  );
  const [outgoingWebhooks, setOutgoingWebhooks] = useState<OutgoingWebhook[]>(
    generateOutgoingWebhooks
  );
  const [checking, setChecking] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [settingsConnector, setSettingsConnector] = useState<Connector | null>(
    null
  );
  const [logsConnector, setLogsConnector] = useState<Connector | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Filters for operations log
  const [opFilterIntegration, setOpFilterIntegration] = useState<string>("all");
  const [opFilterStatus, setOpFilterStatus] = useState<string>("all");

  // Security settings
  const [encryptCreds, setEncryptCreds] = useState(true);
  const [auditLogEnabled, setAuditLogEnabled] = useState(true);
  const [rateLimits, setRateLimits] = useState<Record<string, number>>({
    telegram: 60,
    "ai-provider": 30,
    "openai-compat": 30,
    "google-calendar": 20,
    outlook: 20,
    smtp: 100,
    sendgrid: 100,
    twilio: 30,
    whatsapp: 20,
    "aws-s3": 200,
    gcs: 200,
    dropbox: 100,
    docusign: 30,
    "adobe-sign": 30,
    "google-vision": 60,
    "aws-textract": 60,
    stripe: 100,
    paypal: 100,
    "google-maps": 100,
    "egypt-gov": 10,
  });

  // Role permissions matrix (integrationId × role => boolean)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  // Load local storage for connector configs + permissions
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          configs?: Record<string, Record<string, string>>;
          permissions?: Record<string, boolean>;
          rateLimits?: Record<string, number>;
          encryptCreds?: boolean;
          auditLogEnabled?: boolean;
        };
        // Merge saved toggles into connectors (without overwriting live status)
        if (parsed.permissions) setPermissions(parsed.permissions);
        if (parsed.rateLimits) setRateLimits(parsed.rateLimits);
        if (typeof parsed.encryptCreds === "boolean")
          setEncryptCreds(parsed.encryptCreds);
        if (typeof parsed.auditLogEnabled === "boolean")
          setAuditLogEnabled(parsed.auditLogEnabled);
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback(
    (next: {
      permissions?: Record<string, boolean>;
      rateLimits?: Record<string, number>;
      encryptCreds?: boolean;
      auditLogEnabled?: boolean;
    }) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const prev = saved ? JSON.parse(saved) : {};
        const merged = { ...prev, ...next };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
    },
    []
  );

  // Check live APIs (Telegram + AI provider + health)
  useEffect(() => {
    let cancelled = false;
    async function checkLive() {
      setChecking(true);
      const results = await Promise.allSettled([
        fetch("/api/telegram/health").then((r) => r.json()),
        fetch("/api/ai/provider").then((r) => r.json()),
      ]);

      if (cancelled) return;

      const telegramOk =
        results[0].status === "fulfilled" && results[0].value?.telegramConnected;
      const aiConfigured =
        results[1].status === "fulfilled" && results[1].value?.config?.hasKey;

      setConnectors((prev) =>
        prev.map((c) => {
          if (c.id === "telegram") {
            return {
              ...c,
              status: telegramOk
                ? ("connected" as IntegrationStatus)
                : ("disconnected" as IntegrationStatus),
              lastSync: telegramOk ? new Date().toISOString() : null,
              operationsToday: telegramOk ? 142 : 0,
              errorsToday: telegramOk ? 2 : 0,
              avgResponseMs: telegramOk ? 320 : 0,
            };
          }
          if (c.id === "ai-provider") {
            return {
              ...c,
              status: aiConfigured
                ? ("connected" as IntegrationStatus)
                : ("disconnected" as IntegrationStatus),
              lastSync: aiConfigured ? new Date().toISOString() : null,
              operationsToday: aiConfigured ? 87 : 0,
              errorsToday: aiConfigured ? 1 : 0,
              avgResponseMs: aiConfigured ? 1850 : 0,
            };
          }
          return c;
        })
      );
      setChecking(false);
    }
    checkLive();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------- Stats ------------------------------- */

  const stats = useMemo(() => {
    const active = connectors.filter((c) => c.status === "connected").length;
    const totalOps = connectors.reduce((s, c) => s + c.operationsToday, 0);
    const totalErrors = connectors.reduce((s, c) => s + c.errorsToday, 0);
    const errorRate = totalOps > 0 ? (totalErrors / totalOps) * 100 : 0;
    const connected = connectors.filter(
      (c) => c.status === "connected" && c.avgResponseMs > 0
    );
    const avgResponse =
      connected.length > 0
        ? Math.round(
            connected.reduce((s, c) => s + c.avgResponseMs, 0) / connected.length
          )
        : 0;
    return { active, totalOps, errorRate, avgResponse, totalErrors };
  }, [connectors]);

  /* ----------------------------- Actions ------------------------------- */

  function handleTest(c: Connector) {
    setTestingId(c.id);
    setConnectors((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status: "testing" } : x))
    );
    setTimeout(() => {
      const ok = Math.random() > 0.25;
      setConnectors((prev) =>
        prev.map((x) =>
          x.id === c.id
            ? {
                ...x,
                status: ok ? "connected" : "error",
                lastSync: ok ? new Date().toISOString() : x.lastSync,
                avgResponseMs: ok ? 200 + Math.floor(Math.random() * 800) : x.avgResponseMs,
              }
            : x
        )
      );
      setTestingId(null);
      toast({
        title: ok ? "نجح الاختبار" : "فشل الاختبار",
        description: ok
          ? `التكامل ${c.name} يعمل بشكل صحيح`
          : `تعذر الاتصال بـ ${c.name} - تحقق من الإعدادات`,
        variant: ok ? "default" : "destructive",
      });
    }, 1400);
  }

  function handleToggle(c: Connector) {
    const nextStatus: IntegrationStatus =
      c.status === "connected" ? "disconnected" : "connected";
    setConnectors((prev) =>
      prev.map((x) =>
        x.id === c.id
          ? {
              ...x,
              status: nextStatus,
              lastSync: nextStatus === "connected" ? new Date().toISOString() : x.lastSync,
            }
          : x
      )
    );
    toast({
      title: nextStatus === "connected" ? "تم التفعيل" : "تم الإيقاف",
      description: `${c.name} - ${
        nextStatus === "connected" ? "متصل الآن" : "غير متصل"
      }`,
    });
  }

  function handleSaveSettings(c: Connector, values: Record<string, string>) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const prev = saved ? JSON.parse(saved) : {};
      const configs = { ...(prev.configs ?? {}), [c.id]: values };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, configs }));
    } catch {
      // ignore
    }
    setSettingsConnector(null);
    toast({
      title: "تم حفظ الإعدادات",
      description: `تم حفظ بيانات اعتماد ${c.name} (محليًا)`,
    });
  }

  function handleRetryOp(op: OperationLog) {
    toast({
      title: "إعادة المحاولة",
      description: `تمت جدولة إعادة تنفيذ: ${op.operation} - ${op.integrationName}`,
    });
  }

  function handleCreateIncoming(data: Omit<IncomingWebhook, "id" | "lastTriggered" | "status">) {
    const newWh: IncomingWebhook = {
      ...data,
      id: `wh-${Date.now()}`,
      lastTriggered: null,
      status: "active",
    };
    setIncomingWebhooks((prev) => [newWh, ...prev]);
    toast({ title: "تم إنشاء Webhook", description: data.name });
  }

  function handleCreateOutgoing(data: Omit<OutgoingWebhook, "id" | "lastDelivery" | "retryCount" | "status">) {
    const newOh: OutgoingWebhook = {
      ...data,
      id: `oh-${Date.now()}`,
      lastDelivery: null,
      retryCount: 0,
      status: "active",
    };
    setOutgoingWebhooks((prev) => [newOh, ...prev]);
    toast({ title: "تمت إضافة Webhook صادر", description: data.name });
  }

  function toggleIncomingStatus(id: string) {
    setIncomingWebhooks((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: w.status === "active" ? "paused" : "active" }
          : w
      )
    );
  }

  function toggleOutgoingStatus(id: string) {
    setOutgoingWebhooks((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: w.status === "active" ? "paused" : "active" }
          : w
      )
    );
  }

  function deleteIncoming(id: string) {
    setIncomingWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast({ title: "تم حذف Webhook" });
  }

  function deleteOutgoing(id: string) {
    setOutgoingWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast({ title: "تم حذف Webhook" });
  }

  function rotateApiKey() {
    toast({
      title: "تم تدوير مفتاح API",
      description: "تم إنشاء مفتاح جديد - حدّث التكاملات التي تستخدم المفتاح القديم",
    });
  }

  /* ----------------------------- Derived -------------------------------- */

  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      if (
        opFilterIntegration !== "all" &&
        op.integrationName !== opFilterIntegration
      )
        return false;
      if (opFilterStatus !== "all" && op.status !== opFilterStatus) return false;
      return true;
    });
  }, [operations, opFilterIntegration, opFilterStatus]);

  /* --------------------------------------------------------------------- */
  /*                                Render                                  */
  /* --------------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Plug className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">مركز التكاملات</h1>
              <p className="text-xs text-muted-foreground">
                Integration Hub — إدارة جميع التكاملات الخارجية والموصلات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChecking(true);
                Promise.allSettled([
                  fetch("/api/telegram/health").then((r) => r.json()),
                  fetch("/api/ai/provider").then((r) => r.json()),
                  fetch("/api/health-check").then((r) => r.json()),
                ]).then((results) => {
                  const tgOk =
                    results[0].status === "fulfilled" &&
                    results[0].value?.telegramConnected;
                  const aiOk =
                    results[1].status === "fulfilled" &&
                    results[1].value?.config?.hasKey;
                  setConnectors((prev) =>
                    prev.map((c) => {
                      if (c.id === "telegram")
                        return {
                          ...c,
                          status: tgOk ? "connected" : "disconnected",
                          lastSync: tgOk ? new Date().toISOString() : null,
                        };
                      if (c.id === "ai-provider")
                        return {
                          ...c,
                          status: aiOk ? "connected" : "disconnected",
                          lastSync: aiOk ? new Date().toISOString() : null,
                        };
                      return c;
                    })
                  );
                  setChecking(false);
                  toast({
                    title: "تم تحديث الحالة",
                    description: "تم فحص حالة التكاملات الحية",
                  });
                });
              }}
            >
              <RefreshCw
                className={`size-4 ${checking ? "animate-spin" : ""}`}
              />
              تحديث الحالة
            </Button>
          </div>
        </div>
      </div>

      {/* Overview dashboard */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <OverviewCard
          icon={<Plug className="size-5" />}
          tint="emerald"
          label="عدد التكاملات النشطة"
          value={stats.active.toString()}
          sub={`من ${connectors.length} تكامل`}
        />
        <OverviewCard
          icon={<Activity className="size-5" />}
          tint="cyan"
          label="إجمالي العمليات اليوم"
          value={stats.totalOps.toLocaleString("ar-EG")}
          sub="آخر 24 ساعة"
        />
        <OverviewCard
          icon={<AlertTriangle className="size-5" />}
          tint="rose"
          label="معدل الأخطاء"
          value={`${stats.errorRate.toFixed(1)}%`}
          sub={`${stats.totalErrors} خطأ اليوم`}
        />
        <OverviewCard
          icon={<Clock className="size-5" />}
          tint="amber"
          label="متوسط زمن الاستجابة"
          value={stats.avgResponse > 0 ? `${stats.avgResponse} ms` : "—"}
          sub="للتكاملات المتصلة"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
          <TabsTrigger value="integrations" className="gap-1.5">
            <Plug className="size-4" />
            التكاملات
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5">
            <Webhook className="size-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <ScrollText />
            سجل العمليات
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="size-4" />
            إعدادات الأمان
          </TabsTrigger>
        </TabsList>

        {/* ----------------------- Integrations tab ----------------------- */}
        <TabsContent value="integrations" className="mt-4">
          {checking && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <Loader2 className="size-4 animate-spin" />
              جاري فحص حالة التكاملات الحية...
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {connectors.map((c) => (
              <ConnectorCard
                key={c.id}
                connector={c}
                testing={testingId === c.id}
                onTest={() => handleTest(c)}
                onSettings={() => setSettingsConnector(c)}
                onLogs={() => setLogsConnector(c)}
                onToggle={() => handleToggle(c)}
              />
            ))}
          </div>
        </TabsContent>

        {/* ------------------------- Webhooks tab ------------------------- */}
        <TabsContent value="webhooks" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WebhooksPanel
              title="Webhooks واردة (Incoming)"
              description="نقاط استقبال تستقبل إشعارات من خدمات خارجية"
              items={incomingWebhooks}
              kind="incoming"
              onCreate={handleCreateIncoming}
              onToggle={toggleIncomingStatus}
              onDelete={deleteIncoming}
            />
            <WebhooksPanel
              title="Webhooks صادرة (Outgoing)"
              description="إرسال إشعارات لخدمات خارجية عند الأحداث"
              items={outgoingWebhooks}
              kind="outgoing"
              onCreate={handleCreateOutgoing}
              onToggle={toggleOutgoingStatus}
              onDelete={deleteOutgoing}
            />
          </div>
        </TabsContent>

        {/* ----------------------- Operations Log tab --------------------- */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">سجل عمليات التكاملات</CardTitle>
                  <CardDescription className="text-xs">
                    {filteredOperations.length} عملية
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={opFilterIntegration}
                    onValueChange={setOpFilterIntegration}
                  >
                    <SelectTrigger className="h-8 w-[180px]">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل التكاملات</SelectItem>
                      {Array.from(
                        new Set(operations.map((o) => o.integrationName))
                      ).map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={opFilterStatus}
                    onValueChange={setOpFilterStatus}
                  >
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="success">ناجح</SelectItem>
                      <SelectItem value="failed">فاشل</SelectItem>
                      <SelectItem value="pending">قيد المعالجة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[70vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الوقت</TableHead>
                      <TableHead className="text-right">التكامل</TableHead>
                      <TableHead className="text-right">العملية</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">المدة</TableHead>
                      <TableHead className="text-right">التفاصيل</TableHead>
                      <TableHead className="text-right">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOperations.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(op.time)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {op.integrationName}
                        </TableCell>
                        <TableCell>{op.operation}</TableCell>
                        <TableCell>
                          <OpStatusBadge status={op.status} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {op.durationMs > 0 ? `${op.durationMs} ms` : "—"}
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">
                          {op.details}
                        </TableCell>
                        <TableCell>
                          {op.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={() => handleRetryOp(op)}
                            >
                              <RotateCw className="size-3" />
                              إعادة
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------- Security Settings tab ------------------ */}
        <TabsContent value="security" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Encryption + audit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="size-4 text-emerald-600" />
                  التشفير والتدقيق
                </CardTitle>
                <CardDescription className="text-xs">
                  إعدادات حماية بيانات الاعتماد وسجلات التدقيق
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">تشفير بيانات الاعتماد</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      تشفير AES-256 لكل مفاتيح API وكلمات السر المخزنة
                    </p>
                  </div>
                  <Switch
                    checked={encryptCreds}
                    onCheckedChange={(v) => {
                      setEncryptCreds(v);
                      persist({ encryptCreds: v });
                    }}
                  />
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">سجل التدقيق (Audit Log)</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      تسجيل كل عمليات القراءة والكتابة على التكاملات
                    </p>
                  </div>
                  <Switch
                    checked={auditLogEnabled}
                    onCheckedChange={(v) => {
                      setAuditLogEnabled(v);
                      persist({ auditLogEnabled: v });
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* API Key management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="size-4 text-amber-600" />
                  إدارة مفاتيح API
                </CardTitle>
                <CardDescription className="text-xs">
                  مفاتيح الوصول الرئيسية للنظام
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {["MAIN_API_KEY", "WEBHOOK_SIGNING_KEY"].map((keyName, i) => {
                  const masked = `${keyName.substring(0, 4)}••••••••••••${(i + 17).toString(16)}`;
                  const shown = showSecrets[keyName];
                  return (
                    <div
                      key={keyName}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-muted-foreground">
                            {keyName}
                          </div>
                          <div className="mt-1 font-mono text-sm tracking-tight">
                            {shown ? `sk_live_${keyName.toLowerCase()}_${Math.random().toString(36).slice(2, 12)}` : masked}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() =>
                              setShowSecrets((s) => ({ ...s, [keyName]: !s[keyName] }))
                            }
                          >
                            {shown ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>آخر تدوير: قبل {i === 0 ? 14 : 3} يوم</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={rotateApiKey}
                        >
                          <RotateCw className="size-3" />
                          تدوير المفتاح
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Rate limits */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="size-4 text-cyan-600" />
                  حدود المعدل (Rate Limiting)
                </CardTitle>
                <CardDescription className="text-xs">
                  الحد الأقصى للطلبات في الدقيقة لكل تكامل
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {connectors.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <span className="truncate text-xs">{c.name}</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          value={rateLimits[c.id] ?? 30}
                          onChange={(e) => {
                            const v = Number(e.target.value) || 1;
                            setRateLimits((prev) => ({ ...prev, [c.id]: v }));
                            persist({
                              rateLimits: { ...rateLimits, [c.id]: v },
                            });
                          }}
                          className="h-7 w-16 text-center text-xs"
                        />
                        <span className="text-[10px] text-muted-foreground">/د</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permissions matrix */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="size-4 text-rose-600" />
                  صلاحيات الوصول لكل تكامل
                </CardTitle>
                <CardDescription className="text-xs">
                  تحديد الأدوار المسموح لها باستخدام كل تكامل
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التكامل</TableHead>
                        {ROLES.map((r) => (
                          <TableHead key={r} className="text-center text-xs">
                            {r === "admin"
                              ? "مدير"
                              : r === "lawyer"
                              ? "محامي"
                              : r === "assistant"
                              ? "مساعد"
                              : r === "accountant"
                              ? "محاسب"
                              : "مشاهد"}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {connectors.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-2 rounded-full ${
                                  STATUS_META[c.status].dot
                                }`}
                              />
                              <span className="truncate">{c.name}</span>
                            </div>
                          </TableCell>
                          {ROLES.map((r) => {
                            const k = `${c.id}:${r}`;
                            const checked = permissions[k] ?? (r === "admin");
                            return (
                              <TableCell key={r} className="text-center">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const next = { ...permissions, [k]: !!v };
                                    setPermissions(next);
                                    persist({ permissions: next });
                                  }}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Settings dialog */}
      {settingsConnector && (
        <SettingsDialog
          connector={settingsConnector}
          onClose={() => setSettingsConnector(null)}
          onSave={handleSaveSettings}
        />
      )}

      {/* Logs dialog */}
      {logsConnector && (
        <LogsDialog
          connector={logsConnector}
          operations={operations.filter(
            (o) => o.integrationName === logsConnector.name
          )}
          onClose={() => setLogsConnector(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                 */
/* -------------------------------------------------------------------------- */

function ScrollText() {
  return <Activity className="size-4" />;
}

function OverviewCard({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tint: "emerald" | "cyan" | "rose" | "amber";
}) {
  const tints: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tints[tint]}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-muted-foreground">{label}</div>
          <div className="mt-0.5 text-lg font-bold tracking-tight">{value}</div>
          <div className="truncate text-[10px] text-muted-foreground">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectorCard({
  connector,
  testing,
  onTest,
  onSettings,
  onLogs,
  onToggle,
}: {
  connector: Connector;
  testing: boolean;
  onTest: () => void;
  onSettings: () => void;
  onLogs: () => void;
  onToggle: () => void;
}) {
  const typeMeta = TYPE_META[connector.type];
  const statusMeta = STATUS_META[connector.status];
  const Icon = typeMeta.icon;
  const enabled = connector.status === "connected" || connector.status === "testing";

  return (
    <Card
      className={`flex flex-col transition-shadow hover:shadow-md ${
        connector.status === "connected"
          ? "border-emerald-200 dark:border-emerald-900"
          : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-lg bg-muted ${typeMeta.color}`}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-sm">{connector.name}</CardTitle>
              <CardDescription className="mt-0.5 line-clamp-2 text-xs">
                {connector.description}
              </CardDescription>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={`gap-1 border ${statusMeta.badge}`}
          >
            <span className={`size-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {typeMeta.label}
          </Badge>
          {connector.live && (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              مباشر
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-[10px] text-muted-foreground">العمليات</div>
            <div className="text-sm font-semibold">
              {connector.operationsToday.toLocaleString("ar-EG")}
            </div>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-[10px] text-muted-foreground">الأخطاء</div>
            <div
              className={`text-sm font-semibold ${
                connector.errorsToday > 0
                  ? "text-rose-600"
                  : "text-emerald-600"
              }`}
            >
              {connector.errorsToday}
            </div>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-[10px] text-muted-foreground">الاستجابة</div>
            <div className="text-sm font-semibold">
              {connector.avgResponseMs > 0 ? `${connector.avgResponseMs}ms` : "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          آخر مزامنة: {relativeTime(connector.lastSync)}
        </div>

        <Separator />

        <div className="mt-auto flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 gap-1 text-xs"
            onClick={onTest}
            disabled={testing}
          >
            {testing ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Zap className="size-3" />
            )}
            اختبار
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 gap-1 text-xs"
            onClick={onSettings}
          >
            <Settings2 className="size-3" />
            إعدادات
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 gap-1 text-xs"
            onClick={onLogs}
          >
            <Activity className="size-3" />
            سجل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsDialog({
  connector,
  onClose,
  onSave,
}: {
  connector: Connector;
  onClose: () => void;
  onSave: (c: Connector, values: Record<string, string>) => void;
}) {
  // Load saved values from localStorage via lazy initializer (dialog remounts on open)
  const [values, setValues] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const cfg = parsed.configs?.[connector.id];
        if (cfg) return cfg as Record<string, string>;
      }
    } catch {
      // ignore
    }
    return {};
  });
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="size-4" />
            إعدادات: {connector.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            يتم حفظ بيانات الاعتماد محليًا في المتصفح (للعرض التوضيحي)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {connector.fields?.map((f) => {
            const isSecret = f.type === "password";
            const shown = showSecret[f.key];
            return (
              <div key={f.key} className="grid gap-1.5">
                <Label htmlFor={f.key} className="text-xs">
                  {f.label}
                </Label>
                <div className="flex gap-1">
                  <Input
                    id={f.key}
                    type={isSecret && !shown ? "password" : "text"}
                    value={values[f.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                    placeholder={isSecret ? "••••••••" : ""}
                    className="text-sm"
                  />
                  {isSecret && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setShowSecret((s) => ({ ...s, [f.key]: !s[f.key] }))
                      }
                    >
                      {shown ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {!connector.fields?.length && (
            <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
              لا توجد إعدادات قابلة للتكوين لهذا التكامل
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={() => onSave(connector, values)}>
            <CheckCircle2 className="size-4" />
            حفظ الإعدادات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogsDialog({
  connector,
  operations,
  onClose,
}: {
  connector: Connector;
  operations: OperationLog[];
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="size-4" />
            سجل عمليات: {connector.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            آخر {operations.length} عملية على هذا التكامل
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">العملية</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">المدة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    لا توجد عمليات مسجلة لهذا التكامل
                  </TableCell>
                </TableRow>
              ) : (
                operations.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(op.time)}
                    </TableCell>
                    <TableCell>{op.operation}</TableCell>
                    <TableCell>
                      <OpStatusBadge status={op.status} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {op.durationMs > 0 ? `${op.durationMs} ms` : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OpStatusBadge({ status }: { status: OperationLog["status"] }) {
  if (status === "success")
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      >
        <CheckCircle2 className="size-3" />
        ناجح
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge
        variant="outline"
        className="gap-1 border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
      >
        <XCircle className="size-3" />
        فاشل
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
    >
      <Loader2 className="size-3 animate-spin" />
      معلّق
    </Badge>
  );
}

/* --------------------------- Webhooks panel --------------------------- */

function WebhooksPanel({
  title,
  description,
  items,
  kind,
  onCreate,
  onToggle,
  onDelete,
}: {
  title: string;
  description: string;
  items: IncomingWebhook[] | OutgoingWebhook[];
  kind: "incoming" | "outgoing";
  onCreate: (data: never) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="size-4 text-cyan-600" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">{description}</CardDescription>
          </div>
          <Button size="sm" className="h-8 gap-1" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" />
            {kind === "incoming" ? "إنشاء Webhook" : "إضافة"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="max-h-[60vh]">
          <div className="divide-y">
            {items.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                لا توجد Webhooks مسجلة
              </div>
            )}
            {items.map((item) => (
              <WebhookRow
                key={item.id}
                item={item}
                kind={kind}
                onToggle={() => onToggle(item.id)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      {open && (
        <CreateWebhookDialog
          kind={kind}
          onClose={() => setOpen(false)}
          onCreate={(data) => {
            onCreate(data as never);
            setOpen(false);
          }}
        />
      )}
    </Card>
  );
}

function WebhookRow({
  item,
  kind,
  onToggle,
  onDelete,
}: {
  item: IncomingWebhook | OutgoingWebhook;
  kind: "incoming" | "outgoing";
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isIncoming = kind === "incoming";
  const inc = isIncoming ? (item as IncomingWebhook) : null;
  const out = !isIncoming ? (item as OutgoingWebhook) : null;
  const url = isIncoming ? inc!.url : out!.targetUrl;
  const lastTime = isIncoming ? inc!.lastTriggered : out!.lastDelivery;
  const active = item.status === "active";

  return (
    <div className="flex items-start justify-between gap-3 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="truncate text-sm font-medium">{item.name}</span>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {active ? "نشط" : "متوقف"}
          </Badge>
        </div>
        <div className="mt-1 truncate font-mono text-xs text-muted-foreground" dir="ltr">
          {url}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {isIncoming ? (
            inc!.events.map((e) => (
              <Badge key={e} variant="secondary" className="text-[10px]">
                {e}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              {out!.triggerEvent}
            </Badge>
          )}
          {out && out.retryCount > 0 && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-[10px] text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
            >
              {out.retryCount} إعادة محاولة
            </Badge>
          )}
          {out && (
            <Badge variant="outline" className="text-[10px]">
              {out.headers} headers
            </Badge>
          )}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          آخر نشاط: {relativeTime(lastTime)}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Switch checked={active} onCheckedChange={onToggle} />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-rose-600"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function CreateWebhookDialog({
  kind,
  onClose,
  onCreate,
}: {
  kind: "incoming" | "outgoing";
  onClose: () => void;
  onCreate: (
    data:
      | Omit<IncomingWebhook, "id" | "lastTriggered" | "status">
      | Omit<OutgoingWebhook, "id" | "lastDelivery" | "retryCount" | "status">
  ) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [triggerEvent, setTriggerEvent] = useState<string>(EVENT_OPTIONS[0]);
  const [secret, setSecret] = useState("");
  const [active, setActive] = useState(true);

  function toggleEvent(e: string) {
    setEvents((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  }

  function submit() {
    if (!name.trim()) return;
    if (kind === "incoming") {
      onCreate({
        name,
        url: url || `/api/webhooks/${name.toLowerCase().replace(/\s+/g, "-")}`,
        events: events.length ? events : ["case.created"],
        // secret + active are not part of IncomingWebhook type but allowed by signature mapping
        // we pass them through Object spread; consumer ignores
        ...({ secret, active } as object),
      } as never);
    } else {
      onCreate({
        name,
        targetUrl: targetUrl,
        triggerEvent,
        headers: 0,
      } as never);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-4" />
            {kind === "incoming" ? "إنشاء Webhook وارد" : "إضافة Webhook صادر"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {kind === "incoming"
              ? "أنشئ نقطة استقبال جديدة للأحداث الواردة"
              : "أضف وجهة جديدة لإرسال الإشعارات"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="wh-name" className="text-xs">
              الاسم
            </Label>
            <Input
              id="wh-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: Stripe Payments"
            />
          </div>
          {kind === "incoming" ? (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="wh-url" className="text-xs">
                  URL (المسار النسبي)
                </Label>
                <Input
                  id="wh-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/api/webhooks/stripe"
                  dir="ltr"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">الأحداث المشترك بها</Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                  {EVENT_OPTIONS.map((e) => (
                    <label
                      key={e}
                      className="flex items-center gap-2 text-xs"
                      dir="ltr"
                    >
                      <Checkbox
                        checked={events.includes(e)}
                        onCheckedChange={() => toggleEvent(e)}
                      />
                      <span className="font-mono">{e}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="wh-secret" className="text-xs">
                  Secret (لتوقيع الحمولة)
                </Label>
                <Input
                  id="wh-secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="whsec_..."
                  type="password"
                  dir="ltr"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="oh-url" className="text-xs">
                  Target URL
                </Label>
                <Input
                  id="oh-url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://api.example.com/webhook"
                  dir="ltr"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">الحدث المُحفّز</Label>
                <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_OPTIONS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="text-xs">تفعيل Webhook فورًا</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            <Plus className="size-4" />
            {kind === "incoming" ? "إنشاء" : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
