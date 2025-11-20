// ===============================================
// 🔹 Monitoring & Performance API Routes
// ===============================================
// توفير endpoints لمراقبة الأداء والصحة
// ===============================================

import { Router } from 'express';
import { PerformanceMonitor } from '../middleware/performance-monitor';
import { DatabaseMonitor } from '../middleware/database-monitor';
import { MemoryMonitor } from '../middleware/memory-monitor';
import { db } from '../db';
import { system_performance_metrics } from '../../shared/schema';
import { desc, sql, and, gte } from 'drizzle-orm';

const router = Router();

// 📊 تقرير الأداء الشامل
router.get('/api/monitoring/performance-report', async (req, res) => {
  try {
    const apiPerformance = await PerformanceMonitor.getPerformanceReport();
    const databaseStats = DatabaseMonitor.getQueryStats();
    const memoryStats = MemoryMonitor.getMemoryStats();

    res.json({
      timestamp: new Date(),
      api: apiPerformance,
      database: databaseStats,
      memory: memoryStats,
      systemHealth: {
        status: memoryStats?.warnings.length === 0 ? 'healthy' : 'warning',
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime())
      }
    });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({ error: 'Failed to generate performance report' });
  }
});

// 🐌 الاستعلامات البطيئة
router.get('/api/monitoring/slow-queries', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const slowQueries = DatabaseMonitor.getSlowQueries(limit);
    const patterns = await DatabaseMonitor.analyzeQueryPatterns();

    res.json({
      slowQueries,
      patterns,
      summary: {
        totalSlowQueries: slowQueries.length,
        averageSlowQueryTime: slowQueries.length > 0
          ? Math.round(slowQueries.reduce((sum, q) => sum + q.duration, 0) / slowQueries.length)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    res.status(500).json({ error: 'Failed to fetch slow queries' });
  }
});

// 🐌 النقاط البطيئة في API
router.get('/api/monitoring/slow-endpoints', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 500;
    const slowEndpoints = PerformanceMonitor.getSlowEndpoints(threshold);

    res.json({
      slowEndpoints,
      threshold,
      count: slowEndpoints.length
    });
  } catch (error) {
    console.error('Error fetching slow endpoints:', error);
    res.status(500).json({ error: 'Failed to fetch slow endpoints' });
  }
});

// 💾 إحصائيات الذاكرة
router.get('/api/monitoring/memory', async (req, res) => {
  try {
    const stats = MemoryMonitor.getMemoryStats();
    const minutes = parseInt(req.query.minutes as string) || 5;
    const history = MemoryMonitor.getMemoryHistory(minutes);

    res.json({
      current: stats,
      history: history.map(h => ({
        timestamp: h.timestamp,
        heapUsedMB: (h.heapUsed / 1024 / 1024).toFixed(2),
        rssMB: (h.rss / 1024 / 1024).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Error fetching memory stats:', error);
    res.status(500).json({ error: 'Failed to fetch memory stats' });
  }
});

// 🗑️ تشغيل Garbage Collection
router.post('/api/monitoring/gc', async (req, res) => {
  try {
    const result = MemoryMonitor.forceGarbageCollection();
    res.json(result);
  } catch (error) {
    console.error('Error running GC:', error);
    res.status(500).json({ error: 'Failed to run garbage collection' });
  }
});

// 📈 بيانات الأداء من قاعدة البيانات
router.get('/api/monitoring/metrics', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const category = req.query.category as string;

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    let query = db
      .select()
      .from(system_performance_metrics)
      .where(gte(system_performance_metrics.timestamp, cutoff))
      .orderBy(desc(system_performance_metrics.timestamp))
      .limit(1000);

    const metrics = await query;

    // تجميع حسب الفئة
    const byCategory = metrics.reduce((acc, m) => {
      if (!acc[m.metric_category]) {
        acc[m.metric_category] = [];
      }
      acc[m.metric_category].push(m);
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      total: metrics.length,
      timeRange: `${hours} hours`,
      byCategory,
      latest: metrics.slice(0, 20)
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// 🏥 فحص الصحة
router.get('/api/monitoring/health', async (req, res) => {
  try {
    const memoryStats = MemoryMonitor.getMemoryStats();
    const apiStats = await PerformanceMonitor.getPerformanceReport();
    
    const isHealthy = 
      (!memoryStats || memoryStats.warnings.length === 0) &&
      (apiStats.slowRequestsPercent || 0) < 20;

    res.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date(),
      checks: {
        memory: {
          status: !memoryStats || memoryStats.warnings.length === 0 ? 'ok' : 'warning',
          details: memoryStats
        },
        api: {
          status: (apiStats.slowRequestsPercent || 0) < 20 ? 'ok' : 'warning',
          slowRequestsPercent: apiStats.slowRequestsPercent || 0
        }
      },
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Health check failed' 
    });
  }
});

// دالة مساعدة لتنسيق وقت التشغيل
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}

export default router;
