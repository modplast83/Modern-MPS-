// ===============================================
// 🔹 Memory & Resource Monitor
// ===============================================
// يراقب استهلاك الذاكرة والموارد ويكتشف Memory Leaks
// ===============================================

export interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: Date;
}

export class MemoryMonitor {
  private static snapshots: MemorySnapshot[] = [];
  private static maxSnapshots = 1000;
  private static warningThreshold = 500 * 1024 * 1024; // 500MB
  private static criticalThreshold = 800 * 1024 * 1024; // 800MB

  static startMonitoring(intervalMs = 30000) {
    setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);

    console.log(`✅ Memory monitoring started (interval: ${intervalMs}ms)`);
  }

  static takeSnapshot() {
    const mem = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss,
      timestamp: new Date()
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    // فحص التحذيرات
    this.checkMemoryThresholds(snapshot);

    return snapshot;
  }

  private static checkMemoryThresholds(snapshot: MemorySnapshot) {
    const heapUsedMB = snapshot.heapUsed / 1024 / 1024;

    if (snapshot.heapUsed > this.criticalThreshold) {
      console.error(`🚨 [CRITICAL MEMORY] Heap usage: ${heapUsedMB.toFixed(2)}MB`);
      console.error('   Consider running garbage collection or restarting the server');
      
      // تشغيل garbage collection إذا كان متاحاً
      if (global.gc) {
        console.log('   Running garbage collection...');
        global.gc();
      }
    } else if (snapshot.heapUsed > this.warningThreshold) {
      console.warn(`⚠️ [HIGH MEMORY] Heap usage: ${heapUsedMB.toFixed(2)}MB`);
    }
  }

  static getMemoryStats() {
    if (this.snapshots.length === 0) {
      return null;
    }

    const recent = this.snapshots.slice(-20);
    const current = recent[recent.length - 1];
    const oldest = recent[0];

    const avgHeapUsed = recent.reduce((sum, s) => sum + s.heapUsed, 0) / recent.length;
    const trend = current.heapUsed - oldest.heapUsed;

    return {
      current: {
        heapUsedMB: (current.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (current.heapTotal / 1024 / 1024).toFixed(2),
        rssMB: (current.rss / 1024 / 1024).toFixed(2),
        externalMB: (current.external / 1024 / 1024).toFixed(2)
      },
      average: {
        heapUsedMB: (avgHeapUsed / 1024 / 1024).toFixed(2)
      },
      trend: {
        direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        changeMB: (Math.abs(trend) / 1024 / 1024).toFixed(2),
        isMemoryLeak: this.detectMemoryLeak()
      },
      warnings: this.getMemoryWarnings(current)
    };
  }

  private static detectMemoryLeak(): boolean {
    if (this.snapshots.length < 10) return false;

    const recent = this.snapshots.slice(-10);
    let increasingCount = 0;

    for (let i = 1; i < recent.length; i++) {
      if (recent[i].heapUsed > recent[i - 1].heapUsed) {
        increasingCount++;
      }
    }

    // إذا زاد الاستهلاك في 80% من القراءات الأخيرة
    return increasingCount >= 8;
  }

  private static getMemoryWarnings(snapshot: MemorySnapshot): string[] {
    const warnings: string[] = [];

    if (snapshot.heapUsed > this.criticalThreshold) {
      warnings.push('CRITICAL: Memory usage is very high');
    } else if (snapshot.heapUsed > this.warningThreshold) {
      warnings.push('WARNING: Memory usage is high');
    }

    if (this.detectMemoryLeak()) {
      warnings.push('POSSIBLE MEMORY LEAK: Heap usage consistently increasing');
    }

    return warnings;
  }

  static getMemoryHistory(minutes = 5): MemorySnapshot[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.snapshots.filter(s => s.timestamp >= cutoff);
  }

  static forceGarbageCollection() {
    if (global.gc) {
      const before = process.memoryUsage().heapUsed;
      global.gc();
      const after = process.memoryUsage().heapUsed;
      const freed = (before - after) / 1024 / 1024;
      
      console.log(`🗑️ Garbage collection freed ${freed.toFixed(2)}MB`);
      return { freedMB: freed.toFixed(2) };
    } else {
      console.warn('Garbage collection not available. Run with --expose-gc flag.');
      return { error: 'GC not available' };
    }
  }
}
