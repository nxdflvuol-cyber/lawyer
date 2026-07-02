"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Upload, FileText, FileImage, FileType2, File as FileIcon,
  X, CheckCircle, Loader2, Link2, Paperclip,
} from "lucide-react";

interface DocumentUploadButtonProps {
  // كيانات الربط
  caseId?: string;
  clientId?: string;
  preCaseId?: string;
  powerOfAttorneyId?: string;
  // مظهر الزر
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  className?: string;
  // رابط تلقائي
  autoLink?: boolean;
  onUploaded?: (documentId: string) => void;
}

const DOC_CATEGORIES = [
  { value: "contract", label: "عقد" },
  { value: "pleading", label: "مذكرة" },
  { value: "ruling", label: "حكم" },
  { value: "evidence", label: "دليل" },
  { value: "correspondence", label: "مراسلة" },
  { value: "id_card", label: "بطاقة هوية" },
  { value: "power_of_attorney", label: "توكيل" },
  { value: "other", label: "أخرى" },
];

function detectDocType(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type;
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return "image";
  if (mime.includes("word") || ["doc", "docx"].includes(ext)) return "word";
  if (mime.startsWith("text/") || ["txt"].includes(ext)) return "text";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg"].includes(ext)) return "audio";
  if (mime.startsWith("video/") || ["mp4", "avi", "mov"].includes(ext)) return "video";
  if (["zip", "rar", "7z"].includes(ext)) return "archive";
  return "other";
}

function getDocIcon(type: string) {
  switch (type) {
    case "pdf": return FileType2;
    case "image": return FileImage;
    case "word": return FileText;
    default: return FileIcon;
  }
}

export function DocumentUploadButton({
  caseId, clientId, preCaseId, powerOfAttorneyId,
  variant = "outline", size = "sm", label = "رفع مستند",
  className, autoLink = true, onUploaded,
}: DocumentUploadButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("other");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    setProgress(0);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(dropped);
    setProgress(0);
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const results = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const docType = detectDocType(file);
        const res = await fetch("/api/documents/upload-multi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            fileData: base64,
            docType,
            category,
            caseId: autoLink ? caseId : undefined,
            clientId: autoLink ? clientId : undefined,
            preCaseId: autoLink ? preCaseId : undefined,
            powerOfAttorneyId: autoLink ? powerOfAttorneyId : undefined,
            linkType: "primary",
          }),
        });
        const data = await res.json();
        results.push(data);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      return results;
    },
    onSuccess: (results) => {
      const success = results.filter((r) => r.success).length;
      const duplicates = results.filter((r) => r.isDuplicate).length;
      toast({
        title: `تم رفع ${success} مستند بنجاح`,
        description: duplicates > 0 ? `${duplicates} مستند كان موجوداً وتم ربطه فقط` : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["precase"] });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      if (onUploaded && results[0]?.document) {
        onUploaded(results[0].document.id);
      }
      setFiles([]);
      setOpen(false);
      setProgress(0);
    },
    onError: () => {
      toast({ title: "فشل الرفع", variant: "destructive" });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Upload className="w-4 h-4 ml-2" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفع مستند</DialogTitle>
            <DialogDescription>
              المستند يُخزن مرة واحدة ويُربط بالكيانات المناسبة تلقائياً
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* منطقة السحب والإفلات */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition"
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp3,.mp4,.zip,.rar"
              />
              {files.length === 0 ? (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">اسحب الملفات هنا أو اضغط للاختيار</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Word, صور, صوت, فيديو, ZIP
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  {files.map((file, i) => {
                    const Icon = getDocIcon(detectDocType(file));
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles(files.filter((_, idx) => idx !== i));
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* تصنيف المستند */}
            <div className="space-y-1.5">
              <Label>تصنيف المستند</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* معلومات الربط */}
            <div className="p-3 rounded-md bg-muted/50 text-xs space-y-1">
              <p className="font-medium">سيتم الربط مع:</p>
              {caseId && <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> القضية</span>}
              {clientId && <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> الموكل</span>}
              {preCaseId && <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> ملف التجهيز</span>}
              {powerOfAttorneyId && <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> التوكيل</span>}
              {!caseId && !clientId && !preCaseId && !powerOfAttorneyId && (
                <span className="text-muted-foreground">لا يوجد ربط تلقائي - سيُربط يدوياً لاحقاً</span>
              )}
            </div>

            {/* شريط التقدم */}
            {uploading && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{progress}%</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={files.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الرفع...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 ml-2" />
                  رفع {files.length > 0 ? `(${files.length})` : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
