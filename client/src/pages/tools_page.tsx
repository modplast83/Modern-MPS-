import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";

/**
 * صفحة الأدوات — نسخة موسّعة وقابلة للاستبدال مباشرةً مكان الملف القديم
 * - RTL + TypeScript
 * - بدون تبعيات إضافية
 * - تحسينات UX + أدوات إنتاج متقدمة
 *
 * المسار المقترح: client/src/pages/tools.tsx
 */

// ===================== أنواع التبويبات =====================

type TabId =
  | "bag-weight"
  | "colors"
  | "color-mix"
  | "ink-usage"
  | "order-cost"
  | "order-cost-advanced"
  | "roll"
  | "thickness"
  | "job-time";

interface TabDef { id: TabId; label: string; }

const tabs: TabDef[] = [
  { id: "bag-weight", label: "حاسبة وزن الأكياس" },
  { id: "colors", label: "الألوان (CMYK / Pantone)" },
  { id: "color-mix", label: "خلطات اللون (صورة/كود)" },
  { id: "ink-usage", label: "حساب استخدام الحبر" },
  { id: "order-cost", label: "تكلفة طلبية (سريع)" },
  { id: "order-cost-advanced", label: "تكلفة طلبية (متقدم)" },
  { id: "roll", label: "وزن/طول الرول" },
  { id: "thickness", label: "تحويل السماكة" },
  { id: "job-time", label: "زمن وتشغيل العملية" },
];

// ===================== الغلاف =====================
export default function ToolsPage(): JSX.Element {
  return (
    <div className={t("pages.tools_page.name.min_h_screen_bg_gray_50")} dir="rtl">
      <Header />
      <div className={t("pages.tools_page.name.flex")}>
        <Sidebar />
        <MobileNav />
        <main className={t("pages.tools_page.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          <div className={t("pages.tools_page.name.mb_6")}>
            <h1 className={t("pages.tools_page.name.text_2xl_font_bold_text_gray_900_mb_2")}>{t('pages.tools_page.الأدوات')}</h1>
            <p className={t("pages.tools_page.name.text_gray_600")}>{t('pages.tools_page.مجموعة_من_الحاسبات_والمحوّلات_المساعدة_في_الإنتاج_والتكلفة_والألوان.')}</p>
          </div>
          <ToolsContent />
        </main>
      </div>
    </div>
  );
}

// ===================== المحتوى =====================
function ToolsContent(): JSX.Element {
  const STORAGE_KEY = "mpbf_tools_active_tab";
  const [active, setActive] = useState<TabId>(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY)) as TabId | null;
    return saved ?? "bag-weight";
  });

  // مشاركة وزن الحقيبة (جم) وبعض القيم بين التبويبات
  const [sharedBagWeightG, setSharedBagWeightG] = useState<number>{t('pages.tools_page.(0);_const_[sharedbagdims,_setsharedbagdims]_=_usestate')}<{ widthCm: number; lengthCm: number } | null>(null);

  useEffect(() => { try { window.localStorage.setItem(STORAGE_KEY, active); } catch {} }, [active]);

  return (
    <div className={t("pages.tools_page.name.p_0_md_p_0_lg_p_0_max_w_7xl")}>
      {/* Tabs */}
      <div className={t("pages.tools_page.name.overflow_x_auto")}>
        <div className={t("pages.tools_page.name.inline_flex_gap_2_bg_gray_100_rounded_xl_p_1_mb_6")} role="tablist" aria-label="{t('pages.tools_page.label.{t('pages.tools_page.aria-label.tools-tabs')}')}">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              role="tab"
              aria-selected={active === t.id}
              className={`px-3 py-2 rounded-lg text-sm md:text-base whitespace-nowrap transition ${
                active === t.id ? "bg-white shadow font-semibold" : "hover:bg-white/60"
              }`}
              title={t.label}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      <div className={t("pages.tools_page.name.grid_gap_6")}>
        {active === "bag-weight" && (
          <Card title="{t('pages.tools_page.title.{t('pages.tools_page.title.حاسبة_وزن_الأكياس')}')}">
            <BagWeightCalculator
              onBagWeight={(g) => setSharedBagWeightG(g)}
              onDims={(d) => setSharedBagDims(d)}
            />
          </Card>
        )}

        {active === "colors" && (
          <Card title="{t('pages.tools_page.title.{t('pages.tools_page.title.الألوان_(cmyk_/_pantone)')}')}">
            <ColorTools />
          </Card>
        )}

        {active === "color-mix" && (
          <Card title="{t('pages.tools_page.title.{t('pages.tools_page.title.خلطات_اللون_من_صورة/كود')}')}">
            <ColorMixTools />
          </Card>
        )}

        {active === "ink-usage" && (
          <Card title="{t('pages.tools_page.title.{t('pages.tools_page.title.تقدير_استخدام_الحبر')}')}">
            <InkUsageCalculator sharedDims={sharedBagDims} />
          </Card>
        )}

        {active === "order-cost" && (
          <Card title="{t('pages.tools_page.title.{t('pages.tools_page.title.حساب_تكلفة_طلبية_—_سريع')}')}">
            <OrderCostCalculator sharedBagWeightG={sharedBagWeightG} />
          </Card>
        )}

        {active === "order-cost-advanced" && (
          <Card title="{t('pages.tools_page.title.{t('pages.tools_page.title.حساب_تكلفة_طلبية_—_متقدم_(bom)')}')}">
            <OrderCostAdvanced sharedBagWeightG={sharedBagWeightG} />
          </Card>
        )}

        {active === "roll" && (
          <Card title="{t('pages.tools_page.title.{t('pages.tools_page.title.حساب_وزن/طول_الرول')}')}">
            <RollTools />
          </Card>
        )}

        {active === "thickness" && (
          <Card title="{t('pages.tools_page.title.{t('pages.tools_page.title.تحويل_السماكة_(ميكرون/مم/قيج)')}')}">
            <ThicknessConverter />
          </Card>
        )}

        {active === "job-time" && (
          <Card title="{t('pages.tools_page.title.{t('pages.tools_page.title.زمن_العمليات_وتخطيط_التشغيل')}')}">
            <JobTimePlanner />
          </Card>
        )}
      </div>
    </div>
  );
}

// ===================== عنصر بطاقة موحد =====================
function Card({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className={t("pages.tools_page.name.bg_white_rounded_2xl_shadow_p_4_md_p_6_border_border_gray_100")} aria-label={title}>
      <div className={t("pages.tools_page.name.flex_items_center_justify_between_mb_4")}>
        <h2 className={t("pages.tools_page.name.text_xl_font_semibold")}>{title}</h2>
        <button className={t("pages.tools_page.name.text_xs_px_2_py_1_rounded_border_hover_bg_gray_50")} onClick={() => window.print()} title="{t('pages.tools_page.title.{t('pages.tools_page.title.طباعة')}')}">{t('pages.tools_page.طباعة')}</button>
      </div>
      <div>{children}</div>
    </section>
  );
}

// ===================== 1) حاسبة وزن الأكياس =====================

type BagType = "flat" | "side-gusset" | "table-cover";

interface BagWeightCalculatorProps {
  onBagWeight?: (gramsPerBag: number) => void;
  onDims?: (d: { widthCm: number; lengthCm: number }) => void;
}

function BagWeightCalculator({ onBagWeight, onDims }: BagWeightCalculatorProps): JSX.Element {
  const [bagType, setBagType] = useState<BagType>{t('pages.tools_page.("flat");_const_[widthcm,_setwidthcm]_=_usestate')}<number>{t('pages.tools_page.(30);_const_[lengthcm,_setlengthcm]_=_usestate')}<number>{t('pages.tools_page.(40);_const_[thicknessmicron,_setthicknessmicron]_=_usestate')}<number>{t('pages.tools_page.(18);_const_[layers,_setlayers]_=_usestate')}<number>{t('pages.tools_page.(2);_const_[density,_setdensity]_=_usestate')}<number>{t('pages.tools_page.(0.95);_const_[sidegussetcm,_setsidegussetcm]_=_usestate')}<number>(0);

  useEffect(() => { onDims?.({ widthCm, lengthCm }); }, [widthCm, lengthCm, onDims]);

  const result = useMemo(() => {
    const t_cm = toNumber(thicknessMicron) * 1e-4; // μm → cm
    let effWidth = toNumber(widthCm);
    if (bagType === "side-gusset") effWidth = toNumber(widthCm) + 2 * toNumber(sideGussetCm);
    const gramsPerBag = Math.max(0, effWidth * toNumber(lengthCm) * toNumber(layers) * t_cm * toNumber(density));
    const kgPer1000 = gramsPerBag; // جم/حبة == كجم/1000 حبة
    return { gramsPerBag, kgPer1000 } as const;
  }, [bagType, widthCm, lengthCm, thicknessMicron, layers, density, sideGussetCm]);

  useEffect(() => { onBagWeight?.(result.gramsPerBag || 0); }, [result.gramsPerBag, onBagWeight]);

  return (
    <div className={t("pages.tools_page.name.grid_md_grid_cols_2_gap_4")}>
      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <LabeledSelect
          label="{t('pages.tools_page.label.{t('pages.tools_page.label.نوع_الكيس')}')}"
          value={bagType}
          onChange={(v) => setBagType(v as BagType)}
          options={[
            { value: "flat", label: "كيس مسطح (بدون دخلات)" },
            { value: "side-gusset", label: "كيس بدخلات جانبية (سايد فولد)" },
            { value: "table-cover", label: "سفرة مسطحة" },
          ]}
          hint="اختر النوع لضبط الحسابات والمدخلات المناسبة"
        />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.العرض_(سم)_—_مفرود')}')}" value={widthCm} onChange={setWidthCm} step={0.1} />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الطول_(سم)')}')}" value={lengthCm} onChange={setLengthCm} step={0.1} />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.السماكة_(ميكرون)')}')}" value={thicknessMicron} onChange={setThicknessMicron} step={0.1} />
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.عدد_الطبقات')}')}" value={layers} onChange={setLayers} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الكثافة_g/cm³')}')}" value={density} onChange={setDensity} step={0.01} />
        </div>
        {bagType === "side-gusset" && (
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.دخلات_جانبية_(سم)_—_لكل_جانب')}')}" value={sideGussetCm} onChange={setSideGussetCm} step={0.1} />
        )}
        <p className={t("pages.tools_page.name.text_xs_text_gray_500")}>{t('pages.tools_page.*_العرض_مفرود._في_حالة_الدخلات_الجانبية_يتم_إضافة_(2_×_الدخلات)_إلى_العرض_المؤثر.')}</p>
      </div>
      <div className={t("pages.tools_page.name.grid_gap_3_bg_gray_50_rounded_xl_p_4")}>
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.وزن_الكيس_(جم)')}')}" value={fmtFixed(result.gramsPerBag, 3)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.وزن_1000_كيس_(كجم)')}')}" value={fmtFixed(result.kgPer1000, 3)} />
      </div>
    </div>
  );
}

// ===================== 2) أدوات الألوان (قياسية) =====================
function ColorTools(): JSX.Element {
  const [c, setC] = useState<number>{t('pages.tools_page.(0);_const_[m,_setm]_=_usestate')}<number>{t('pages.tools_page.(0);_const_[y,_sety]_=_usestate')}<number>{t('pages.tools_page.(0);_const_[k,_setk]_=_usestate')}<number>(0);
  const rgb = useMemo(() => cmykToRgb(c, m, y, k), [c, m, y, k]);
  const hex = useMemo(() =>{t('pages.tools_page.rgbtohex(rgb.r,_rgb.g,_rgb.b),_[rgb]);_const_[pantonecode,_setpantonecode]_=_usestate')}<string>{t('pages.tools_page.("");_return_(')}<div className={t("pages.tools_page.name.grid_md_grid_cols_2_gap_4")}>
      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <h3 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.تحويل_cmyk_→_rgb/hex')}</h3>
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.c_%')}')}" value={c} onChange={setC} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.m_%')}')}" value={m} onChange={setM} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.y_%')}')}" value={y} onChange={setY} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.k_%')}')}" value={k} onChange={setK} step={1} />
        </div>
        <div className={t("pages.tools_page.name.grid_gap_2_bg_gray_50_rounded_xl_p_4")}>
          <div className={t("pages.tools_page.name.flex_items_center_gap_3")}>
            <div className={t("pages.tools_page.name.w_16_h_10_rounded_border")} style={{ backgroundColor: hex }} title="{t('pages.tools_page.title.{t('pages.tools_page.title.معاينة_اللون')}')}" />
            <div className={t("pages.tools_page.name.grid_text_sm")}>
              <span>RGB: {rgb.r}, {rgb.g}, {rgb.b}</span>
              <span>HEX: {hex}</span>
            </div>
          </div>
          <p className={t("pages.tools_page.name.text_xs_text_gray_500")}>{t('pages.tools_page.التحويل_تقريبي_وقد_يختلف_حسب_الحبر_والمادة_وظروف_الطباعة.')}</p>
        </div>
        <div className={t("pages.tools_page.name.grid_gap_2_mt_3")}>
          <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.مرجع_pantone_(اختياري)')}</h4>
          <LabeledText label="{t('pages.tools_page.label.{t('pages.tools_page.label.كود_pantone_(مثال:_186_c)')}')}" value={pantoneCode} onChange={setPantoneCode} placeholder="{t('pages.tools_page.placeholder.أدخل_الكود_للمرجعة_الداخلية')}" />
          <p className={t("pages.tools_page.name.text_xs_text_gray_500")}>{t('pages.tools_page.لا_يمكن_اشتقاق_cmyk_دقيق_من_pantone_بدون_جدول_مرجعي_معتمد.')}</p>
        </div>
      </div>
      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <h3 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.تحويل_rgb_→_cmyk')}</h3>
        <RgbToCmykWidget />
      </div>
    </div>
  );
}

function RgbToCmykWidget(): JSX.Element {
  const [r, setR] = useState<number>{t('pages.tools_page.(255);_const_[g,_setg]_=_usestate')}<number>{t('pages.tools_page.(255);_const_[b,_setb]_=_usestate')}<number>(255);
  const cmyk = useMemo(() => rgbToCmyk(r, g, b), [r, g, b]);
  const hex = useMemo(() =>{t('pages.tools_page.rgbtohex(r,_g,_b),_[r,_g,_b]);_return_(')}<div className={t("pages.tools_page.name.grid_gap_3")}>
      <div className={t("pages.tools_page.name.grid_grid_cols_3_gap_3")}>
        <LabeledNumber label="R" value={r} onChange={setR} step={1} />
        <LabeledNumber label="G" value={g} onChange={setG} step={1} />
        <LabeledNumber label="B" value={b} onChange={setB} step={1} />
      </div>
      <div className={t("pages.tools_page.name.flex_items_center_gap_3")}>
        <div className={t("pages.tools_page.name.w_16_h_10_rounded_border")} style={{ backgroundColor: hex }} />
        <div className={t("pages.tools_page.name.grid_text_sm")}>
          <span>HEX: {hex}</span>
          <span>CMYK: {cmyk.c}% / {cmyk.m}% / {cmyk.y}% / {cmyk.k}%</span>
        </div>
      </div>
    </div>
  );
}

// ===================== 3) خلطات اللون (من صورة/كود) =====================
function ColorMixTools(): JSX.Element {
  const [hex, setHex] = useState<string>{t('pages.tools_page.("#008dcb");_const_[cmyk,_setcmyk]_=_usestate')}<CMYK>(() =>{t('pages.tools_page.rgbtocmyk(0,_141,_203));_const_[totalinkpct,_settotalinkpct]_=_usestate')}<number>{t('pages.tools_page.(100);_//_مجموع_نسب_الخلطة_المطلوب_(افتراضي_100)_//_رفع_صورة_واستخراج_ألوان_مهيمنة_const_[palette,_setpalette]_=_usestate')}<string[]>{t('pages.tools_page.([]);_const_canvasref_=_useref')}<HTMLCanvasElement | null>(null);

  function onHexChange(v: string) {
    const clean = normalizeHex(v);
    setHex(clean);
    const { r, g, b } = hexToRgb(clean);
    setCmyk(rgbToCmyk(r, g, b));
  }

  function handleImageUpload(file: File) {
    const img = new Image();
    img.onload = () => {
      const cvs = canvasRef.current ?? document.createElement("canvas");
      const ctx = cvs.getContext("2d");
      if (!ctx) return;
      const W = 240, H = Math.max(120, Math.floor((img.height / img.width) * 240));
      cvs.width = W; cvs.height = H;
      ctx.drawImage(img, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;
      const buckets: Record<string, number> = {};
      // كوانتنزيشن بسيط: تجميع كل قناة على 8 مستويات (0..7)
      for (let i = 0; i < data.length; i += 16) { // تخطي عينات لتسريع
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const R = r >> 5, G = g >> 5, B = b >> 5; // 0..7
        const key = `${R}-${G}-${B}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const entries = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const pal = entries.map(([k]) => {
        const [R, G, B] = k.split("-").map((n) => Number(n));
        return rgbToHex(R * 32 + 16, G * 32 + 16, B * 32 + 16);
      });
      setPalette(pal);
      if (pal[0]) onHexChange(pal[0]);
    };
    img.onerror = () => { /* تجاهل */ };
    img.src = URL.createObjectURL(file);
  }

  // اقتراح خلطة: توزيع نسبي حسب نسب CMYK
  const mix = useMemo(() => {
    const total = Math.max(1, cmyk.c + cmyk.m + cmyk.y + cmyk.k);
    const factor = totalInkPct / total;
    return {
      C: round(cmyk.c * factor, 1),
      M: round(cmyk.m * factor, 1),
      Y: round(cmyk.y * factor, 1),
      K: round(cmyk.k * factor, 1),
    };
  }, [cmyk, totalInkPct]);

  return (
    <div className={t("pages.tools_page.name.grid_md_grid_cols_2_gap_4")}>
      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <LabeledText label="{t('pages.tools_page.label.{t('pages.tools_page.label.hex')}')}" value={hex} onChange={onHexChange} placeholder="{t('pages.tools_page.placeholder.#rrggbb')}" />
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.c_%')}')}" value={cmyk.c} onChange={(v) => setCmyk({ ...cmyk, c: v })} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.m_%')}')}" value={cmyk.m} onChange={(v) => setCmyk({ ...cmyk, m: v })} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.y_%')}')}" value={cmyk.y} onChange={(v) => setCmyk({ ...cmyk, y: v })} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.k_%')}')}" value={cmyk.k} onChange={(v) => setCmyk({ ...cmyk, k: v })} step={1} />
        </div>
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.مجموع_الخلطة_المطلوب_%')}')}" value={totalInkPct} onChange={setTotalInkPct} step={1} />
          <div className={t("pages.tools_page.name.flex_items_end_gap_2")}>
            <div className={t("pages.tools_page.name.w_16_h_10_rounded_border")} style={{ backgroundColor: hex }} />
            <span className={t("pages.tools_page.name.text_xs_text_gray_600")}>{t('pages.tools_page.معاينة')}</span>
          </div>
        </div>
        <div className={t("pages.tools_page.name.grid_gap_2_bg_gray_50_rounded_xl_p_4")}>
          <h4 className={t("pages.tools_page.name.font_semibold")}>اقتراح خلطة (نِسَب من إجمالي {totalInkPct}%)</h4>
          <div className={t("pages.tools_page.name.grid_grid_cols_4_gap_3")}>
            <Metric label="C" value={`${mix.C}%`} />
            <Metric label="M" value={`${mix.M}%`} />
            <Metric label="Y" value={`${mix.Y}%`} />
            <Metric label="K" value={`${mix.K}%`} />
          </div>
          <p className={t("pages.tools_page.name.text_11px_text_gray_500")}>{t('pages.tools_page.اقتراح_أولي_—_يلزم_اختبار_عملي_(drawdown)_على_نفس_المادة_والآلة.')}</p>
        </div>
      </div>

      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.استخراج_ألوان_من_صورة_تصميم')}</h4>
        <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
        <canvas ref={canvasRef} className={t("pages.tools_page.name.hidden")} />
        {palette.length >{t('pages.tools_page.0_&&_(')}<div className={t("pages.tools_page.name.grid_grid_cols_3_md_grid_cols_6_gap_2")}>
            {palette.map((p) => (
              <button key={p} className={t("pages.tools_page.name.h_10_rounded_border")} style={{ backgroundColor: p }} title={p} onClick={() => onHexChange(p)} />
            ))}
          </div>
        )}
        <p className={t("pages.tools_page.name.text_xs_text_gray_500")}>{t('pages.tools_page.انقر_على_أي_لون_من_اللوحة_لتحديث_الخلطة_المقترحة.')}</p>
      </div>
    </div>
  );
}

// ===================== 4) تقدير استخدام الحبر =====================
function InkUsageCalculator({ sharedDims }: { sharedDims: { widthCm: number; lengthCm: number } | null }): JSX.Element {
  const [widthCm, setWidthCm] = useState<number>{t('pages.tools_page.(shareddims?.widthcm_??_30);_const_[lengthcm,_setlengthcm]_=_usestate')}<number>{t('pages.tools_page.(shareddims?.lengthcm_??_40);_const_[printsides,_setprintsides]_=_usestate')}<1 | 2>{t('pages.tools_page.(1);_const_[coveragepct,_setcoveragepct]_=_usestate')}<number>{t('pages.tools_page.(30);_//_نسبة_التغطية_على_المساحة_المطبوعة_const_[inklaydowngsm,_setinklaydowngsm]_=_usestate')}<number>{t('pages.tools_page.(1.2);_//_جرام/م²_(حسب_الأنيـلوكس/الحبر)_const_[qty,_setqty]_=_usestate')}<number>(10000);

  useEffect(() => { if (sharedDims) { setWidthCm(sharedDims.widthCm); setLengthCm(sharedDims.lengthCm); } }, [sharedDims]);

  const result = useMemo(() => {
    // مساحة الكيس (م²) لكل وجه
    const area_m2 = (toNumber(widthCm) / 100) * (toNumber(lengthCm) / 100);
    // مساحة مطبوعة فعليًا = area * coverage * sides
    const printed_m2_per_bag = area_m2 * (toNumber(coveragePct) / 100) * toNumber(printSides);
    const total_printed_m2 = printed_m2_per_bag * toNumber(qty);
    const ink_grams = total_printed_m2 * toNumber(inkLaydownGsm);
    const ink_kg = ink_grams / 1000;
    return { printed_m2_per_bag, total_printed_m2, ink_kg } as const;
  }, [widthCm, lengthCm, printSides, coveragePct, inkLaydownGsm, qty]);

  return (
    <div className={t("pages.tools_page.name.grid_md_grid_cols_2_gap_4")}>
      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.العرض_(سم)')}')}" value={widthCm} onChange={setWidthCm} step={0.1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الطول_(سم)')}')}" value={lengthCm} onChange={setLengthCm} step={0.1} />
        </div>
        <LabeledSelect label="{t('pages.tools_page.label.{t('pages.tools_page.label.عدد_الأوجه_المطبوعة')}')}" value={String(printSides)} onChange={(v) => setPrintSides(Number(v) === 2 ? 2 : 1)} options={[{ value: "1", label: "وجه واحد" }, { value: "2", label: "وجهان" }]} />
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.نسبة_التغطية_%')}')}" value={coveragePct} onChange={setCoveragePct} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.بدل_الحبر_(g/m²)')}')}" value={inkLaydownGsm} onChange={setInkLaydownGsm} step={0.1} />
        </div>
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الكمية_(حبة)')}')}" value={qty} onChange={setQty} step={500} />
        <p className={t("pages.tools_page.name.text_11px_text_gray_500")}>{t('pages.tools_page.قيم_g/m²_تقريبية_وتختلف_حسب_الأنيـلوكس،_نوع_الحبر،_والسطح.')}</p>
      </div>
      <div className={t("pages.tools_page.name.grid_gap_3_bg_gray_50_rounded_xl_p_4")}>
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.مساحة_مطبوعة/حبة_(م²)')}')}" value={fmtFixed(result.printed_m2_per_bag, 4)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.المساحة_المطبوعة_الكلّية_(م²)')}')}" value={fmtFixed(result.total_printed_m2, 2)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.كمية_الحبر_(كجم)')}')}" value={fmtFixed(result.ink_kg, 2)} emphasis />
      </div>
    </div>
  );
}

// ===================== 5) تكلفة طلبية — سريع (موجود أعلاه) =====================
interface OrderCostCalculatorProps { sharedBagWeightG?: number; }
function OrderCostCalculator({ sharedBagWeightG = 0 }: OrderCostCalculatorProps): JSX.Element {
  const [qty, setQty] = useState<number>{t('pages.tools_page.(10000);_const_[bagweightg,_setbagweightg]_=_usestate')}<number>{t('pages.tools_page.(sharedbagweightg_||_5);_const_[useshared,_setuseshared]_=_usestate')}<boolean>{t('pages.tools_page.(boolean(sharedbagweightg));_const_[materialpriceperkg,_setmaterialpriceperkg]_=_usestate')}<number>{t('pages.tools_page.(7.0);_const_[wastepct,_setwastepct]_=_usestate')}<number>{t('pages.tools_page.(4);_const_[extrusioncostperkg,_setextrusioncostperkg]_=_usestate')}<number>{t('pages.tools_page.(1.0);_const_[cuttingcostper1000,_setcuttingcostper1000]_=_usestate')}<number>{t('pages.tools_page.(6.0);_const_[colors,_setcolors]_=_usestate')}<number>{t('pages.tools_page.(0);_const_[printcostpercolorper1000,_setprintcostpercolorper1000]_=_usestate')}<number>{t('pages.tools_page.(5.0);_const_[platecost,_setplatecost]_=_usestate')}<number>{t('pages.tools_page.(0);_const_[overheadfixed,_setoverheadfixed]_=_usestate')}<number>{t('pages.tools_page.(0);_const_[marginpct,_setmarginpct]_=_usestate')}<number>(10);
  useEffect(() => { if (useShared) setBagWeightG(sharedBagWeightG || 0); }, [sharedBagWeightG, useShared]);
  const result = useMemo(() => {
    const weightPerBagG = toNumber(bagWeightG);
    const totalWeightKg = (toNumber(qty) * weightPerBagG) / 1_000_000; // g → kg
    const materialKg = totalWeightKg * (1 + toNumber(wastePct) / 100);
    const materialCost = materialKg * toNumber(materialPricePerKg);
    const extrusionCost = materialKg * toNumber(extrusionCostPerKg);
    const cuttingCost = (toNumber(qty) / 1000) * toNumber(cuttingCostPer1000);
    const printingCost = (toNumber(qty) / 1000) * toNumber(colors) * toNumber(printCostPerColorPer1000);
    const subtotal = materialCost + extrusionCost + cuttingCost + printingCost + toNumber(plateCost) + toNumber(overheadFixed);
    const margin = subtotal * (toNumber(marginPct) / 100);
    const total = subtotal + margin;
    return { totalWeightKg, materialKg, materialCost, extrusionCost, cuttingCost, printingCost, subtotal, margin, total, unitPrice: total / Math.max(1, toNumber(qty)), pricePerKg: total / Math.max(0.000001, materialKg) } as const;
  }, [qty, bagWeightG, wastePct, materialPricePerKg, extrusionCostPerKg, cuttingCostPer1000, colors, printCostPerColorPer1000, plateCost, overheadFixed, marginPct]);
  return (
    <div className={t("pages.tools_page.name.grid_lg_grid_cols_2_gap_4")}>
      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <label className={t("pages.tools_page.name.flex_items_center_gap_2_text_sm")}>
          <input type="checkbox" className={t("pages.tools_page.name.accent_black")} checked={useShared} onChange={(e) => setUseShared(e.target.checked)} />
          استخدم وزن الكيس من التبويب الأول ({fmtFixed(sharedBagWeightG, 3)} جم)
        </label>
        {!useShared && (<LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.وزن_الكيس_(جم)')}')}" value={bagWeightG} onChange={setBagWeightG} step={0.01} />)}
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الكمية_(حبة)')}')}" value={qty} onChange={setQty} step={500} />
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.سعر_المادة_(ر.س/كجم)')}')}" value={materialPricePerKg} onChange={setMaterialPricePerKg} step={0.1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.هالك_%')}')}" value={wastePct} onChange={setWastePct} step={0.5} />
        </div>
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكلفة_الاكسترودر_(ر.س/كجم)')}')}" value={extrusionCostPerKg} onChange={setExtrusionCostPerKg} step={0.1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكلفة_التقطيع_(ر.س/1000)')}')}" value={cuttingCostPer1000} onChange={setCuttingCostPer1000} step={0.1} />
        </div>
        <div className={t("pages.tools_page.name.grid_grid_cols_3_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.عدد_الألوان')}')}" value={colors} onChange={setColors} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.طباعة_(ر.س/لون/1000)')}')}" value={printCostPerColorPer1000} onChange={setPrintCostPerColorPer1000} step={0.1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكلفة_الكليشة/الربلات_(ر.س)')}')}" value={plateCost} onChange={setPlateCost} step={1} />
        </div>
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.مصروفات_ثابتة_(ر.س)')}')}" value={overheadFixed} onChange={setOverheadFixed} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.هامش_الربح_%')}')}" value={marginPct} onChange={setMarginPct} step={0.5} />
        </div>
      </div>
      <div className={t("pages.tools_page.name.grid_gap_3_bg_gray_50_rounded_xl_p_4")}>
        <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.النتائج')}</h4>
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.الوزن_الإجمالي_(كجم)')}')}" value={fmtFixed(result.totalWeightKg, 3)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.وزن_المادة_بعد_الهالك_(كجم)')}')}" value={fmtFixed(result.materialKg, 3)} />
        <Divider />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكلفة_المادة')}')}" value={fmtSar(result.materialCost)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكلفة_الاكسترودر')}')}" value={fmtSar(result.extrusionCost)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكلفة_التقطيع')}')}" value={fmtSar(result.cuttingCost)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكلفة_الطباعة')}')}" value={fmtSar(result.printingCost)} />
        <Divider />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.الإجمالي_قبل_الربح')}')}" value={fmtSar(result.subtotal)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.الربح')}')}" value={fmtSar(result.margin)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.الإجمالي_مع_الربح')}')}" value={fmtSar(result.total)} emphasis />
        <Divider />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.سعر_الحبة')}')}" value={fmtSar(result.unitPrice)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.سعر_للكيلو')}')}" value={fmtSar(result.pricePerKg)} />
      </div>
    </div>
  );
}

// ===================== 6) تكلفة طلبية — متقدم (BOM) =====================
interface BomItem { name: string; pct: number; pricePerKg: number; }
interface OtherCost { name: string; type: "perKg" | "per1000" | "fixed"; value: number; }

function OrderCostAdvanced({ sharedBagWeightG = 0 }: { sharedBagWeightG?: number }): JSX.Element {
  const [qty, setQty] = useState<number>{t('pages.tools_page.(10000);_const_[bagweightg,_setbagweightg]_=_usestate')}<number>{t('pages.tools_page.(sharedbagweightg_||_5);_const_[useshared,_setuseshared]_=_usestate')}<boolean>{t('pages.tools_page.(boolean(sharedbagweightg));_//_مكونات_الخلطة_(bom)_const_[bom,_setbom]_=_usestate')}<BomItem[]>([
    { name: "HDPE Base", pct: 90, pricePerKg: 7.0 },
    { name: "Masterbatch", pct: 8, pricePerKg: 12.0 },
    { name: "Additive", pct: 2, pricePerKg: 18.0 },
  ]);

  // تكاليف أخرى متنوعة
  const [otherCosts, setOtherCosts] = useState<OtherCost[]>([
    { name: "Extrusion Energy", type: "perKg", value: 0.4 },
    { name: "Cutting", type: "per1000", value: 6.0 },
    { name: "Setup", type: "fixed", value: 50 },
  ]);

  const [wastePct, setWastePct] = useState<number>{t('pages.tools_page.(4);_const_[colors,_setcolors]_=_usestate')}<number>{t('pages.tools_page.(0);_const_[printcostpercolorper1000,_setprintcostpercolorper1000]_=_usestate')}<number>{t('pages.tools_page.(5.0);_const_[marginpct,_setmarginpct]_=_usestate')}<number>(10);

  useEffect(() => { if (useShared) setBagWeightG(sharedBagWeightG || 0); }, [sharedBagWeightG, useShared]);

  const blend = useMemo(() => {
    const totalPct = Math.max(1, bom.reduce((s, r) => s + toNumber(r.pct), 0));
    const norm = bom.map((r) => ({ ...r, weight: r.pct / totalPct }));
    const pricePerKg = norm.reduce((sum, r) => sum + r.weight * toNumber(r.pricePerKg), 0);
    return { pricePerKg } as const;
  }, [bom]);

  const result = useMemo(() => {
    const weightPerBagG = toNumber(bagWeightG);
    const totalWeightKg = (toNumber(qty) * weightPerBagG) / 1_000_000; // g → kg
    const materialKg = totalWeightKg * (1 + toNumber(wastePct) / 100);

    // تكلفة المادة من الخلطة
    const materialCost = materialKg * blend.pricePerKg;

    // تكاليف أخرى
    const others = otherCosts.reduce(
      (acc, c) => {
        if (c.type === "perKg") acc.sum += materialKg * toNumber(c.value);
        else if (c.type === "per1000") acc.sum += (toNumber(qty) / 1000) * toNumber(c.value);
        else acc.sum += toNumber(c.value);
        return acc;
      },
      { sum: 0 }
    ).sum;

    // طباعة
    const printingCost = (toNumber(qty) / 1000) * toNumber(colors) * toNumber(printCostPerColorPer1000);

    const subtotal = materialCost + others + printingCost;
    const margin = subtotal * (toNumber(marginPct) / 100);
    const total = subtotal + margin;

    return {
      materialKg,
      blendPrice: blend.pricePerKg,
      materialCost,
      otherCosts: others,
      printingCost,
      subtotal,
      margin,
      total,
      unitPrice: total / Math.max(1, toNumber(qty)),
      pricePerKg: total / Math.max(0.000001, materialKg),
    } as const;
  }, [qty, bagWeightG, wastePct, blend.pricePerKg, otherCosts, colors, printCostPerColorPer1000, marginPct]);

  return (
    <div className={t("pages.tools_page.name.grid_gap_6")}>
      <div className={t("pages.tools_page.name.grid_lg_grid_cols_2_gap_4")}>
        <div className={t("pages.tools_page.name.grid_gap_3")}>
          <label className={t("pages.tools_page.name.flex_items_center_gap_2_text_sm")}>
            <input type="checkbox" className={t("pages.tools_page.name.accent_black")} checked={useShared} onChange={(e) => setUseShared(e.target.checked)} />
            استخدم وزن الحقيبة من التبويب الأول ({fmtFixed(sharedBagWeightG, 3)} جم)
          </label>
          {!useShared && <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.وزن_الحقيبة_(جم)')}')}" value={bagWeightG} onChange={setBagWeightG} step={0.01} />}
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الكمية_(حبة)')}')}" value={qty} onChange={setQty} step={500} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.هالك_%')}')}" value={wastePct} onChange={setWastePct} step={0.5} />
          <Divider />
          <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.مكونات_الخلطة_(bom)')}</h4>
          <BomTable rows={bom} setRows={setBom} />
          <p className={t("pages.tools_page.name.text_11px_text_gray_500")}>{t('pages.tools_page.يجب_أن_يكون_مجموع_النِّسَب_تقريبيًا_100%،_وسيتم_التطبيع_تلقائيًا_للحساب.')}</p>
        </div>
        <div className={t("pages.tools_page.name.grid_gap_3")}>
          <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.تكاليف_أخرى')}</h4>
          <OtherCostsTable rows={otherCosts} setRows={setOtherCosts} />
          <div className={t("pages.tools_page.name.grid_grid_cols_3_gap_3")}>
            <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.عدد_الألوان')}')}" value={colors} onChange={setColors} step={1} />
            <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.طباعة_(ر.س/لون/1000)')}')}" value={printCostPerColorPer1000} onChange={setPrintCostPerColorPer1000} step={0.1} />
            <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.هامش_الربح_%')}')}" value={marginPct} onChange={setMarginPct} step={0.5} />
          </div>
        </div>
      </div>

      <div className={t("pages.tools_page.name.grid_gap_3_bg_gray_50_rounded_xl_p_4")}>
        <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.نتائج_التكلفة')}</h4>
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.سعر_الخلطة_(ر.س/كجم)')}')}" value={fmtSar(result.blendPrice)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.وزن_المادة_بعد_الهالك_(كجم)')}')}" value={fmtFixed(result.materialKg, 3)} />
        <Divider />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكلفة_المادة')}')}" value={fmtSar(result.materialCost)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكاليف_أخرى')}')}" value={fmtSar(result.otherCosts)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.تكلفة_الطباعة')}')}" value={fmtSar(result.printingCost)} />
        <Divider />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.الإجمالي_قبل_الربح')}')}" value={fmtSar(result.subtotal)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.الربح')}')}" value={fmtSar(result.margin)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.الإجمالي_مع_الربح')}')}" value={fmtSar(result.total)} emphasis />
        <Divider />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.سعر_الحبة')}')}" value={fmtSar(result.unitPrice)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.سعر_للكيلو')}')}" value={fmtSar(result.pricePerKg)} />
      </div>
    </div>
  );
}

function BomTable({ rows, setRows }: { rows: BomItem[]; setRows: (r: BomItem[]) => void }): JSX.Element {
  function updateRow(idx: number, patch: Partial<BomItem>) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function addRow() { setRows([...rows, { name: "New", pct: 0, pricePerKg: 0 }]); }
  function delRow(idx: number) { setRows(rows.filter((_, i) => i !== idx)); }
  return (
    <div className={t("pages.tools_page.name.grid_gap_2")}>
      {rows.map((r, i) => (
        <div key={i} className={t("pages.tools_page.name.grid_grid_cols_12_gap_2_items_end")}>
          <input className={t("pages.tools_page.name.col_span_5_border_rounded_lg_px_3_py_2")} value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} />
          <input type="number" className={t("pages.tools_page.name.col_span_2_border_rounded_lg_px_3_py_2")} value={r.pct} step={0.1} onChange={(e) => updateRow(i, { pct: Number(e.target.value) })} placeholder="%" />
          <input type="number" className={t("pages.tools_page.name.col_span_3_border_rounded_lg_px_3_py_2")} value={r.pricePerKg} step={0.1} onChange={(e) => updateRow(i, { pricePerKg: Number(e.target.value) })} placeholder="{t('pages.tools_page.placeholder.ر.س/كجم')}" />
          <button className={t("pages.tools_page.name.col_span_2_text_xs_px_2_py_2_rounded_border_hover_bg_gray_50")} onClick={() => delRow(i)}>{t('pages.tools_page.حذف')}</button>
        </div>
      ))}
      <button className={t("pages.tools_page.name.text_xs_px_2_py_2_rounded_border_hover_bg_gray_50_w_fit")} onClick={addRow}>{t('pages.tools_page.+_إضافة_مكوّن')}</button>
    </div>
  );
}

function OtherCostsTable({ rows, setRows }: { rows: OtherCost[]; setRows: (r: OtherCost[]) => void }): JSX.Element {
  function updateRow(idx: number, patch: Partial<OtherCost>) { setRows(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r))); }
  function addRow() { setRows([...rows, { name: "New Cost", type: "fixed", value: 0 }]); }
  function delRow(idx: number) { setRows(rows.filter((_, i) => i !== idx)); }
  return (
    <div className={t("pages.tools_page.name.grid_gap_2")}>
      {rows.map((r, i) => (
        <div key={i} className={t("pages.tools_page.name.grid_grid_cols_12_gap_2_items_end")}>
          <input className={t("pages.tools_page.name.col_span_5_border_rounded_lg_px_3_py_2")} value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} />
          <select className={t("pages.tools_page.name.col_span_3_border_rounded_lg_px_3_py_2_bg_white")} value={r.type} onChange={(e) => updateRow(i, { type: e.target.value as OtherCost["type"] })}>
            <option value="perKg">{t('pages.tools_page.ر.س/كجم')}</option>
            <option value="per1000">{t('pages.tools_page.ر.س/1000_حبة')}</option>
            <option value="fixed">{t('pages.tools_page.مبلغ_ثابت')}</option>
          </select>
          <input type="number" className={t("pages.tools_page.name.col_span_2_border_rounded_lg_px_3_py_2")} value={r.value} step={0.1} onChange={(e) => updateRow(i, { value: Number(e.target.value) })} />
          <button className={t("pages.tools_page.name.col_span_2_text_xs_px_2_py_2_rounded_border_hover_bg_gray_50")} onClick={() => delRow(i)}>{t('pages.tools_page.حذف')}</button>
        </div>
      ))}
      <button className={t("pages.tools_page.name.text_xs_px_2_py_2_rounded_border_hover_bg_gray_50_w_fit")} onClick={addRow}>{t('pages.tools_page.+_إضافة_تكلفة')}</button>
    </div>
  );
}

// ===================== 7) وزن/طول الرول (كما هو مع تحسينات طفيفة) =====================
function RollTools(): JSX.Element {
  const [rollWeightKg, setRollWeightKg] = useState<number>{t('pages.tools_page.(25);_const_[coreweightkg,_setcoreweightkg]_=_usestate')}<number>{t('pages.tools_page.(0.4);_const_[rollwidthcm,_setrollwidthcm]_=_usestate')}<number>{t('pages.tools_page.(60);_const_[rollthicknessmicron,_setrollthicknessmicron]_=_usestate')}<number>{t('pages.tools_page.(18);_const_[rolldensity,_setrolldensity]_=_usestate')}<number>(0.95);
  const netRollWeightG = Math.max(0, toNumber(rollWeightKg) - toNumber(coreWeightKg)) * 1000;
  const thicknessCm = toNumber(rollThicknessMicron) * 1e-4;
  const lengthM = useMemo(() => {
    const denom = toNumber(rollWidthCm) * thicknessCm * toNumber(rollDensity) * 100; // سم → متر
    if (denom <= 0) return 0; return netRollWeightG / denom;
  }, [netRollWeightG, rollWidthCm, thicknessCm, rollDensity]);
  const [targetLengthM, setTargetLengthM] = useState<number>{t('pages.tools_page.(1000);_const_[twidthcm,_settwidthcm]_=_usestate')}<number>{t('pages.tools_page.(60);_const_[tthicknessmicron,_settthicknessmicron]_=_usestate')}<number>{t('pages.tools_page.(18);_const_[tdensity,_settdensity]_=_usestate')}<number>(0.95);
  const tThicknessCm = toNumber(tThicknessMicron) * 1e-4;
  const neededWeightKg = useMemo(() => {
    const grams = toNumber(tWidthCm) * tThicknessCm * toNumber(targetLengthM) * 100 * toNumber(tDensity);
    return grams / 1000;
  }, [targetLengthM, tWidthCm, tThicknessCm, tDensity]);
  return (
    <div className={t("pages.tools_page.name.grid_lg_grid_cols_2_gap_6")}>
      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.من_وزن_الرول_→_الطول_التقريبي')}</h4>
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.وزن_الرول_(كجم)')}')}" value={rollWeightKg} onChange={setRollWeightKg} step={0.1} />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.وزن_الكرتون/اللب_(كجم)')}')}" value={coreWeightKg} onChange={setCoreWeightKg} step={0.01} />
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.العرض_(سم)')}')}" value={rollWidthCm} onChange={setRollWidthCm} step={0.1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.السماكة_(ميكرون)')}')}" value={rollThicknessMicron} onChange={setRollThicknessMicron} step={0.1} />
        </div>
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الكثافة_g/cm³')}')}" value={rollDensity} onChange={setRollDensity} step={0.01} />
        <Divider />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.الطول_التقريبي_(متر)')}')}" value={fmtFixed(lengthM, 1)} emphasis />
      </div>
      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.من_الطول_المطلوب_→_وزن_الرول_المطلوب')}</h4>
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الطول_المطلوب_(متر)')}')}" value={targetLengthM} onChange={setTargetLengthM} step={1} />
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.العرض_(سم)')}')}" value={tWidthCm} onChange={setTWidthCm} step={0.1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.السماكة_(ميكرون)')}')}" value={tThicknessMicron} onChange={setTThicknessMicron} step={0.1} />
        </div>
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الكثافة_g/cm³')}')}" value={tDensity} onChange={setTDensity} step={0.01} />
        <Divider />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.الوزن_التقريبي_المطلوب_(كجم)')}')}" value={fmtFixed(neededWeightKg, 2)} emphasis />
      </div>
    </div>
  );
}

// ===================== 8) تحويل السماكة =====================
function ThicknessConverter(): JSX.Element {
  const [micron, setMicron] = useState<number>(20);
  const mm = useMemo(() => toNumber(micron) / 1000, [micron]);
  const gauge = useMemo(() =>{t('pages.tools_page.tonumber(micron)_*_4,_[micron]);_const_[mmin,_setmmin]_=_usestate')}<number>(0.02);
  const micronFromMm = useMemo(() => toNumber(mmIn) * 1000, [mmIn]);
  const gaugeFromMm = useMemo(() =>{t('pages.tools_page.micronfrommm_*_4,_[micronfrommm]);_const_[gaugein,_setgaugein]_=_usestate')}<number>(80);
  const micronFromGauge = useMemo(() => toNumber(gaugeIn) * 0.25, [gaugeIn]);
  const mmFromGauge = useMemo(() =>{t('pages.tools_page.micronfromgauge_/_1000,_[micronfromgauge]);_return_(')}<div className={t("pages.tools_page.name.grid_md_grid_cols_3_gap_4")}>
      <div className={t("pages.tools_page.name.grid_gap_2")}>
        <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.من_ميكرون')}</h4>
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.ميكرون')}')}" value={micron} onChange={setMicron} step={0.1} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.مم')}')}" value={fmtFixed(mm, 3)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.قيج_(تقريبي)')}')}" value={fmtFixed(gauge, 1)} />
      </div>
      <div className={t("pages.tools_page.name.grid_gap_2")}>
        <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.من_مم')}</h4>
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.مم')}')}" value={mmIn} onChange={setMmIn} step={0.001} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.ميكرون')}')}" value={fmtFixed(micronFromMm, 1)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.قيج_(تقريبي)')}')}" value={fmtFixed(gaugeFromMm, 1)} />
      </div>
      <div className={t("pages.tools_page.name.grid_gap_2")}>
        <h4 className={t("pages.tools_page.name.font_semibold")}>{t('pages.tools_page.من_قيج')}</h4>
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.قيج')}')}" value={gaugeIn} onChange={setGaugeIn} step={1} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.ميكرون')}')}" value={fmtFixed(micronFromGauge, 1)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.مم')}')}" value={fmtFixed(mmFromGauge, 3)} />
      </div>
    </div>
  );
}

// ===================== 9) زمن وتشغيل العملية =====================
function JobTimePlanner(): JSX.Element {
  // معطيات عامة
  const [qty, setQty] = useState<number>{t('pages.tools_page.(10000);_const_[bagweightg,_setbagweightg]_=_usestate')}<number>{t('pages.tools_page.(5);_//_سرعات_تقديرية_const_[extrusionkgperhr,_setextrusionkgperhr]_=_usestate')}<number>{t('pages.tools_page.(35);_//_كجم/ساعة_لكل_خط_const_[cutbagspermin,_setcutbagspermin]_=_usestate')}<number>{t('pages.tools_page.(120);_//_حبة/دقيقة_const_[printmpermin,_setprintmpermin]_=_usestate')}<number>{t('pages.tools_page.(60);_//_متر/دقيقة_//_أطوال_إضافية_للتقدير_const_[baglengthcm,_setbaglengthcm]_=_usestate')}<number>{t('pages.tools_page.(40);_//_إعدادات_وتغييرات_const_[setupextruderhr,_setsetupextruderhr]_=_usestate')}<number>{t('pages.tools_page.(0.5);_const_[setupcutterhr,_setsetupcutterhr]_=_usestate')}<number>{t('pages.tools_page.(0.3);_const_[setupprinterhr,_setsetupprinterhr]_=_usestate')}<number>{t('pages.tools_page.(0.7);_const_[colors,_setcolors]_=_usestate')}<number>{t('pages.tools_page.(0);_const_[changeoverpercolormin,_setchangeoverpercolormin]_=_usestate')}<number>(8);

  const result = useMemo(() => {
    const totalKg = (toNumber(qty) * toNumber(bagWeightG)) / 1000 / 1000; // كجم

    // بثق
    const extrusionHours = totalKg / Math.max(1e-6, toNumber(extrusionKgPerHr)) + toNumber(setupExtruderHr);

    // طباعة: تقريب الطول الكلي (متر)
    const totalMeters = (toNumber(qty) * (toNumber(bagLengthCm) / 100));
    const printCore = totalMeters / Math.max(1e-6, toNumber(printMPerMin)) / 60; // ساعات
    const printChangeovers = (toNumber(colors) > 0 ? (toNumber(colors) - 1) * (toNumber(changeoverPerColorMin) / 60) : 0);
    const printHours = printCore + printChangeovers + toNumber(setupPrinterHr);

    // تقطيع
    const cutCore = (toNumber(qty) / Math.max(1e-6, toNumber(cutBagsPerMin))) / 60; // ساعات
    const cutHours = cutCore + toNumber(setupCutterHr);

    const totalHours = extrusionHours + printHours + cutHours;

    return { totalKg, extrusionHours, printHours, cutHours, totalHours } as const;
  }, [qty, bagWeightG, extrusionKgPerHr, cutBagsPerMin, printMPerMin, bagLengthCm, setupExtruderHr, setupCutterHr, setupPrinterHr, colors, changeoverPerColorMin]);

  return (
    <div className={t("pages.tools_page.name.grid_lg_grid_cols_2_gap_4")}>
      <div className={t("pages.tools_page.name.grid_gap_3")}>
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.الكمية_(حبة)')}')}" value={qty} onChange={setQty} step={500} />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.وزن_الحبة_(جم)')}')}" value={bagWeightG} onChange={setBagWeightG} step={0.01} />
        <Divider />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.سرعة_البثق_(كجم/ساعة)')}')}" value={extrusionKgPerHr} onChange={setExtrusionKgPerHr} step={1} />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.سرعة_التقطيع_(حبة/دقيقة)')}')}" value={cutBagsPerMin} onChange={setCutBagsPerMin} step={1} />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.سرعة_الطباعة_(م/دقيقة)')}')}" value={printMPerMin} onChange={setPrintMPerMin} step={1} />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.طول_الحبة_(سم)')}')}" value={bagLengthCm} onChange={setBagLengthCm} step={0.1} />
        <Divider />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.إعداد_البثق_(ساعة)')}')}" value={setupExtruderHr} onChange={setSetupExtruderHr} step={0.1} />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.إعداد_التقطيع_(ساعة)')}')}" value={setupCutterHr} onChange={setSetupCutterHr} step={0.1} />
        <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.إعداد_الطباعة_(ساعة)')}')}" value={setupPrinterHr} onChange={setSetupPrinterHr} step={0.1} />
        <div className={t("pages.tools_page.name.grid_grid_cols_2_gap_3")}>
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.عدد_الألوان')}')}" value={colors} onChange={setColors} step={1} />
          <LabeledNumber label="{t('pages.tools_page.label.{t('pages.tools_page.label.زمن_تغيير/لون_(دقيقة)')}')}" value={changeoverPerColorMin} onChange={setChangeoverPerColorMin} step={1} />
        </div>
      </div>

      <div className={t("pages.tools_page.name.grid_gap_3_bg_gray_50_rounded_xl_p_4")}>
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.إجمالي_وزن_المادة_(كجم)')}')}" value={fmtFixed(result.totalKg, 3)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.ساعات_البثق')}')}" value={fmtFixed(result.extrusionHours, 2)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.ساعات_الطباعة')}')}" value={fmtFixed(result.printHours, 2)} />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.ساعات_التقطيع')}')}" value={fmtFixed(result.cutHours, 2)} />
        <Divider />
        <Metric label="{t('pages.tools_page.label.{t('pages.tools_page.label.إجمالي_ساعات_التشغيل')}')}" value={fmtFixed(result.totalHours, 2)} emphasis />
      </div>
    </div>
  );
}

// ===================== عناصر واجهة عامة =====================
interface LabeledNumberProps { label: string; value: number; onChange: (v: number) => void; step?: number; title?: string; }
function LabeledNumber({ label, value, onChange, step = 0.1, title }: LabeledNumberProps): JSX.Element {
  return (
    <label className={t("pages.tools_page.name.grid_gap_1_text_sm")} title={title}>
      <span className={t("pages.tools_page.name.text_gray_700")}>{label}</span>
      <input type="number" className={t("pages.tools_page.name.border_rounded_lg_px_3_py_2_focus_outline_none_focus_ring_2_focus_ring_black_10")} value={Number.isFinite(value) ? value : 0} step={step} onChange={(e) => onChange(toNumber(e.target.value))} />
    </label>
  );
}

interface LabeledTextProps { label: string; value: string; onChange: (v: string) => void; placeholder?: string; }
function LabeledText({ label, value, onChange, placeholder }: LabeledTextProps): JSX.Element {
  return (
    <label className={t("pages.tools_page.name.grid_gap_1_text_sm")}>
      <span className={t("pages.tools_page.name.text_gray_700")}>{label}</span>
      <input type="text" className={t("pages.tools_page.name.border_rounded_lg_px_3_py_2_focus_outline_none_focus_ring_2_focus_ring_black_10")} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

interface LabeledSelectProps { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: string; }
function LabeledSelect({ label, value, onChange, options, hint }: LabeledSelectProps): JSX.Element {
  return (
    <label className={t("pages.tools_page.name.grid_gap_1_text_sm")}>
      <span className={t("pages.tools_page.name.text_gray_700")}>{label}</span>
      <select className={t("pages.tools_page.name.border_rounded_lg_px_3_py_2_bg_white_focus_outline_none_focus_ring_2_focus_ring_black_10")} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
      {hint && <span className={t("pages.tools_page.name.text_11px_text_gray_500")}>{hint}</span>}
    </label>
  );
}

function Divider(): JSX.Element { return <div className={t("pages.tools_page.name.h_px_bg_gray_200_my_1")} />; }

function Metric({ label, value, hint, emphasis = false }: { label: string; value: string | number; hint?: string; emphasis?: boolean; }): JSX.Element {
  return (
    <div>
      <div className={t("pages.tools_page.name.text_gray_600_text_xs")}>{label}</div>
      <div className={`text-lg ${emphasis ? "font-bold" : "font-medium"}`}>{String(value)}</div>
      {hint && <div className={t("pages.tools_page.name.text_11px_text_gray_400")}>{hint}</div>}
    </div>
  );
}

// ===================== دوال الألوان =====================
interface RGB { r: number; g: number; b: number }
interface CMYK { c: number; m: number; y: number; k: number }
function cmykToRgb(C: number, M: number, Y: number, K: number): RGB {
  const c = clamp01(C / 100), m = clamp01(M / 100), y = clamp01(Y / 100), k = clamp01(K / 100);
  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));
  return { r, g, b };
}
function rgbToCmyk(R: number, G: number, B: number): CMYK {
  const r = clamp01(R / 255), g = clamp01(G / 255), b = clamp01(B / 255);
  const k = 1 - Math.max(r, g, b);
  const c = k === 0 ? 0 : (1 - r - k) / (1 - k);
  const m = k === 0 ? 0 : (1 - g - k) / (1 - k);
  const y = k === 0 ? 0 : (1 - b - k) / (1 - k);
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
}
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp255(Math.round(n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function hexToRgb(hex: string): RGB {
  const h = normalizeHex(hex).slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}
function normalizeHex(v: string): string {
  let x = v.trim();
  if (!x.startsWith("#")) x = `#${x}`;
  if (x.length === 4) { // #RGB → #RRGGBB
    x = `#${x[1]}${x[1]}${x[2]}${x[2]}${x[3]}${x[3]}`;
  }
  if (x.length !== 7) return "#000000";
  return x.toUpperCase();
}

// ===================== دوال عامة =====================
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }
function clamp255(x: number): number { return Math.max(0, Math.min(255, x)); }
function toNumber(x: unknown): number { const n = typeof x === "number" ? x : Number(x); return Number.isFinite(n) ? n : 0; }
function fmtSar(v: number): string { if (!Number.isFinite(v)) return "-"; return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(v); }
function fmtFixed(v: number, d = 2): string { if (!Number.isFinite(v)) return "-"; return Number(v.toFixed(d)).toString(); }
function round(v: number, d = 2): number { return Number(v.toFixed(d)); }
