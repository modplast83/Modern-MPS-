import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import {
  Send,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

export default function WhatsAppTest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phoneNumber, setPhoneNumber] = useState("+966");
  const [message, setMessage] = useState(
    "مرحباً! هذه رسالة اختبار من نظام MPBF.",
  );
  const [testResults, setTestResults] = useState<any[]>([]);

  // استعلام الإشعارات مع cleanup مناسب
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: false, // Disabled polling to reduce server load
    staleTime: 2 * 60 * 1000, // 2 minutes stale time
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  // تنظيف الاستعلامات عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      // Cancel all queries for this component when unmounting
      queryClient.cancelQueries({ queryKey: ["/api/notifications"] });
    };
  }, [queryClient]);

  // تحويل البيانات إلى مصفوفة
  const notificationsList = Array.isArray(notifications) ? notifications : [];

  // إرسال رسالة اختبار
  const sendTestMessage = useMutation({
    mutationFn: async (data: { phone: string; message: string }) => {
      const response = await apiRequest("/api/notifications/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: data.phone,
          message: data.message,
          title: "رسالة اختبار",
        }),
      });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ تم إرسال الرسالة",
        description: `تم إرسال رسالة اختبار إلى ${phoneNumber}`,
      });

      // إضافة النتيجة إلى السجل
      setTestResults((prev) => [
        {
          timestamp: new Date(),
          phone: phoneNumber,
          message: message,
          status: "sent",
          messageId: data?.messageId || "unknown",
          success: true,
        },
        ...prev,
      ]);

      // تحديث الإشعارات
      refetchNotifications();
    },
    onError: (error: any) => {
      toast({
        title: "❌ فشل في الإرسال",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive",
      });

      // إضافة النتيجة إلى السجل
      setTestResults((prev) => [
        {
          timestamp: new Date(),
          phone: phoneNumber,
          message: message,
          status: "failed",
          error: error.message,
          success: false,
        },
        ...prev,
      ]);
    },
  });

  const handleSendTest = () => {
    if (!phoneNumber || !message) {
      toast({
        title: "⚠️ بيانات ناقصة",
        description: "يرجى ملء رقم الهاتف والرسالة",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.startsWith("+")) {
      toast({
        title: "⚠️ رقم هاتف غير صحيح",
        description: "يجب أن يبدأ رقم الهاتف بـ +",
        variant: "destructive",
      });
      return;
    }

    sendTestMessage.mutate({ phone: phoneNumber, message });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className={t("pages.whatsapp-test.name.h_4_w_4_text_green_600")} />{t('pages.whatsapp-test.;_case_"delivered":_return')}<CheckCircle className={t("pages.whatsapp-test.name.h_4_w_4_text_blue_600")} />{t('pages.whatsapp-test.;_case_"failed":_return')}<XCircle className={t("pages.whatsapp-test.name.h_4_w_4_text_red_600")} />{t('pages.whatsapp-test.;_default:_return')}<Clock className={t("pages.whatsapp-test.name.h_4_w_4_text_yellow_600")} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className={t("pages.whatsapp-test.name.min_h_screen_bg_gray_50_p_4")} dir="rtl">
      <div className={t("pages.whatsapp-test.name.max_w_6xl_mx_auto_space_y_6")}>
        {/* Header */}
        <div className={t("pages.whatsapp-test.name.text_center")}>
          <h1 className={t("pages.whatsapp-test.name.text_3xl_font_bold_text_gray_900_mb_2")}>{t('pages.whatsapp-test.🧪_اختبار_خدمة_whatsapp')}</h1>
          <p className={t("pages.whatsapp-test.name.text_gray_600")}>{t('pages.whatsapp-test.اختبار_إرسال_واستقبال_رسائل_whatsapp_عبر_twilio')}</p>
        </div>

        <div className={t("pages.whatsapp-test.name.grid_grid_cols_1_lg_grid_cols_2_gap_6")}>
          {/* نموذج الإرسال */}
          <Card>
            <CardHeader>
              <CardTitle className={t("pages.whatsapp-test.name.flex_items_center_gap_2")}>
                <Send className={t("pages.whatsapp-test.name.h_5_w_5")} />{t('pages.whatsapp-test.إرسال_رسالة_اختبار')}</CardTitle>
              <CardDescription>{t('pages.whatsapp-test.أرسل_رسالة_whatsapp_لاختبار_الاتصال')}</CardDescription>
            </CardHeader>
            <CardContent className={t("pages.whatsapp-test.name.space_y_4")}>
              <div>
                <Label htmlFor="phone">{t('pages.whatsapp-test.رقم_الهاتف')}</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="{t('pages.whatsapp-test.placeholder.+966501234567')}"
                  dir="ltr"
                  data-testid="input-phone"
                />
                <p className={t("pages.whatsapp-test.name.text_sm_text_gray_500_mt_1")}>{t('pages.whatsapp-test.يجب_أن_يبدأ_بـ_+_ورمز_الدولة')}</p>
              </div>

              <div>
                <Label htmlFor="message">{t('pages.whatsapp-test.الرسالة')}</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="{t('pages.whatsapp-test.placeholder.اكتب_رسالتك_هنا...')}"
                  rows={4}
                  data-testid="textarea-message"
                />
              </div>

              <Button
                onClick={handleSendTest}
                disabled={sendTestMessage.isPending}
                className={t("pages.whatsapp-test.name.w_full")}
                data-testid="button-send-test"
              >
                {sendTestMessage.isPending ? (
                  <>
                    <Loader2 className={t("pages.whatsapp-test.name.mr_2_h_4_w_4_animate_spin")} />{t('pages.whatsapp-test.جاري_الإرسال...')}</>{t('pages.whatsapp-test.)_:_(')}<>
                    <MessageCircle className={t("pages.whatsapp-test.name.mr_2_h_4_w_4")} />{t('pages.whatsapp-test.إرسال_رسالة_اختبار')}</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* معلومات النظام */}
          <Card>
            <CardHeader>
              <CardTitle className={t("pages.whatsapp-test.name.flex_items_center_gap_2")}>
                <Phone className={t("pages.whatsapp-test.name.h_5_w_5")} />{t('pages.whatsapp-test.معلومات_النظام')}</CardTitle>
            </CardHeader>
            <CardContent className={t("pages.whatsapp-test.name.space_y_4")}>
              <div className={t("pages.whatsapp-test.name.space_y_2")}>
                <div className={t("pages.whatsapp-test.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-test.name.text_sm_text_gray_600")}>{t('pages.whatsapp-test.رقم_whatsapp:')}</span>
                  <Badge variant="outline" data-testid="badge-whatsapp-number">{t('pages.whatsapp-test.+15557911537')}</Badge>
                </div>

                <div className={t("pages.whatsapp-test.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-test.name.text_sm_text_gray_600")}>{t('pages.whatsapp-test.اسم_الشركة:')}</span>
                  <Badge variant="outline" data-testid="badge-business-name">{t('pages.whatsapp-test.mpbf')}</Badge>
                </div>

                <div className={t("pages.whatsapp-test.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-test.name.text_sm_text_gray_600")}>{t('pages.whatsapp-test.حالة_الخدمة:')}</span>
                  <Badge
                    className={t("pages.whatsapp-test.name.bg_green_100_text_green_800")}
                    data-testid="badge-service-status"
                  >{t('pages.whatsapp-test.✅_متصل')}</Badge>
                </div>

                <div className={t("pages.whatsapp-test.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-test.name.text_sm_text_gray_600")}>{t('pages.whatsapp-test.webhook_url:')}</span>
                  <code
                    className={t("pages.whatsapp-test.name.text_xs_bg_gray_100_px_2_py_1_rounded")}
                    data-testid="text-webhook-url"
                  >{t('pages.whatsapp-test./api/notifications/webhook/twilio')}</code>
                </div>
              </div>

              <div className={t("pages.whatsapp-test.name.bg_blue_50_p_3_rounded_lg")}>
                <p className={t("pages.whatsapp-test.name.text_sm_text_blue_700")}>
                  <strong>{t('pages.whatsapp-test.💡_نصيحة:')}</strong>{t('pages.whatsapp-test.تأكد_من_إعداد_webhook_url_في_twilio_console_لاستقبال_الرسائل_والتحديثات.')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* سجل النتائج */}
        {testResults.length >{t('pages.whatsapp-test.0_&&_(')}<Card>
            <CardHeader>
              <CardTitle>{t('pages.whatsapp-test.📋_سجل_الاختبارات')}</CardTitle>
              <CardDescription>{t('pages.whatsapp-test.نتائج_رسائل_الاختبار_المرسلة')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={t("pages.whatsapp-test.name.space_y_3")}>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={t("pages.whatsapp-test.name.border_rounded_lg_p_3_bg_white")}
                    data-testid={`test-result-${index}`}
                  >
                    <div className={t("pages.whatsapp-test.name.flex_items_center_justify_between_mb_2")}>
                      <div className={t("pages.whatsapp-test.name.flex_items_center_gap_2")}>
                        {getStatusIcon(result.status)}
                        <span className={t("pages.whatsapp-test.name.font_medium")}>{result.phone}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <span className={t("pages.whatsapp-test.name.text_sm_text_gray_500")}>
                        {result.timestamp.toLocaleTimeString("ar")}
                      </span>
                    </div>

                    <p className={t("pages.whatsapp-test.name.text_sm_text_gray_700_mb_1")}>
                      "{result.message}"
                    </p>

                    {result.messageId && (
                      <p className={t("pages.whatsapp-test.name.text_xs_text_gray_500")}>
                        Message ID: {result.messageId}
                      </p>
                    )}

                    {result.error && (
                      <p className={t("pages.whatsapp-test.name.text_xs_text_red_600")}>
                        خطأ: {result.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* الإشعارات الأخيرة */}
        {notificationsList && notificationsList.length >{t('pages.whatsapp-test.0_&&_(')}<Card>
            <CardHeader>
              <CardTitle>{t('pages.whatsapp-test.📬_آخر_الإشعارات')}</CardTitle>
              <CardDescription>{t('pages.whatsapp-test.الإشعارات_المرسلة_عبر_النظام')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={t("pages.whatsapp-test.name.space_y_3")}>
                {notificationsList.slice(0, 5).map((notification: any) => (
                  <div
                    key={notification.id}
                    className={t("pages.whatsapp-test.name.border_rounded_lg_p_3_bg_white")}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className={t("pages.whatsapp-test.name.flex_items_center_justify_between_mb_2")}>
                      <div className={t("pages.whatsapp-test.name.flex_items_center_gap_2")}>
                        <MessageCircle className={t("pages.whatsapp-test.name.h_4_w_4")} />
                        <span className={t("pages.whatsapp-test.name.font_medium")}>
                          {notification.title}
                        </span>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status}
                        </Badge>
                      </div>
                      <span className={t("pages.whatsapp-test.name.text_sm_text_gray_500")}>
                        {new Date(notification.created_at).toLocaleString("ar")}
                      </span>
                    </div>

                    <p className={t("pages.whatsapp-test.name.text_sm_text_gray_700_mb_1")}>
                      {notification.message}
                    </p>

                    {notification.phone_number && (
                      <p className={t("pages.whatsapp-test.name.text_xs_text_gray_500")}>
                        إلى: {notification.phone_number}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
