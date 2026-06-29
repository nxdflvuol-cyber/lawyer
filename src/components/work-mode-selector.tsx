"use client";

import { useNavStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Gavel, Users, MessageSquare, Search } from "lucide-react";

const MODES = [
  { value: "office", label: "في المكتب", icon: Building2 },
  { value: "court", label: "في المحكمة", icon: Gavel },
  { value: "client-meeting", label: "مقابلة عميل", icon: Users },
  { value: "pleading", label: "المرافعة", icon: MessageSquare },
  { value: "investigation", label: "التحقيق", icon: Search },
] as const;

export function WorkModeSelector() {
  const workMode = useNavStore((s) => s.workMode);
  const setWorkMode = useNavStore((s) => s.setWorkMode);

  const current = MODES.find((m) => m.value === workMode) ?? MODES[0];
  const CurrentIcon = current.icon;

  return (
    <Select value={workMode} onValueChange={(v) => setWorkMode(v as typeof workMode)}>
      <SelectTrigger className="w-[140px] h-9 hidden md:flex">
        <div className="flex items-center gap-2">
          <CurrentIcon className="w-4 h-4 text-primary" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <SelectItem key={mode.value} value={mode.value}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {mode.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
