import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  MessageCircle,
  Settings,
  ExternalLink,
} from "lucide-react";

export default function WhatsAppTroubleshoot() {
  const queryClient = useQueryClient();
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  // استعلام الإشعارات للتحقق من أخطاء Twilio مع معدل تحديث مُحسن
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    // Reduce polling frequency to every 30 seconds instead of 10
    refetchInterval: 30000,
    // Use global gcTime instead of overriding
    // Remove manual cleanup - React Query handles this automatically
  });

  const notificationsList = Array.isArray(notifications) ? notifications : [];
  const failedMessages = notificationsList.filter(
    (n: any) => n.status === "failed" || n.external_status === "undelivered",
  );

  const troubleshootSteps = [
    {
      id: "check-twilio-console",
      title: "التحقق من Twilio Console",
      description: "تأكد من إعداد WhatsApp Business في Twilio Console",
      status: "pending",
      actions: [
        "اذهب إلى Twilio Console → Messaging → WhatsApp senders",
        "تأكد أن رقم +15557911537 مُفعل ومُصدق عليه",
        "تحقق من حالة WhatsApp Business Account",
      ],
    },
    {
      id: "verify-recipient",
      title: "التحقق من رقم المستقبل",
      description: "تأكد أن رقم الهاتف المستقبل مُسجل في WhatsApp",
      status: "pending",
      actions: [
        "تأكد أن الرقم مُسجل في WhatsApp",
        "تأكد أن الرقم يقبل رسائل من أرقام الأعمال",
        "جرب إرسال رسالة إلى رقم مختلف",
      ],
    },
    {
      id: "check-template-approval",
      title: "التحقق من قوالب الرسائل",
      description:
        "تأكد من الموافقة على قوالب الرسائل في Meta Business Manager",
      status: "pending",
      actions: [
        "اذهب إلى Meta Business Manager → WhatsApp → Message Templates",
        "تأكد من وجود قالب رسالة مُوافق عليه",
        'قم بإنشاء قالب "Hello World" إذا لم يكن موجوداً',
      ],
    },
    {
      id: "sandbox-mode",
      title: "وضع Sandbox",
      description: "التحقق من إعدادات وضع الاختبار",
      status: "pending",
      actions: [
        "في WhatsApp Sandbox، يجب إضافة الأرقام المستقبلة يدوياً",
        'أرسل رسالة "join" إلى رقم Sandbox من هاتفك',
        "تأكد أن الرقم المستقبل مُضاف إلى Sandbox",
      ],
    },
    {
      id: "webhook-setup",
      title: "إعداد Webhook",
      description: "التحقق من إعداد Webhook في Twilio",
      status: "pending",
      actions: [
        "اذهب إلى Twilio Console → Messaging → WhatsApp senders → Configure",
        "تأكد من إعداد Webhook URL بشكل صحيح",
        `استخدم: ${window.location.origin}/api/notifications/webhook/twilio`,
      ],
    },
  ];

  const toggleCheck = (itemId: string) => {
    setCheckedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const getErrorCode63016Details = () => ({
    code: "63016",
    description:
      "WhatsApp Business Account غير مُعد بشكل صحيح أو المستقبل غير مُسجل",
    solutions: [
      "تأكد من تفعيل WhatsApp Business Account في Meta Business Manager",
      "تأكد من ربط الحساب بـ Twilio بشكل صحيح",
      "تأكد أن رقم المستقبل مُسجل في WhatsApp ويقبل رسائل الأعمال",
      "في وضع Sandbox، يجب إضافة الأرقام المستقبلة يدوياً",
    ],
  });

  const error63016 = getErrorCode63016Details();

  return (
    <div className={t("pages.whatsapp-troubleshoot.name.min_h_screen_bg_gray_50_p_4")} dir="rtl">
      <div className={t("pages.whatsapp-troubleshoot.name.max_w_4xl_mx_auto_space_y_6")}>
        {/* Header */}
        <div className={t("pages.whatsapp-troubleshoot.name.text_center")}>
          <h1 className={t("pages.whatsapp-troubleshoot.name.text_3xl_font_bold_text_gray_900_mb_2")}>{t('pages.whatsapp-troubleshoot.🔧_تشخيص_مشاكل_whatsapp')}</h1>
          <p className={t("pages.whatsapp-troubleshoot.name.text_gray_600")}>{t('pages.whatsapp-troubleshoot.دليل_خطوة_بخطوة_لحل_مشاكل_إرسال_رسائل_whatsapp')}</p>
        </div>

        {/* خطأ 63016 */}
        <Card className={t("pages.whatsapp-troubleshoot.name.border_red_200_bg_red_50")}>
          <CardHeader>
            <CardTitle className={t("pages.whatsapp-troubleshoot.name.flex_items_center_gap_2_text_red_700")}>
              <XCircle className={t("pages.whatsapp-troubleshoot.name.h_5_w_5")} />
              خطأ Twilio: {error63016.code}
            </CardTitle>
            <CardDescription className={t("pages.whatsapp-troubleshoot.name.text_red_600")}>
              {error63016.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={t("pages.whatsapp-troubleshoot.name.space_y_2")}>
              <h4 className={t("pages.whatsapp-troubleshoot.name.font_medium_text_red_700")}>{t('pages.whatsapp-troubleshoot.الحلول_المقترحة:')}</h4>
              <ul className={t("pages.whatsapp-troubleshoot.name.list_disc_list_inside_space_y_1_text_sm_text_red_700")}>
                {error63016.solutions.map((solution, index) => (
                  <li key={index}>{solution}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* معلومات النظام الحالي */}
        <Card>
          <CardHeader>
            <CardTitle className={t("pages.whatsapp-troubleshoot.name.flex_items_center_gap_2")}>
              <Settings className={t("pages.whatsapp-troubleshoot.name.h_5_w_5")} />{t('pages.whatsapp-troubleshoot.حالة_النظام_الحالي')}</CardTitle>
          </CardHeader>
          <CardContent className={t("pages.whatsapp-troubleshoot.name.space_y_4")}>
            <div className={t("pages.whatsapp-troubleshoot.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
              <div className={t("pages.whatsapp-troubleshoot.name.space_y_2")}>
                <div className={t("pages.whatsapp-troubleshoot.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_600")}>{t('pages.whatsapp-troubleshoot.رقم_whatsapp:')}</span>
                  <Badge variant="outline">{t('pages.whatsapp-troubleshoot.+15557911537')}</Badge>
                </div>

                <div className={t("pages.whatsapp-troubleshoot.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_600")}>{t('pages.whatsapp-troubleshoot.business_account_id:')}</span>
                  <Badge variant="outline" className={t("pages.whatsapp-troubleshoot.name.text_xs")}>{t('pages.whatsapp-troubleshoot.795259496521200')}</Badge>
                </div>

                <div className={t("pages.whatsapp-troubleshoot.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_600")}>{t('pages.whatsapp-troubleshoot.twilio_account:')}</span>
                  <Badge variant="outline" className={t("pages.whatsapp-troubleshoot.name.text_xs")}>{t('pages.whatsapp-troubleshoot.ace4ba2fd2e98be5b019c354539404cc29')}</Badge>
                </div>
              </div>

              <div className={t("pages.whatsapp-troubleshoot.name.space_y_2")}>
                <div className={t("pages.whatsapp-troubleshoot.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_600")}>{t('pages.whatsapp-troubleshoot.آخر_رسالة:')}</span>
                  <Badge className={t("pages.whatsapp-troubleshoot.name.bg_red_100_text_red_800")}>{t('pages.whatsapp-troubleshoot.undelivered')}</Badge>
                </div>

                <div className={t("pages.whatsapp-troubleshoot.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_600")}>{t('pages.whatsapp-troubleshoot.كود_الخطأ:')}</span>
                  <Badge className={t("pages.whatsapp-troubleshoot.name.bg_red_100_text_red_800")}>{t('pages.whatsapp-troubleshoot.63016')}</Badge>
                </div>

                <div className={t("pages.whatsapp-troubleshoot.name.flex_justify_between_items_center")}>
                  <span className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_600")}>{t('pages.whatsapp-troubleshoot.الرسائل_الفاشلة:')}</span>
                  <Badge className={t("pages.whatsapp-troubleshoot.name.bg_red_100_text_red_800")}>
                    {failedMessages.length}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* خطوات التشخيص */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.whatsapp-troubleshoot.📋_قائمة_التحقق')}</CardTitle>
            <CardDescription>{t('pages.whatsapp-troubleshoot.اتبع_هذه_الخطوات_بالترتيب_لحل_المشكلة')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={t("pages.whatsapp-troubleshoot.name.space_y_4")}>
              {troubleshootSteps.map((step) => (
                <div key={step.id} className={t("pages.whatsapp-troubleshoot.name.border_rounded_lg_p_4")}>
                  <div className={t("pages.whatsapp-troubleshoot.name.flex_items_start_gap_3")}>
                    <button
                      onClick={() => toggleCheck(step.id)}
                      className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        checkedItems.includes(step.id)
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {checkedItems.includes(step.id) && (
                        <CheckCircle className={t("pages.whatsapp-troubleshoot.name.h_3_w_3")} />
                      )}
                    </button>

                    <div className={t("pages.whatsapp-troubleshoot.name.flex_1")}>
                      <h4 className={t("pages.whatsapp-troubleshoot.name.font_medium_text_gray_900")}>
                        {step.title}
                      </h4>
                      <p className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_600_mb_2")}>
                        {step.description}
                      </p>

                      <div className={t("pages.whatsapp-troubleshoot.name.space_y_1")}>
                        {step.actions.map((action, index) => (
                          <div
                            key={index}
                            className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_700_flex_items_start_gap_2")}
                          >
                            <span className={t("pages.whatsapp-troubleshoot.name.text_blue_500_mt_1")}>•</span>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* روابط مفيدة */}
        <Card>
          <CardHeader>
            <CardTitle className={t("pages.whatsapp-troubleshoot.name.flex_items_center_gap_2")}>
              <ExternalLink className={t("pages.whatsapp-troubleshoot.name.h_5_w_5")} />{t('pages.whatsapp-troubleshoot.روابط_مفيدة')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("pages.whatsapp-troubleshoot.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
              <Button
                variant="outline"
                className={t("pages.whatsapp-troubleshoot.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://console.twilio.com/us1/develop/sms/senders/whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.whatsapp-troubleshoot.name.text_left")}>
                    <div className={t("pages.whatsapp-troubleshoot.name.font_medium")}>{t('pages.whatsapp-troubleshoot.twilio_whatsapp_console')}</div>
                    <div className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_500")}>{t('pages.whatsapp-troubleshoot.إدارة_أرقام_whatsapp')}</div>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                className={t("pages.whatsapp-troubleshoot.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://business.facebook.com/wa/manage"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.whatsapp-troubleshoot.name.text_left")}>
                    <div className={t("pages.whatsapp-troubleshoot.name.font_medium")}>{t('pages.whatsapp-troubleshoot.meta_business_manager')}</div>
                    <div className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_500")}>{t('pages.whatsapp-troubleshoot.إدارة_whatsapp_business')}</div>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                className={t("pages.whatsapp-troubleshoot.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://www.twilio.com/docs/whatsapp/sandbox"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.whatsapp-troubleshoot.name.text_left")}>
                    <div className={t("pages.whatsapp-troubleshoot.name.font_medium")}>{t('pages.whatsapp-troubleshoot.whatsapp_sandbox')}</div>
                    <div className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_500")}>{t('pages.whatsapp-troubleshoot.دليل_وضع_الاختبار')}</div>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                className={t("pages.whatsapp-troubleshoot.name.h_auto_p_4_justify_start")}
                asChild
              >
                <a
                  href="https://www.twilio.com/docs/errors/63016"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={t("pages.whatsapp-troubleshoot.name.text_left")}>
                    <div className={t("pages.whatsapp-troubleshoot.name.font_medium")}>{t('pages.whatsapp-troubleshoot.تفاصيل_خطأ_63016')}</div>
                    <div className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_500")}>{t('pages.whatsapp-troubleshoot.شرح_مفصل_للخطأ')}</div>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* الرسائل الفاشلة */}
        {failedMessages.length >{t('pages.whatsapp-troubleshoot.0_&&_(')}<Card>
            <CardHeader>
              <CardTitle className={t("pages.whatsapp-troubleshoot.name.flex_items_center_gap_2_text_red_700")}>
                <AlertTriangle className={t("pages.whatsapp-troubleshoot.name.h_5_w_5")} />
                الرسائل الفاشلة ({failedMessages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={t("pages.whatsapp-troubleshoot.name.space_y_3")}>
                {failedMessages.slice(0, 5).map((message: any) => (
                  <div
                    key={message.id}
                    className={t("pages.whatsapp-troubleshoot.name.border_rounded_lg_p_3_bg_red_50")}
                  >
                    <div className={t("pages.whatsapp-troubleshoot.name.flex_items_center_justify_between_mb_2")}>
                      <span className={t("pages.whatsapp-troubleshoot.name.font_medium_text_red_700")}>
                        {message.phone_number || "رقم غير محدد"}
                      </span>
                      <Badge className={t("pages.whatsapp-troubleshoot.name.bg_red_100_text_red_800")}>
                        {message.status}
                      </Badge>
                    </div>
                    <p className={t("pages.whatsapp-troubleshoot.name.text_sm_text_gray_700_mb_1")}>
                      {message.message}
                    </p>
                    {message.error_message && (
                      <p className={t("pages.whatsapp-troubleshoot.name.text_xs_text_red_600")}>
                        خطأ: {message.error_message}
                      </p>
                    )}
                    <p className={t("pages.whatsapp-troubleshoot.name.text_xs_text_gray_500")}>
                      {new Date(message.created_at).toLocaleString("ar")}
                    </p>
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
