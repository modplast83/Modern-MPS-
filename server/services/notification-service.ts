import twilio from 'twilio';
import type { IStorage } from '../storage';

export interface NotificationData {
  title: string;
  title_ar?: string;
  message: string;
  message_ar?: string;
  type: 'whatsapp' | 'sms' | 'email' | 'push' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  recipient_type: 'user' | 'group' | 'role' | 'all';
  recipient_id?: string;
  phone_number?: string;
  context_type?: string;
  context_id?: string;
  scheduled_for?: Date;
}

export interface WhatsAppTemplate {
  name: string;
  variables?: string[];
  language?: string;
}

export class NotificationService {
  private twilioClient: twilio.Twilio;
  private storage: IStorage;
  private twilioPhoneNumber: string;

  constructor(storage: IStorage) {
    this.storage = storage;
    
    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not found. WhatsApp messaging will be disabled.');
      this.twilioClient = null as any;
    } else {
      this.twilioClient = twilio(accountSid, authToken);
      console.log('✅ Twilio WhatsApp service initialized successfully');
    }
  }

  /**
   * إرسال رسالة واتس اب باستخدام قالب مُوافق عليه
   */
  async sendWhatsAppTemplateMessage(
    phoneNumber: string,
    templateName: string,
    variables: string[] = [],
    options?: {
      title?: string;
      priority?: string;
      context_type?: string;
      context_id?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.twilioClient) {
        throw new Error('خدمة Twilio غير مُعدة بشكل صحيح');
      }

      const formattedNumber = phoneNumber.startsWith('whatsapp:') 
        ? phoneNumber 
        : `whatsapp:${phoneNumber}`;

      // في Twilio، نحتاج استخدام template الذي تم تسجيله في Twilio Content Template Builder
      // بدلاً من Meta template ID مباشرة
      const messageData: any = {
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: formattedNumber,
        body: variables[0] || 'مرحباً من نظام MPBF' // استخدام النص المباشر مؤقتاً
      };

      // ملاحظة: للاستخدام الصحيح للقوالب، يجب:
      // 1. إنشاء Content Template في Twilio Console
      // 2. ربطه بـ Meta template المُوافق عليه
      // 3. استخدام contentSid للقالب من Twilio
      
      // إضافة متغيرات القالب إن وجدت (للاستخدام المستقبلي)
      // if (variables && variables.length > 0) {
      //   messageData.contentVariables = JSON.stringify(
      //     variables.reduce((acc, variable, index) => {
      //       acc[`${index + 1}`] = variable;
      //       return acc;
      //     }, {} as Record<string, string>)
      //   );
      // }

      const twilioMessage = await this.twilioClient.messages.create(messageData);

      // Save notification to database
      const notificationData = {
        title: options?.title || 'إشعار واتس اب',
        message: `قالب: ${templateName} - متغيرات: ${variables.join(', ')}`,
        type: 'whatsapp' as const,
        priority: options?.priority || 'normal',
        recipient_type: 'user' as const,
        phone_number: phoneNumber,
        status: 'sent' as const,
        twilio_sid: twilioMessage.sid,
        external_status: twilioMessage.status,
        sent_at: new Date(),
        context_type: options?.context_type,
        context_id: options?.context_id,
      };

      await this.storage.createNotification(notificationData);

      console.log(`📱 تم إرسال رسالة واتس اب (قالب) إلى ${phoneNumber} - SID: ${twilioMessage.sid}`);
      
      return {
        success: true,
        messageId: twilioMessage.sid
      };

    } catch (error: any) {
      console.error('خطأ في إرسال رسالة واتس اب (قالب):', error);
      
      const notificationData = {
        title: options?.title || 'إشعار واتس اب',
        message: `قالب: ${templateName} - خطأ: ${error.message}`,
        type: 'whatsapp' as const,
        priority: options?.priority || 'normal',
        recipient_type: 'user' as const,
        phone_number: phoneNumber,
        status: 'failed' as const,
        error_message: error.message,
        context_type: options?.context_type,
        context_id: options?.context_id,
      };

      await this.storage.createNotification(notificationData);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * إرسال إشعار واتس اب (النسخة القديمة للتوافق مع الكود الحالي)
   */
  async sendWhatsAppMessage(
    phoneNumber: string, 
    message: string, 
    options?: {
      title?: string;
      priority?: string;
      context_type?: string;
      context_id?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // استخدام القالب المُوافق عليه بدلاً من النص الحر
    return this.sendWhatsAppTemplateMessage(
      phoneNumber,
      'welcome_hxc4485f514cb7d4536026fc56250f75e7',
      [message], // استخدام الرسالة كمتغير في القالب
      options
    );
  }

  /**
   * إرسال رسالة واتس اب مباشرة (للاختبار فقط في Sandbox)
   */
  async sendWhatsAppDirectMessage(
    phoneNumber: string, 
    message: string, 
    options?: {
      title?: string;
      priority?: string;
      context_type?: string;
      context_id?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.twilioClient) {
        throw new Error('خدمة Twilio غير مُعدة بشكل صحيح');
      }

      // Format phone number for WhatsApp (must include whatsapp: prefix)
      const formattedNumber = phoneNumber.startsWith('whatsapp:') 
        ? phoneNumber 
        : `whatsapp:${phoneNumber}`;

      // Send WhatsApp message via Twilio
      const twilioMessage = await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: formattedNumber
      });

      // Save notification to database
      const notificationData = {
        title: options?.title || 'إشعار واتس اب',
        message: message,
        type: 'whatsapp' as const,
        priority: options?.priority || 'normal',
        recipient_type: 'user' as const,
        phone_number: phoneNumber,
        status: 'sent' as const,
        twilio_sid: twilioMessage.sid,
        external_status: twilioMessage.status,
        sent_at: new Date(),
        context_type: options?.context_type,
        context_id: options?.context_id,
      };

      await this.storage.createNotification(notificationData);

      console.log(`📱 تم إرسال رسالة واتس اب إلى ${phoneNumber} - SID: ${twilioMessage.sid}`);
      
      return {
        success: true,
        messageId: twilioMessage.sid
      };

    } catch (error: any) {
      console.error('خطأ في إرسال رسالة واتس اب:', error);
      
      // Save failed notification to database
      const notificationData = {
        title: options?.title || 'إشعار واتس اب',
        message: message,
        type: 'whatsapp' as const,
        priority: options?.priority || 'normal',
        recipient_type: 'user' as const,
        phone_number: phoneNumber,
        status: 'failed' as const,
        error_message: error.message,
        context_type: options?.context_type,
        context_id: options?.context_id,
      };

      await this.storage.createNotification(notificationData);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * إرسال إشعار إلى مستخدم محدد
   */
  async notifyUser(userId: number, notificationData: NotificationData): Promise<boolean> {
    try {
      // Get user details
      const user = await this.storage.getUserById(userId);
      if (!user) {
        console.warn(`المستخدم ${userId} غير موجود`);
        return false;
      }

      // Check if user has phone number for WhatsApp
      if (notificationData.type === 'whatsapp' && user.phone) {
        const result = await this.sendWhatsAppMessage(
          user.phone,
          notificationData.message_ar || notificationData.message,
          {
            title: notificationData.title_ar || notificationData.title,
            priority: notificationData.priority,
            context_type: notificationData.context_type,
            context_id: notificationData.context_id
          }
        );
        return result.success;
      }

      // Save as system notification if WhatsApp not available
      const dbNotification = {
        ...notificationData,
        recipient_type: 'user' as const,
        recipient_id: userId.toString(),
        status: 'sent' as const
      };

      await this.storage.createNotification(dbNotification);
      return true;

    } catch (error: any) {
      console.error(`خطأ في إرسال الإشعار للمستخدم ${userId}:`, error);
      return false;
    }
  }

  /**
   * إرسال إشعارات جماعية بناءً على الدور
   */
  async notifyByRole(roleId: number, notificationData: NotificationData): Promise<number> {
    try {
      const users = await this.storage.getUsersByRole(roleId);
      let successCount = 0;

      for (const user of users) {
        const success = await this.notifyUser(user.id, notificationData);
        if (success) successCount++;
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`تم إرسال ${successCount} إشعار من أصل ${users.length} للدور ${roleId}`);
      return successCount;

    } catch (error: any) {
      console.error(`خطأ في إرسال الإشعارات للدور ${roleId}:`, error);
      return 0;
    }
  }

  /**
   * معالجة إشعارات الحضور
   */
  async notifyAttendanceEvent(
    userId: number, 
    eventType: 'check_in' | 'check_out' | 'lunch_start' | 'lunch_end' | 'late',
    additionalInfo?: any
  ): Promise<boolean> {
    const messages = {
      check_in: 'تم تسجيل دخولك بنجاح ✅',
      check_out: 'تم تسجيل خروجك بنجاح 👋',
      lunch_start: 'تم تسجيل بداية استراحة الغداء 🍽️',
      lunch_end: 'تم تسجيل انتهاء استراحة الغداء ✅',
      late: 'تنبيه: تم تسجيل تأخير في الحضور ⚠️'
    };

    const titles = {
      check_in: 'تسجيل الدخول',
      check_out: 'تسجيل الخروج',
      lunch_start: 'استراحة الغداء',
      lunch_end: 'العودة من الاستراحة',
      late: 'تنبيه تأخير'
    };

    const notificationData: NotificationData = {
      title: titles[eventType],
      message: messages[eventType],
      type: 'whatsapp',
      priority: eventType === 'late' ? 'high' : 'normal',
      recipient_type: 'user',
      context_type: 'attendance',
      context_id: additionalInfo?.attendanceId?.toString()
    };

    return await this.notifyUser(userId, notificationData);
  }

  /**
   * معالجة إشعارات الطلبات
   */
  async notifyOrderEvent(
    orderNumber: string,
    eventType: 'created' | 'completed' | 'delayed' | 'cancelled',
    userIds?: number[]
  ): Promise<number> {
    const messages = {
      created: `تم إنشاء طلب جديد: ${orderNumber} 📦`,
      completed: `تم إكمال الطلب: ${orderNumber} ✅`,
      delayed: `تأخير في الطلب: ${orderNumber} ⚠️`,
      cancelled: `تم إلغاء الطلب: ${orderNumber} ❌`
    };

    const titles = {
      created: 'طلب جديد',
      completed: 'اكتمال طلب',
      delayed: 'تأخير طلب',
      cancelled: 'إلغاء طلب'
    };

    const notificationData: NotificationData = {
      title: titles[eventType],
      message: messages[eventType],
      type: 'whatsapp',
      priority: eventType === 'delayed' ? 'high' : 'normal',
      recipient_type: userIds ? 'user' : 'role',
      context_type: 'order',
      context_id: orderNumber
    };

    if (userIds && userIds.length > 0) {
      let successCount = 0;
      for (const userId of userIds) {
        const success = await this.notifyUser(userId, notificationData);
        if (success) successCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return successCount;
    } else {
      // Notify managers and supervisors (role_id = 2)
      return await this.notifyByRole(2, notificationData);
    }
  }

  /**
   * الحصول على حالة الرسالة من Twilio
   */
  async updateMessageStatus(twilioSid: string): Promise<boolean> {
    try {
      if (!this.twilioClient) return false;

      const message = await this.twilioClient.messages(twilioSid).fetch();
      
      // Update notification status in database
      await this.storage.updateNotificationStatus(twilioSid, {
        external_status: message.status,
        delivered_at: message.status === 'delivered' ? new Date() : undefined,
        error_message: message.errorMessage || undefined
      });

      return true;
    } catch (error: any) {
      console.error(`خطأ في تحديث حالة الرسالة ${twilioSid}:`, error);
      return false;
    }
  }

  /**
   * إرسال رسالة اختبار
   */
  async sendTestMessage(phoneNumber: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const testMessage = `
🔧 رسالة اختبار من نظام إدارة المصنع

مرحباً! هذه رسالة اختبار للتأكد من عمل خدمة الواتس اب بشكل صحيح.

⏰ التوقيت: ${new Date().toLocaleString('ar-SA')}
✅ الخدمة تعمل بنجاح

شكراً لاستخدام نظامنا! 
    `.trim();

    const result = await this.sendWhatsAppMessage(phoneNumber, testMessage, {
      title: 'رسالة اختبار',
      priority: 'normal',
      context_type: 'system',
      context_id: 'test'
    });

    return {
      success: result.success,
      message: result.success ? 'تم إرسال رسالة الاختبار بنجاح' : undefined,
      error: result.error
    };
  }
}