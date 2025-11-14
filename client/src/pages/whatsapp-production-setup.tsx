import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  CheckCircle,
  ExternalLink,
  Settings,
  Phone,
  MessageSquare,
  Shield,
  ArrowRight,
  Copy,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function WhatsAppProductionSetup() {
  const { toast } = useToast();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId],
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص إلى الحافظة",
    });
  };

  const webhookUrl = `${window.location.origin}/api/notifications/webhook/twilio`;

  const productionSteps = [
    {
      id: "meta-business-setup",
      title: "إعداد Meta Business Manager",
      description: "تأكد من إعداد WhatsApp Business Account بشكل صحيح",
      category: "Meta Setup",
      steps: [
        "اذهب إلى Meta Business Manager (business.facebook.com)",
        "اختر WhatsApp من القائمة الجانبية",
        "تأكد أن WhatsApp Business Account ID: 795259496521200 مُفعل",
        'تحقق من أن Display Name "MPBF" مُوافق عليه',
        "تأكد من تفعيل رقم +15557911537 بالكامل",
      ],
      important: true,
    },
    {
      id: "message-templates",
      title: "إنشاء قوالب الرسائل",
      description: "إنشاء والموافقة على قوالب الرسائل المطلوبة",
      category: "Templates",
      steps: [
        "اذهب إلى WhatsApp → Message Templates في Meta Business Manager",
        'أنشئ قالب "hello_world" الأساسي للاختبار',
        "أنشئ قوالب مخصصة لنظامك (إشعارات، تذكيرات، إلخ)",
        "انتظر الموافقة على القوالب (قد يستغرق 24-48 ساعة)",
        'تأكد من حالة "APPROVED" لجميع القوالب',
      ],
      templates: [
        {
          name: "hello_world",
          content: "Hello {{1}}, your appointment is confirmed.",
          language: "en",
        },
        {
          name: "system_notification_ar",
          content: "مرحباً {{1}}، لديك إشعار جديد من نظام MPBF: {{2}}",
          language: "ar",
        },
        {
          name: "order_status_ar",
          content: "تحديث الطلب رقم {{1}}: {{2}}. شكراً لك.",
          language: "ar",
        },
      ],
    },
    {
      id: "twilio-production",
      title: "تفعيل Production في Twilio",
      description: "ربط WhatsApp Business Account مع Twilio",
      category: "Twilio Setup",
      steps: [
        "اذهب إلى Twilio Console → Messaging → WhatsApp senders",
        'اختر "Connect a WhatsApp Business Account"',
        "أدخل Business Account ID: 795259496521200",
        "اتبع خطوات التحقق والربط",
        "تأكد من ظهور الرقم +15557911537 في قائمة Connected Numbers",
      ],
    },
    {
      id: "webhook-configuration",
      title: "إعداد Webhook",
      description: "تكوين endpoints لاستقبال الرسائل والتحديثات",
      category: "Integration",
      steps: [
        "في Twilio Console، اختر رقم WhatsApp المُفعل",
        "اذهب إلى Configuration → Webhooks",
        `أدخل Webhook URL: ${webhookUrl}`,
        "اختر HTTP Method: POST",
        'فعل "When a message comes in" و "Status callback"',
        "احفظ الإعدادات واختبر الاتصال",
      ],
    },
    {
      id: "permissions-verification",
      title: "التحقق من الصلاحيات",
      description: "تأكد من جميع الصلاحيات والموافقات المطلوبة",
      category: "Verification",
      steps: [
        "تحقق من Business Verification في Meta Business Manager",
        "تأكد من Payment Method مُضاف ومُفعل",
        "تحقق من Message Limits (عدد الرسائل المسموح)",
        "تأكد من Quality Rating للحساب",
        "تحقق من Compliance مع WhatsApp Policies",
      ],
    },
    {
      id: "system-integration",
      title: "تحديث النظام",
      description: "تحديث النظام لاستخدام Production templates",
      category: "System Update",
      steps: [
        "تحديث notification service لاستخدام approved templates",
        "إضافة معالجة أخطاء production-specific",
        "تحديث message formatting للقوالب المُوافق عليها",
        "إعداد rate limiting حسب WhatsApp limits",
        "تفعيل production logging ومراقبة",
      ],
    },
  ];

  const accountInfo = {
    businessAccountId: "795259496521200",
    businessManagerId: "8726984570657839",
    whatsappNumber: "+15557911537",
    displayName: "MPBF",
    twilioAccountSid: "ACe4ba2fd2e98be5b019c354539404cc29",
  };

  const getStepIcon = (stepId: string) => {
    return completedSteps.includes(stepId) ? (
      <CheckCircle className={t("pages.name.h_5_w_5_text_green_600")} />{t('pages.whatsapp-production-setup.)_:_(')}<div className={t("pages.name.h_5_w_5_border_2_border_gray_300_rounded_full")} />
    );
  };

  const completedCount = completedSteps.length;
  const totalSteps = productionSteps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  return (
    <div className={t("pages.name.min_h_screen_bg_gray_50_p_4")} dir="rtl">
      <div className={t("pages.name.max_w_4xl_mx_auto_space_y_6")}>
        {/* Header */}
        <div className={t("pages.name.text_center")}>
          <h1 className={t("pages.name.text_3xl_font_bold_text_gray_900_mb_2")}>{t('pages.whatsapp-production-setup.🚀_إعداد_whatsapp_production_mode')}</h1>
          <p className={t("pages.name.text_gray_600")}>{t('pages.whatsapp-production-setup.دليل_شامل_لتفعيل_whatsapp_business_في_وضع_الإنتاج')}</p>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className={t("pages.name.pt_6")}>
            <div className={t("pages.name.flex_items_center_justify_between_mb_2")}>
              <span className={t("pages.name.text_sm_font_medium_text_gray_700")}>{t('pages.whatsapp-production-setup.التقدم_الإجمالي')}</span>
              <span className={t("pages.name.text_sm_text_gray_500")}>
                {completedCount} من {totalSteps}
              </span>
            </div>
            <div className={t("pages.name.w_full_bg_gray_200_rounded_full_h_2")}>
              <div
                className={t("pages.name.bg_blue_600_h_2_rounded_full_transition_all_duration_300")}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className={t("pages.name.flex_items_center_gap_2")}>
              <Settings className={t("pages.name.h_5_w_5")} />{t('pages.whatsapp-production-setup.معلومات_الحساب')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("pages.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
              <div className={t("pages.name.space_y_3")}>
                <div className={t("pages.name.flex_justify_between_items_center")}>
                  <span className={t("pages.name.text_sm_text_gray_600")}>{t('pages.whatsapp-production-setup.business_account_id:')}</span>
                  <div className={t("pages.name.flex_items_center_gap_2")}>
                    <Badge variant="outline" className={t("pages.name.font_mono")}>
                      {accountInfo.businessAccountId}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(accountInfo.businessAccountId)
                      }
                    >
                      <Copy className={t("pages.name.h_3_w_3")} />
                    </Button>
                  </div>
                </div>

                <div className={t("pages.name.flex_justify_between_items_center")}>
                  <span className={t("pages.name.text_sm_text_gray_600")}>{t('pages.whatsapp-production-setup.business_manager_id:')}</span>
                  <div className={t("pages.name.flex_items_center_gap_2")}>
                    <Badge variant="outline" className={t("pages.name.font_mono")}>
                      {accountInfo.businessManagerId}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(accountInfo.businessManagerId)
                      }
                    >
                      <Copy className={t("pages.name.h_3_w_3")} />
                    </Button>
                  </div>
                </div>

                <div className={t("pages.name.flex_justify_between_items_center")}>
                  <span className={t("pages.name.text_sm_text_gray_600")}>{t('pages.whatsapp-production-setup.whatsapp_number:')}</span>
                  <Badge variant="outline">{accountInfo.whatsappNumber}</Badge>
                </div>
              </div>

              <div className={t("pages.name.space_y_3")}>
                <div className={t("pages.name.flex_justify_between_items_center")}>
                  <span className={t("pages.name.text_sm_text_gray_600")}>{t('pages.whatsapp-production-setup.display_name:')}</span>
                  <Badge variant="outline">{accountInfo.displayName}</Badge>
                </div>

                <div className={t("pages.name.flex_justify_between_items_center")}>
                  <span className={t("pages.name.text_sm_text_gray_600")}>{t('pages.whatsapp-production-setup.twilio_account:')}</span>
                  <Badge variant="outline" className={t("pages.name.font_mono_text_xs")}>
                    {accountInfo.twilioAccountSid}
                  </Badge>
                </div>

                <div className={t("pages.name.flex_justify_between_items_center")}>
                  <span className={t("pages.name.text_sm_text_gray_600")}>{t('pages.whatsapp-production-setup.webhook_url:')}</span>
                  <div className={t("pages.name.flex_items_center_gap_2")}>
                    <Badge
                      variant="outline"
                      className={t("pages.name.text_xs_max_w_200px_truncate")}
                    >
                      {webhookUrl}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(webhookUrl)}
                    >
                      <Copy className={t("pages.name.h_3_w_3")} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Alert>
          <Shield className={t("pages.name.h_4_w_4")} />
          <AlertDescription>
            <strong>{t('pages.whatsapp-production-setup.مهم:')}</strong>{t('pages.whatsapp-production-setup.في_production_mode،_يجب_الحصول_على_موافقة_meta_على_جميع_قوالب_الرسائل_قبل_الإرسال._عملية_الموافقة_قد_تستغرق_24-48_ساعة.')}</AlertDescription>
        </Alert>

        {/* Setup Steps */}
        <div className={t("pages.name.space_y_4")}>
          {productionSteps.map((step, index) => (
            <Card
              key={step.id}
              className={`${step.important ? "border-blue-200 bg-blue-50" : ""}`}
            >
              <CardHeader>
                <div className={t("pages.name.flex_items_center_justify_between")}>
                  <CardTitle className={t("pages.name.flex_items_center_gap_3")}>
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={t("pages.name.flex_shrink_0")}
                    >
                      {getStepIcon(step.id)}
                    </button>
                    <div>
                      <div className={t("pages.name.flex_items_center_gap_2")}>
                        <span>
                          الخطوة {index + 1}: {step.title}
                        </span>
                        <Badge variant="secondary" className={t("pages.name.text_xs")}>
                          {step.category}
                        </Badge>
                      </div>
                      <CardDescription className={t("pages.name.mt_1")}>
                        {step.description}
                      </CardDescription>
                    </div>
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                <div className={t("pages.name.space_y_2")}>
                  {step.steps.map((stepText, stepIndex) => (
                    <div
                      key={stepIndex}
                      className={t("pages.name.flex_items_start_gap_3_text_sm")}
                    >
                      <span className={t("pages.name.text_blue_500_mt_1_flex_shrink_0")}>
                        {stepIndex + 1}.
                      </span>
                      <span className={t("pages.name.text_gray_700")}>{stepText}</span>
                    </div>
                  ))}
                </div>

                {/* Templates for message templates step */}
                {step.id === "message-templates" &&
                  "templates" in step &&
                  step.templates && (
                    <div className={t("pages.name.mt_4_space_y_3")}>
                      <h4 className={t("pages.name.font_medium_text_gray_900")}>{t('pages.whatsapp-production-setup.قوالب_الرسائل_المقترحة:')}</h4>
                      {step.templates.map((template, templateIndex) => (
                        <div
                          key={templateIndex}
                          className={t("pages.name.bg_white_p_3_rounded_border")}
                        >
                          <div className={t("pages.name.flex_items_center_justify_between_mb_2")}>
                            <span className={t("pages.name.font_medium_text_sm")}>
                              {template.name}
                            </span>
                            <Badge variant="outline" className={t("pages.name.text_xs")}>
                              {template.language === "ar" ? "عربي" : "إنجليزي"}
                            </Badge>
                          </div>
                          <div className={t("pages.name.text_sm_text_gray_600_bg_gray_50_p_2_rounded_font_mono")}>
                            {template.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className={t("pages.name.flex_items_center_gap_2")}>
              <ExternalLink className={t("pages.name.h_5_w_5")} />{t('pages.whatsapp-production-setup.روابط_سريعة')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("pages.name.grid_grid_cols_1_md_grid_cols_2_gap_3")}>
              <Button
                variant="outline"
                className={t("pages.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://business.facebook.com/wa/manage"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.name.text_right")}>
                    <div className={t("pages.name.font_medium")}>{t('pages.whatsapp-production-setup.meta_business_manager')}</div>
                    <div className={t("pages.name.text_sm_text_gray_500")}>{t('pages.whatsapp-production-setup.إدارة_whatsapp_business_account')}</div>
                  </div>
                  <ArrowRight className={t("pages.name.h_4_w_4_mr_2")} />
                </a>
              </Button>

              <Button
                variant="outline"
                className={t("pages.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://console.twilio.com/us1/develop/sms/senders/whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.name.text_right")}>
                    <div className={t("pages.name.font_medium")}>{t('pages.whatsapp-production-setup.twilio_whatsapp_console')}</div>
                    <div className={t("pages.name.text_sm_text_gray_500")}>{t('pages.whatsapp-production-setup.إدارة_أرقام_whatsapp')}</div>
                  </div>
                  <ArrowRight className={t("pages.name.h_4_w_4_mr_2")} />
                </a>
              </Button>

              <Button
                variant="outline"
                className={t("pages.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://business.facebook.com/wa/manage/message-templates/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.name.text_right")}>
                    <div className={t("pages.name.font_medium")}>{t('pages.whatsapp-production-setup.message_templates')}</div>
                    <div className={t("pages.name.text_sm_text_gray_500")}>{t('pages.whatsapp-production-setup.إدارة_قوالب_الرسائل')}</div>
                  </div>
                  <ArrowRight className={t("pages.name.h_4_w_4_mr_2")} />
                </a>
              </Button>

              <Button
                variant="outline"
                className={t("pages.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://business.facebook.com/settings/business-verification"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.name.text_right")}>
                    <div className={t("pages.name.font_medium")}>{t('pages.whatsapp-production-setup.business_verification')}</div>
                    <div className={t("pages.name.text_sm_text_gray_500")}>{t('pages.whatsapp-production-setup.التحقق_من_الأعمال')}</div>
                  </div>
                  <ArrowRight className={t("pages.name.h_4_w_4_mr_2")} />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {completedCount === totalSteps && (
          <Card className={t("pages.name.border_green_200_bg_green_50")}>
            <CardHeader>
              <CardTitle className={t("pages.name.text_green_700")}>{t('pages.whatsapp-production-setup.🎉_إعداد_production_مكتمل!')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={t("pages.name.text_green_700_mb_3")}>{t('pages.whatsapp-production-setup.أحسنت!_أكملت_جميع_خطوات_إعداد_production_mode.')}</p>
              <div className={t("pages.name.space_y_2_text_sm_text_green_600")}>
                <p>{t('pages.whatsapp-production-setup.•_يمكنك_الآن_إرسال_رسائل_إلى_أي_رقم_whatsapp_مُسجل')}</p>
                <p>{t('pages.whatsapp-production-setup.•_تأكد_من_استخدام_القوالب_المُوافق_عليها_فقط')}</p>
                <p>{t('pages.whatsapp-production-setup.•_راقب_message_limits_و_quality_rating')}</p>
                <p>{t('pages.whatsapp-production-setup.•_اختبر_النظام_مع_أرقام_حقيقية')}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
