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
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import {
  Send,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function WhatsAppTemplateTest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phoneNumber, setPhoneNumber] = useState("+966");
  const [selectedTemplate, setSelectedTemplate] = useState(
    "welcome_hxc4485f514cb7d4536026fc56250f75e7",
  );
  const [templateVariables, setTemplateVariables] = useState([
    "مرحباً من نظام MPBF",
  ]);
  const [useTemplate, setUseTemplate] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);

  // قوالب الرسائل المُوافق عليها
  const approvedTemplates = [
    {
      id: "welcome_hxc4485f514cb7d4536026fc56250f75e7",
      name: "Welcome Template",
      language: "Arabic",
      description: "قالب الترحيب المُوافق عليه من Meta",
      variables: ["{{1}}"],
      example: "مرحباً، {{1}}",
    },
  ];

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

  const notificationsList = Array.isArray(notifications) ? notifications : [];

  // إرسال رسالة باستخدام القالب
  const sendTemplateMessage = useMutation({
    mutationFn: async (data: {
      phone: string;
      template: string;
      variables: string[];
      useTemplate: boolean;
    }) => {
      const response = await apiRequest("/api/notifications/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          phone_number: data.phone,
          message: data.variables[0] || "رسالة اختبار",
          title: "رسالة اختبار القالب",
          template_name: data.template,
          variables: data.variables,
          use_template: data.useTemplate,
        }),
      });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "تم إرسال الرسالة بنجاح",
        description: `تم إرسال رسالة باستخدام القالب إلى ${phoneNumber}`,
      });

      setTestResults((prev) => [
        {
          timestamp: new Date(),
          phone: phoneNumber,
          template: selectedTemplate,
          variables: templateVariables,
          status: "sent",
          messageId: data?.messageId || "unknown",
          success: true,
          useTemplate,
        },
        ...prev,
      ]);

      refetchNotifications();
    },
    onError: (error: any) => {
      toast({
        title: "فشل في الإرسال",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive",
      });

      setTestResults((prev) => [
        {
          timestamp: new Date(),
          phone: phoneNumber,
          template: selectedTemplate,
          variables: templateVariables,
          status: "failed",
          error: error.message,
          success: false,
          useTemplate,
        },
        ...prev,
      ]);
    },
  });

  const handleSendTest = () => {
    if (!phoneNumber) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.startsWith("+")) {
      toast({
        title: "رقم هاتف غير صحيح",
        description: "يجب أن يبدأ رقم الهاتف بـ +",
        variant: "destructive",
      });
      return;
    }

    sendTemplateMessage.mutate({
      phone: phoneNumber,
      template: selectedTemplate,
      variables: templateVariables,
      useTemplate,
    });
  };

  const addVariable = () => {
    setTemplateVariables([...templateVariables, ""]);
  };

  const updateVariable = (index: number, value: string) => {
    const newVariables = [...templateVariables];
    newVariables[index] = value;
    setTemplateVariables(newVariables);
  };

  const removeVariable = (index: number) => {
    setTemplateVariables(templateVariables.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className={t("pages.whatsapp-template-test.name.h_4_w_4_text_green_600")} />{t('pages.whatsapp-template-test.;_case_"delivered":_return')}<CheckCircle className={t("pages.whatsapp-template-test.name.h_4_w_4_text_blue_600")} />{t('pages.whatsapp-template-test.;_case_"failed":_return')}<XCircle className={t("pages.whatsapp-template-test.name.h_4_w_4_text_red_600")} />{t('pages.whatsapp-template-test.;_default:_return')}<MessageSquare className={t("pages.whatsapp-template-test.name.h_4_w_4_text_yellow_600")} />;
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
    <div className={t("pages.whatsapp-template-test.name.min_h_screen_bg_gray_50_p_4")} dir="rtl">
      <div className={t("pages.whatsapp-template-test.name.max_w_6xl_mx_auto_space_y_6")}>
        {/* Header */}
        <div className={t("pages.whatsapp-template-test.name.text_center")}>
          <h1 className={t("pages.whatsapp-template-test.name.text_3xl_font_bold_text_gray_900_mb_2")}>{t('pages.whatsapp-template-test.✨_اختبار_قوالب_whatsapp_المُوافقة')}</h1>
          <p className={t("pages.whatsapp-template-test.name.text_gray_600")}>{t('pages.whatsapp-template-test.اختبار_إرسال_رسائل_whatsapp_باستخدام_القوالب_المُوافق_عليها_من_meta')}</p>
        </div>

        <div className={t("pages.whatsapp-template-test.name.grid_grid_cols_1_lg_grid_cols_2_gap_6")}>
          {/* نموذج الإرسال */}
          <Card>
            <CardHeader>
              <CardTitle className={t("pages.whatsapp-template-test.name.flex_items_center_gap_2")}>
                <Sparkles className={t("pages.whatsapp-template-test.name.h_5_w_5")} />{t('pages.whatsapp-template-test.إرسال_رسالة_بقالب_مُوافق')}</CardTitle>
              <CardDescription>{t('pages.whatsapp-template-test.استخدام_القوالب_المُوافق_عليها_من_meta_لإرسال_الرسائل')}</CardDescription>
            </CardHeader>
            <CardContent className={t("pages.whatsapp-template-test.name.space_y_4")}>
              <div>
                <Label htmlFor="phone">{t('pages.whatsapp-template-test.رقم_الهاتف')}</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="{t('pages.whatsapp-template-test.placeholder.+966501234567')}"
                  dir="ltr"
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="template">{t('pages.whatsapp-template-test.القالب')}</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger data-testid="select-template">
                    <SelectValue placeholder="{t('pages.whatsapp-template-test.placeholder.اختر_القالب')}" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedTemplates
                      .filter(
                        (template) =>
                          template.id &&
                          template.id !== "" &&
                          template.id !== null &&
                          template.id !== undefined,
                      )
                      .map((template) => (
                        <SelectItem
                          key={template.id}
                          value={template.id.toString()}
                        >
                          <div className={t("pages.whatsapp-template-test.name.flex_items_center_gap_2")}>
                            <span>{template.name}</span>
                            <Badge variant="secondary" className={t("pages.whatsapp-template-test.name.text_xs")}>
                              {template.language}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* متغيرات القالب */}
              <div>
                <Label>{t('pages.whatsapp-template-test.متغيرات_القالب')}</Label>
                <div className={t("pages.whatsapp-template-test.name.space_y_2")}>
                  {templateVariables.map((variable, index) => (
                    <div key={index} className={t("pages.whatsapp-template-test.name.flex_items_center_gap_2")}>
                      <Input
                        value={variable}
                        onChange={(e) => updateVariable(index, e.target.value)}
                        placeholder={`متغير ${index + 1}`}
                        data-testid={`input-variable-${index}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeVariable(index)}
                        data-testid={`button-remove-variable-${index}`}
                      >{t('pages.whatsapp-template-test.حذف')}</Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariable}
                    data-testid="button-add-variable"
                  >{t('pages.whatsapp-template-test.إضافة_متغير')}</Button>
                </div>
              </div>

              <div className={t("pages.whatsapp-template-test.name.flex_items_center_space_x_2")}>
                <input
                  type="checkbox"
                  id="useTemplate"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  data-testid="checkbox-use-template"
                />
                <Label htmlFor="useTemplate" className={t("pages.whatsapp-template-test.name.text_sm")}>{t('pages.whatsapp-template-test.استخدام_القالب_المُوافق_عليه_(production_mode)')}</Label>
              </div>

              <Button
                onClick={handleSendTest}
                disabled={sendTemplateMessage.isPending}
                className={t("pages.whatsapp-template-test.name.w_full")}
                data-testid="button-send-template"
              >
                {sendTemplateMessage.isPending ? (
                  <>
                    <Loader2 className={t("pages.whatsapp-template-test.name.mr_2_h_4_w_4_animate_spin")} />{t('pages.whatsapp-template-test.جاري_الإرسال...')}</>{t('pages.whatsapp-template-test.)_:_(')}<>
                    <Send className={t("pages.whatsapp-template-test.name.mr_2_h_4_w_4")} />{t('pages.whatsapp-template-test.إرسال_رسالة_بالقالب')}</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* تفاصيل القالب المُختار */}
          <Card>
            <CardHeader>
              <CardTitle className={t("pages.whatsapp-template-test.name.flex_items_center_gap_2")}>
                <MessageSquare className={t("pages.whatsapp-template-test.name.h_5_w_5")} />{t('pages.whatsapp-template-test.تفاصيل_القالب')}</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedTemplates.find((t) =>{t('pages.whatsapp-template-test.t.id_===_selectedtemplate)_&&_(')}<div className={t("pages.whatsapp-template-test.name.space_y_4")}>
                  <div>
                    <Label className={t("pages.whatsapp-template-test.name.text_sm_font_medium")}>{t('pages.whatsapp-template-test.اسم_القالب:')}</Label>
                    <p className={t("pages.whatsapp-template-test.name.text_sm_text_gray_600_font_mono")}>
                      {
                        approvedTemplates.find((t) => t.id === selectedTemplate)
                          ?.name
                      }
                    </p>
                  </div>

                  <div>
                    <Label className={t("pages.whatsapp-template-test.name.text_sm_font_medium")}>{t('pages.whatsapp-template-test.معرف_القالب:')}</Label>
                    <p className={t("pages.whatsapp-template-test.name.text_xs_text_gray_500_font_mono_break_all")}>
                      {selectedTemplate}
                    </p>
                  </div>

                  <div>
                    <Label className={t("pages.whatsapp-template-test.name.text_sm_font_medium")}>{t('pages.whatsapp-template-test.اللغة:')}</Label>
                    <Badge variant="outline">
                      {
                        approvedTemplates.find((t) => t.id === selectedTemplate)
                          ?.language
                      }
                    </Badge>
                  </div>

                  <div>
                    <Label className={t("pages.whatsapp-template-test.name.text_sm_font_medium")}>{t('pages.whatsapp-template-test.المتغيرات:')}</Label>
                    <div className={t("pages.whatsapp-template-test.name.text_sm_text_gray_600")}>
                      {approvedTemplates
                        .find((t) => t.id === selectedTemplate)
                        ?.variables.join(", ")}
                    </div>
                  </div>

                  <div>
                    <Label className={t("pages.whatsapp-template-test.name.text_sm_font_medium")}>{t('pages.whatsapp-template-test.مثال:')}</Label>
                    <div className={t("pages.whatsapp-template-test.name.bg_gray_50_p_3_rounded_text_sm_font_mono")}>
                      {
                        approvedTemplates.find((t) => t.id === selectedTemplate)
                          ?.example
                      }
                    </div>
                  </div>

                  <div className={t("pages.whatsapp-template-test.name.bg_blue_50_p_3_rounded")}>
                    <p className={t("pages.whatsapp-template-test.name.text_xs_text_blue_700")}>
                      <strong>{t('pages.whatsapp-template-test.حالة_القالب:')}</strong>{t('pages.whatsapp-template-test.مُوافق_عليه_من_meta_✅')}<br />{t('pages.whatsapp-template-test.يمكن_استخدامه_لإرسال_رسائل_إلى_أي_رقم_whatsapp_مُسجل')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* سجل النتائج */}
        {testResults.length >{t('pages.whatsapp-template-test.0_&&_(')}<Card>
            <CardHeader>
              <CardTitle>{t('pages.whatsapp-template-test.📋_سجل_اختبارات_القوالب')}</CardTitle>
              <CardDescription>{t('pages.whatsapp-template-test.نتائج_الرسائل_المُرسلة_باستخدام_القوالب')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={t("pages.whatsapp-template-test.name.space_y_3")}>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={t("pages.whatsapp-template-test.name.border_rounded_lg_p_3_bg_white")}
                    data-testid={`template-result-${index}`}
                  >
                    <div className={t("pages.whatsapp-template-test.name.flex_items_center_justify_between_mb_2")}>
                      <div className={t("pages.whatsapp-template-test.name.flex_items_center_gap_2")}>
                        {getStatusIcon(result.status)}
                        <span className={t("pages.whatsapp-template-test.name.font_medium")}>{result.phone}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        {result.useTemplate && (
                          <Badge variant="outline" className={t("pages.whatsapp-template-test.name.text_xs")}>{t('pages.whatsapp-template-test.قالب')}</Badge>
                        )}
                      </div>
                      <span className={t("pages.whatsapp-template-test.name.text_sm_text_gray_500")}>
                        {result.timestamp.toLocaleTimeString("ar")}
                      </span>
                    </div>

                    <div className={t("pages.whatsapp-template-test.name.space_y_1_text_sm")}>
                      <p>
                        <strong>{t('pages.whatsapp-template-test.القالب:')}</strong> {result.template}
                      </p>
                      <p>
                        <strong>{t('pages.whatsapp-template-test.المتغيرات:')}</strong>{" "}
                        {result.variables?.join(", ") || "لا يوجد"}
                      </p>
                    </div>

                    {result.messageId && (
                      <p className={t("pages.whatsapp-template-test.name.text_xs_text_gray_500_mt_2")}>
                        Message ID: {result.messageId}
                      </p>
                    )}

                    {result.error && (
                      <p className={t("pages.whatsapp-template-test.name.text_xs_text_red_600_mt_2")}>
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
        {notificationsList && notificationsList.length >{t('pages.whatsapp-template-test.0_&&_(')}<Card>
            <CardHeader>
              <CardTitle>{t('pages.whatsapp-template-test.📬_آخر_الإشعارات')}</CardTitle>
              <CardDescription>{t('pages.whatsapp-template-test.آخر_الرسائل_المُرسلة_عبر_النظام')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={t("pages.whatsapp-template-test.name.space_y_3")}>
                {notificationsList.slice(0, 5).map((notification: any) => (
                  <div
                    key={notification.id}
                    className={t("pages.whatsapp-template-test.name.border_rounded_lg_p_3_bg_white")}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className={t("pages.whatsapp-template-test.name.flex_items_center_justify_between_mb_2")}>
                      <div className={t("pages.whatsapp-template-test.name.flex_items_center_gap_2")}>
                        <MessageSquare className={t("pages.whatsapp-template-test.name.h_4_w_4")} />
                        <span className={t("pages.whatsapp-template-test.name.font_medium")}>
                          {notification.title}
                        </span>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status}
                        </Badge>
                      </div>
                      <span className={t("pages.whatsapp-template-test.name.text_sm_text_gray_500")}>
                        {new Date(notification.created_at).toLocaleString("ar")}
                      </span>
                    </div>

                    <p className={t("pages.whatsapp-template-test.name.text_sm_text_gray_700_mb_1")}>
                      {notification.message}
                    </p>

                    {notification.phone_number && (
                      <p className={t("pages.whatsapp-template-test.name.text_xs_text_gray_500")}>
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
