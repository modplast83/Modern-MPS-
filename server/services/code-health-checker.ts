// ===============================================
// 🔹 Code Health Checker
// ===============================================
// فحص آلي للكود المكرر والملفات غير المستخدمة
// ===============================================

import fs from 'fs';
import path from 'path';

export interface CodeIssue {
  type: 'duplicate_code' | 'unused_file' | 'large_file' | 'complex_file' | 'deprecated_pattern';
  severity: 'low' | 'medium' | 'high';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

export interface CodeHealthReport {
  timestamp: Date;
  totalFiles: number;
  issues: CodeIssue[];
  summary: {
    duplicateCode: number;
    unusedFiles: number;
    largeFiles: number;
    complexFiles: number;
    deprecatedPatterns: number;
  };
  recommendations: string[];
}

export class CodeHealthChecker {
  private static clientDir = path.join(process.cwd(), 'client', 'src');
  private static serverDir = path.join(process.cwd(), 'server');

  /**
   * تشغيل فحص شامل للكود
   */
  static async runFullHealthCheck(): Promise<CodeHealthReport> {
    const issues: CodeIssue[] = [];

    try {
      // 1. فحص الملفات الكبيرة
      const largeFiles = await this.checkLargeFiles();
      issues.push(...largeFiles);

      // 2. فحص الأنماط المهجورة
      const deprecatedPatterns = await this.checkDeprecatedPatterns();
      issues.push(...deprecatedPatterns);

      // 3. فحص ملفات النسخ الاحتياطي
      const backupFiles = await this.checkBackupFiles();
      issues.push(...backupFiles);

      // 4. فحص imports غير المستخدمة
      const unusedImports = await this.checkUnusedImports();
      issues.push(...unusedImports);

      // 5. فحص الكود المكرر
      const duplicates = await this.checkDuplicateCode();
      issues.push(...duplicates);

      const summary = {
        duplicateCode: issues.filter(i => i.type === 'duplicate_code').length,
        unusedFiles: issues.filter(i => i.type === 'unused_file').length,
        largeFiles: issues.filter(i => i.type === 'large_file').length,
        complexFiles: issues.filter(i => i.type === 'complex_file').length,
        deprecatedPatterns: issues.filter(i => i.type === 'deprecated_pattern').length
      };

      const recommendations = this.generateRecommendations(summary);

      return {
        timestamp: new Date(),
        totalFiles: await this.countFiles(),
        issues,
        summary,
        recommendations
      };
    } catch (error) {
      console.error('Error running health check:', error);
      throw error;
    }
  }

  /**
   * فحص الملفات الكبيرة التي قد تحتاج إلى تقسيم
   */
  private static async checkLargeFiles(): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const maxLines = 500; // الحد الأقصى للسطور

    const files = await this.getAllFiles([this.clientDir, this.serverDir]);

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n').length;

      if (lines > maxLines) {
        issues.push({
          type: 'large_file',
          severity: lines > 1000 ? 'high' : 'medium',
          file: this.relativePath(file),
          message: `File has ${lines} lines (recommended: < ${maxLines})`,
          suggestion: 'Consider splitting into smaller, focused modules'
        });
      }
    }

    return issues;
  }

  /**
   * فحص الأنماط المهجورة في الكود
   */
  private static async checkDeprecatedPatterns(): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    const deprecatedPatterns = [
      {
        pattern: /onError[\s\S]*useQuery/,
        message: 'TanStack Query v5: onError in useQuery is deprecated',
        suggestion: 'Use error state or useEffect instead'
      },
      {
        pattern: /import React from ['"]react['"]/,
        message: 'Explicit React import not needed with modern JSX transform',
        suggestion: 'Remove "import React" line'
      },
      {
        pattern: /process\.env\./,
        message: 'Frontend should use import.meta.env instead of process.env',
        suggestion: 'Use import.meta.env with VITE_ prefix'
      }
    ];

    const files = await this.getAllFiles([this.clientDir]);

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;

      const content = fs.readFileSync(file, 'utf-8');

      for (const { pattern, message, suggestion } of deprecatedPatterns) {
        if (pattern.test(content)) {
          // تخطي false positives (مثل server code)
          if (file.includes('server') && pattern === deprecatedPatterns[2].pattern) {
            continue;
          }

          issues.push({
            type: 'deprecated_pattern',
            severity: 'medium',
            file: this.relativePath(file),
            message,
            suggestion
          });
        }
      }
    }

    return issues;
  }

  /**
   * فحص ملفات النسخ الاحتياطي
   */
  private static async checkBackupFiles(): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const files = await this.getAllFiles([this.clientDir, this.serverDir]);

    const backupPatterns = [
      /-backup\.(ts|tsx|js|jsx)$/,
      /\.backup\.(ts|tsx|js|jsx)$/,
      /-old\.(ts|tsx|js|jsx)$/,
      /\.old\.(ts|tsx|js|jsx)$/,
      /-copy\.(ts|tsx|js|jsx)$/
    ];

    for (const file of files) {
      for (const pattern of backupPatterns) {
        if (pattern.test(file)) {
          issues.push({
            type: 'unused_file',
            severity: 'low',
            file: this.relativePath(file),
            message: 'Backup or old file detected',
            suggestion: 'Remove if no longer needed to reduce codebase size'
          });
          break;
        }
      }
    }

    return issues;
  }

  /**
   * فحص imports غير المستخدمة (فحص بسيط)
   */
  private static async checkUnusedImports(): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    // هذا فحص بسيط - أداة مثل ts-prune ستكون أفضل
    
    // للآن، نتحقق فقط من imports لم تُستخدم بوضوح
    const files = await this.getAllFiles([this.clientDir, this.serverDir]);

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // تحقق من imports غير مستخدمة بوضوح
        const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
        if (importMatch) {
          const imports = importMatch[1].split(',').map(s => s.trim());
          
          for (const imp of imports) {
            // بحث بسيط - قد يكون false positive
            const usageCount = content.split(imp).length - 1;
            if (usageCount === 1) { // ظهر مرة واحدة فقط (في import)
              issues.push({
                type: 'unused_file',
                severity: 'low',
                file: this.relativePath(file),
                line: i + 1,
                message: `Possibly unused import: ${imp}`,
                suggestion: 'Run ts-prune for accurate unused import detection'
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * فحص الكود المكرر (فحص بسيط)
   */
  private static async checkDuplicateCode(): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // فحص بسيط للدوال المكررة
    const files = await this.getAllFiles([this.clientDir, this.serverDir]);
    const functionSignatures = new Map<string, string[]>();

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;

      const content = fs.readFileSync(file, 'utf-8');
      
      // البحث عن تعريفات الدوال
      const functionRegex = /(?:function|const|let|var)\s+(\w+)\s*[=:]?\s*(?:\([^)]*\)|\([^)]*\)\s*=>)/g;
      let match;

      while ((match = functionRegex.exec(content)) !== null) {
        const funcName = match[1];
        const signature = match[0];

        if (!functionSignatures.has(signature)) {
          functionSignatures.set(signature, []);
        }
        functionSignatures.get(signature)!.push(file);
      }
    }

    // الإبلاغ عن الدوال المكررة
    Array.from(functionSignatures.entries()).forEach(([signature, files]) => {
      if (files.length > 1) {
        issues.push({
          type: 'duplicate_code',
          severity: 'medium',
          file: files.map((f: string) => this.relativePath(f)).join(', '),
          message: `Similar function found in ${files.length} files`,
          suggestion: 'Consider creating a shared utility function'
        });
      }
    });

    return issues;
  }

  /**
   * توليد توصيات بناءً على النتائج
   */
  private static generateRecommendations(summary: CodeHealthReport['summary']): string[] {
    const recommendations: string[] = [];

    if (summary.largeFiles > 0) {
      recommendations.push(`📦 Found ${summary.largeFiles} large file(s). Consider splitting them into smaller modules for better maintainability.`);
    }

    if (summary.deprecatedPatterns > 0) {
      recommendations.push(`⚠️ Found ${summary.deprecatedPatterns} deprecated pattern(s). Update to use modern practices.`);
    }

    if (summary.unusedFiles > 0) {
      recommendations.push(`🗑️ Found ${summary.unusedFiles} potentially unused file(s). Remove to reduce bundle size.`);
    }

    if (summary.duplicateCode > 0) {
      recommendations.push(`♻️ Found ${summary.duplicateCode} instance(s) of duplicate code. Refactor into shared utilities.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Code health looks good! No major issues detected.');
    }

    return recommendations;
  }

  /**
   * الحصول على جميع الملفات من المجلدات
   */
  private static async getAllFiles(dirs: string[]): Promise<string[]> {
    const files: string[] = [];

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
            walk(fullPath);
          }
        } else {
          files.push(fullPath);
        }
      }
    };

    for (const dir of dirs) {
      walk(dir);
    }

    return files;
  }

  /**
   * حساب عدد الملفات
   */
  private static async countFiles(): Promise<number> {
    const files = await this.getAllFiles([this.clientDir, this.serverDir]);
    return files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).length;
  }

  /**
   * تحويل المسار إلى مسار نسبي
   */
  private static relativePath(file: string): string {
    return path.relative(process.cwd(), file);
  }
}
