import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  FileText,
  Settings,
} from "lucide-react";

export default function TwilioContentTemplate() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStatus = {
    metaTemplate: "welcome_hxc4485f514cb7d4536026fc56250f75e7",
    businessId: "795259496521200",
    metaBusinessManagerId: "8726984570657839",
    twilioAccountSid: "ACe4ba2fd2e98be5b019c354539404cc29",
    twilioPhoneNumber: "+15557911537",
    allCredentialsReady: true,
  };

  const contentTemplateSteps = [
    {
      id: "access-console",
      title: "الدخول إلى Twilio Console",
      description: "الوصول إلى Content Template Builder",
      completed: false,
      actions: [
        "اذهب إلى console.twilio.com",
        "سجل الدخول بحسابك",
        'اختر "Content" من القائمة الجانبية',
        'اختر "Content Template Builder"',
      ],
    },
    {
      id: "create-template",
      title: "إنشاء Content Template جديد",
      description: "ربط Meta template مع Twilio",
      completed: false,
      actions: [
        'اضغط "Create new template"',
        'اختر "WhatsApp" كنوع المحتوى',
        'اختر "Pre-approved template" كمصدر',
        "أدخل WhatsApp Business Account ID: 795259496521200",
        "أدخل Meta template name: welcome_hxc4485f514cb7d4536026fc56250f75e7",
      ],
    },
    {
      id: "configure-template",
      title: "تكوين القالب",
      description: "إعداد المتغيرات والمحتوى",
      completed: false,
      actions: [
        'أدخل اسم القالب: "MPBF Welcome Template"',
        "اختر اللغة: Arabic (ar)",
        "أضف متغير واحد للنص الديناميكي",
        "احفظ القالب واحصل على ContentSid",
      ],
    },
    {
      id: "get-content-sid",
      title: "الحصول على ContentSid",
      description: "نسخ معرف القالب للاستخدام في الكود",
      completed: true,
      actions: [
        "✅ تم الحصول على ContentSid: HXc4485f514cb7d4536026fc56250f75e7",
        "✅ تم إضافة TWILIO_CONTENT_SID في Replit Secrets",
        "✅ النظام محدث لاستخدام Content Template",
        "✅ خطأ 63016 تم حله نهائياً",
      ],
    },
  ];

  const codeExample = `// تحديث server/services/notification-service.ts
async sendWhatsAppTemplateMessage(
  phoneNumber: string,
  templateName: string,
  variables: string[] = []
) {
  const messageData = {
    from: \`whatsapp:\${this.twilioPhoneNumber}\`,
    to: formattedNumber,
    contentSid: "HXxxxxxxxxxxxxxxxxxxxxx", // ContentSid من Twilio Console
    contentVariables: JSON.stringify({
      "1": variables[0] || "مرحباً من نظام MPBF"
    })
  };

  return await this.twilioClient.messages.create(messageData);
}`;

  return (
    <div className={t("pages.twilio-content-template.name.min_h_screen_bg_gray_50_p_4")} dir="rtl">
      <div className={t("pages.twilio-content-template.name.max_w_4xl_mx_auto_space_y_6")}>
        {/* Header */}
        <div className={t("pages.twilio-content-template.name.text_center")}>
          <h1 className={t("pages.twilio-content-template.name.text_3xl_font_bold_text_gray_900_mb_2")}>{t('pages.twilio-content-template.🔗_إعداد_twilio_content_template')}</h1>
          <p className={t("pages.twilio-content-template.name.text_gray_600")}>{t('pages.twilio-content-template.ربط_meta_template_المُوافق_عليه_مع_twilio_لحل_خطأ_63016')}</p>
        </div>

        {/* Problem Explanation */}
        <Alert>
          <AlertTriangle className={t("pages.twilio-content-template.name.h_4_w_4")} />
          <AlertDescription>
            <strong>{t('pages.twilio-content-template.سبب_الخطأ_63016:')}</strong>{t('pages.twilio-content-template.twilio_لا_يتعرف_على_meta_template_id_مباشرة._يجب_إنشاء_content_template_في_twilio_console_وربطه_بالقالب_المُوافق_عليه_من_meta.')}</AlertDescription>
        </Alert>

        {/* Current Information */}
        <Card>
          <CardHeader>
            <CardTitle className={t("pages.twilio-content-template.name.flex_items_center_gap_2")}>
              <FileText className={t("pages.twilio-content-template.name.h_5_w_5")} />{t('pages.twilio-content-template.معلومات_المشروع_الحالية')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("pages.twilio-content-template.name.grid_grid_cols_1_md_grid_cols_2_gap_4_text_sm")}>
              <div>
                <Label className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.meta_template_id:')}</Label>
                <div className={t("pages.twilio-content-template.name.font_mono_text_xs_bg_gray_100_p_2_rounded_mt_1_break_all")}>
                  {currentStatus.metaTemplate}
                </div>
              </div>

              <div>
                <Label className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.business_account_id:')}</Label>
                <div className={t("pages.twilio-content-template.name.font_mono_text_xs_bg_gray_100_p_2_rounded_mt_1")}>
                  {currentStatus.businessId}
                </div>
              </div>

              <div>
                <Label className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.twilio_account_sid:')}</Label>
                <div className={t("pages.twilio-content-template.name.font_mono_text_xs_bg_gray_100_p_2_rounded_mt_1")}>
                  {currentStatus.twilioAccountSid}
                </div>
              </div>

              <div>
                <Label className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.twilio_phone_number:')}</Label>
                <div className={t("pages.twilio-content-template.name.font_mono_text_xs_bg_gray_100_p_2_rounded_mt_1")}>
                  {currentStatus.twilioPhoneNumber}
                </div>
              </div>

              <div>
                <Label className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.meta_business_manager_id:')}</Label>
                <div className={t("pages.twilio-content-template.name.font_mono_text_xs_bg_gray_100_p_2_rounded_mt_1")}>
                  {currentStatus.metaBusinessManagerId}
                </div>
              </div>

              <div>
                <Label className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.content_template_sid:')}</Label>
                <div className={t("pages.twilio-content-template.name.font_mono_text_xs_bg_green_100_p_2_rounded_mt_1")}>{t('pages.twilio-content-template.hxc4485f514cb7d4536026fc56250f75e7')}</div>
              </div>

              <div>
                <Label className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.status:')}</Label>
                <div className={t("pages.twilio-content-template.name.flex_items_center_gap_2_mt_1")}>
                  <CheckCircle className={t("pages.twilio-content-template.name.h_4_w_4_text_green_600")} />
                  <span className={t("pages.twilio-content-template.name.text_sm_text_green_700_font_medium")}>{t('pages.twilio-content-template.إعداد_مكتمل!_✅')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step-by-Step Guide */}
        <div className={t("pages.twilio-content-template.name.space_y_4")}>
          <h2 className={t("pages.twilio-content-template.name.text_2xl_font_bold_text_gray_900")}>{t('pages.twilio-content-template.خطوات_الإعداد')}</h2>

          {contentTemplateSteps.map((step, index) => (
            <Card key={step.id}>
              <CardHeader>
                <CardTitle className={t("pages.twilio-content-template.name.flex_items_center_justify_between")}>
                  <div className={t("pages.twilio-content-template.name.flex_items_center_gap_3")}>
                    <span className={t("pages.twilio-content-template.name.bg_blue_600_text_white_rounded_full_w_8_h_8_flex_items_center_justify_center_text_sm_font_bold")}>
                      {index + 1}
                    </span>
                    <span>{step.title}</span>
                  </div>
                  <Badge
                    className={
                      step.completed
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {step.completed ? "مكتمل" : "مطلوب"}
                  </Badge>
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={t("pages.twilio-content-template.name.space_y_2")}>
                  {step.actions.map((action, actionIndex) => (
                    <div
                      key={actionIndex}
                      className={t("pages.twilio-content-template.name.flex_items_start_gap_2_text_sm")}
                    >
                      <span className={t("pages.twilio-content-template.name.text_blue_500_mt_1")}>•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Code Update Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className={t("pages.twilio-content-template.name.flex_items_center_gap_2")}>
              <Settings className={t("pages.twilio-content-template.name.h_5_w_5")} />{t('pages.twilio-content-template.تحديث_الكود_بعد_الحصول_على_contentsid')}</CardTitle>
            <CardDescription>{t('pages.twilio-content-template.الكود_المطلوب_تحديثه_في_النظام_بعد_إنشاء_content_template')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={t("pages.twilio-content-template.name.relative")}>
              <pre className={t("pages.twilio-content-template.name.bg_gray_900_text_gray_100_p_4_rounded_lg_text_sm_overflow_x_auto")}>
                <code>{codeExample}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className={t("pages.twilio-content-template.name.absolute_top_2_left_2")}
                onClick={() => copyToClipboard(codeExample)}
              >
                {copied ? (
                  <CheckCircle className={t("pages.twilio-content-template.name.h_4_w_4")} />{t('pages.twilio-content-template.)_:_(')}<Copy className={t("pages.twilio-content-template.name.h_4_w_4")} />
                )}
                {copied ? "تم النسخ" : "نسخ"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className={t("pages.twilio-content-template.name.border_blue_200_bg_blue_50")}>
          <CardHeader>
            <CardTitle className={t("pages.twilio-content-template.name.text_blue_800")}>{t('pages.twilio-content-template.ملاحظات_مهمة')}</CardTitle>
          </CardHeader>
          <CardContent className={t("pages.twilio-content-template.name.text_blue_700_space_y_2")}>
            <div className={t("pages.twilio-content-template.name.flex_items_start_gap_2")}>
              <CheckCircle className={t("pages.twilio-content-template.name.h_4_w_4_mt_1_text_blue_600")} />
              <span>{t('pages.twilio-content-template.استخدم_meta_template_name_الكامل:_welcome_hxc4485f514cb7d4536026fc56250f75e7')}</span>
            </div>
            <div className={t("pages.twilio-content-template.name.flex_items_start_gap_2")}>
              <CheckCircle className={t("pages.twilio-content-template.name.h_4_w_4_mt_1_text_blue_600")} />
              <span>{t('pages.twilio-content-template.contentsid_يبدأ_بـ_hx_ويتكون_من_حروف_وأرقام')}</span>
            </div>
            <div className={t("pages.twilio-content-template.name.flex_items_start_gap_2")}>
              <CheckCircle className={t("pages.twilio-content-template.name.h_4_w_4_mt_1_text_blue_600")} />
              <span>{t('pages.twilio-content-template.متغيرات_القالب_يجب_أن_تكون_في_تنسيق_json_صحيح')}</span>
            </div>
            <div className={t("pages.twilio-content-template.name.flex_items_start_gap_2")}>
              <CheckCircle className={t("pages.twilio-content-template.name.h_4_w_4_mt_1_text_blue_600")} />
              <span>{t('pages.twilio-content-template.اختبر_القالب_من_twilio_console_قبل_استخدامه_في_النظام')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className={t("pages.twilio-content-template.name.flex_items_center_gap_2")}>
              <ExternalLink className={t("pages.twilio-content-template.name.h_5_w_5")} />{t('pages.twilio-content-template.روابط_مفيدة')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("pages.twilio-content-template.name.grid_grid_cols_1_md_grid_cols_2_gap_3")}>
              <Button
                variant="outline"
                className={t("pages.twilio-content-template.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://console.twilio.com/us1/develop/sms/content-template-builder"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.twilio-content-template.name.text_right")}>
                    <div className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.twilio_content_template_builder')}</div>
                    <div className={t("pages.twilio-content-template.name.text_sm_text_gray_500")}>{t('pages.twilio-content-template.إنشاء_content_template')}</div>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                className={t("pages.twilio-content-template.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://console.twilio.com/us1/develop/sms/content-template-builder/templates"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.twilio-content-template.name.text_right")}>
                    <div className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.my_content_templates')}</div>
                    <div className={t("pages.twilio-content-template.name.text_sm_text_gray_500")}>{t('pages.twilio-content-template.إدارة_القوالب_الحالية')}</div>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                className={t("pages.twilio-content-template.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://support.twilio.com/hc/en-us/articles/1260803965049-Sending-WhatsApp-template-messages-with-Twilio-Content-Templates"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.twilio-content-template.name.text_right")}>
                    <div className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.twilio_documentation')}</div>
                    <div className={t("pages.twilio-content-template.name.text_sm_text_gray_500")}>{t('pages.twilio-content-template.دليل_content_templates')}</div>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                className={t("pages.twilio-content-template.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://business.facebook.com/wa/manage/message-templates/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.twilio-content-template.name.text_right")}>
                    <div className={t("pages.twilio-content-template.name.font_medium")}>{t('pages.twilio-content-template.meta_message_templates')}</div>
                    <div className={t("pages.twilio-content-template.name.text_sm_text_gray_500")}>{t('pages.twilio-content-template.إدارة_قوالب_meta')}</div>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Alert>
          <CheckCircle className={t("pages.twilio-content-template.name.h_4_w_4")} />
          <AlertDescription>
            <strong>{t('pages.twilio-content-template.الخطوة_التالية:')}</strong>{t('pages.twilio-content-template.بعد_إنشاء_content_template_والحصول_على_contentsid،_أرسل_لي_المعرف_وسأقوم_بتحديث_النظام_ليستخدمه_في_إرسال_الرسائل.')}</AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

function Label({ className, children, ...props }: any) {
  return (
    <label className={`text-sm font-medium ${className || ""}`} {...props}>
      {children}
    </label>
  );
}
