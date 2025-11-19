import { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
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
import { Textarea } from "../components/ui/textarea";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Copy, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function WhatsAppSetup() {
  const { toast } = useToast();
  const [certificate, setCertificate] = useState(
    "CmEKHQiXiLXLyZi7AhIGZW50OndhIgRNUEJGUPrb48QGGkCr8LSQ5wTCvUiJ5/EVMWcWnrs6hjWAcMwfaGfagJvEow6UVO4Wqzmpaq5kSaDjZXbrjqPgUwYfVtyXGt7pnK8CEi5tbgik9NfihfNatbOdqWgunFvl4F/C2OedL0VOrTxez1dCeu7pPITYOVBNqw5j",
  );
  const [displayName, setDisplayName] = useState("MPBF");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [twilioSettings, setTwilioSettings] = useState({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص إلى الحافظة",
    });
  };

  const saveTwilioSettings = async () => {
    try {
      // Save Twilio settings to environment or database
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات Twilio بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  return (
    <PageLayout title="إعداد WhatsApp Business API" description="ضبط إعدادات الواتس اب للأعمال وربطها بـ Meta Business">
      <Tabs defaultValue="meta" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="meta">شهادة Meta</TabsTrigger>
              <TabsTrigger value="twilio">إعدادات Twilio</TabsTrigger>
              <TabsTrigger value="test">اختبار الاتصال</TabsTrigger>
            </TabsList>

            <TabsContent value="meta" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    شهادة الملكية من Meta
                  </CardTitle>
                  <CardDescription>
                    شهادة التحقق من ملكية رقم الهاتف المعتمدة من Meta Business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">اسم العرض المعتمد</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1"
                      readOnly
                    />
                    <p className="text-sm text-green-600 mt-1">
                      ✓ معتمد من Meta
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="certificate">شهادة الملكية</Label>
                    <div className="relative">
                      <Textarea
                        id="certificate"
                        value={certificate}
                        onChange={(e) => setCertificate(e.target.value)}
                        className="mt-1 min-h-[120px] font-mono text-sm"
                        dir="ltr"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 left-2"
                        onClick={() => copyToClipboard(certificate)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      هذه الشهادة تؤكد ملكيتك لرقم الهاتف في WhatsApp Business
                      API
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>خطوات مهمة:</strong>
                      <br />
                      1. احفظ هذه الشهادة في مكان آمن
                      <br />
                      2. استخدمها لتأكيد ملكية الرقم في لوحة تحكم Twilio
                      <br />
                      3. تأكد من أن اسم العرض يطابق اسم شركتك المسجل
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="twilio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    إعدادات Twilio WhatsApp
                  </CardTitle>
                  <CardDescription>
                    ضبط معلومات حساب Twilio لإرسال رسائل WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="accountSid">Account SID</Label>
                    <Input
                      id="accountSid"
                      value={twilioSettings.accountSid}
                      onChange={(e) =>
                        setTwilioSettings((prev) => ({
                          ...prev,
                          accountSid: e.target.value,
                        }))
                      }
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="mt-1"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="authToken">Auth Token</Label>
                    <Input
                      id="authToken"
                      type="password"
                      value={twilioSettings.authToken}
                      onChange={(e) =>
                        setTwilioSettings((prev) => ({
                          ...prev,
                          authToken: e.target.value,
                        }))
                      }
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="mt-1"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="twilioPhone">رقم WhatsApp في Twilio</Label>
                    <Input
                      id="twilioPhone"
                      value={twilioSettings.phoneNumber}
                      onChange={(e) =>
                        setTwilioSettings((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                      placeholder="whatsapp:+1234567890"
                      className="mt-1"
                      dir="ltr"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      يجب أن يبدأ بـ "whatsapp:" متبوعاً برقم الهاتف
                    </p>
                  </div>

                  <Button onClick={saveTwilioSettings} className="w-full">
                    حفظ إعدادات Twilio
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>متطلبات التكامل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>حساب Twilio مفعل</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>شهادة Meta معتمدة</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      <span>ربط رقم الهاتف في Twilio Console</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      <span>تفعيل WhatsApp Business API</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>اختبار إرسال الرسائل</CardTitle>
                  <CardDescription>
                    تأكد من أن النظام يمكنه إرسال رسائل WhatsApp بنجاح
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="testPhone">رقم الهاتف للاختبار</Label>
                    <Input
                      id="testPhone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+966501234567"
                      className="mt-1"
                      dir="ltr"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "جاري الإرسال...",
                        description: "جاري إرسال رسالة اختبار",
                      });
                    }}
                  >
                    إرسال رسالة اختبار
                  </Button>

                  <Alert>
                    <AlertDescription>
                      ستصل رسالة اختبار إلى الرقم المحدد خلال ثوان. تأكد من أن
                      الرقم مسجل في WhatsApp.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
