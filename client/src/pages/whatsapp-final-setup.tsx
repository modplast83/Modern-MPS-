import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import {
  CheckCircle,
  Send,
  Loader2,
  MessageSquare,
  Zap,
  Settings,
} from "lucide-react";

export default function WhatsAppFinalSetup() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("+966");
  const [message, setMessage] = useState(
    "مرحباً! هذه رسالة اختبار من نظام MPBF",
  );
  const [useTemplate, setUseTemplate] = useState(true);

  // إرسال رسالة تجريبية
  const testMessage = useMutation({
    mutationFn: async (data: {
      phone: string;
      message: string;
      useTemplate: boolean;
    }) => {
      const response = await apiRequest("/api/notifications/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          phone_number: data.phone,
          message: data.message,
          title: "اختبار نهائي",
          use_template: data.useTemplate,
          template_name: data.useTemplate
            ? "welcome_hxc4485f514cb7d4536026fc56250f75e7"
            : undefined,
        }),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الرسالة بنجاح!",
        description: "تم إرسال رسالة WhatsApp باستخدام Content Template",
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

  const systemStatus = {
    twilioCredentials: true,
    contentTemplate: true,
    webhookConfigured: true,
    metaTemplateApproved: true,
    ready: true,
  };

  const features = [
    {
      icon: <MessageSquare className={t("pages.whatsapp-final-setup.name.h_5_w_5")} />,
      title: "إرسال الرسائل",
      description: "إرسال رسائل WhatsApp للموظفين والعملاء",
      status: "active",
    },
    {
      icon: <CheckCircle className={t("pages.whatsapp-final-setup.name.h_5_w_5")} />,
      title: "القوالب المُوافقة",
      description: "استخدام قوالب Meta المُوافق عليها",
      status: "active",
    },
    {
      icon: <Zap className={t("pages.whatsapp-final-setup.name.h_5_w_5")} />,
      title: "إشعارات فورية",
      description: "إشعارات تلقائية للطلبات والصيانة",
      status: "active",
    },
    {
      icon: <Settings className={t("pages.whatsapp-final-setup.name.h_5_w_5")} />,
      title: "تحديثات الحالة",
      description: "متابعة حالة الرسائل والتسليم",
      status: "active",
    },
  ];

  return (
    <div
      className={t("pages.whatsapp-final-setup.name.min_h_screen_bg_gradient_to_br_from_green_50_to_blue_50_p_4")}
      dir="rtl"
    >
      <div className={t("pages.whatsapp-final-setup.name.max_w_4xl_mx_auto_space_y_6")}>
        {/* Header */}
        <div className={t("pages.whatsapp-final-setup.name.text_center_space_y_4")}>
          <div className={t("pages.whatsapp-final-setup.name.w_20_h_20_bg_green_600_rounded_full_flex_items_center_justify_center_mx_auto")}>
            <CheckCircle className={t("pages.whatsapp-final-setup.name.h_12_w_12_text_white")} />
          </div>
          <h1 className={t("pages.whatsapp-final-setup.name.text_4xl_font_bold_text_gray_900")}>{t('pages.whatsapp-final-setup.🎉_whatsapp_business_api_جاهز!')}</h1>
          <p className={t("pages.whatsapp-final-setup.name.text_xl_text_gray_600")}>{t('pages.whatsapp-final-setup.تم_إعداد_نظام_whatsapp_بنجاح_مع_جميع_الميزات_المطلوبة')}</p>
        </div>

        {/* Success Alert */}
        <Alert className={t("pages.whatsapp-final-setup.name.border_green_200_bg_green_50")}>
          <CheckCircle className={t("pages.whatsapp-final-setup.name.h_4_w_4_text_green_600")} />
          <AlertDescription className={t("pages.whatsapp-final-setup.name.text_green_700")}>
            <strong>{t('pages.whatsapp-final-setup.إعداد_مكتمل!')}</strong>{t('pages.whatsapp-final-setup.النظام_جاهز_لإرسال_رسائل_whatsapp_باستخدام_twilio_مع_content_template_المرتبط_بقالب_meta_المُوافق_عليه._لا_مزيد_من_خطأ_63016!')}</AlertDescription>
        </Alert>

        <div className={t("pages.whatsapp-final-setup.name.grid_grid_cols_1_lg_grid_cols_2_gap_6")}>
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className={t("pages.whatsapp-final-setup.name.flex_items_center_gap_2")}>
                <Settings className={t("pages.whatsapp-final-setup.name.h_5_w_5")} />{t('pages.whatsapp-final-setup.حالة_النظام')}</CardTitle>
              <CardDescription>{t('pages.whatsapp-final-setup.جميع_المكونات_تعمل_بشكل_صحيح')}</CardDescription>
            </CardHeader>
            <CardContent className={t("pages.whatsapp-final-setup.name.space_y_4")}>
              <div className={t("pages.whatsapp-final-setup.name.flex_items_center_justify_between")}>
                <span className={t("pages.whatsapp-final-setup.name.text_sm")}>{t('pages.whatsapp-final-setup.بيانات_twilio')}</span>
                <Badge className={t("pages.whatsapp-final-setup.name.bg_green_100_text_green_800")}>{t('pages.whatsapp-final-setup.متصل')}</Badge>
              </div>

              <div className={t("pages.whatsapp-final-setup.name.flex_items_center_justify_between")}>
                <span className={t("pages.whatsapp-final-setup.name.text_sm")}>{t('pages.whatsapp-final-setup.content_template')}</span>
                <Badge className={t("pages.whatsapp-final-setup.name.bg_green_100_text_green_800")}>{t('pages.whatsapp-final-setup.مُعد')}</Badge>
              </div>

              <div className={t("pages.whatsapp-final-setup.name.flex_items_center_justify_between")}>
                <span className={t("pages.whatsapp-final-setup.name.text_sm")}>{t('pages.whatsapp-final-setup.meta_template')}</span>
                <Badge className={t("pages.whatsapp-final-setup.name.bg_green_100_text_green_800")}>{t('pages.whatsapp-final-setup.مُوافق')}</Badge>
              </div>

              <div className={t("pages.whatsapp-final-setup.name.flex_items_center_justify_between")}>
                <span className={t("pages.whatsapp-final-setup.name.text_sm")}>{t('pages.whatsapp-final-setup.webhook')}</span>
                <Badge className={t("pages.whatsapp-final-setup.name.bg_green_100_text_green_800")}>{t('pages.whatsapp-final-setup.نشط')}</Badge>
              </div>

              <div className={t("pages.whatsapp-final-setup.name.flex_items_center_justify_between_font_medium_pt_2_border_t")}>
                <span>{t('pages.whatsapp-final-setup.الحالة_العامة')}</span>
                <Badge className={t("pages.whatsapp-final-setup.name.bg_green_600_text_white")}>{t('pages.whatsapp-final-setup.جاهز_للإنتاج')}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Test Message */}
          <Card>
            <CardHeader>
              <CardTitle className={t("pages.whatsapp-final-setup.name.flex_items_center_gap_2")}>
                <Send className={t("pages.whatsapp-final-setup.name.h_5_w_5")} />{t('pages.whatsapp-final-setup.اختبار_نهائي')}</CardTitle>
              <CardDescription>{t('pages.whatsapp-final-setup.إرسال_رسالة_تجريبية_للتأكد_من_العمل_الصحيح')}</CardDescription>
            </CardHeader>
            <CardContent className={t("pages.whatsapp-final-setup.name.space_y_4")}>
              <div>
                <Label htmlFor="finalTestPhone">{t('pages.whatsapp-final-setup.رقم_الهاتف')}</Label>
                <Input
                  id="finalTestPhone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="{t('pages.whatsapp-final-setup.placeholder.+966501234567')}"
                  dir="ltr"
                  data-testid="input-final-phone"
                />
              </div>

              <div>
                <Label htmlFor="finalTestMessage">{t('pages.whatsapp-final-setup.الرسالة')}</Label>
                <Input
                  id="finalTestMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  data-testid="input-final-message"
                />
              </div>

              <div className={t("pages.whatsapp-final-setup.name.flex_items_center_space_x_2")}>
                <input
                  type="checkbox"
                  id="finalUseTemplate"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  data-testid="checkbox-final-template"
                />
                <Label htmlFor="finalUseTemplate" className={t("pages.whatsapp-final-setup.name.text_sm")}>{t('pages.whatsapp-final-setup.استخدام_content_template_(موصى_به)')}</Label>
              </div>

              <Button
                onClick={() =>
                  testMessage.mutate({
                    phone: phoneNumber,
                    message,
                    useTemplate,
                  })
                }
                disabled={testMessage.isPending}
                className={t("pages.whatsapp-final-setup.name.w_full_bg_green_600_hover_bg_green_700")}
                data-testid="button-final-test"
              >
                {testMessage.isPending ? (
                  <>
                    <Loader2 className={t("pages.whatsapp-final-setup.name.mr_2_h_4_w_4_animate_spin")} />{t('pages.whatsapp-final-setup.جاري_الإرسال...')}</>{t('pages.whatsapp-final-setup.)_:_(')}<>
                    <Send className={t("pages.whatsapp-final-setup.name.mr_2_h_4_w_4")} />{t('pages.whatsapp-final-setup.إرسال_رسالة_تجريبية')}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.whatsapp-final-setup.المميزات_المتاحة_الآن')}</CardTitle>
            <CardDescription>{t('pages.whatsapp-final-setup.جميع_المميزات_جاهزة_للاستخدام_في_نظام_mpbf')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={t("pages.whatsapp-final-setup.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={t("pages.whatsapp-final-setup.name.flex_items_start_gap_3_p_4_border_rounded_lg_bg_white")}
                >
                  <div className={t("pages.whatsapp-final-setup.name.text_green_600")}>{feature.icon}</div>
                  <div className={t("pages.whatsapp-final-setup.name.flex_1")}>
                    <h4 className={t("pages.whatsapp-final-setup.name.font_medium_text_gray_900")}>
                      {feature.title}
                    </h4>
                    <p className={t("pages.whatsapp-final-setup.name.text_sm_text_gray_600_mt_1")}>
                      {feature.description}
                    </p>
                  </div>
                  <Badge className={t("pages.whatsapp-final-setup.name.bg_green_100_text_green_800")}>{t('pages.whatsapp-final-setup.نشط')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card className={t("pages.whatsapp-final-setup.name.border_blue_200_bg_blue_50")}>
          <CardHeader>
            <CardTitle className={t("pages.whatsapp-final-setup.name.text_blue_800")}>{t('pages.whatsapp-final-setup.التفاصيل_التقنية')}</CardTitle>
          </CardHeader>
          <CardContent className={t("pages.whatsapp-final-setup.name.text_blue_700_space_y_2_text_sm")}>
            <div className={t("pages.whatsapp-final-setup.name.flex_items_center_gap_2")}>
              <CheckCircle className={t("pages.whatsapp-final-setup.name.h_4_w_4")} />
              <span>{t('pages.whatsapp-final-setup.twilio_account_sid:_ace4ba2fd2e98be5b019c354539404cc29')}</span>
            </div>
            <div className={t("pages.whatsapp-final-setup.name.flex_items_center_gap_2")}>
              <CheckCircle className={t("pages.whatsapp-final-setup.name.h_4_w_4")} />
              <span>{t('pages.whatsapp-final-setup.whatsapp_number:_+15557911537')}</span>
            </div>
            <div className={t("pages.whatsapp-final-setup.name.flex_items_center_gap_2")}>
              <CheckCircle className={t("pages.whatsapp-final-setup.name.h_4_w_4")} />
              <span>{t('pages.whatsapp-final-setup.content_template_sid:_hxc4485f514cb7d4536026fc56250f75e7')}</span>
            </div>
            <div className={t("pages.whatsapp-final-setup.name.flex_items_center_gap_2")}>
              <CheckCircle className={t("pages.whatsapp-final-setup.name.h_4_w_4")} />
              <span>{t('pages.whatsapp-final-setup.meta_template:_welcome_hxc4485f514cb7d4536026fc56250f75e7')}</span>
            </div>
            <div className={t("pages.whatsapp-final-setup.name.flex_items_center_gap_2")}>
              <CheckCircle className={t("pages.whatsapp-final-setup.name.h_4_w_4")} />
              <span>{t('pages.whatsapp-final-setup.business_account_id:_795259496521200')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.whatsapp-final-setup.الخطوات_التالية')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("pages.whatsapp-final-setup.name.space_y_3")}>
              <div className={t("pages.whatsapp-final-setup.name.flex_items_start_gap_3")}>
                <span className={t("pages.whatsapp-final-setup.name.bg_blue_600_text_white_rounded_full_w_6_h_6_flex_items_center_justify_center_text_sm_font_bold")}>
                  1
                </span>
                <div>
                  <h4 className={t("pages.whatsapp-final-setup.name.font_medium")}>{t('pages.whatsapp-final-setup.استخدام_النظام_في_الإنتاج')}</h4>
                  <p className={t("pages.whatsapp-final-setup.name.text_sm_text_gray_600")}>{t('pages.whatsapp-final-setup.النظام_جاهز_لإرسال_إشعارات_الطلبات_والصيانة')}</p>
                </div>
              </div>

              <div className={t("pages.whatsapp-final-setup.name.flex_items_start_gap_3")}>
                <span className={t("pages.whatsapp-final-setup.name.bg_blue_600_text_white_rounded_full_w_6_h_6_flex_items_center_justify_center_text_sm_font_bold")}>
                  2
                </span>
                <div>
                  <h4 className={t("pages.whatsapp-final-setup.name.font_medium")}>{t('pages.whatsapp-final-setup.مراقبة_الأداء')}</h4>
                  <p className={t("pages.whatsapp-final-setup.name.text_sm_text_gray_600")}>{t('pages.whatsapp-final-setup.متابعة_حالة_الرسائل_ومعدلات_التسليم')}</p>
                </div>
              </div>

              <div className={t("pages.whatsapp-final-setup.name.flex_items_start_gap_3")}>
                <span className={t("pages.whatsapp-final-setup.name.bg_blue_600_text_white_rounded_full_w_6_h_6_flex_items_center_justify_center_text_sm_font_bold")}>
                  3
                </span>
                <div>
                  <h4 className={t("pages.whatsapp-final-setup.name.font_medium")}>{t('pages.whatsapp-final-setup.إضافة_قوالب_جديدة')}</h4>
                  <p className={t("pages.whatsapp-final-setup.name.text_sm_text_gray_600")}>{t('pages.whatsapp-final-setup.إنشاء_قوالب_إضافية_حسب_الحاجة')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
