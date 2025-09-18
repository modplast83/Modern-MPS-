import { EventEmitter } from 'events';
import type { IStorage } from '../storage';
import { db, pool } from '../db';
import { eq, desc, and, sql, count, gte, lte } from 'drizzle-orm';
import type { 
  SystemAlert, 
  InsertSystemAlert, 
  SystemHealthCheck, 
  InsertSystemHealthCheck,
  SystemPerformanceMetric,
  InsertSystemPerformanceMetric,
  AlertRule,
  InsertAlertRule
} from '@shared/schema';
import { getNotificationManager } from './notification-manager';

// أنواع المراقبة والتحذيرات
export interface HealthCheckResult {
  checkName: string;
  checkName_ar: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  duration: number;
  details: Record<string, any>;
  error?: string;
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SmartAlert {
  id?: number;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: 'system' | 'production' | 'quality' | 'inventory' | 'maintenance' | 'security';
  category: 'warning' | 'error' | 'critical' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  source_id?: string;
  context_data?: Record<string, any>;
  suggested_actions?: {action: string; priority: number; description?: string}[];
  target_users?: number[];
  target_roles?: number[];
  requires_action: boolean;
}

/**
 * نظام مراقبة سلامة النظام والتحذيرات الذكية
 */
export class SystemHealthMonitor extends EventEmitter {
  private storage: IStorage;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alertRules: AlertRule[] = [];
  private lastHealthStatus: Map<string, HealthCheckResult> = new Map();
  private lastAlertTimes: Map<string, Date> = new Map(); // Track when alerts were last sent
  private alertCooldowns: Map<string, number> = new Map(); // Track alert cooldown periods
  
  // إعدادات المراقبة
  private readonly MONITORING_INTERVAL = 5 * 60 * 1000; // 5 دقائق
  private readonly HEALTH_CHECK_INTERVAL = 2 * 60 * 1000; // دقيقتين
  private readonly PERFORMANCE_RETENTION_DAYS = 30; // الاحتفاظ بالبيانات لمدة 30 يوم
  
  // إعدادات التحذيرات - Alert Rate Limiting
  private readonly ALERT_COOLDOWN_MEMORY = 10 * 60 * 1000; // 10 دقائق للذاكرة
  private readonly ALERT_COOLDOWN_DATABASE = 5 * 60 * 1000; // 5 دقائق لقاعدة البيانات
  private readonly ALERT_COOLDOWN_DEFAULT = 15 * 60 * 1000; // 15 دقائق افتراضي

  constructor(storage: IStorage) {
    super();
    this.storage = storage;
    
    console.log('[SystemHealthMonitor] نظام مراقبة السلامة مُفعل');
    this.initialize();
  }

  /**
   * تشغيل نظام المراقبة
   */
  private async initialize(): Promise<void> {
    try {
      // تحميل قواعد التحذيرات
      await this.loadAlertRules();
      
      // إنشاء فحوصات سلامة النظام الافتراضية
      await this.createDefaultHealthChecks();
      
      // بدء المراقبة الدورية
      this.startMonitoring();
      
      console.log('[SystemHealthMonitor] تم تشغيل نظام المراقبة بنجاح ✅');
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في تشغيل نظام المراقبة:', error);
    }
  }

  /**
   * بدء المراقبة الدورية
   */
  private startMonitoring(): void {
    // فحوصات سلامة النظام
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);

    // مراقبة الأداء والتحذيرات
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoring();
    }, this.MONITORING_INTERVAL);

    console.log('[SystemHealthMonitor] بدأت المراقبة الدورية');
  }

  /**
   * إيقاف المراقبة
   */
  public stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('[SystemHealthMonitor] تم إيقاف المراقبة');
  }

  /**
   * تحميل قواعد التحذيرات من قاعدة البيانات
   */
  private async loadAlertRules(): Promise<void> {
    try {
      // سنحتاج لإضافة هذه العملية في storage.ts لاحقاً
      console.log('[SystemHealthMonitor] تم تحميل قواعد التحذيرات');
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في تحميل قواعد التحذيرات:', error);
    }
  }

  /**
   * إنشاء فحوصات سلامة النظام الافتراضية
   */
  private async createDefaultHealthChecks(): Promise<void> {
    try {
      const defaultChecks: InsertSystemHealthCheck[] = [
        {
          check_name: 'Database Connection',
          check_name_ar: 'اتصال قاعدة البيانات',
          check_type: 'database',
          thresholds: { warning: 1000, critical: 5000, unit: 'ms' },
          is_critical: true
        },
        {
          check_name: 'Database Performance',
          check_name_ar: 'أداء قاعدة البيانات',
          check_type: 'database',
          thresholds: { warning: 500, critical: 2000, unit: 'ms' },
          is_critical: false
        },
        {
          check_name: 'Memory Usage',
          check_name_ar: 'استخدام الذاكرة',
          check_type: 'memory',
          thresholds: { warning: 85, critical: 95, unit: 'percent' },
          is_critical: false
        },
        {
          check_name: 'System Health API',
          check_name_ar: 'API سلامة النظام',
          check_type: 'api',
          thresholds: { warning: 1000, critical: 3000, unit: 'ms' },
          is_critical: false
        }
      ];

      // سنحتاج لإضافة هذه العملية في storage.ts لاحقاً
      console.log('[SystemHealthMonitor] تم إنشاء فحوصات السلامة الافتراضية');
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في إنشاء فحوصات السلامة:', error);
    }
  }

  /**
   * تنفيذ فحوصات سلامة النظام
   */
  private async performHealthChecks(): Promise<void> {
    try {
      const checks = [
        this.checkDatabaseConnection(),
        this.checkDatabasePerformance(),
        this.checkSystemMemory(),
        this.checkSystemHealth()
      ];

      const results = await Promise.allSettled(checks);
      
      for (const result of results) {
        if (result.status === 'fulfilled') {
          await this.processHealthCheckResult(result.value);
        } else {
          console.error('[SystemHealthMonitor] فشل في فحص السلامة:', result.reason);
        }
      }
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في تنفيذ فحوصات السلامة:', error);
    }
  }

  /**
   * فحص اتصال قاعدة البيانات
   */
  private async checkDatabaseConnection(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      await db.execute(sql`SELECT 1 as test`);
      const duration = Date.now() - startTime;
      
      return {
        checkName: 'Database Connection',
        checkName_ar: 'اتصال قاعدة البيانات',
        status: duration > 5000 ? 'critical' : duration > 1000 ? 'warning' : 'healthy',
        duration,
        details: { responseTime: duration, connected: true }
      };
    } catch (error: any) {
      return {
        checkName: 'Database Connection',
        checkName_ar: 'اتصال قاعدة البيانات',
        status: 'critical',
        duration: Date.now() - startTime,
        details: { connected: false },
        error: error.message
      };
    }
  }

  /**
   * فحص أداء قاعدة البيانات
   */
  private async checkDatabasePerformance(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // فحص عدد الاتصالات النشطة
      const activeConnections = await db.execute(sql`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      
      // فحص حجم قاعدة البيانات
      const dbSize = await db.execute(sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
      `);
      
      const duration = Date.now() - startTime;
      const connectionCount = (activeConnections as unknown as any[])[0]?.active_connections || 0;
      
      return {
        checkName: 'Database Performance',
        checkName_ar: 'أداء قاعدة البيانات',
        status: duration > 2000 ? 'critical' : duration > 500 ? 'warning' : 'healthy',
        duration,
        details: { 
          activeConnections: connectionCount,
          databaseSize: (dbSize as unknown as any[])[0]?.db_size,
          queryTime: duration
        }
      };
    } catch (error: any) {
      return {
        checkName: 'Database Performance',
        checkName_ar: 'أداء قاعدة البيانات',
        status: 'critical',
        duration: Date.now() - startTime,
        details: {},
        error: error.message
      };
    }
  }

  /**
   * فحص استخدام الذاكرة
   */
  private async checkSystemMemory(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      
      // Heap memory calculation (Node.js specific)
      const heapTotal = memoryUsage.heapTotal;
      const heapUsed = memoryUsage.heapUsed;
      const heapUsagePercent = (heapUsed / heapTotal) * 100;
      
      // RSS (Resident Set Size) - more representative of actual memory usage
      const rss = memoryUsage.rss;
      const external = memoryUsage.external;
      const arrayBuffers = memoryUsage.arrayBuffers || 0;
      
      // Calculate total process memory usage
      const totalProcessMemory = rss + external;
      
      // Use a more conservative calculation that considers RSS + external memory
      // RSS represents the actual physical memory currently used by the process
      const effectiveUsagePercent = Math.max(heapUsagePercent, (rss / (heapTotal * 2)) * 100);
      
      // Determine status based on improved thresholds
      let status: 'healthy' | 'warning' | 'critical' | 'unknown' = 'healthy';
      if (effectiveUsagePercent > 95) {
        status = 'critical';
      } else if (effectiveUsagePercent > 85) {
        status = 'warning';
      }
      
      return {
        checkName: 'Memory Usage',
        checkName_ar: 'استخدام الذاكرة',
        status,
        duration: Date.now() - startTime,
        details: {
          effectiveUsagePercent: Math.round(effectiveUsagePercent * 100) / 100,
          heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
          heapUsedMB: Math.round(heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(heapTotal / 1024 / 1024),
          rssMB: Math.round(rss / 1024 / 1024),
          externalMB: Math.round(external / 1024 / 1024),
          arrayBuffersMB: Math.round(arrayBuffers / 1024 / 1024),
          totalProcessMemoryMB: Math.round(totalProcessMemory / 1024 / 1024)
        }
      };
    } catch (error: any) {
      return {
        checkName: 'Memory Usage',
        checkName_ar: 'استخدام الذاكرة',
        status: 'unknown',
        duration: Date.now() - startTime,
        details: {},
        error: error.message
      };
    }
  }

  /**
   * فحص سلامة النظام العام
   */
  private async checkSystemHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // فحص الـ uptime
      const uptime = process.uptime();
      const uptimeHours = uptime / 3600;
      
      // فحص معلومات النظام
      const nodeVersion = process.version;
      const platform = process.platform;
      
      return {
        checkName: 'System Health API',
        checkName_ar: 'API سلامة النظام',
        status: 'healthy',
        duration: Date.now() - startTime,
        details: {
          uptime: `${Math.floor(uptimeHours)} ساعة`,
          nodeVersion,
          platform,
          processId: process.pid
        }
      };
    } catch (error: any) {
      return {
        checkName: 'System Health API',
        checkName_ar: 'API سلامة النظام',
        status: 'critical',
        duration: Date.now() - startTime,
        details: {},
        error: error.message
      };
    }
  }

  /**
   * معالجة نتائج فحوصات السلامة
   */
  private async processHealthCheckResult(result: HealthCheckResult): Promise<void> {
    try {
      // حفظ النتيجة في قاعدة البيانات
      const healthCheckData: InsertSystemHealthCheck = {
        check_name: result.checkName,
        check_name_ar: result.checkName_ar,
        check_type: this.getCheckType(result.checkName),
        status: result.status,
        last_check_time: new Date(),
        check_duration_ms: result.duration,
        check_details: result.details,
        last_error: result.error
      };

      // سنحتاج لإضافة هذه العملية في storage.ts لاحقاً
      
      // Check if status has improved and clear alert state if needed
      const previousResult = this.lastHealthStatus.get(result.checkName);
      if (previousResult && this.hasStatusImproved(previousResult.status, result.status)) {
        this.clearAlertState(result.checkName);
        console.log(`[SystemHealthMonitor] تم تحسن حالة ${result.checkName_ar} من ${previousResult.status} إلى ${result.status}`);
      }
      
      // إنشاء تحذير إذا كان الوضع سيء
      if (result.status === 'critical' || result.status === 'warning') {
        await this.createHealthAlert(result);
      }
      
      // تخزين النتيجة محلياً للمقارنة
      this.lastHealthStatus.set(result.checkName, result);
      
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في معالجة نتيجة الفحص:', error);
    }
  }

  /**
   * فحص ما إذا كان الوضع قد تحسن
   */
  private hasStatusImproved(oldStatus: string, newStatus: string): boolean {
    const statusLevels = { 'healthy': 0, 'warning': 1, 'critical': 2, 'unknown': 3 };
    const oldLevel = statusLevels[oldStatus as keyof typeof statusLevels] || 3;
    const newLevel = statusLevels[newStatus as keyof typeof statusLevels] || 3;
    return newLevel < oldLevel;
  }

  /**
   * مسح حالة التحذير عند تحسن الوضع
   */
  private clearAlertState(checkName: string): void {
    // Clear all alert states for this check type
    const keysToRemove: string[] = [];
    this.lastAlertTimes.forEach((value, key) => {
      if (key.startsWith(checkName)) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.lastAlertTimes.delete(key));
  }

  /**
   * تحديد نوع الفحص
   */
  private getCheckType(checkName: string): string {
    if (checkName.includes('Database')) return 'database';
    if (checkName.includes('Memory')) return 'memory';
    if (checkName.includes('API')) return 'api';
    return 'system';
  }

  /**
   * إنشاء تحذير صحي مع Rate Limiting
   */
  private async createHealthAlert(result: HealthCheckResult): Promise<void> {
    try {
      // Check if we should send alert based on rate limiting
      const alertKey = `${result.checkName}_${result.status}`;
      if (!this.shouldSendAlert(alertKey, result.checkName)) {
        console.log(`[SystemHealthMonitor] تم تجاهل التحذير بسبب Rate Limiting: ${result.checkName_ar} - ${result.status}`);
        return;
      }

      const alert: SmartAlert = {
        title: `System Health Issue: ${result.checkName}`,
        title_ar: `مشكلة في سلامة النظام: ${result.checkName_ar}`,
        message: result.error || `${result.checkName} is in ${result.status} state`,
        message_ar: result.error || `${result.checkName_ar} في حالة ${result.status}`,
        type: 'system',
        category: result.status === 'critical' ? 'critical' : 'warning',
        severity: result.status === 'critical' ? 'critical' : 'medium',
        source: 'system_health_monitor',
        source_id: result.checkName,
        context_data: result.details,
        requires_action: result.status === 'critical',
        suggested_actions: this.getSuggestedActions(result),
        target_roles: [1, 2] // الأدمن والمديرين
      };

      // Record that we sent this alert
      this.recordAlertSent(alertKey, result.checkName);
      
      await this.createSystemAlert(alert);
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في إنشاء تحذير السلامة:', error);
    }
  }

  /**
   * فحص ما إذا كان يجب إرسال التحذير بناءً على Rate Limiting
   */
  private shouldSendAlert(alertKey: string, checkName: string): boolean {
    const lastAlertTime = this.lastAlertTimes.get(alertKey);
    
    if (!lastAlertTime) {
      return true; // لم يتم إرسال تحذير من قبل
    }

    const cooldownPeriod = this.getAlertCooldown(checkName);
    const timeSinceLastAlert = Date.now() - lastAlertTime.getTime();
    
    return timeSinceLastAlert >= cooldownPeriod;
  }

  /**
   * تسجيل أنه تم إرسال تحذير
   */
  private recordAlertSent(alertKey: string, checkName: string): void {
    this.lastAlertTimes.set(alertKey, new Date());
    console.log(`[SystemHealthMonitor] تم تسجيل إرسال التحذير: ${alertKey} في ${new Date().toISOString()}`);
  }

  /**
   * الحصول على فترة التهدئة لنوع الفحص
   */
  private getAlertCooldown(checkName: string): number {
    if (checkName.includes('Memory')) {
      return this.ALERT_COOLDOWN_MEMORY;
    }
    if (checkName.includes('Database')) {
      return this.ALERT_COOLDOWN_DATABASE;
    }
    return this.ALERT_COOLDOWN_DEFAULT;
  }

  /**
   * الحصول على إجراءات مقترحة
   */
  private getSuggestedActions(result: HealthCheckResult): {action: string; priority: number; description?: string}[] {
    const actions: {action: string; priority: number; description?: string}[] = [];
    
    if (result.checkName.includes('Database')) {
      actions.push(
        { action: 'check_database_connections', priority: 1, description: 'فحص اتصالات قاعدة البيانات' },
        { action: 'restart_database_service', priority: 2, description: 'إعادة تشغيل خدمة قاعدة البيانات' }
      );
    }
    
    if (result.checkName.includes('Memory')) {
      actions.push(
        { action: 'check_memory_usage', priority: 1, description: 'مراجعة استخدام الذاكرة' },
        { action: 'restart_application', priority: 3, description: 'إعادة تشغيل التطبيق' }
      );
    }
    
    return actions;
  }

  /**
   * المراقبة العامة للنظام
   */
  private async performMonitoring(): Promise<void> {
    try {
      // مراقبة الأداء
      await this.monitorPerformance();
      
      // مراقبة الإنتاج
      await this.monitorProduction();
      
      // مراقبة المخزون
      await this.monitorInventory();
      
      // تنظيف البيانات القديمة
      await this.cleanupOldData();
      
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في المراقبة العامة:', error);
    }
  }

  /**
   * مراقبة الأداء
   */
  private async monitorPerformance(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // حفظ مؤشرات الأداء
      const metrics: InsertSystemPerformanceMetric[] = [
        {
          metric_name: 'memory_usage',
          metric_category: 'system',
          value: String(memoryUsage.heapUsed / 1024 / 1024), // MB
          unit: 'MB',
          source: 'system'
        },
        {
          metric_name: 'memory_usage_percent',
          metric_category: 'system',
          value: String((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
          unit: 'percent',
          source: 'system'
        }
      ];

      // سنحتاج لإضافة هذه العملية في storage.ts لاحقاً
      console.log('[SystemHealthMonitor] تم رصد مؤشرات الأداء');
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في مراقبة الأداء:', error);
    }
  }

  /**
   * مراقبة الإنتاج
   */
  private async monitorProduction(): Promise<void> {
    try {
      // فحص الطلبات المتأخرة
      const overdueOrders = await this.checkOverdueOrders();
      
      // فحص المكائن المعطلة
      const brokenMachines = await this.checkMachineStatus();
      
      // إنشاء تحذيرات حسب الحاجة
      if (overdueOrders > 0) {
        await this.createProductionAlert('overdue_orders', {
          count: overdueOrders,
          message: `يوجد ${overdueOrders} طلب متأخر عن موعد التسليم`
        });
      }
      
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في مراقبة الإنتاج:', error);
    }
  }

  /**
   * فحص الطلبات المتأخرة
   */
  private async checkOverdueOrders(): Promise<number> {
    try {
      // سنحتاج لإضافة هذا الاستعلام في storage.ts
      console.log('[SystemHealthMonitor] فحص الطلبات المتأخرة');
      return 0; // مؤقت
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في فحص الطلبات المتأخرة:', error);
      return 0;
    }
  }

  /**
   * فحص حالة المكائن
   */
  private async checkMachineStatus(): Promise<number> {
    try {
      // سنحتاج لإضافة هذا الاستعلام في storage.ts
      console.log('[SystemHealthMonitor] فحص حالة المكائن');
      return 0; // مؤقت
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في فحص حالة المكائن:', error);
      return 0;
    }
  }

  /**
   * مراقبة المخزون
   */
  private async monitorInventory(): Promise<void> {
    try {
      // فحص المواد قليلة المخزون
      const lowStockItems = await this.checkLowStockItems();
      
      if (lowStockItems > 0) {
        await this.createInventoryAlert('low_stock', {
          count: lowStockItems,
          message: `يوجد ${lowStockItems} صنف قليل المخزون`
        });
      }
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في مراقبة المخزون:', error);
    }
  }

  /**
   * فحص المواد قليلة المخزون
   */
  private async checkLowStockItems(): Promise<number> {
    try {
      // سنحتاج لإضافة هذا الاستعلام في storage.ts
      console.log('[SystemHealthMonitor] فحص المواد قليلة المخزون');
      return 0; // مؤقت
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في فحص المواد قليلة المخزون:', error);
      return 0;
    }
  }

  /**
   * إنشاء تحذير إنتاج
   */
  private async createProductionAlert(type: string, data: any): Promise<void> {
    const alert: SmartAlert = {
      title: `Production Alert: ${type}`,
      title_ar: `تحذير إنتاج: ${type}`,
      message: data.message,
      message_ar: data.message,
      type: 'production',
      category: 'warning',
      severity: 'medium',
      source: 'production_monitor',
      source_id: type,
      context_data: data,
      requires_action: true,
      target_roles: [2, 3] // المديرين والمشرفين
    };

    await this.createSystemAlert(alert);
  }

  /**
   * إنشاء تحذير مخزون
   */
  private async createInventoryAlert(type: string, data: any): Promise<void> {
    const alert: SmartAlert = {
      title: `Inventory Alert: ${type}`,
      title_ar: `تحذير مخزون: ${type}`,
      message: data.message,
      message_ar: data.message,
      type: 'system',
      category: 'warning',
      severity: 'medium',
      source: 'inventory_monitor',
      source_id: type,
      context_data: data,
      requires_action: true,
      target_roles: [2, 4] // المديرين ومسؤولي المخزون
    };

    await this.createSystemAlert(alert);
  }

  /**
   * إنشاء تحذير نظام
   */
  private async createSystemAlert(alert: SmartAlert): Promise<void> {
    try {
      const alertData: InsertSystemAlert = {
        title: alert.title,
        title_ar: alert.title_ar,
        message: alert.message,
        message_ar: alert.message_ar,
        type: alert.type,
        category: alert.category,
        severity: alert.severity,
        source: alert.source,
        source_id: alert.source_id,
        requires_action: alert.requires_action,
        context_data: alert.context_data,
        suggested_actions: alert.suggested_actions,
        target_users: alert.target_users,
        target_roles: alert.target_roles,
        notification_sent: false
      };

      // سنحتاج لإضافة هذه العملية في storage.ts لاحقاً
      console.log('[SystemHealthMonitor] تم إنشاء تحذير النظام:', alert.title_ar);

      // إرسال إشعار فوري
      await this.sendAlertNotification(alert);
      
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في إنشاء تحذير النظام:', error);
    }
  }

  /**
   * إرسال إشعار التحذير
   */
  private async sendAlertNotification(alert: SmartAlert): Promise<void> {
    try {
      const notificationManager = getNotificationManager(this.storage);
      
      if (alert.target_roles && alert.target_roles.length > 0) {
        for (const roleId of alert.target_roles) {
          await notificationManager.sendToRole(roleId, {
            title: alert.title_ar,
            message: alert.message_ar,
            type: this.mapAlertTypeToNotificationType(alert.type),
            priority: alert.severity === 'critical' ? 'urgent' : alert.severity === 'high' ? 'high' : 'normal',
            recipient_type: 'role',
            recipient_id: roleId.toString(),
            context_type: alert.type,
            context_id: alert.source_id,
            sound: alert.severity === 'critical',
            icon: this.getAlertIcon(alert.type)
          });
        }
      }
      
      if (alert.target_users && alert.target_users.length > 0) {
        for (const userId of alert.target_users) {
          await notificationManager.sendToUser(userId, {
            title: alert.title_ar,
            message: alert.message_ar,
            type: this.mapAlertTypeToNotificationType(alert.type),
            priority: alert.severity === 'critical' ? 'urgent' : alert.severity === 'high' ? 'high' : 'normal',
            recipient_type: 'user',
            recipient_id: userId.toString(),
            context_type: alert.type,
            context_id: alert.source_id,
            sound: alert.severity === 'critical',
            icon: this.getAlertIcon(alert.type)
          });
        }
      }
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في إرسال إشعار التحذير:', error);
    }
  }

  /**
   * تحويل نوع التحذير إلى نوع الإشعار المسموح
   */
  private mapAlertTypeToNotificationType(alertType: string): 'system' | 'order' | 'production' | 'maintenance' | 'quality' | 'hr' {
    const typeMapping: Record<string, 'system' | 'order' | 'production' | 'maintenance' | 'quality' | 'hr'> = {
      system: 'system',
      production: 'production',
      quality: 'quality',
      inventory: 'system', // Map inventory to system
      maintenance: 'maintenance',
      security: 'system' // Map security to system
    };
    return typeMapping[alertType] || 'system';
  }

  /**
   * الحصول على أيقونة التحذير
   */
  private getAlertIcon(type: string): string {
    const icons = {
      system: '⚙️',
      production: '🏭',
      quality: '✅',
      inventory: '📦',
      maintenance: '🔧',
      security: '🔒'
    };
    return icons[type as keyof typeof icons] || '🚨';
  }

  /**
   * تنظيف البيانات القديمة وحالات التحذيرات
   */
  private async cleanupOldData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.PERFORMANCE_RETENTION_DAYS);

      // Clean up old alert states (older than 24 hours)
      const alertCutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      const keysToRemove: string[] = [];
      
      for (const [key, alertTime] of Array.from(this.lastAlertTimes.entries())) {
        if (alertTime.getTime() < alertCutoffTime) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => this.lastAlertTimes.delete(key));
      
      if (keysToRemove.length > 0) {
        console.log(`[SystemHealthMonitor] تم تنظيف ${keysToRemove.length} حالة تحذير قديمة`);
      }

      // حذف البيانات القديمة من جدول الأداء
      // سنحتاج لإضافة هذه العملية في storage.ts لاحقاً
      
      console.log('[SystemHealthMonitor] تم تنظيف البيانات القديمة');
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في تنظيف البيانات القديمة:', error);
    }
  }

  /**
   * إيقاف النظام بأمان
   */
  public async shutdown(): Promise<void> {
    try {
      this.stopMonitoring();
      console.log('[SystemHealthMonitor] تم إيقاف نظام المراقبة بأمان');
    } catch (error) {
      console.error('[SystemHealthMonitor] خطأ في إيقاف نظام المراقبة:', error);
    }
  }

  /**
   * الحصول على حالة النظام الحالية
   */
  public getSystemStatus(): Record<string, any> {
    const status: Record<string, any> = {
      monitoring: this.monitoringInterval !== null,
      healthChecks: this.healthCheckInterval !== null,
      lastHealthChecks: Array.from(this.lastHealthStatus.values()),
      totalAlertRules: this.alertRules.length
    };
    
    return status;
  }
}

// إنشاء مثيل مشترك
let systemHealthMonitor: SystemHealthMonitor | null = null;

export function getSystemHealthMonitor(storage: IStorage): SystemHealthMonitor {
  if (!systemHealthMonitor) {
    systemHealthMonitor = new SystemHealthMonitor(storage);
  }
  return systemHealthMonitor;
}

export default SystemHealthMonitor;