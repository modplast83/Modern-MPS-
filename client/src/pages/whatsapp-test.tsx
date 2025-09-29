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
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
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
            🧪 اختبار خدمة WhatsApp
          </h1>
          <p className="text-gray-600">
            اختبار إرسال واستقبال رسائل WhatsApp عبر Twilio
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* نموذج الإرسال */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                إرسال رسالة اختبار
              </CardTitle>
              <CardDescription>
                أرسل رسالة WhatsApp لاختبار الاتصال
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
                <p className="text-sm text-gray-500 mt-1">
                  يجب أن يبدأ بـ + ورمز الدولة
                </p>
              </div>

              <div>
                <Label htmlFor="message">الرسالة</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  rows={4}
                  data-testid="textarea-message"
                />
              </div>

              <Button
                onClick={handleSendTest}
                disabled={sendTestMessage.isPending}
                className="w-full"
                data-testid="button-send-test"
              >
                {sendTestMessage.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    إرسال رسالة اختبار
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* معلومات النظام */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                معلومات النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">رقم WhatsApp:</span>
                  <Badge variant="outline" data-testid="badge-whatsapp-number">
                    +15557911537
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">اسم الشركة:</span>
                  <Badge variant="outline" data-testid="badge-business-name">
                    MPBF
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">حالة الخدمة:</span>
                  <Badge
                    className="bg-green-100 text-green-800"
                    data-testid="badge-service-status"
                  >
                    ✅ متصل
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Webhook URL:</span>
                  <code
                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                    data-testid="text-webhook-url"
                  >
                    /api/notifications/webhook/twilio
                  </code>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>💡 نصيحة:</strong> تأكد من إعداد Webhook URL في Twilio
                  Console لاستقبال الرسائل والتحديثات.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* سجل النتائج */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 سجل الاختبارات</CardTitle>
              <CardDescription>نتائج رسائل الاختبار المرسلة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 bg-white"
                    data-testid={`test-result-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.phone}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {result.timestamp.toLocaleTimeString("ar")}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-1">
                      "{result.message}"
                    </p>

                    {result.messageId && (
                      <p className="text-xs text-gray-500">
                        Message ID: {result.messageId}
                      </p>
                    )}

                    {result.error && (
                      <p className="text-xs text-red-600">
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
              <CardDescription>الإشعارات المرسلة عبر النظام</CardDescription>
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
                        <MessageCircle className="h-4 w-4" />
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
