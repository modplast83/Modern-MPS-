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
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "required":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "optional":
        return <Settings className="h-5 w-5 text-gray-400" />;
      default:
        return <Settings className="h-5 w-5 text-gray-400" />;
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
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 إعداد Meta WhatsApp Business API
          </h1>
          <p className="text-gray-600">
            إعداد وتكوين Meta WhatsApp Business API للاستخدام المباشر
          </p>
        </div>

        {/* Important Notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>مهم:</strong> استخدام Meta WhatsApp API مباشرة يوفر تحكم
            أكبر وتكلفة أقل من Twilio، ولكن يتطلب إعداد تقني أكثر تفصيلاً. تأكد
            من إكمال جميع الخطوات بعناية.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Setup Steps */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">خطوات الإعداد</h2>

            {setupSteps.map((step, index) => (
              <Card key={step.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span>{step.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                  <div className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-blue-500 mt-1">•</span>
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
          <div className="space-y-6">
            {/* Required Secrets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  المتغيرات المطلوبة
                </CardTitle>
                <CardDescription>
                  إضافة هذه المتغيرات في Replit Secrets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {requiredSecrets.map((secret) => (
                  <div key={secret.name} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{secret.name}</span>
                      <Badge
                        variant={secret.required ? "destructive" : "secondary"}
                      >
                        {secret.required ? "مطلوب" : "اختياري"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {secret.description}
                    </p>
                    <code className="text-xs bg-gray-100 p-1 rounded block">
                      {secret.example}
                    </code>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Test Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  اختبار Meta API
                </CardTitle>
                <CardDescription>
                  اختبار إرسال رسالة عبر Meta WhatsApp API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testPhone">رقم الهاتف</Label>
                  <Input
                    id="testPhone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+966501234567"
                    dir="ltr"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="testMessage">الرسالة</Label>
                  <Input
                    id="testMessage"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="رسالة اختبار"
                    data-testid="input-message"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useTemplate"
                    checked={useTemplate}
                    onChange={(e) => setUseTemplate(e.target.checked)}
                    data-testid="checkbox-template"
                  />
                  <Label htmlFor="useTemplate" className="text-sm">
                    استخدام القالب المُوافق عليه
                  </Label>
                </div>

                {useTemplate && (
                  <div>
                    <Label htmlFor="templateName">اسم القالب</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="welcome_hxc4485f514cb7d4536026fc56250f75e7"
                      className="font-mono text-xs"
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
                  className="w-full"
                  data-testid="button-test-meta"
                >
                  {testMetaAPI.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      اختبار Meta API
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  روابط مفيدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    asChild
                  >
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="text-right">
                        <div className="font-medium">Meta for Developers</div>
                        <div className="text-sm text-gray-500">
                          إنشاء تطبيق Meta جديد
                        </div>
                      </div>
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    asChild
                  >
                    <a
                      href="https://business.facebook.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="text-right">
                        <div className="font-medium">Meta Business Manager</div>
                        <div className="text-sm text-gray-500">
                          إدارة الحسابات التجارية
                        </div>
                      </div>
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    asChild
                  >
                    <a
                      href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="text-right">
                        <div className="font-medium">
                          WhatsApp Cloud API Guide
                        </div>
                        <div className="text-sm text-gray-500">
                          دليل البدء السريع
                        </div>
                      </div>
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    asChild
                  >
                    <a
                      href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="text-right">
                        <div className="font-medium">Webhook Configuration</div>
                        <div className="text-sm text-gray-500">
                          إعداد Webhooks
                        </div>
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
            <CardTitle>🎯 مزايا استخدام Meta API مباشرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">تكلفة أقل</h4>
                  <p className="text-sm text-gray-600">
                    لا توجد رسوم وسطاء، فقط رسوم Meta
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">تحكم كامل</h4>
                  <p className="text-sm text-gray-600">
                    إدارة مباشرة للقوالب والإعدادات
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">ميزات متقدمة</h4>
                  <p className="text-sm text-gray-600">
                    وصول لجميع ميزات WhatsApp Business
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">استقرار أعلى</h4>
                  <p className="text-sm text-gray-600">
                    اتصال مباشر بدون وسطاء
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">تحديثات فورية</h4>
                  <p className="text-sm text-gray-600">
                    الحصول على آخر التحديثات مباشرة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">دعم أفضل</h4>
                  <p className="text-sm text-gray-600">دعم مباشر من Meta</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
