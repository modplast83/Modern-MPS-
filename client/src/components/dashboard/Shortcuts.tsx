// client/src/components/dashboard/Shortcuts.tsx
import { Link } from "wouter";
import { PlusCircle, UserPlus, Package } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Shortcuts() {
  const { t } = useTranslation();
  const items = [
    { id: "order", label: t('shortcuts.addOrder'), href: "/orders?create=1", Icon: PlusCircle, bg: "bg-blue-600" },
    { id: "customer", label: t('shortcuts.addCustomer'), href: "/definitions?tab=customers&create=1", Icon: UserPlus, bg: "bg-green-600" },
    { id: "cust-product", label: t('shortcuts.addCustomerProduct'), href: "/definitions?tab=customerProducts&create=1", Icon: Package, bg: "bg-indigo-600" },
  ];

  return (
    <div className={t("components.dashboard.shortcuts.name.mb_6")}>
      <div className={t("components.dashboard.shortcuts.name.flex_flex_col_sm_flex_row_gap_3_items_stretch")}>
        {items.map((it) => (
          <Link key={it.id} href={it.href}>
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-lg text-white shadow-md hover:shadow-lg transition cursor-pointer
                         ${it.bg} hover:opacity-95`}
              title={it.label}
              aria-label={it.label}
              data-testid={`shortcut-${it.id}`}
            >
              <it.Icon className={t("components.dashboard.shortcuts.name.w_6_h_6")} />
              <span className={t("components.dashboard.shortcuts.name.font_semibold")}>{it.label}</span>
              <span className={t("components.dashboard.shortcuts.name.ml_auto_text_sm_opacity_80")}>{t('shortcuts.shortcut')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
