import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, AlertTriangle, ExternalLink, Send, Loader2 } from 'lucide-react';

export default function WhatsAppFinalSetup() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('+966');
  const [message, setMessage] = useState('مرحباً! هذه رسالة اختبار من نظام MPBF.');

  // اختبار الإرسال
  const testMessage = useMutation({
    mutationFn: async (data: { phone: string; message: string }) => {
      const response = await apiRequest('/api/notifications/whatsapp', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: data.phone,
          message: data.message,
          title: 'رسالة اختبار Production',
          use_template: false // استخدام الرسالة المباشرة مؤقتاً
        })
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال رسالة اختبار بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "فشل في الإرسال",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const currentStatus = {
    metaApproved: true,
    twilioConnected: true,
    templateApproved: true,
    webhookConfigured: true,
    phoneNumber: '+15557911537',
    businessId: '795259496521200',
    templateId: 'welcome_hxc4485f514cb7d4536026fc56250f75e7'
  };

  const nextSteps = [
    {
      title: 'إنشاء Content Template في Twilio',
      description: 'ربط Meta template مع Twilio Content Template',
      status: 'pending',
      actions: [
        'اذهب إلى Twilio Console → Content → Content Template Builder',
        'أنشئ Content Template جديد',
        `اربطه بـ Meta template: ${currentStatus.templateId}`,
        'احصل على ContentSid من Twilio',
        'حدث الكود لاستخدام ContentSid بدلاً من Meta template ID'
      ]
    },
    {
      title: 'تحديث كود النظام',
      description: 'تحديث notification service لاستخدام Twilio ContentSid',
      status: 'pending',
      actions: [
        'استخدام ContentSid بدلاً من Meta template ID مباشرة',
        'تحديث contentVariables format حسب Twilio specs',
        'إضافة error handling محسّن للقوالب',
        'اختبار القالب مع أرقام مختلفة'
      ]
    },
    {
      title: 'إعداد WhatsApp Business API مباشرة (اختياري)',
      description: 'تجاوز Twilio واستخدام Meta WhatsApp Business API مباشرة',
      status: 'alternative',
      actions: [
        'الحصول على Access Token من Meta Business Manager',
        'إعداد Webhook مباشر مع Meta',
        'تحديث النظام لاستخدام Graph API',
        'اختبار الإرسال مع Meta API مباشرة'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 الخطوة الأخيرة - إعداد Production
          </h1>
          <p className="text-gray-600">
            إكمال إعداد WhatsApp Production Mode للعمل مع القوالب المُوافقة
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              الحالة الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Meta Business Account:</span>
                  <Badge className={currentStatus.metaApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {currentStatus.metaApproved ? '✅ مُفعل' : '❌ غير مُفعل'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Twilio Connection:</span>
                  <Badge className={currentStatus.twilioConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {currentStatus.twilioConnected ? '✅ متصل' : '❌ غير متصل'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Template Approval:</span>
                  <Badge className={currentStatus.templateApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {currentStatus.templateApproved ? '✅ مُوافق عليه' : '❌ في الانتظار'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Webhook Setup:</span>
                  <Badge className={currentStatus.webhookConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {currentStatus.webhookConfigured ? '✅ مُعد' : '❌ غير مُعد'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Phone Number:</span>
                  <Badge variant="outline">{currentStatus.phoneNumber}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Business ID:</span>
                  <Badge variant="outline" className="text-xs">{currentStatus.businessId}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problem Analysis */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>المشكلة الحالية:</strong> خطأ 63016 يحدث لأن Twilio لا يتعرف على Meta template ID مباشرة. 
            يجب إنشاء Content Template في Twilio Console وربطه بـ Meta template المُوافق عليه.
          </AlertDescription>
        </Alert>

        {/* Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              اختبار الإرسال المباشر
            </CardTitle>
            <CardDescription>
              اختبار إرسال رسالة مباشرة (بدون قالب) للتأكد من الاتصال
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
              />
            </div>
            
            <div>
              <Label htmlFor="testMessage">الرسالة</Label>
              <Input
                id="testMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="رسالة اختبار"
              />
            </div>
            
            <Button
              onClick={() => testMessage.mutate({ phone: phoneNumber, message })}
              disabled={testMessage.isPending}
              className="w-full"
            >
              {testMessage.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  اختبار الإرسال المباشر
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">الخطوات التالية</h2>
          
          {nextSteps.map((step, index) => (
            <Card key={index} className={step.status === 'alternative' ? 'border-blue-200 bg-blue-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  {step.title}
                  {step.status === 'alternative' && (
                    <Badge variant="secondary">اختياري</Badge>
                  )}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {step.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              روابط مفيدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 justify-start" asChild>
                <a href="https://console.twilio.com/us1/develop/sms/content-template-builder" target="_blank" rel="noopener noreferrer">
                  <div className="text-right">
                    <div className="font-medium">Twilio Content Template Builder</div>
                    <div className="text-sm text-gray-500">إنشاء وإدارة قوالب المحتوى</div>
                  </div>
                </a>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 justify-start" asChild>
                <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noopener noreferrer">
                  <div className="text-right">
                    <div className="font-medium">Meta Message Templates</div>
                    <div className="text-sm text-gray-500">إدارة قوالب Meta المُوافقة</div>
                  </div>
                </a>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 justify-start" asChild>
                <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noopener noreferrer">
                  <div className="text-right">
                    <div className="font-medium">WhatsApp Cloud API</div>
                    <div className="text-sm text-gray-500">استخدام Meta API مباشرة</div>
                  </div>
                </a>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 justify-start" asChild>
                <a href="https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates" target="_blank" rel="noopener noreferrer">
                  <div className="text-right">
                    <div className="font-medium">Twilio WhatsApp Templates</div>
                    <div className="text-sm text-gray-500">دليل قوالب Twilio</div>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}