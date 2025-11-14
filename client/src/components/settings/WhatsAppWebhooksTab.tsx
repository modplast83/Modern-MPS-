import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
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

export default function WhatsAppWebhooksTab() {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("+966");
  const [testMessage, setTestMessage] = useState("مرحباً! اختبار webhook");

  const webhookUrls = {
    meta: `${window.location.origin}/api/notifications/webhook/meta`,
    twilio: `${window.location.origin}/api/notifications/webhook/twilio`,
  };

  const defaultVerifyToken = "mpbf_webhook_token";

  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 10000,
  });

  const notificationsList = Array.isArray(notifications) ? notifications : [];
  const recentWebhookMessages = notificationsList
    .filter((n: any) => n.channel === "whatsapp")
    .slice(0, 10);

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
    <div className={t("components.settings.whatsappwebhookstab.name.space_y_6")}>
      <Card>
        <CardHeader>
          <CardTitle className={t("components.settings.whatsappwebhookstab.name.flex_items_center_gap_2")}>
            <Code className={t("components.settings.whatsappwebhookstab.name.h_5_w_5")} />{t('components.settings.WhatsAppWebhooksTab.webhook_urls')}</CardTitle>
          <CardDescription>{t('components.settings.WhatsAppWebhooksTab.استخدم_هذه_الـ_urls_لتكوين_webhooks_في_meta_و_twilio')}</CardDescription>
        </CardHeader>
        <CardContent className={t("components.settings.whatsappwebhookstab.name.space_y_4")}>
          <div className={t("components.settings.whatsappwebhookstab.name.space_y_2")}>
            <Label>{t('components.settings.WhatsAppWebhooksTab.meta_whatsapp_webhook_url')}</Label>
            <div className={t("components.settings.whatsappwebhookstab.name.flex_gap_2")}>
              <Input
                value={webhookUrls.meta}
                readOnly
                className={t("components.settings.whatsappwebhookstab.name.font_mono_text_sm")}
                data-testid="input-meta-webhook-url"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrls.meta, "Meta URL")}
                data-testid="button-copy-meta-url"
              >
                {copiedUrl === "Meta URL" ? (
                  <CheckCircle className={t("components.settings.whatsappwebhookstab.name.h_4_w_4_text_green_500")} />{t('components.settings.WhatsAppWebhooksTab.)_:_(')}<Copy className={t("components.settings.whatsappwebhookstab.name.h_4_w_4")} />
                )}
              </Button>
            </div>
          </div>

          <div className={t("components.settings.whatsappwebhookstab.name.space_y_2")}>
            <Label>{t('components.settings.WhatsAppWebhooksTab.twilio_webhook_url')}</Label>
            <div className={t("components.settings.whatsappwebhookstab.name.flex_gap_2")}>
              <Input
                value={webhookUrls.twilio}
                readOnly
                className={t("components.settings.whatsappwebhookstab.name.font_mono_text_sm")}
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
                  <CheckCircle className={t("components.settings.whatsappwebhookstab.name.h_4_w_4_text_green_500")} />{t('components.settings.WhatsAppWebhooksTab.)_:_(')}<Copy className={t("components.settings.whatsappwebhookstab.name.h_4_w_4")} />
                )}
              </Button>
            </div>
          </div>

          <div className={t("components.settings.whatsappwebhookstab.name.space_y_2")}>
            <Label>{t('components.settings.WhatsAppWebhooksTab.verify_token_(meta)')}</Label>
            <div className={t("components.settings.whatsappwebhookstab.name.flex_gap_2")}>
              <Input
                value={defaultVerifyToken}
                readOnly
                className={t("components.settings.whatsappwebhookstab.name.font_mono_text_sm")}
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
                  <CheckCircle className={t("components.settings.whatsappwebhookstab.name.h_4_w_4_text_green_500")} />{t('components.settings.WhatsAppWebhooksTab.)_:_(')}<Copy className={t("components.settings.whatsappwebhookstab.name.h_4_w_4")} />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="meta" className={t("components.settings.whatsappwebhookstab.name.w_full")}>
        <TabsList className={t("components.settings.whatsappwebhookstab.name.grid_w_full_grid_cols_3")}>
          <TabsTrigger value="meta" data-testid="tab-meta-setup">{t('components.settings.WhatsAppWebhooksTab.تكوين_meta')}</TabsTrigger>
          <TabsTrigger value="twilio" data-testid="tab-twilio-setup">{t('components.settings.WhatsAppWebhooksTab.تكوين_twilio')}</TabsTrigger>
          <TabsTrigger value="test" data-testid="tab-test">{t('components.settings.WhatsAppWebhooksTab.اختبار')}</TabsTrigger>
        </TabsList>

        <TabsContent value="meta">
          <Card>
            <CardHeader>
              <CardTitle>{t('components.settings.WhatsAppWebhooksTab.خطوات_تكوين_meta_whatsapp_webhook')}</CardTitle>
              <CardDescription>{t('components.settings.WhatsAppWebhooksTab.اتبع_هذه_الخطوات_لتكوين_webhook_في_meta')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={t("components.settings.whatsappwebhookstab.name.space_y_4")}>
                {metaSetupSteps.map((step) => (
                  <div
                    key={step.step}
                    className={t("components.settings.whatsappwebhookstab.name.border_rounded_lg_p_4_dark_border_gray_700")}
                  >
                    <div className={t("components.settings.whatsappwebhookstab.name.flex_items_start_gap_3")}>
                      <div className={t("components.settings.whatsappwebhookstab.name.flex_shrink_0_w_8_h_8_rounded_full_bg_blue_500_text_white_flex_items_center_justify_center_font_bold")}>
                        {step.step}
                      </div>
                      <div className={t("components.settings.whatsappwebhookstab.name.flex_1_space_y_2")}>
                        <h4 className={t("components.settings.whatsappwebhookstab.name.font_medium_text_gray_900_dark_text_white")}>
                          {step.title}
                        </h4>
                        <p className={t("components.settings.whatsappwebhookstab.name.text_sm_text_gray_600_dark_text_gray_400")}>
                          {step.description}
                        </p>
                        {step.link && (
                          <Button
                            variant="link"
                            className={t("components.settings.whatsappwebhookstab.name.p_0_h_auto")}
                            asChild
                          >
                            <a
                              href={step.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >{t('components.settings.WhatsAppWebhooksTab.افتح_الرابط')}<ExternalLink className={t("components.settings.whatsappwebhookstab.name.mr_1_h_3_w_3")} />
                            </a>
                          </Button>
                        )}
                        {step.code && (
                          <div className={t("components.settings.whatsappwebhookstab.name.bg_gray_100_dark_bg_gray_800_rounded_p_2_font_mono_text_sm_flex_items_center_justify_between")}>
                            <code className={t("components.settings.whatsappwebhookstab.name.text_blue_600_dark_text_blue_400")}>
                              {step.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(step.code!, step.title)
                              }
                            >
                              <Copy className={t("components.settings.whatsappwebhookstab.name.h_3_w_3")} />
                            </Button>
                          </div>
                        )}
                        {step.items && (
                          <ul className={t("components.settings.whatsappwebhookstab.name.list_disc_list_inside_space_y_1_text_sm_text_gray_700_dark_text_gray_300")}>
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

        <TabsContent value="twilio">
          <Card>
            <CardHeader>
              <CardTitle>{t('components.settings.WhatsAppWebhooksTab.خطوات_تكوين_twilio_webhook')}</CardTitle>
              <CardDescription>{t('components.settings.WhatsAppWebhooksTab.اتبع_هذه_الخطوات_لتكوين_webhook_في_twilio')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={t("components.settings.whatsappwebhookstab.name.space_y_4")}>
                {twilioSetupSteps.map((step) => (
                  <div
                    key={step.step}
                    className={t("components.settings.whatsappwebhookstab.name.border_rounded_lg_p_4_dark_border_gray_700")}
                  >
                    <div className={t("components.settings.whatsappwebhookstab.name.flex_items_start_gap_3")}>
                      <div className={t("components.settings.whatsappwebhookstab.name.flex_shrink_0_w_8_h_8_rounded_full_bg_green_500_text_white_flex_items_center_justify_center_font_bold")}>
                        {step.step}
                      </div>
                      <div className={t("components.settings.whatsappwebhookstab.name.flex_1_space_y_2")}>
                        <h4 className={t("components.settings.whatsappwebhookstab.name.font_medium_text_gray_900_dark_text_white")}>
                          {step.title}
                        </h4>
                        <p className={t("components.settings.whatsappwebhookstab.name.text_sm_text_gray_600_dark_text_gray_400")}>
                          {step.description}
                        </p>
                        {step.link && (
                          <Button
                            variant="link"
                            className={t("components.settings.whatsappwebhookstab.name.p_0_h_auto")}
                            asChild
                          >
                            <a
                              href={step.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >{t('components.settings.WhatsAppWebhooksTab.افتح_الرابط')}<ExternalLink className={t("components.settings.whatsappwebhookstab.name.mr_1_h_3_w_3")} />
                            </a>
                          </Button>
                        )}
                        {step.code && (
                          <div className={t("components.settings.whatsappwebhookstab.name.bg_gray_100_dark_bg_gray_800_rounded_p_2_font_mono_text_sm_flex_items_center_justify_between")}>
                            <code className={t("components.settings.whatsappwebhookstab.name.text_green_600_dark_text_green_400")}>
                              {step.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(step.code!, step.title)
                              }
                            >
                              <Copy className={t("components.settings.whatsappwebhookstab.name.h_3_w_3")} />
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

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className={t("components.settings.whatsappwebhookstab.name.flex_items_center_gap_2")}>
                <Send className={t("components.settings.whatsappwebhookstab.name.h_5_w_5")} />{t('components.settings.WhatsAppWebhooksTab.اختبار_إرسال_رسالة')}</CardTitle>
              <CardDescription>{t('components.settings.WhatsAppWebhooksTab.أرسل_رسالة_اختبار_للتحقق_من_عمل_webhook')}</CardDescription>
            </CardHeader>
            <CardContent className={t("components.settings.whatsappwebhookstab.name.space_y_4")}>
              <div className={t("components.settings.whatsappwebhookstab.name.space_y_2")}>
                <Label htmlFor="test-phone">{t('components.settings.WhatsAppWebhooksTab.رقم_الهاتف')}</Label>
                <Input
                  id="test-phone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="{t('components.settings.WhatsAppWebhooksTab.placeholder.+966xxxxxxxxx')}"
                  data-testid="input-test-phone"
                />
              </div>

              <div className={t("components.settings.whatsappwebhookstab.name.space_y_2")}>
                <Label htmlFor="test-message">{t('components.settings.WhatsAppWebhooksTab.الرسالة')}</Label>
                <Input
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="{t('components.settings.WhatsAppWebhooksTab.placeholder.أدخل_رسالة_الاختبار')}"
                  data-testid="input-test-message"
                />
              </div>

              <Button
                onClick={() => sendTestMessage.mutate()}
                disabled={sendTestMessage.isPending}
                className={t("components.settings.whatsappwebhookstab.name.w_full")}
                data-testid="button-send-test"
              >
                {sendTestMessage.isPending ? (
                  <>
                    <Loader2 className={t("components.settings.whatsappwebhookstab.name.ml_2_h_4_w_4_animate_spin")} />{t('components.settings.WhatsAppWebhooksTab.جاري_الإرسال...')}</>{t('components.settings.WhatsAppWebhooksTab.)_:_(')}<>
                    <Send className={t("components.settings.whatsappwebhookstab.name.ml_2_h_4_w_4")} />{t('components.settings.WhatsAppWebhooksTab.إرسال_رسالة_اختبار')}</>
                )}
              </Button>

              <Alert>
                <AlertDescription>{t('components.settings.WhatsAppWebhooksTab.💡_بعد_إرسال_الرسالة،_تحقق_من_قسم_سجل_الـ_webhooks_أدناه_لرؤية_التحديثات')}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <div className={t("components.settings.whatsappwebhookstab.name.flex_items_center_justify_between")}>
            <div className={t("components.settings.whatsappwebhookstab.name.flex_items_center_gap_2")}>
              <Activity className={t("components.settings.whatsappwebhookstab.name.h_5_w_5")} />
              <CardTitle>{t('components.settings.WhatsAppWebhooksTab.سجل_webhook_messages')}</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchNotifications()}
              data-testid="button-refresh-log"
            >
              <RefreshCw className={t("components.settings.whatsappwebhookstab.name.h_4_w_4_ml_2")} />{t('components.settings.WhatsAppWebhooksTab.تحديث')}</Button>
          </div>
          <CardDescription>
            آخر {recentWebhookMessages.length} رسالة واتساب
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentWebhookMessages.length === 0 ? (
            <div className={t("components.settings.whatsappwebhookstab.name.text_center_py_8_text_gray_500")}>{t('components.settings.WhatsAppWebhooksTab.لا_توجد_رسائل_webhook_حتى_الآن')}</div>{t('components.settings.WhatsAppWebhooksTab.)_:_(')}<div className={t("components.settings.whatsappwebhookstab.name.space_y_3")}>
              {recentWebhookMessages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={t("components.settings.whatsappwebhookstab.name.border_rounded_lg_p_3_dark_border_gray_700")}
                  data-testid={`webhook-message-${msg.id}`}
                >
                  <div className={t("components.settings.whatsappwebhookstab.name.flex_items_center_justify_between_mb_2")}>
                    <div className={t("components.settings.whatsappwebhookstab.name.flex_items_center_gap_2")}>
                      <span className={t("components.settings.whatsappwebhookstab.name.font_medium_text_gray_900_dark_text_white")}>
                        {msg.phone_number || "رقم غير محدد"}
                      </span>
                      {msg.status === "sent" ? (
                        <Badge className={t("components.settings.whatsappwebhookstab.name.bg_green_100_text_green_800_dark_bg_green_900_dark_text_green_100")}>
                          <CheckCircle className={t("components.settings.whatsappwebhookstab.name.h_3_w_3_ml_1")} />
                          {msg.status}
                        </Badge>{t('components.settings.WhatsAppWebhooksTab.)_:_msg.status_===_"failed"_?_(')}<Badge className={t("components.settings.whatsappwebhookstab.name.bg_red_100_text_red_800_dark_bg_red_900_dark_text_red_100")}>
                          <XCircle className={t("components.settings.whatsappwebhookstab.name.h_3_w_3_ml_1")} />
                          {msg.status}
                        </Badge>{t('components.settings.WhatsAppWebhooksTab.)_:_(')}<Badge variant="outline">{msg.status}</Badge>
                      )}
                    </div>
                    <span className={t("components.settings.whatsappwebhookstab.name.text_xs_text_gray_500")}>
                      {new Date(msg.created_at).toLocaleString("ar")}
                    </span>
                  </div>
                  <p className={t("components.settings.whatsappwebhookstab.name.text_sm_text_gray_700_dark_text_gray_300_mb_1")}>
                    {msg.message}
                  </p>
                  {msg.external_id && (
                    <p className={t("components.settings.whatsappwebhookstab.name.text_xs_text_gray_500_font_mono")}>
                      Message ID: {msg.external_id}
                    </p>
                  )}
                  {msg.error_message && (
                    <p className={t("components.settings.whatsappwebhookstab.name.text_xs_text_red_600_mt_1")}>
                      خطأ: {msg.error_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <Settings className={t("components.settings.whatsappwebhookstab.name.h_4_w_4")} />
        <AlertDescription className={t("components.settings.whatsappwebhookstab.name.text_sm")}>
          <strong>{t('components.settings.WhatsAppWebhooksTab.ملاحظات_هامة:')}</strong>
          <ul className={t("components.settings.whatsappwebhookstab.name.list_disc_list_inside_mt_2_space_y_1")}>
            <li>{t('components.settings.WhatsAppWebhooksTab.تأكد_من_تفعيل_webhook_في_meta_أو_twilio_قبل_الاختبار')}</li>
            <li>{t('components.settings.WhatsAppWebhooksTab.الرسائل_المرسلة_عبر_meta_تتطلب_قالب_معتمد_في_الإنتاج')}</li>
            <li>{t('components.settings.WhatsAppWebhooksTab.رسائل_twilio_الاختبارية_تعمل_مع_أرقام_محددة_فقط')}</li>
            <li>{t('components.settings.WhatsAppWebhooksTab.تحقق_من_صحة_الـ_verify_token_في_إعدادات_meta')}</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
