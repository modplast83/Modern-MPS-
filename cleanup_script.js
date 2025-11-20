import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// إعداد __dirname لأنها غير موجودة تلقائياً في نظام ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. قائمة الملفات المراد حذفها
const filesToDelete = [
		'client/src/pages/orders-backup.tsx', 
];

// 2. قائمة الملفات التي تحتاج إزالة "import React" منها
const filesToRemoveReactImport = [
		'client/src/components/MachineCard.tsx',
		'client/src/components/QueryErrorBoundary.tsx',
		'client/src/components/SafeSelectItem.tsx',
		'client/src/components/Sparkline.tsx',
		'client/src/main.tsx',
		'client/src/pages/notifications.tsx'
];

console.log("🚀 Starting Cleanup Process...\n");

// --- تنفيذ الحذف ---
filesToDelete.forEach(filePath => {
		const fullPath = path.join(__dirname, filePath);
		if (fs.existsSync(fullPath)) {
				try {
						fs.unlinkSync(fullPath);
						console.log(`✅ DELETED: ${filePath}`);
				} catch (err) {
						console.error(`❌ FAILED to delete ${filePath}: ${err.message}`);
				}
		} else {
				console.log(`⚠️  File already gone: ${filePath}`);
		}
});

console.log("\n--- Removing Deprecated 'import React' ---\n");

// --- تنفيذ تنظيف الأكواد القديمة ---
filesToRemoveReactImport.forEach(filePath => {
		const fullPath = path.join(__dirname, filePath);
		if (fs.existsSync(fullPath)) {
				try {
						let content = fs.readFileSync(fullPath, 'utf8');

						const originalLength = content.length;

						// حذف: import React from 'react';
						content = content.replace(/^import React from ['"]react['"];?\s*$/gm, '');

						if (content.length < originalLength) {
								fs.writeFileSync(fullPath, content, 'utf8');
								console.log(`✨ CLEANED: ${filePath}`);
						} else {
								console.log(`ℹ️  No changes needed: ${filePath}`);
						}
				} catch (err) {
						console.error(`❌ Error processing ${filePath}: ${err.message}`);
				}
		} else {
				console.log(`⚠️  File not found: ${filePath}`);
		}
});

console.log("\n🎉 Cleanup Complete!");