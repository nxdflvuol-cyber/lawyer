"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Building2,
  Phone,
  Clock,
  Navigation,
  Search,
  Plus,
  MapPinned,
  Gavel,
  Landmark,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COURTS_DATA = [
  {
    id: "1",
    name: "محكمة شمال القاهرة الابتدائية",
    type: "ابتدائية",
    address: "ميدان العباسية، القاهرة",
    phone: "02-26701234",
    workingHours: "9:00 ص - 2:00 م",
    city: "القاهرة",
    coords: { lat: 30.0782, lng: 31.2896 },
    notes: "تختص بالقضايا المدنية والتجارية بشمال القاهرة",
  },
  {
    id: "2",
    name: "محكمة جنوب القاهرة الابتدائية",
    type: "ابتدائية",
    address: "شارع الجلاء، المعادي",
    phone: "02-23568790",
    workingHours: "9:00 ص - 2:00 م",
    city: "القاهرة",
    coords: { lat: 29.9602, lng: 31.2569 },
    notes: "قضايا مدنية وتجارية وجنح",
  },
  {
    id: "3",
    name: "محكمة استئناف القاهرة",
    type: "استئناف",
    address: "ميدان رمسيس، القاهرة",
    phone: "02-25771234",
    workingHours: "9:00 ص - 3:00 م",
    city: "القاهرة",
    coords: { lat: 30.0626, lng: 31.2497 },
    notes: "محكمة الاستئناف للقضايا المدنية والتجارية والجنائية",
  },
  {
    id: "4",
    name: "محكمة الأسرة - حدائق القبة",
    type: "أحوال شخصية",
    address: "شارع层次的 القبة، القاهرة",
    phone: "02-26854321",
    workingHours: "9:00 ص - 2:00 م",
    city: "القاهرة",
    coords: { lat: 30.0915, lng: 31.2789 },
    notes: "قضايا الأحوال الشخصية والأسرة",
  },
  {
    id: "5",
    name: "محكمة الجيزة الابتدائية",
    type: "ابتدائية",
    address: "شارع النيل، الجيزة",
    phone: "02-35721345",
    workingHours: "9:00 ص - 2:00 م",
    city: "الجيزة",
    coords: { lat: 30.0444, lng: 31.2357 },
    notes: "قضايا مدنية وتجارية وجنح بالجيزة",
  },
  {
    id: "6",
    name: "محكمة نقض القاهرة (التمييز)",
    type: "نقض",
    address: "الأمريكان، المعادي",
    phone: "02-23567890",
    workingHours: "9:00 ص - 3:00 م",
    city: "القاهرة",
    coords: { lat: 29.9627, lng: 31.2754 },
    notes: "المحكمة العليا للطعن على الأحكام",
  },
  {
    id: "7",
    name: "محكمة جنوب القاهرة الاقتصادية",
    type: "اقتصادية",
    address: "مدينة نصر، القاهرة",
    phone: "02-24012345",
    workingHours: "9:00 ص - 3:00 م",
    city: "القاهرة",
    coords: { lat: 30.0566, lng: 31.3656 },
    notes: "تختص بالقضايا الاقتصادية والتجارية الكبرى",
  },
  {
    id: "8",
    name: "مكتب توثيق الزمالك",
    type: "توثيق",
    address: "شارع 26 يوليو، الزمالك",
    phone: "02-27351920",
    workingHours: "9:00 ص - 2:00 م",
    city: "القاهرة",
    coords: { lat: 30.0608, lng: 31.2218 },
    notes: "توثيق العقود والتوكيلات",
  },
];

const TYPE_ICONS: Record<string, typeof Landmark> = {
  "ابتدائية": Landmark,
  "استئناف": Gavel,
  "نقض": Gavel,
  "أحوال شخصية": Building2,
  "اقتصادية": Building2,
  "توثيق": FileText,
};

const TYPE_COLORS: Record<string, string> = {
  "ابتدائية": "bg-emerald-50 text-emerald-700",
  "استئناف": "bg-amber-50 text-amber-700",
  "نقض": "bg-red-50 text-red-700",
  "أحوال شخصية": "bg-purple-50 text-purple-700",
  "اقتصادية": "bg-teal-50 text-teal-700",
  "توثيق": "bg-slate-50 text-slate-700",
};

export function MapsSection() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedCourt, setSelectedCourt] = useState<typeof COURTS_DATA[0] | null>(null);

  const filtered = COURTS_DATA.filter((court) => {
    const matchesSearch =
      court.name.includes(search) ||
      court.address.includes(search) ||
      court.city.includes(search);
    const matchesType = filterType === "all" || court.type === filterType;
    return matchesSearch && matchesType;
  });

  const types = ["all", ...Array.from(new Set(COURTS_DATA.map((c) => c.type)))];

  function openInMaps(court: typeof COURTS_DATA[0]) {
    const url = `https://www.openstreetmap.org/?mlat=${court.coords.lat}&mlon=${court.coords.lng}&zoom=16`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <MapPin className="w-8 h-8 text-primary" />
          الخرائط المهنية
        </h1>
        <p className="text-muted-foreground mt-2">
          قاعدة بيانات المحاكم والمؤسسات القانونية مع المواقع
        </p>
      </div>

      {/* بحث وفلترة */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم المحكمة، العنوان، أو المدينة..."
                className="pr-10"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-md text-sm transition ${
                    filterType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {type === "all" ? "الكل" : type}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* قائمة المحاكم */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            المحاكم والمؤسسات ({filtered.length})
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pl-2">
            {filtered.map((court) => {
              const Icon = TYPE_ICONS[court.type] ?? Landmark;
              return (
                <Card
                  key={court.id}
                  className={`cursor-pointer transition hover:shadow-md ${
                    selectedCourt?.id === court.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedCourt(court)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${TYPE_COLORS[court.type] ?? "bg-slate-50 text-slate-700"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{court.name}</p>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {court.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{court.address}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {court.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {court.workingHours}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                لا توجد نتائج
              </div>
            )}
          </div>
        </div>

        {/* الخريطة / التفاصيل */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPinned className="w-5 h-5 text-primary" />
            التفاصيل والموقع
          </h2>
          {selectedCourt ? (
            <Card>
              <CardContent className="p-0">
                {/* خريطة بسيطة SVG */}
                <div className="relative h-64 bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/20 dark:to-amber-950/20 rounded-t-lg overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0l40 40M40 0L0 40' stroke='%230f766e' stroke-width='0.5'/%3E%3C/svg%3E")`,
                  }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <MapPin className="w-16 h-16 text-primary drop-shadow-lg" />
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full opacity-50 animate-ping" />
                    </div>
                  </div>
                  <Badge className="absolute top-3 right-3" variant="secondary">
                    {selectedCourt.city}
                  </Badge>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-bold text-lg">{selectedCourt.name}</p>
                    <Badge variant="outline" className="mt-1">{selectedCourt.type}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>{selectedCourt.address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span dir="ltr">{selectedCourt.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>{selectedCourt.workingHours}</span>
                    </div>
                  </div>
                  {selectedCourt.notes && (
                    <div className="p-3 rounded-md bg-accent/30 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">ملاحظات:</p>
                      {selectedCourt.notes}
                    </div>
                  )}
                  <Button onClick={() => openInMaps(selectedCourt)} className="w-full">
                    <Navigation className="w-4 h-4 ml-2" />
                    فتح في الخرائط
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  اختر محكمة من القائمة لعرض التفاصيل والموقع
                </p>
              </CardContent>
            </Card>
          )}

          {/* إضافة محكمة */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <Button variant="ghost" className="w-full" onClick={() => toast({ title: "قريباً", description: "إضافة محاكم مخصصة" })}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة محكمة مخصصة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
