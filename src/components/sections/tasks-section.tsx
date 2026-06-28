"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavStore } from "@/lib/stores";
import {
  TASK_PRIORITY,
  TASK_STATUS,
  formatDate,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Search,
  Plus,
  Filter,
  X,
  Trash2,
  Edit3,
  Save,
  ChevronLeft,
  Clock,
  AlertCircle,
  ListChecks,
  KanbanSquare,
  Briefcase,
  User,
  Calendar,
  Flag,
  CheckCircle2,
  Circle,
  PlayCircle,
  GripVertical,
  Tag,
  Timer,
  AlertTriangle,
} from "lucide-react";

// ============================================================
// الأنواع
// ============================================================

interface CaseLite {
  id: string;
  internalNumber: string;
}

interface ClientLite {
  id: string;
  fullName: string;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  reminderDate?: string | null;
  caseId?: string | null;
  clientId?: string | null;
  case?: CaseLite | null;
  client?: ClientLite | null;
  estimatedHours?: number | null;
  tags?: string | null;
  checklist?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// ثوابت محلية
// ============================================================

const KANBAN_COLUMNS = [
  { id: "todo", title: "للتنفيذ", icon: Circle, color: "text-slate-600", headerBg: "bg-slate-100 dark:bg-slate-800/50" },
  { id: "in_progress", title: "قيد التنفيذ", icon: PlayCircle, color: "text-amber-600", headerBg: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "completed", title: "مكتملة", icon: CheckCircle2, color: "text-emerald-600", headerBg: "bg-emerald-100 dark:bg-emerald-900/30" },
];

function getPriorityConfig(priority: string) {
  return TASK_PRIORITY.find((p) => p.value === priority) ?? TASK_PRIORITY[2];
}

function getStatusConfig(status: string) {
  return TASK_STATUS.find((s) => s.value === status) ?? TASK_STATUS[0];
}

function isOverdue(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// ============================================================
// مكوّن مساعد للحالة الفارغة
// ============================================================

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================
// القسم الرئيسي
// ============================================================

export function TasksSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setSection = useNavStore((s) => s.setSection);

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: casesData } = useQuery({
    queryKey: ["cases", "for-task-select"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      return res.json();
    },
  });
  const { data: clientsData } = useQuery({
    queryKey: ["clients", "for-task-select"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    },
  });

  const cases: CaseLite[] = casesData?.cases ?? [];
  const clients: ClientLite[] = clientsData?.clients ?? [];
  const allTasks: TaskItem[] = data?.tasks ?? [];

  // فلترة محلية
  const filteredTasks = useMemo(() => {
    let list = allTasks;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          (t.tags ?? "").toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }
    return list;
  }, [allTasks, search, priorityFilter]);

  // إحصائيات
  const stats = useMemo(() => {
    const todo = allTasks.filter((t) => t.status === "todo").length;
    const inProgress = allTasks.filter((t) => t.status === "in_progress").length;
    const overdue = allTasks.filter(
      (t) => t.status !== "completed" && isOverdue(t.dueDate)
    ).length;
    const completed = allTasks.filter((t) => t.status === "completed").length;
    return { todo, inProgress, overdue, completed };
  }, [allTasks]);

  // تحديث حالة المهمة (DnD)
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: () => {
      toast({ title: "فشل تحديث حالة المهمة", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم حذف المهمة" });
      setDetailTaskId(null);
    },
    onError: () => {
      toast({ title: "فشل الحذف", variant: "destructive" });
    },
  });

  // تجميع المهام حسب الحالة لـ Kanban
  const tasksByStatus = useMemo(() => {
    const map: Record<string, TaskItem[]> = { todo: [], in_progress: [], completed: [] };
    filteredTasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [filteredTasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = allTasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const targetId = String(over.id);

    // إذا أُفلتت على عمود (droppable للعمود)
    if (KANBAN_COLUMNS.some((c) => c.id === targetId)) {
      const task = allTasks.find((t) => t.id === taskId);
      if (task && task.status !== targetId) {
        updateTaskStatusMutation.mutate({ id: taskId, status: targetId });
        toast({
          title: "تم نقل المهمة",
          description: `إلى ${
            KANBAN_COLUMNS.find((c) => c.id === targetId)?.title
          }`,
        });
      }
      return;
    }

    // إذا أُفلتت فوق مهمة أخرى — نحدد العمود من المهمة المستهدفة
    const overTask = allTasks.find((t) => t.id === targetId);
    if (overTask && overTask.id !== taskId) {
      const targetStatus = overTask.status;
      const task = allTasks.find((t) => t.id === taskId);
      if (task && task.status !== targetStatus) {
        updateTaskStatusMutation.mutate({ id: taskId, status: targetStatus });
        toast({
          title: "تم نقل المهمة",
          description: `إلى ${
            KANBAN_COLUMNS.find((c) => c.id === targetStatus)?.title
          }`,
        });
      }
    }
  }

  const statCards = [
    {
      title: "للتنفيذ",
      value: stats.todo,
      icon: Circle,
      color: "text-slate-600 bg-slate-100",
    },
    {
      title: "قيد التنفيذ",
      value: stats.inProgress,
      icon: PlayCircle,
      color: "text-amber-600 bg-amber-100",
    },
    {
      title: "متأخرة",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-600 bg-red-100",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الرأس */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-primary" />
            إدارة المهام
          </h1>
          <p className="text-muted-foreground mt-1">
            نظام مهام متكامل مع لوحة كانبان وسحب وإفلات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSection("appointments")}>
            <Calendar className="w-4 h-4 ml-2" />
            المواعيد
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 ml-2" />
            مهمة جديدة
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="stat-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-lg", card.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {card.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* أدوات البحث والفلترة */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث في المهام..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-3.5 h-3.5 ml-1" />
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأولويات</SelectItem>
                {TASK_PRIORITY.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
              <TabsList>
                <TabsTrigger value="kanban" className="gap-1">
                  <KanbanSquare className="w-3.5 h-3.5" />
                  كانبان
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1">
                  <ListChecks className="w-3.5 h-3.5" />
                  قائمة
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {(search || priorityFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setPriorityFilter("all");
                }}
              >
                <X className="w-3.5 h-3.5 ml-1" />
                مسح
              </Button>
            )}
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredTasks.length} مهمة
            </span>
          </div>
        </CardContent>
      </Card>

      {/* المحتوى */}
      {isLoading ? (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-4">
            <EmptyState
              icon={CheckSquare}
              title="لا توجد مهام"
              description="ابدأ بإضافة مهمة جديدة لتنظيم عملك اليومي"
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  مهمة جديدة
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasksByStatus[col.id] ?? []}
                onTaskClick={(id) => setDetailTaskId(id)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="rotate-3 opacity-90">
                <KanbanCard task={activeTask} onClick={() => {}} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" />
              قائمة المهام
            </CardTitle>
            <CardDescription>
              اضغط على أي مهمة لعرض التفاصيل الكاملة
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[calc(100vh-22rem)]">
              <div className="space-y-2 p-4">
                {filteredTasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onClick={() => setDetailTaskId(t.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* نافذة إنشاء مهمة */}
      <CreateTaskDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        cases={cases}
        clients={clients}
        onCreated={(id) => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
          setDetailTaskId(id);
        }}
      />

      {/* لوحة تفاصيل المهمة */}
      <TaskDetailSheet
        taskId={detailTaskId}
        open={!!detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onDelete={(id) => deleteMutation.mutate(id)}
        cases={cases}
        clients={clients}
      />
    </div>
  );
}

// ============================================================
// عمود كانبان
// ============================================================

interface KanbanColumnDef {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  headerBg: string;
}

function KanbanColumn({
  column,
  tasks,
  onTaskClick,
}: {
  column: KanbanColumnDef;
  tasks: TaskItem[];
  onTaskClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const Icon = column.icon;

  return (
    <Card
      className={cn(
        "flex flex-col transition-colors",
        isOver && "border-primary border-2"
      )}
    >
      <CardHeader className={cn("pb-3 rounded-t-lg", column.headerBg)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className={cn("w-4 h-4", column.color)} />
            {column.title}
          </CardTitle>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-1" ref={setNodeRef}>
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-32">
            {tasks.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8 border-2 border-dashed border-border/50 rounded-lg">
                اسحب المهام هنا
              </div>
            ) : (
              tasks.map((t) => (
                <KanbanCard
                  key={t.id}
                  task={t}
                  onClick={() => onTaskClick(t.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

// ============================================================
// بطاقة مهمة (Sortable)
// ============================================================

function KanbanCard({
  task,
  onClick,
  isOverlay = false,
}: {
  task: TaskItem;
  onClick: () => void;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = task.status !== "completed" && isOverdue(task.dueDate);
  const priorityConf = getPriorityConfig(task.priority);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-card border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer animate-fade-in",
        isDragging && "opacity-50",
        overdue && "border-red-300",
        !overdue && "border-border"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {!isOverlay && (
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-0.5 flex-shrink-0 touch-none"
            title="اسحب لإعادة الترتيب"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-xs", priorityConf.color)}
            >
              <Flag className="w-2.5 h-2.5 ml-1" />
              {priorityConf.label}
            </Badge>
            {task.dueDate && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  overdue
                    ? "text-red-600 bg-red-50 border-red-200"
                    : "text-slate-600 bg-slate-50 border-slate-200"
                )}
              >
                <Clock className="w-2.5 h-2.5 ml-1" />
                {formatDate(task.dueDate)}
              </Badge>
            )}
          </div>
          {(task.case || task.client) && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
              {task.case && (
                <span className="flex items-center gap-1 truncate">
                  <Briefcase className="w-3 h-3 text-primary" />
                  {task.case.internalNumber}
                </span>
              )}
              {task.client && (
                <span className="flex items-center gap-1 truncate">
                  <User className="w-3 h-3" />
                  {task.client.fullName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// صف مهمة (قائمة)
// ============================================================

function TaskRow({
  task,
  onClick,
}: {
  task: TaskItem;
  onClick: () => void;
}) {
  const overdue = task.status !== "completed" && isOverdue(task.dueDate);
  const statusConf = getStatusConfig(task.status);
  const priorityConf = getPriorityConfig(task.priority);
  const StatusIcon = statusConf.value === "completed" ? CheckCircle2 : statusConf.value === "in_progress" ? PlayCircle : Circle;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-3 hover:border-primary/40 hover:shadow-md transition-all animate-fade-in flex items-start gap-3",
        overdue && "border-red-300",
        !overdue && "border-border"
      )}
    >
      <StatusIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", statusConf.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="font-medium text-foreground">{task.title}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant="outline" className={cn("text-xs", priorityConf.color)}>
              {priorityConf.label}
            </Badge>
            <Badge className={cn("text-xs", statusConf.color)}>
              {statusConf.label}
            </Badge>
          </div>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
          {task.dueDate && (
            <span className={cn("flex items-center gap-1", overdue && "text-red-600 font-medium")}>
              <Clock className="w-3 h-3" />
              {overdue ? "متأخرة: " : "موعد: "}
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.case && (
            <span className="flex items-center gap-1 text-primary">
              <Briefcase className="w-3 h-3" />
              {task.case.internalNumber}
            </span>
          )}
          {task.client && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.client.fullName}
            </span>
          )}
          {task.tags && (
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {task.tags}
            </span>
          )}
        </div>
      </div>
      <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </div>
  );
}

// ============================================================
// نافذة إنشاء مهمة
// ============================================================

interface CreateTaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  reminderDate: string;
  caseId: string;
  clientId: string;
  estimatedHours: string;
  tags: string;
}

function CreateTaskDialog({
  open,
  onOpenChange,
  cases,
  clients,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cases: CaseLite[];
  clients: ClientLite[];
  onCreated: (id: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateTaskFormData>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    reminderDate: "",
    caseId: "",
    clientId: "",
    estimatedHours: "",
    tags: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTaskFormData) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate || null,
          reminderDate: data.reminderDate || null,
          caseId: data.caseId || null,
          clientId: data.clientId || null,
          estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : null,
          tags: data.tags || null,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "تم إنشاء المهمة", description: form.title });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        onCreated(data.task.id);
        setForm({
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          dueDate: "",
          reminderDate: "",
          caseId: "",
          clientId: "",
          estimatedHours: "",
          tags: "",
        });
      } else {
        toast({
          title: "فشل الإنشاء",
          description: data.error ?? "خطأ غير معروف",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({ title: "خطأ", description: "تعذّر إنشاء المهمة", variant: "destructive" });
    },
  });

  function handleSubmit() {
    if (!form.title) {
      toast({ title: "العنوان مطلوب", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            مهمة جديدة
          </DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المهمة. يمكن تعديلها لاحقاً.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-2">
            <div className="space-y-1.5">
              <Label>
                عنوان المهمة <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: إعداد مذكرة دفاع"
              />
            </div>

            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="تفاصيل المهمة..."
                className="min-h-20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الحالة</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS.filter((s) => s.value !== "cancelled").map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الأولوية</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITY.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>موعد التسليم</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>تذكير قبل</Label>
                <Input
                  type="date"
                  value={form.reminderDate}
                  onChange={(e) =>
                    setForm({ ...form, reminderDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>القضية المرتبطة</Label>
                <Select
                  value={form.caseId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, caseId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="بدون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.internalNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الموكل المرتبط</Label>
                <Select
                  value={form.clientId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, clientId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="بدون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الساعات المقدّرة</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.estimatedHours}
                  onChange={(e) =>
                    setForm({ ...form, estimatedHours: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>الوسوم</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="مهم, عاجل"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Clock className="w-4 h-4 ml-2 animate-pulse" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ المهمة
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// لوحة تفاصيل المهمة
// ============================================================

function TaskDetailSheet({
  taskId,
  open,
  onClose,
  onDelete,
  cases,
  clients,
}: {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  cases: CaseLite[];
  clients: ClientLite[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    reminderDate: string;
    caseId: string;
    clientId: string;
    estimatedHours: string;
    tags: string;
  }>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    reminderDate: "",
    caseId: "",
    clientId: "",
    estimatedHours: "",
    tags: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      return res.json();
    },
    enabled: !!taskId,
  });

  const task: TaskItem | undefined = (data?.tasks ?? []).find(
    (t: TaskItem) => t.id === taskId
  );

  // مزامنة باستخدام useEffect
  useEffect(() => {
    if (task && !editing) {
      setEditForm({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        reminderDate: task.reminderDate ? task.reminderDate.slice(0, 10) : "",
        caseId: task.caseId ?? "",
        clientId: task.clientId ?? "",
        estimatedHours: task.estimatedHours ? String(task.estimatedHours) : "",
        tags: task.tags ?? "",
      });
    }
  }, [task, editing]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم تحديث المهمة" });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "فشل التحديث", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تم تحديث الحالة" });
    },
    onError: () => {
      toast({ title: "فشل التحديث", variant: "destructive" });
    },
  });

  function handleSave() {
    updateMutation.mutate({
      title: editForm.title,
      description: editForm.description || null,
      status: editForm.status,
      priority: editForm.priority,
      dueDate: editForm.dueDate || null,
      reminderDate: editForm.reminderDate || null,
      caseId: editForm.caseId || null,
      clientId: editForm.clientId || null,
      estimatedHours: editForm.estimatedHours ? Number(editForm.estimatedHours) : null,
      tags: editForm.tags || null,
    });
  }

  if (!open || !taskId) return null;
  if (isLoading || !task) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="left" className="w-full sm:max-w-2xl p-0">
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const overdue = task.status !== "completed" && isOverdue(task.dueDate);
  const statusConf = getStatusConfig(task.status);
  const priorityConf = getPriorityConfig(task.priority);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                {task.title}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 flex-wrap mt-1">
                <Badge className={cn("text-xs", statusConf.color)}>
                  {statusConf.label}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", priorityConf.color)}>
                  <Flag className="w-2.5 h-2.5 ml-1" />
                  {priorityConf.label}
                </Badge>
                {overdue && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-2.5 h-2.5 ml-1" />
                    متأخرة
                  </Badge>
                )}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(!editing)}
                title={editing ? "إلغاء التعديل" : "تعديل"}
              >
                {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmDelete(true)}
                title="حذف"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* أزرار الحالة السريعة */}
            {!editing && (
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-2">تغيير الحالة:</p>
                  <div className="flex flex-wrap gap-2">
                    {TASK_STATUS.filter((s) => s.value !== "cancelled").map((s) => (
                      <Button
                        key={s.value}
                        size="sm"
                        variant={task.status === s.value ? "default" : "outline"}
                        onClick={() => statusMutation.mutate(s.value)}
                        disabled={statusMutation.isPending}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* البيانات */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary" />
                  تفاصيل المهمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editing ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>العنوان</Label>
                      <Input
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>الوصف</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        className="min-h-20"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>الحالة</Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(v) =>
                            setEditForm({ ...editForm, status: v })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_STATUS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>الأولوية</Label>
                        <Select
                          value={editForm.priority}
                          onValueChange={(v) =>
                            setEditForm({ ...editForm, priority: v })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_PRIORITY.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>موعد التسليم</Label>
                        <Input
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) =>
                            setEditForm({ ...editForm, dueDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>تذكير قبل</Label>
                        <Input
                          type="date"
                          value={editForm.reminderDate}
                          onChange={(e) =>
                            setEditForm({ ...editForm, reminderDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>القضية</Label>
                        <Select
                          value={editForm.caseId || "none"}
                          onValueChange={(v) =>
                            setEditForm({
                              ...editForm,
                              caseId: v === "none" ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون</SelectItem>
                            {cases.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.internalNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>الموكل</Label>
                        <Select
                          value={editForm.clientId || "none"}
                          onValueChange={(v) =>
                            setEditForm({
                              ...editForm,
                              clientId: v === "none" ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون</SelectItem>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>الساعات المقدّرة</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={editForm.estimatedHours}
                          onChange={(e) =>
                            setEditForm({ ...editForm, estimatedHours: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>الوسوم</Label>
                        <Input
                          value={editForm.tags}
                          onChange={(e) =>
                            setEditForm({ ...editForm, tags: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    {task.description && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow
                        icon={Clock}
                        label="موعد التسليم"
                        value={task.dueDate ? formatDate(task.dueDate) : "—"}
                        valueClass={overdue ? "text-red-600 font-medium" : ""}
                      />
                      <DetailRow
                        icon={Timer}
                        label="تذكير قبل"
                        value={
                          task.reminderDate ? formatDate(task.reminderDate) : "—"
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow
                        icon={Timer}
                        label="ساعات مقدّرة"
                        value={task.estimatedHours ? `${task.estimatedHours} ساعة` : "—"}
                      />
                      <DetailRow
                        icon={Calendar}
                        label="تاريخ الإنشاء"
                        value={formatDate(task.createdAt)}
                      />
                    </div>
                    {task.case && (
                      <DetailRow
                        icon={Briefcase}
                        label="القضية"
                        value={task.case.internalNumber}
                      />
                    )}
                    {task.client && (
                      <DetailRow
                        icon={User}
                        label="الموكل"
                        value={task.client.fullName}
                      />
                    )}
                    {task.tags && (
                      <DetailRow
                        icon={Tag}
                        label="الوسوم"
                        value={task.tags}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* تأكيد الحذف */}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد حذف المهمة</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف &quot;{task.title}&quot;؟ لا يمكن التراجع.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (taskId) onDelete(taskId);
                  setConfirmDelete(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 mt-1 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm text-foreground break-words", valueClass)}>
          {value}
        </p>
      </div>
    </div>
  );
}
