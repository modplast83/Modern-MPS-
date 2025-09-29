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
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 تشخيص مشاكل WhatsApp
          </h1>
          <p className="text-gray-600">
            دليل خطوة بخطوة لحل مشاكل إرسال رسائل WhatsApp
          </p>
        </div>

        {/* خطأ 63016 */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              خطأ Twilio: {error63016.code}
            </CardTitle>
            <CardDescription className="text-red-600">
              {error63016.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="font-medium text-red-700">الحلول المقترحة:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
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
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              حالة النظام الحالي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">رقم WhatsApp:</span>
                  <Badge variant="outline">+15557911537</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Business Account ID:
                  </span>
                  <Badge variant="outline" className="text-xs">
                    795259496521200
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Twilio Account:</span>
                  <Badge variant="outline" className="text-xs">
                    ACe4ba2fd2e98be5b019c354539404cc29
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">آخر رسالة:</span>
                  <Badge className="bg-red-100 text-red-800">undelivered</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">كود الخطأ:</span>
                  <Badge className="bg-red-100 text-red-800">63016</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    الرسائل الفاشلة:
                  </span>
                  <Badge className="bg-red-100 text-red-800">
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
            <CardTitle>📋 قائمة التحقق</CardTitle>
            <CardDescription>
              اتبع هذه الخطوات بالترتيب لحل المشكلة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {troubleshootSteps.map((step) => (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleCheck(step.id)}
                      className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        checkedItems.includes(step.id)
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {checkedItems.includes(step.id) && (
                        <CheckCircle className="h-3 w-3" />
                      )}
                    </button>

                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {step.description}
                      </p>

                      <div className="space-y-1">
                        {step.actions.map((action, index) => (
                          <div
                            key={index}
                            className="text-sm text-gray-700 flex items-start gap-2"
                          >
                            <span className="text-blue-500 mt-1">•</span>
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
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              روابط مفيدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                asChild
              >
                <a
                  href="https://console.twilio.com/us1/develop/sms/senders/whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="text-left">
                    <div className="font-medium">Twilio WhatsApp Console</div>
                    <div className="text-sm text-gray-500">
                      إدارة أرقام WhatsApp
                    </div>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                asChild
              >
                <a
                  href="https://business.facebook.com/wa/manage"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="text-left">
                    <div className="font-medium">Meta Business Manager</div>
                    <div className="text-sm text-gray-500">
                      إدارة WhatsApp Business
                    </div>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                asChild
              >
                <a
                  href="https://www.twilio.com/docs/whatsapp/sandbox"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="text-left">
                    <div className="font-medium">WhatsApp Sandbox</div>
                    <div className="text-sm text-gray-500">
                      دليل وضع الاختبار
                    </div>
                  </div>
                </a>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                asChild
              >
                <a
                  href="https://www.twilio.com/docs/errors/63016"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="text-left">
                    <div className="font-medium">تفاصيل خطأ 63016</div>
                    <div className="text-sm text-gray-500">شرح مفصل للخطأ</div>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* الرسائل الفاشلة */}
        {failedMessages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                الرسائل الفاشلة ({failedMessages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {failedMessages.slice(0, 5).map((message: any) => (
                  <div
                    key={message.id}
                    className="border rounded-lg p-3 bg-red-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-red-700">
                        {message.phone_number || "رقم غير محدد"}
                      </span>
                      <Badge className="bg-red-100 text-red-800">
                        {message.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      {message.message}
                    </p>
                    {message.error_message && (
                      <p className="text-xs text-red-600">
                        خطأ: {message.error_message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
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
