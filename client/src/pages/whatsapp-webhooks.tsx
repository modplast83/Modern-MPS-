import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import {
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Webhook,
  Settings,
  Code,
  Activity,
  RefreshCw,
  Send,
  Loader2,
} from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";

export default function WhatsAppWebhooks() {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("+966");
  const [testMessage, setTestMessage] = useState("مرحباً! اختبار webhook");

  const webhookUrls = {
    meta: `${window.location.origin}/api/notifications/webhook/meta`,
    twilio: `${window.location.origin}/api/notifications/webhook/twilio`,
  };

  const defaultVerifyToken = "mpbf_webhook_token";

  // استعلام الإشعارات لعرض سجل webhook
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 10000,
  });

  const notificationsList = Array.isArray(notifications) ? notifications : [];
  const recentWebhookMessages = notificationsList
    .filter((n: any) => n.channel === "whatsapp")
    .slice(0, 10);

  // اختبار إرسال رسالة
  const sendTestMessage = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/notifications/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          phone_number: testPhone,
          message: testMessage,
          title: "اختبار Webhook",
          use_template: false,
        }),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال رسالة اختبار بنجاح",
      });
      refetchNotifications();
    },
    onError: (error: any) => {
      toast({
        title: "فشل الإرسال",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label} إلى الحافظة`,
    });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const metaSetupSteps = [
    {
      step: 1,
      title: "انتقل إلى Meta App Dashboard",
      description: "اذهب إلى developers.facebook.com واختر تطبيقك",
      link: "https://developers.facebook.com/apps",
    },
    {
      step: 2,
      title: "اختر WhatsApp → Configuration",
      description: "من القائمة الجانبية، اختر WhatsApp ثم Configuration",
    },
    {
      step: 3,
      title: "أضف Webhook URL",
      description: "في قسم Webhooks، أضف الـ URL التالي:",
      code: webhookUrls.meta,
    },
    {
      step: 4,
      title: "أضف Verify Token",
      description: "استخدم الـ token التالي:",
      code: defaultVerifyToken,
    },
    {
      step: 5,
      title: "اشترك في Events",
      description: "اختر الـ events التي تريد استقبالها:",
      items: ["messages", "message_status"],
    },
    {
      step: 6,
      title: "تحقق من الـ Webhook",
      description: 'اضغط على "Verify and Save" للتحقق من الـ webhook',
    },
  ];

  const twilioSetupSteps = [
    {
      step: 1,
      title: "انتقل إلى Twilio Console",
      description: "اذهب إلى console.twilio.com",
      link: "https://console.twilio.com",
    },
    {
      step: 2,
      title: "اختر Messaging → WhatsApp Senders",
      description: "من القائمة، اختر Messaging ثم WhatsApp senders",
    },
    {
      step: 3,
      title: "اختر رقم WhatsApp",
      description: "اضغط على رقم WhatsApp الخاص بك",
    },
    {
      step: 4,
      title: "أضف Status Callback URL",
      description: "في قسم Webhooks، أضف الـ URL التالي:",
      code: webhookUrls.twilio,
    },
    {
      step: 5,
      title: "احفظ التغييرات",
      description: 'اضغط على "Save" لحفظ إعدادات الـ webhook',
    },
  ];

  return (
    <div className={t("pages.whatsapp-webhooks.name.min_h_screen_bg_gray_50_dark_bg_gray_900")}>
      <Header />

      <div className={t("pages.whatsapp-webhooks.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.whatsapp-webhooks.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")} dir="rtl">
          <div className={t("pages.whatsapp-webhooks.name.max_w_6xl_mx_auto_space_y_6")}>
            {/* Header */}
            <div className={t("pages.whatsapp-webhooks.name.text_center")}>
              <h1 className={t("pages.whatsapp-webhooks.name.text_3xl_font_bold_text_gray_900_dark_text_white_mb_2_flex_items_center_justify_center_gap_2")}>
                <Webhook className={t("pages.whatsapp-webhooks.name.h_8_w_8")} />{t('pages.whatsapp-webhooks.إدارة_whatsapp_webhooks')}</h1>
              <p className={t("pages.whatsapp-webhooks.name.text_gray_600_dark_text_gray_400")}>{t('pages.whatsapp-webhooks.تكوين_واختبار_webhooks_للواتساب')}</p>
            </div>

            {/* Webhook URLs */}
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.whatsapp-webhooks.name.flex_items_center_gap_2")}>
                  <Code className={t("pages.whatsapp-webhooks.name.h_5_w_5")} />{t('pages.whatsapp-webhooks.webhook_urls')}</CardTitle>
                <CardDescription>{t('pages.whatsapp-webhooks.استخدم_هذه_الـ_urls_لتكوين_webhooks_في_meta_و_twilio')}</CardDescription>
              </CardHeader>
              <CardContent className={t("pages.whatsapp-webhooks.name.space_y_4")}>
                <div className={t("pages.whatsapp-webhooks.name.space_y_2")}>
                  <Label>{t('pages.whatsapp-webhooks.meta_whatsapp_webhook_url')}</Label>
                  <div className={t("pages.whatsapp-webhooks.name.flex_gap_2")}>
                    <Input
                      value={webhookUrls.meta}
                      readOnly
                      className={t("pages.whatsapp-webhooks.name.font_mono_text_sm")}
                      data-testid="input-meta-webhook-url"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(webhookUrls.meta, "Meta URL")}
                      data-testid="button-copy-meta-url"
                    >
                      {copiedUrl === "Meta URL" ? (
                        <CheckCircle className={t("pages.whatsapp-webhooks.name.h_4_w_4_text_green_500")} />{t('pages.whatsapp-webhooks.)_:_(')}<Copy className={t("pages.whatsapp-webhooks.name.h_4_w_4")} />
                      )}
                    </Button>
                  </div>
                </div>

                <div className={t("pages.whatsapp-webhooks.name.space_y_2")}>
                  <Label>{t('pages.whatsapp-webhooks.twilio_webhook_url')}</Label>
                  <div className={t("pages.whatsapp-webhooks.name.flex_gap_2")}>
                    <Input
                      value={webhookUrls.twilio}
                      readOnly
                      className={t("pages.whatsapp-webhooks.name.font_mono_text_sm")}
                      data-testid="input-twilio-webhook-url"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(webhookUrls.twilio, "Twilio URL")
                      }
                      data-testid="button-copy-twilio-url"
                    >
                      {copiedUrl === "Twilio URL" ? (
                        <CheckCircle className={t("pages.whatsapp-webhooks.name.h_4_w_4_text_green_500")} />{t('pages.whatsapp-webhooks.)_:_(')}<Copy className={t("pages.whatsapp-webhooks.name.h_4_w_4")} />
                      )}
                    </Button>
                  </div>
                </div>

                <div className={t("pages.whatsapp-webhooks.name.space_y_2")}>
                  <Label>{t('pages.whatsapp-webhooks.verify_token_(meta)')}</Label>
                  <div className={t("pages.whatsapp-webhooks.name.flex_gap_2")}>
                    <Input
                      value={defaultVerifyToken}
                      readOnly
                      className={t("pages.whatsapp-webhooks.name.font_mono_text_sm")}
                      data-testid="input-verify-token"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(defaultVerifyToken, "Verify Token")
                      }
                      data-testid="button-copy-verify-token"
                    >
                      {copiedUrl === "Verify Token" ? (
                        <CheckCircle className={t("pages.whatsapp-webhooks.name.h_4_w_4_text_green_500")} />{t('pages.whatsapp-webhooks.)_:_(')}<Copy className={t("pages.whatsapp-webhooks.name.h_4_w_4")} />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Setup Tabs */}
            <Tabs defaultValue="meta" className={t("pages.whatsapp-webhooks.name.w_full")}>
              <TabsList className={t("pages.whatsapp-webhooks.name.grid_w_full_grid_cols_3")}>
                <TabsTrigger value="meta" data-testid="tab-meta-setup">{t('pages.whatsapp-webhooks.تكوين_meta')}</TabsTrigger>
                <TabsTrigger value="twilio" data-testid="tab-twilio-setup">{t('pages.whatsapp-webhooks.تكوين_twilio')}</TabsTrigger>
                <TabsTrigger value="test" data-testid="tab-test">{t('pages.whatsapp-webhooks.اختبار')}</TabsTrigger>
              </TabsList>

              {/* Meta Setup */}
              <TabsContent value="meta">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('pages.whatsapp-webhooks.خطوات_تكوين_meta_whatsapp_webhook')}</CardTitle>
                    <CardDescription>{t('pages.whatsapp-webhooks.اتبع_هذه_الخطوات_لتكوين_webhook_في_meta')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={t("pages.whatsapp-webhooks.name.space_y_4")}>
                      {metaSetupSteps.map((step) => (
                        <div
                          key={step.step}
                          className={t("pages.whatsapp-webhooks.name.border_rounded_lg_p_4_dark_border_gray_700")}
                        >
                          <div className={t("pages.whatsapp-webhooks.name.flex_items_start_gap_3")}>
                            <div className={t("pages.whatsapp-webhooks.name.flex_shrink_0_w_8_h_8_rounded_full_bg_blue_500_text_white_flex_items_center_justify_center_font_bold")}>
                              {step.step}
                            </div>
                            <div className={t("pages.whatsapp-webhooks.name.flex_1_space_y_2")}>
                              <h4 className={t("pages.whatsapp-webhooks.name.font_medium_text_gray_900_dark_text_white")}>
                                {step.title}
                              </h4>
                              <p className={t("pages.whatsapp-webhooks.name.text_sm_text_gray_600_dark_text_gray_400")}>
                                {step.description}
                              </p>
                              {step.link && (
                                <Button
                                  variant="link"
                                  className={t("pages.whatsapp-webhooks.name.p_0_h_auto")}
                                  asChild
                                >
                                  <a
                                    href={step.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >{t('pages.whatsapp-webhooks.افتح_الرابط')}<ExternalLink className={t("pages.whatsapp-webhooks.name.mr_1_h_3_w_3")} />
                                  </a>
                                </Button>
                              )}
                              {step.code && (
                                <div className={t("pages.whatsapp-webhooks.name.bg_gray_100_dark_bg_gray_800_rounded_p_2_font_mono_text_sm_flex_items_center_justify_between")}>
                                  <code className={t("pages.whatsapp-webhooks.name.text_blue_600_dark_text_blue_400")}>
                                    {step.code}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      copyToClipboard(step.code!, step.title)
                                    }
                                  >
                                    <Copy className={t("pages.whatsapp-webhooks.name.h_3_w_3")} />
                                  </Button>
                                </div>
                              )}
                              {step.items && (
                                <ul className={t("pages.whatsapp-webhooks.name.list_disc_list_inside_space_y_1_text_sm_text_gray_700_dark_text_gray_300")}>
                                  {step.items.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Twilio Setup */}
              <TabsContent value="twilio">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('pages.whatsapp-webhooks.خطوات_تكوين_twilio_webhook')}</CardTitle>
                    <CardDescription>{t('pages.whatsapp-webhooks.اتبع_هذه_الخطوات_لتكوين_webhook_في_twilio')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={t("pages.whatsapp-webhooks.name.space_y_4")}>
                      {twilioSetupSteps.map((step) => (
                        <div
                          key={step.step}
                          className={t("pages.whatsapp-webhooks.name.border_rounded_lg_p_4_dark_border_gray_700")}
                        >
                          <div className={t("pages.whatsapp-webhooks.name.flex_items_start_gap_3")}>
                            <div className={t("pages.whatsapp-webhooks.name.flex_shrink_0_w_8_h_8_rounded_full_bg_green_500_text_white_flex_items_center_justify_center_font_bold")}>
                              {step.step}
                            </div>
                            <div className={t("pages.whatsapp-webhooks.name.flex_1_space_y_2")}>
                              <h4 className={t("pages.whatsapp-webhooks.name.font_medium_text_gray_900_dark_text_white")}>
                                {step.title}
                              </h4>
                              <p className={t("pages.whatsapp-webhooks.name.text_sm_text_gray_600_dark_text_gray_400")}>
                                {step.description}
                              </p>
                              {step.link && (
                                <Button
                                  variant="link"
                                  className={t("pages.whatsapp-webhooks.name.p_0_h_auto")}
                                  asChild
                                >
                                  <a
                                    href={step.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >{t('pages.whatsapp-webhooks.افتح_الرابط')}<ExternalLink className={t("pages.whatsapp-webhooks.name.mr_1_h_3_w_3")} />
                                  </a>
                                </Button>
                              )}
                              {step.code && (
                                <div className={t("pages.whatsapp-webhooks.name.bg_gray_100_dark_bg_gray_800_rounded_p_2_font_mono_text_sm_flex_items_center_justify_between")}>
                                  <code className={t("pages.whatsapp-webhooks.name.text_green_600_dark_text_green_400")}>
                                    {step.code}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      copyToClipboard(step.code!, step.title)
                                    }
                                  >
                                    <Copy className={t("pages.whatsapp-webhooks.name.h_3_w_3")} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Test Tab */}
              <TabsContent value="test">
                <Card>
                  <CardHeader>
                    <CardTitle className={t("pages.whatsapp-webhooks.name.flex_items_center_gap_2")}>
                      <Send className={t("pages.whatsapp-webhooks.name.h_5_w_5")} />{t('pages.whatsapp-webhooks.اختبار_إرسال_رسالة')}</CardTitle>
                    <CardDescription>{t('pages.whatsapp-webhooks.أرسل_رسالة_اختبار_للتحقق_من_عمل_webhook')}</CardDescription>
                  </CardHeader>
                  <CardContent className={t("pages.whatsapp-webhooks.name.space_y_4")}>
                    <div className={t("pages.whatsapp-webhooks.name.space_y_2")}>
                      <Label htmlFor="test-phone">{t('pages.whatsapp-webhooks.رقم_الهاتف')}</Label>
                      <Input
                        id="test-phone"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="{t('pages.whatsapp-webhooks.placeholder.+966xxxxxxxxx')}"
                        data-testid="input-test-phone"
                      />
                    </div>

                    <div className={t("pages.whatsapp-webhooks.name.space_y_2")}>
                      <Label htmlFor="test-message">{t('pages.whatsapp-webhooks.الرسالة')}</Label>
                      <Input
                        id="test-message"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="{t('pages.whatsapp-webhooks.placeholder.أدخل_رسالة_الاختبار')}"
                        data-testid="input-test-message"
                      />
                    </div>

                    <Button
                      onClick={() => sendTestMessage.mutate()}
                      disabled={sendTestMessage.isPending}
                      className={t("pages.whatsapp-webhooks.name.w_full")}
                      data-testid="button-send-test"
                    >
                      {sendTestMessage.isPending ? (
                        <>
                          <Loader2 className={t("pages.whatsapp-webhooks.name.ml_2_h_4_w_4_animate_spin")} />{t('pages.whatsapp-webhooks.جاري_الإرسال...')}</>{t('pages.whatsapp-webhooks.)_:_(')}<>
                          <Send className={t("pages.whatsapp-webhooks.name.ml_2_h_4_w_4")} />{t('pages.whatsapp-webhooks.إرسال_رسالة_اختبار')}</>
                      )}
                    </Button>

                    <Alert>
                      <AlertDescription>{t('pages.whatsapp-webhooks.💡_بعد_إرسال_الرسالة،_تحقق_من_قسم_سجل_الـ_webhooks_أدناه_لرؤية_التحديثات')}</AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Webhook Log */}
            <Card>
              <CardHeader>
                <div className={t("pages.whatsapp-webhooks.name.flex_items_center_justify_between")}>
                  <div className={t("pages.whatsapp-webhooks.name.flex_items_center_gap_2")}>
                    <Activity className={t("pages.whatsapp-webhooks.name.h_5_w_5")} />
                    <CardTitle>{t('pages.whatsapp-webhooks.سجل_webhook_messages')}</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchNotifications()}
                    data-testid="button-refresh-log"
                  >
                    <RefreshCw className={t("pages.whatsapp-webhooks.name.h_4_w_4_ml_2")} />{t('pages.whatsapp-webhooks.تحديث')}</Button>
                </div>
                <CardDescription>
                  آخر {recentWebhookMessages.length} رسالة واتساب
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentWebhookMessages.length === 0 ? (
                  <div className={t("pages.whatsapp-webhooks.name.text_center_py_8_text_gray_500")}>{t('pages.whatsapp-webhooks.لا_توجد_رسائل_webhook_حتى_الآن')}</div>{t('pages.whatsapp-webhooks.)_:_(')}<div className={t("pages.whatsapp-webhooks.name.space_y_3")}>
                    {recentWebhookMessages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={t("pages.whatsapp-webhooks.name.border_rounded_lg_p_3_dark_border_gray_700")}
                        data-testid={`webhook-message-${msg.id}`}
                      >
                        <div className={t("pages.whatsapp-webhooks.name.flex_items_center_justify_between_mb_2")}>
                          <div className={t("pages.whatsapp-webhooks.name.flex_items_center_gap_2")}>
                            <span className={t("pages.whatsapp-webhooks.name.font_medium_text_gray_900_dark_text_white")}>
                              {msg.phone_number || "رقم غير محدد"}
                            </span>
                            {msg.status === "sent" ? (
                              <Badge className={t("pages.whatsapp-webhooks.name.bg_green_100_text_green_800_dark_bg_green_900_dark_text_green_100")}>
                                <CheckCircle className={t("pages.whatsapp-webhooks.name.h_3_w_3_ml_1")} />
                                {msg.status}
                              </Badge>{t('pages.whatsapp-webhooks.)_:_msg.status_===_"failed"_?_(')}<Badge className={t("pages.whatsapp-webhooks.name.bg_red_100_text_red_800_dark_bg_red_900_dark_text_red_100")}>
                                <XCircle className={t("pages.whatsapp-webhooks.name.h_3_w_3_ml_1")} />
                                {msg.status}
                              </Badge>{t('pages.whatsapp-webhooks.)_:_(')}<Badge variant="outline">{msg.status}</Badge>
                            )}
                          </div>
                          <span className={t("pages.whatsapp-webhooks.name.text_xs_text_gray_500")}>
                            {new Date(msg.created_at).toLocaleString("ar")}
                          </span>
                        </div>
                        <p className={t("pages.whatsapp-webhooks.name.text_sm_text_gray_700_dark_text_gray_300_mb_1")}>
                          {msg.message}
                        </p>
                        {msg.external_id && (
                          <p className={t("pages.whatsapp-webhooks.name.text_xs_text_gray_500_font_mono")}>
                            Message ID: {msg.external_id}
                          </p>
                        )}
                        {msg.error_message && (
                          <p className={t("pages.whatsapp-webhooks.name.text_xs_text_red_600_mt_1")}>
                            خطأ: {msg.error_message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Alert>
              <Settings className={t("pages.whatsapp-webhooks.name.h_4_w_4")} />
              <AlertDescription className={t("pages.whatsapp-webhooks.name.space_y_2")}>
                <p className={t("pages.whatsapp-webhooks.name.font_medium")}>{t('pages.whatsapp-webhooks.ملاحظات_هامة:')}</p>
                <ul className={t("pages.whatsapp-webhooks.name.list_disc_list_inside_space_y_1_text_sm")}>
                  <li>{t('pages.whatsapp-webhooks.تأكد_من_أن_الـ_webhook_urls_متاحة_للوصول_من_الإنترنت_(لا_تعمل_على_localhost)')}</li>
                  <li>{t('pages.whatsapp-webhooks.يجب_أن_يكون_لديك_https_للـ_webhooks_في_الإنتاج_(replit_توفر_ذلك_تلقائياً)')}</li>
                  <li>{t('pages.whatsapp-webhooks.meta_تتحقق_من_الـ_webhook_باستخدام_get_request_قبل_حفظه')}</li>
                  <li>{t('pages.whatsapp-webhooks.twilio_يرسل_تحديثات_حالة_الرسائل_إلى_webhook')}</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    </div>
  );
}
