import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Send,
  Loader2,
  Settings,
  Phone,
  MessageSquare,
  Key,
} from "lucide-react";

export default function MetaWhatsAppSetup() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("+966");
  const [message, setMessage] = useState(
    "مرحباً! هذا اختبار من Meta WhatsApp API المباشر",
  );
  const [useTemplate, setUseTemplate] = useState(true);
  const [templateName, setTemplateName] = useState(
    "welcome_hxc4485f514cb7d4536026fc56250f75e7",
  );

  // إرسال رسالة تجريبية عبر Meta API
  const testMetaAPI = useMutation({
    mutationFn: async (data: {
      phone: string;
      message: string;
      useTemplate: boolean;
      templateName?: string;
    }) => {
      const response = await apiRequest("/api/notifications/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          phone_number: data.phone,
          message: data.message,
          title: "اختبار Meta API",
          use_template: data.useTemplate,
          template_name: data.templateName,
        }),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الرسالة بنجاح",
        description: "تم إرسال رسالة اختبار عبر Meta WhatsApp API",
      });
    },
    onError: (error: any) => {
      toast({
        title: "فشل في الإرسال",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setupSteps = [
    {
      id: "business-manager",
      title: "إعداد Meta Business Manager",
      status: "completed",
      description: "إنشاء وإعداد حساب Meta Business Manager",
      details: [
        "تم إنشاء Business Account ID: 795259496521200",
        "تم ربط WhatsApp Business Account",
        "تم التحقق من الحساب التجاري",
      ],
    },
    {
      id: "app-creation",
      title: "إنشاء تطبيق Meta",
      status: "required",
      description: "إنشاء تطبيق في Meta for Developers",
      details: [
        "اذهب إلى developers.facebook.com",
        'أنشئ تطبيق جديد من نوع "Business"',
        "أضف منتج WhatsApp Business Platform",
        "احصل على App ID و App Secret",
      ],
    },
    {
      id: "access-token",
      title: "إنشاء Access Token",
      status: "required",
      description: "الحصول على Access Token دائم",
      details: [
        "من App Dashboard → WhatsApp → API Setup",
        "أنشئ System User في Business Manager",
        "اربط System User بـ WhatsApp Business Account",
        "احصل على Permanent Access Token",
      ],
    },
    {
      id: "phone-number",
      title: "إعداد رقم الهاتف",
      status: "required",
      description: "تسجيل وإعداد رقم WhatsApp Business",
      details: [
        "سجل رقم هاتف تجاري في Meta",
        "تحقق من الرقم باستخدام SMS/Voice",
        "احصل على Phone Number ID",
        "اختبر إرسال الرسائل",
      ],
    },
    {
      id: "webhook",
      title: "إعداد Webhook",
      status: "required",
      description: "ربط النظام بـ Meta Webhook",
      details: [
        "استخدم URL: https://your-domain.replit.app/api/notifications/webhook/meta",
        "Verify Token: mpbf_webhook_token",
        "Subscribe to messages, message_status",
        "اختبر الاستجابة للأحداث",
      ],
    },
  ];

  const requiredSecrets = [
    {
      name: "META_ACCESS_TOKEN",
      description: "Access Token دائم من Meta Business Manager",
      example: "EAABsBCS1iL8BAxxxxxx...",
      required: true,
    },
    {
      name: "META_PHONE_NUMBER_ID",
      description: "معرف رقم الهاتف المسجل في Meta",
      example: "1234567890123456",
      required: true,
    },
    {
      name: "META_BUSINESS_ACCOUNT_ID",
      description: "معرف حساب WhatsApp Business",
      example: "795259496521200",
      required: false,
    },
    {
      name: "META_WEBHOOK_VERIFY_TOKEN",
      description: "رمز التحقق من Webhook",
      example: "mpbf_webhook_token",
      required: false,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_green_600")} />{t('pages.meta-whatsapp-setup.;_case_"required":_return')}<AlertTriangle className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_yellow_600")} />{t('pages.meta-whatsapp-setup.;_case_"optional":_return')}<Settings className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_gray_400")} />{t('pages.meta-whatsapp-setup.;_default:_return')}<Settings className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_gray_400")} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "required":
        return "bg-yellow-100 text-yellow-800";
      case "optional":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className={t("pages.meta-whatsapp-setup.name.min_h_screen_bg_gray_50_p_4")} dir="rtl">
      <div className={t("pages.meta-whatsapp-setup.name.max_w_6xl_mx_auto_space_y_6")}>
        {/* Header */}
        <div className={t("pages.meta-whatsapp-setup.name.text_center")}>
          <h1 className={t("pages.meta-whatsapp-setup.name.text_3xl_font_bold_text_gray_900_mb_2")}>{t('pages.meta-whatsapp-setup.🚀_إعداد_meta_whatsapp_business_api')}</h1>
          <p className={t("pages.meta-whatsapp-setup.name.text_gray_600")}>{t('pages.meta-whatsapp-setup.إعداد_وتكوين_meta_whatsapp_business_api_للاستخدام_المباشر')}</p>
        </div>

        {/* Important Notice */}
        <Alert>
          <AlertTriangle className={t("pages.meta-whatsapp-setup.name.h_4_w_4")} />
          <AlertDescription>
            <strong>{t('pages.meta-whatsapp-setup.مهم:')}</strong>{t('pages.meta-whatsapp-setup.استخدام_meta_whatsapp_api_مباشرة_يوفر_تحكم_أكبر_وتكلفة_أقل_من_twilio،_ولكن_يتطلب_إعداد_تقني_أكثر_تفصيلاً._تأكد_من_إكمال_جميع_الخطوات_بعناية.')}</AlertDescription>
        </Alert>

        <div className={t("pages.meta-whatsapp-setup.name.grid_grid_cols_1_lg_grid_cols_2_gap_6")}>
          {/* Setup Steps */}
          <div className={t("pages.meta-whatsapp-setup.name.space_y_4")}>
            <h2 className={t("pages.meta-whatsapp-setup.name.text_2xl_font_bold_text_gray_900")}>{t('pages.meta-whatsapp-setup.خطوات_الإعداد')}</h2>

            {setupSteps.map((step, index) => (
              <Card key={step.id} className={t("pages.meta-whatsapp-setup.name.relative")}>
                <CardHeader>
                  <CardTitle className={t("pages.meta-whatsapp-setup.name.flex_items_center_justify_between")}>
                    <div className={t("pages.meta-whatsapp-setup.name.flex_items_center_gap_3")}>
                      <span className={t("pages.meta-whatsapp-setup.name.bg_blue_600_text_white_rounded_full_w_8_h_8_flex_items_center_justify_center_text_sm_font_bold")}>
                        {index + 1}
                      </span>
                      <span>{step.title}</span>
                    </div>
                    <div className={t("pages.meta-whatsapp-setup.name.flex_items_center_gap_2")}>
                      {getStatusIcon(step.status)}
                      <Badge className={getStatusColor(step.status)}>
                        {step.status === "completed"
                          ? "مكتمل"
                          : step.status === "required"
                            ? "مطلوب"
                            : "اختياري"}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={t("pages.meta-whatsapp-setup.name.space_y_2")}>
                    {step.details.map((detail, detailIndex) => (
                      <div
                        key={detailIndex}
                        className={t("pages.meta-whatsapp-setup.name.flex_items_start_gap_2_text_sm")}
                      >
                        <span className={t("pages.meta-whatsapp-setup.name.text_blue_500_mt_1")}>•</span>
                        <span
                          className={
                            step.status === "completed"
                              ? "text-green-700"
                              : "text-gray-700"
                          }
                        >
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Configuration & Testing */}
          <div className={t("pages.meta-whatsapp-setup.name.space_y_6")}>
            {/* Required Secrets */}
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.meta-whatsapp-setup.name.flex_items_center_gap_2")}>
                  <Key className={t("pages.meta-whatsapp-setup.name.h_5_w_5")} />{t('pages.meta-whatsapp-setup.المتغيرات_المطلوبة')}</CardTitle>
                <CardDescription>{t('pages.meta-whatsapp-setup.إضافة_هذه_المتغيرات_في_replit_secrets')}</CardDescription>
              </CardHeader>
              <CardContent className={t("pages.meta-whatsapp-setup.name.space_y_4")}>
                {requiredSecrets.map((secret) => (
                  <div key={secret.name} className={t("pages.meta-whatsapp-setup.name.border_rounded_lg_p_3")}>
                    <div className={t("pages.meta-whatsapp-setup.name.flex_items_center_justify_between_mb_2")}>
                      <span className={t("pages.meta-whatsapp-setup.name.font_medium_text_sm")}>{secret.name}</span>
                      <Badge
                        variant={secret.required ? "destructive" : "secondary"}
                      >
                        {secret.required ? "مطلوب" : "اختياري"}
                      </Badge>
                    </div>
                    <p className={t("pages.meta-whatsapp-setup.name.text_xs_text_gray_600_mb_2")}>
                      {secret.description}
                    </p>
                    <code className={t("pages.meta-whatsapp-setup.name.text_xs_bg_gray_100_p_1_rounded_block")}>
                      {secret.example}
                    </code>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Test Section */}
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.meta-whatsapp-setup.name.flex_items_center_gap_2")}>
                  <Send className={t("pages.meta-whatsapp-setup.name.h_5_w_5")} />{t('pages.meta-whatsapp-setup.اختبار_meta_api')}</CardTitle>
                <CardDescription>{t('pages.meta-whatsapp-setup.اختبار_إرسال_رسالة_عبر_meta_whatsapp_api')}</CardDescription>
              </CardHeader>
              <CardContent className={t("pages.meta-whatsapp-setup.name.space_y_4")}>
                <div>
                  <Label htmlFor="testPhone">{t('pages.meta-whatsapp-setup.رقم_الهاتف')}</Label>
                  <Input
                    id="testPhone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="{t('pages.meta-whatsapp-setup.placeholder.+966501234567')}"
                    dir="ltr"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="testMessage">{t('pages.meta-whatsapp-setup.الرسالة')}</Label>
                  <Input
                    id="testMessage"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="{t('pages.meta-whatsapp-setup.placeholder.رسالة_اختبار')}"
                    data-testid="input-message"
                  />
                </div>

                <div className={t("pages.meta-whatsapp-setup.name.flex_items_center_space_x_2")}>
                  <input
                    type="checkbox"
                    id="useTemplate"
                    checked={useTemplate}
                    onChange={(e) => setUseTemplate(e.target.checked)}
                    data-testid="checkbox-template"
                  />
                  <Label htmlFor="useTemplate" className={t("pages.meta-whatsapp-setup.name.text_sm")}>{t('pages.meta-whatsapp-setup.استخدام_القالب_المُوافق_عليه')}</Label>
                </div>

                {useTemplate && (
                  <div>
                    <Label htmlFor="templateName">{t('pages.meta-whatsapp-setup.اسم_القالب')}</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="{t('pages.meta-whatsapp-setup.placeholder.welcome_hxc4485f514cb7d4536026fc56250f75e7')}"
                      className={t("pages.meta-whatsapp-setup.name.font_mono_text_xs")}
                      data-testid="input-template-name"
                    />
                  </div>
                )}

                <Button
                  onClick={() =>
                    testMetaAPI.mutate({
                      phone: phoneNumber,
                      message,
                      useTemplate,
                      templateName: useTemplate ? templateName : undefined,
                    })
                  }
                  disabled={testMetaAPI.isPending}
                  className={t("pages.meta-whatsapp-setup.name.w_full")}
                  data-testid="button-test-meta"
                >
                  {testMetaAPI.isPending ? (
                    <>
                      <Loader2 className={t("pages.meta-whatsapp-setup.name.mr_2_h_4_w_4_animate_spin")} />{t('pages.meta-whatsapp-setup.جاري_الإرسال...')}</>{t('pages.meta-whatsapp-setup.)_:_(')}<>
                      <Send className={t("pages.meta-whatsapp-setup.name.mr_2_h_4_w_4")} />{t('pages.meta-whatsapp-setup.اختبار_meta_api')}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.meta-whatsapp-setup.name.flex_items_center_gap_2")}>
                  <ExternalLink className={t("pages.meta-whatsapp-setup.name.h_5_w_5")} />{t('pages.meta-whatsapp-setup.روابط_مفيدة')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.meta-whatsapp-setup.name.space_y_3")}>
                  <Button
                    variant="outline"
                    className={t("pages.meta-whatsapp-setup.name.w_full_justify_start_h_auto_p_4")}
                    asChild
                  >
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className={t("pages.meta-whatsapp-setup.name.text_right")}>
                        <div className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.meta_for_developers')}</div>
                        <div className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_500")}>{t('pages.meta-whatsapp-setup.إنشاء_تطبيق_meta_جديد')}</div>
                      </div>
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className={t("pages.meta-whatsapp-setup.name.w_full_justify_start_h_auto_p_4")}
                    asChild
                  >
                    <a
                      href="https://business.facebook.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className={t("pages.meta-whatsapp-setup.name.text_right")}>
                        <div className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.meta_business_manager')}</div>
                        <div className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_500")}>{t('pages.meta-whatsapp-setup.إدارة_الحسابات_التجارية')}</div>
                      </div>
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className={t("pages.meta-whatsapp-setup.name.w_full_justify_start_h_auto_p_4")}
                    asChild
                  >
                    <a
                      href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className={t("pages.meta-whatsapp-setup.name.text_right")}>
                        <div className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.whatsapp_cloud_api_guide')}</div>
                        <div className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_500")}>{t('pages.meta-whatsapp-setup.دليل_البدء_السريع')}</div>
                      </div>
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className={t("pages.meta-whatsapp-setup.name.w_full_justify_start_h_auto_p_4")}
                    asChild
                  >
                    <a
                      href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className={t("pages.meta-whatsapp-setup.name.text_right")}>
                        <div className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.webhook_configuration')}</div>
                        <div className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_500")}>{t('pages.meta-whatsapp-setup.إعداد_webhooks')}</div>
                      </div>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.meta-whatsapp-setup.🎯_مزايا_استخدام_meta_api_مباشرة')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("pages.meta-whatsapp-setup.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_gap_4")}>
              <div className={t("pages.meta-whatsapp-setup.name.flex_items_start_gap_3")}>
                <CheckCircle className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_green_600_mt_1")} />
                <div>
                  <h4 className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.تكلفة_أقل')}</h4>
                  <p className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_600")}>{t('pages.meta-whatsapp-setup.لا_توجد_رسوم_وسطاء،_فقط_رسوم_meta')}</p>
                </div>
              </div>

              <div className={t("pages.meta-whatsapp-setup.name.flex_items_start_gap_3")}>
                <CheckCircle className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_green_600_mt_1")} />
                <div>
                  <h4 className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.تحكم_كامل')}</h4>
                  <p className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_600")}>{t('pages.meta-whatsapp-setup.إدارة_مباشرة_للقوالب_والإعدادات')}</p>
                </div>
              </div>

              <div className={t("pages.meta-whatsapp-setup.name.flex_items_start_gap_3")}>
                <CheckCircle className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_green_600_mt_1")} />
                <div>
                  <h4 className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.ميزات_متقدمة')}</h4>
                  <p className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_600")}>{t('pages.meta-whatsapp-setup.وصول_لجميع_ميزات_whatsapp_business')}</p>
                </div>
              </div>

              <div className={t("pages.meta-whatsapp-setup.name.flex_items_start_gap_3")}>
                <CheckCircle className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_green_600_mt_1")} />
                <div>
                  <h4 className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.استقرار_أعلى')}</h4>
                  <p className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_600")}>{t('pages.meta-whatsapp-setup.اتصال_مباشر_بدون_وسطاء')}</p>
                </div>
              </div>

              <div className={t("pages.meta-whatsapp-setup.name.flex_items_start_gap_3")}>
                <CheckCircle className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_green_600_mt_1")} />
                <div>
                  <h4 className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.تحديثات_فورية')}</h4>
                  <p className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_600")}>{t('pages.meta-whatsapp-setup.الحصول_على_آخر_التحديثات_مباشرة')}</p>
                </div>
              </div>

              <div className={t("pages.meta-whatsapp-setup.name.flex_items_start_gap_3")}>
                <CheckCircle className={t("pages.meta-whatsapp-setup.name.h_5_w_5_text_green_600_mt_1")} />
                <div>
                  <h4 className={t("pages.meta-whatsapp-setup.name.font_medium")}>{t('pages.meta-whatsapp-setup.دعم_أفضل')}</h4>
                  <p className={t("pages.meta-whatsapp-setup.name.text_sm_text_gray_600")}>{t('pages.meta-whatsapp-setup.دعم_مباشر_من_meta')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
