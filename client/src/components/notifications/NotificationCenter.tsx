import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, MessageSquare, Send, TestTube, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Notification {
  id: number;
  title: string;
  title_ar?: string;
  message: string;
  message_ar?: string;
  type: string;
  priority: string;
  status: string;
  phone_number?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
  twilio_sid?: string;
  error_message?: string;
}

export default function NotificationCenter() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  // Send WhatsApp message mutation
  const sendWhatsAppMutation = useMutation({
    mutationFn: async (data: {
      phone_number: string;
      message: string;
      title?: string;
      priority?: string;
    }) => {
      return await apiRequest('/api/notifications/whatsapp', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "✅ تم إرسال الرسالة",
        description: "تم إرسال رسالة الواتس اب بنجاح",
      });
      setMessage('');
      setTitle('');
      setPhoneNumber('');
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ في الإرسال",
        description: error.message || "فشل في إرسال رسالة الواتس اب",
        variant: "destructive"
      });
    }
  });

  // Send test message mutation
  const sendTestMutation = useMutation({
    mutationFn: async (phone_number: string) => {
      return await apiRequest('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ phone_number }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "✅ رسالة الاختبار",
        description: "تم إرسال رسالة الاختبار بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ في الاختبار",
        description: error.message || "فشل في إرسال رسالة الاختبار",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!phoneNumber || !message) {
      toast({
        title: "⚠️ بيانات ناقصة",
        description: "يرجى إدخال رقم الهاتف والرسالة",
        variant: "destructive"
      });
      return;
    }

    sendWhatsAppMutation.mutate({
      phone_number: phoneNumber,
      message,
      title,
      priority
    });
  };

  const handleSendTest = () => {
    if (!phoneNumber) {
      toast({
        title: "⚠️ رقم الهاتف مطلوب",
        description: "يرجى إدخال رقم الهاتف لإرسال رسالة الاختبار",
        variant: "destructive"
      });
      return;
    }

    sendTestMutation.mutate(phoneNumber);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مركز الإشعارات</h1>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            إرسال رسائل
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            سجل الإشعارات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                إرسال رسالة واتس اب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">رقم الهاتف *</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="+966501234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendTest}
                      disabled={sendTestMutation.isPending}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    مثال: +966501234567 (يجب أن يبدأ برمز الدولة)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان الرسالة</label>
                  <Input
                    placeholder="عنوان الإشعار"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">محتوى الرسالة *</label>
                <Textarea
                  placeholder="اكتب محتوى الرسالة هنا..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الأولوية</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="low">منخفضة</option>
                  <option value="normal">عادية</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={sendWhatsAppMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sendWhatsAppMutation.isPending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={sendTestMutation.isPending || !phoneNumber}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  رسالة اختبار
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل الإشعارات</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">جاري تحميل الإشعارات...</p>
                </div>
              ) : notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(notification.status)}
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {notification.title_ar || notification.title}
                            </h3>
                            <Badge className={getStatusColor(notification.status)}>
                              {notification.status === 'sent' ? 'مُرسل' :
                               notification.status === 'delivered' ? 'مُسلم' :
                               notification.status === 'failed' ? 'فاشل' : 'معلق'}
                            </Badge>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority === 'urgent' ? 'عاجل' :
                               notification.priority === 'high' ? 'عالي' :
                               notification.priority === 'low' ? 'منخفض' : 'عادي'}
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {notification.message_ar || notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {notification.phone_number && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {notification.phone_number}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.created_at).toLocaleString('ar-SA')}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {notification.error_message && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                          <p className="text-red-700 dark:text-red-300 text-sm">
                            خطأ: {notification.error_message}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">لا توجد إشعارات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}