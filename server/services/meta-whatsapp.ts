import type { IStorage } from "../storage";

export interface MetaWhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  apiVersion: string;
}

export interface WhatsAppTemplateMessage {
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters?: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

export interface WhatsAppTextMessage {
  to: string;
  type: "text";
  text: {
    body: string;
  };
}

export class MetaWhatsAppService {
  private config: MetaWhatsAppConfig;
  private storage: IStorage;
  private baseUrl: string;

  constructor(storage: IStorage, config?: Partial<MetaWhatsAppConfig>) {
    this.storage = storage;

    this.config = {
      accessToken: process.env.META_ACCESS_TOKEN || "",
      phoneNumberId: process.env.META_PHONE_NUMBER_ID || "",
      businessAccountId:
        process.env.META_BUSINESS_ACCOUNT_ID || "795259496521200",
      apiVersion: "v21.0",
      ...config,
    };

    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}`;

    if (!this.config.accessToken || !this.config.phoneNumberId) {
      console.warn(
        "⚠️ Meta WhatsApp API credentials not configured. Set META_ACCESS_TOKEN and META_PHONE_NUMBER_ID environment variables.",
      );
    } else {
      console.log("✅ Meta WhatsApp API service initialized successfully");
    }
  }

  /**
   * إرسال رسالة نصية مباشرة
   */
  async sendTextMessage(
    to: string,
    message: string,
    options?: {
      title?: string;
      priority?: string;
      context_type?: string;
      context_id?: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.config.accessToken || !this.config.phoneNumberId) {
        throw new Error("Meta WhatsApp API غير مُعد بشكل صحيح");
      }

      // تنسيق رقم الهاتف (إزالة + وwhatsapp: إن وجدت)
      const formattedPhone = to
        .replace(/[\+\s\-\(\)]/g, "")
        .replace("whatsapp:", "");

      const messageData: WhatsAppTextMessage = {
        to: formattedPhone,
        type: "text",
        text: {
          body: message,
        },
      };

      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      // حفظ الإشعار في قاعدة البيانات
      const notificationData = {
        title: options?.title || "رسالة واتس اب",
        message: message,
        type: "whatsapp" as const,
        priority: options?.priority || "normal",
        recipient_type: "user" as const,
        phone_number: to,
        status: "sent" as const,
        external_id: result.messages?.[0]?.id,
        external_status: "sent",
        sent_at: new Date(),
        context_type: options?.context_type,
        context_id: options?.context_id,
      };

      await this.storage.createNotification(notificationData);

      console.log(
        `📱 تم إرسال رسالة واتس اب مباشرة إلى ${to} - ID: ${result.messages?.[0]?.id}`,
      );

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error("خطأ في إرسال رسالة واتس اب عبر Meta API:", error);

      const notificationData = {
        title: options?.title || "رسالة واتس اب",
        message: message,
        type: "whatsapp" as const,
        priority: options?.priority || "normal",
        recipient_type: "user" as const,
        phone_number: to,
        status: "failed" as const,
        error_message: error.message,
        context_type: options?.context_type,
        context_id: options?.context_id,
      };

      await this.storage.createNotification(notificationData);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * إرسال رسالة باستخدام قالب Meta مُوافق عليه
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = "ar",
    variables: string[] = [],
    options?: {
      title?: string;
      priority?: string;
      context_type?: string;
      context_id?: string;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.config.accessToken || !this.config.phoneNumberId) {
        throw new Error("Meta WhatsApp API غير مُعد بشكل صحيح");
      }

      // تنسيق رقم الهاتف
      const formattedPhone = to
        .replace(/[\+\s\-\(\)]/g, "")
        .replace("whatsapp:", "");

      const messageData: WhatsAppTemplateMessage = {
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: language,
          },
        },
      };

      // إضافة متغيرات القالب إن وجدت
      if (variables && variables.length > 0) {
        messageData.template.components = [
          {
            type: "body",
            parameters: variables.map((variable) => ({
              type: "text",
              text: variable,
            })),
          },
        ];
      }

      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      // حفظ الإشعار في قاعدة البيانات
      const notificationData = {
        title: options?.title || "رسالة واتس اب (قالب)",
        message: `قالب: ${templateName} - متغيرات: ${variables.join(", ")}`,
        type: "whatsapp" as const,
        priority: options?.priority || "normal",
        recipient_type: "user" as const,
        phone_number: to,
        status: "sent" as const,
        external_id: result.messages?.[0]?.id,
        external_status: "sent",
        sent_at: new Date(),
        context_type: options?.context_type,
        context_id: options?.context_id,
      };

      await this.storage.createNotification(notificationData);

      console.log(
        `📱 تم إرسال رسالة واتس اب (قالب Meta) إلى ${to} - ID: ${result.messages?.[0]?.id}`,
      );

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error("خطأ في إرسال رسالة واتس اب (قالب Meta):", error);

      const notificationData = {
        title: options?.title || "رسالة واتس اب (قالب)",
        message: `قالب: ${templateName} - خطأ: ${error.message}`,
        type: "whatsapp" as const,
        priority: options?.priority || "normal",
        recipient_type: "user" as const,
        phone_number: to,
        status: "failed" as const,
        error_message: error.message,
        context_type: options?.context_type,
        context_id: options?.context_id,
      };

      await this.storage.createNotification(notificationData);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * الحصول على معلومات رقم الهاتف التجاري
   */
  async getPhoneNumberInfo(): Promise<any> {
    try {
      if (!this.config.accessToken || !this.config.phoneNumberId) {
        throw new Error("Meta WhatsApp API غير مُعد بشكل صحيح");
      }

      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error: any) {
      console.error("خطأ في الحصول على معلومات الرقم:", error);
      throw error;
    }
  }

  /**
   * الحصول على قائمة القوالب المُوافقة
   */
  async getApprovedTemplates(): Promise<any[]> {
    try {
      if (!this.config.accessToken || !this.config.businessAccountId) {
        throw new Error("Meta WhatsApp API غير مُعد بشكل صحيح");
      }

      const response = await fetch(
        `${this.baseUrl}/${this.config.businessAccountId}/message_templates?fields=name,status,language,components`,
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || `HTTP ${response.status}`);
      }

      // فلترة القوالب المُوافقة فقط
      return (
        result.data?.filter(
          (template: any) => template.status === "APPROVED",
        ) || []
      );
    } catch (error: any) {
      console.error("خطأ في الحصول على القوالب:", error);
      throw error;
    }
  }

  /**
   * التحقق من صحة الإعداد
   */
  async testConnection(): Promise<{
    success: boolean;
    error?: string;
    data?: any;
  }> {
    try {
      const phoneInfo = await this.getPhoneNumberInfo();
      return {
        success: true,
        data: phoneInfo,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * معالجة Webhook الواردة من Meta
   */
  async handleWebhook(body: any): Promise<void> {
    try {
      // معالجة تحديثات حالة الرسائل
      if (body.entry && body.entry[0] && body.entry[0].changes) {
        for (const change of body.entry[0].changes) {
          if (change.field === "messages") {
            const value = change.value;

            // تحديث حالة الرسائل
            if (value.statuses) {
              for (const status of value.statuses) {
                await this.updateMessageStatus(status.id, status.status);
              }
            }

            // معالجة الرسائل الواردة
            if (value.messages) {
              for (const message of value.messages) {
                await this.handleIncomingMessage(message);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("خطأ في معالجة Webhook:", error);
    }
  }

  /**
   * تحديث حالة الرسالة
   */
  private async updateMessageStatus(
    messageId: string,
    status: string,
  ): Promise<void> {
    try {
      // تحديث حالة الرسالة في قاعدة البيانات
      const notifications = await this.storage.getNotifications();
      const notification = notifications.find(
        (n) =>
          n.twilio_sid === messageId || (n as any).external_id === messageId,
      );

      if (notification) {
        // تحديث الحالة
        const updatedNotification = {
          ...notification,
          external_status: status,
          delivered_at:
            status === "delivered" ? new Date() : notification.delivered_at,
          read_at: status === "read" ? new Date() : notification.read_at,
        };

        console.log(`📊 تم تحديث حالة الرسالة ${messageId}: ${status}`);
      }
    } catch (error: any) {
      console.error("خطأ في تحديث حالة الرسالة:", error);
    }
  }

  /**
   * معالجة الرسائل الواردة
   */
  private async handleIncomingMessage(message: any): Promise<void> {
    try {
      console.log("📨 رسالة واردة:", {
        from: message.from,
        type: message.type,
        text: message.text?.body || "غير نصية",
      });

      // حفظ الرسالة الواردة في قاعدة البيانات
      const notificationData = {
        title: "رسالة واردة",
        message: message.text?.body || "رسالة غير نصية",
        type: "whatsapp" as const,
        priority: "normal",
        recipient_type: "system" as const,
        phone_number: message.from,
        status: "received" as const,
        external_id: message.id,
        external_status: "received",
        received_at: new Date(),
        context_type: "incoming_message",
      };

      await this.storage.createNotification(notificationData);
    } catch (error: any) {
      console.error("خطأ في معالجة الرسالة الواردة:", error);
    }
  }
}
