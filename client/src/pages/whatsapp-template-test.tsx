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
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-yellow-600" />;
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
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ✨ اختبار قوالب WhatsApp المُوافقة
          </h1>
          <p className="text-gray-600">
            اختبار إرسال رسائل WhatsApp باستخدام القوالب المُوافق عليها من Meta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* نموذج الإرسال */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                إرسال رسالة بقالب مُوافق
              </CardTitle>
              <CardDescription>
                استخدام القوالب المُوافق عليها من Meta لإرسال الرسائل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+966501234567"
                  dir="ltr"
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="template">القالب</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger data-testid="select-template">
                    <SelectValue placeholder="اختر القالب" />
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
                          <div className="flex items-center gap-2">
                            <span>{template.name}</span>
                            <Badge variant="secondary" className="text-xs">
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
                <Label>متغيرات القالب</Label>
                <div className="space-y-2">
                  {templateVariables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-2">
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
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariable}
                    data-testid="button-add-variable"
                  >
                    إضافة متغير
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useTemplate"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  data-testid="checkbox-use-template"
                />
                <Label htmlFor="useTemplate" className="text-sm">
                  استخدام القالب المُوافق عليه (Production Mode)
                </Label>
              </div>

              <Button
                onClick={handleSendTest}
                disabled={sendTemplateMessage.isPending}
                className="w-full"
                data-testid="button-send-template"
              >
                {sendTemplateMessage.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    إرسال رسالة بالقالب
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* تفاصيل القالب المُختار */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                تفاصيل القالب
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedTemplates.find((t) => t.id === selectedTemplate) && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">اسم القالب:</Label>
                    <p className="text-sm text-gray-600 font-mono">
                      {
                        approvedTemplates.find((t) => t.id === selectedTemplate)
                          ?.name
                      }
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">معرف القالب:</Label>
                    <p className="text-xs text-gray-500 font-mono break-all">
                      {selectedTemplate}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">اللغة:</Label>
                    <Badge variant="outline">
                      {
                        approvedTemplates.find((t) => t.id === selectedTemplate)
                          ?.language
                      }
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">المتغيرات:</Label>
                    <div className="text-sm text-gray-600">
                      {approvedTemplates
                        .find((t) => t.id === selectedTemplate)
                        ?.variables.join(", ")}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">مثال:</Label>
                    <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                      {
                        approvedTemplates.find((t) => t.id === selectedTemplate)
                          ?.example
                      }
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-blue-700">
                      <strong>حالة القالب:</strong> مُوافق عليه من Meta ✅
                      <br />
                      يمكن استخدامه لإرسال رسائل إلى أي رقم WhatsApp مُسجل
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* سجل النتائج */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 سجل اختبارات القوالب</CardTitle>
              <CardDescription>
                نتائج الرسائل المُرسلة باستخدام القوالب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 bg-white"
                    data-testid={`template-result-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.phone}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        {result.useTemplate && (
                          <Badge variant="outline" className="text-xs">
                            قالب
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {result.timestamp.toLocaleTimeString("ar")}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>القالب:</strong> {result.template}
                      </p>
                      <p>
                        <strong>المتغيرات:</strong>{" "}
                        {result.variables?.join(", ") || "لا يوجد"}
                      </p>
                    </div>

                    {result.messageId && (
                      <p className="text-xs text-gray-500 mt-2">
                        Message ID: {result.messageId}
                      </p>
                    )}

                    {result.error && (
                      <p className="text-xs text-red-600 mt-2">
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
        {notificationsList && notificationsList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📬 آخر الإشعارات</CardTitle>
              <CardDescription>آخر الرسائل المُرسلة عبر النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificationsList.slice(0, 5).map((notification: any) => (
                  <div
                    key={notification.id}
                    className="border rounded-lg p-3 bg-white"
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium">
                          {notification.title}
                        </span>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString("ar")}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-1">
                      {notification.message}
                    </p>

                    {notification.phone_number && (
                      <p className="text-xs text-gray-500">
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
