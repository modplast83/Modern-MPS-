// client/src/components/dashboard/Shortcuts.tsx
import { Link } from "wouter";
import { PlusCircle, UserPlus, Package } from "lucide-react";

export default function Shortcuts() {
  const items = [
    { id: "order", label: "إضافة طلب", href: "/orders?create=1", Icon: PlusCircle, bg: "bg-blue-600" },
    { id: "customer", label: "إضافة عميل", href: "/definitions?tab=customers&create=1", Icon: UserPlus, bg: "bg-green-600" },
    { id: "cust-product", label: "إضافة منتج عميل", href: "/definitions?tab=customerProducts&create=1", Icon: Package, bg: "bg-indigo-600" },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        {items.map((it) => (
          <Link key={it.id} href={it.href}>
            <a
              className={`flex items-center gap-3 px-5 py-3 rounded-lg text-white shadow-md hover:shadow-lg transition 
                         ${it.bg} hover:opacity-95`}
              title={it.label}
              aria-label={it.label}
            >
              <it.Icon className="w-6 h-6" />
              <span className="font-semibold">{it.label}</span>
              <span className="ml-auto text-sm opacity-80">اختصار</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
