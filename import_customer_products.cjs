const fs = require('fs');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');

// Parse CSV function
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }
  
  return { headers, rows };
}

// Main import function
async function importCustomerProducts() {
  console.log('🚀 بدء استيراد منتجات العملاء...');
  
  // Read CSV file
  const csvPath = path.join(__dirname, 'attached_assets/CP_1755794430663.CSV');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ الملف غير موجود:', csvPath);
    return;
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const { rows } = parseCSV(csvContent);
  
  console.log(`📊 تم العثور على ${rows.length} سطر للاستيراد`);
  
  // Connect to database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  
  try {
    console.log('🔄 بدء الاستيراد إلى قاعدة البيانات...');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // تحويل البيانات إلى التنسيق المطلوب
        const customerProductData = {
          customer_id: row.customer_id,
          category_id: row.category_id,
          item_id: row.item_id,
          size_caption: row.size_caption,
          width: row.width ? parseFloat(row.width) : null,
          left_facing: row.left_facing ? parseFloat(row.left_facing) : null,
          right_facing: row.right_facing ? parseFloat(row.right_facing) : null,
          thickness: row.thickness ? parseFloat(row.thickness) : null,
          printing_cylinder: row.printing_cylinder || null,
          cutting_length_cm: row.cutting_length_cm ? parseInt(row.cutting_length_cm) : null,
          raw_material: row.raw_material || null,
          master_batch_id: row.master_batch_id || null,
          is_printed: row.is_printed === 'Yes' ? true : false,
          cutting_unit: row.cutting_unit || null,
          unit_weight_kg: row.unit_weight_kg ? parseFloat(row.unit_weight_kg) : null,
          notes: row.notes || null,
          punching: row.punching || null,
          status: 'active' // قيمة افتراضية
        };
        
        // التحقق من وجود السجل مسبقاً لتجنب التكرار
        const checkQuery = `
          SELECT id FROM customer_products 
          WHERE customer_id = $1 AND item_id = $2 AND size_caption = $3
        `;
        const checkResult = await pool.query(checkQuery, [
          customerProductData.customer_id,
          customerProductData.item_id, 
          customerProductData.size_caption
        ]);
        
        if (checkResult.rows.length > 0) {
          duplicateCount++;
          console.log(`⚠️  السجل موجود مسبقاً: ${customerProductData.customer_id} - ${customerProductData.item_id} - ${customerProductData.size_caption}`);
          continue;
        }
        
        // إدراج السجل الجديد
        const insertQuery = `
          INSERT INTO customer_products (
            customer_id, category_id, item_id, size_caption, width, left_facing, 
            right_facing, thickness, printing_cylinder, cutting_length_cm, 
            raw_material, master_batch_id, is_printed, cutting_unit, 
            unit_weight_kg, notes, punching, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
          )
        `;
        
        await pool.query(insertQuery, [
          customerProductData.customer_id,
          customerProductData.category_id,
          customerProductData.item_id,
          customerProductData.size_caption,
          customerProductData.width,
          customerProductData.left_facing,
          customerProductData.right_facing,
          customerProductData.thickness,
          customerProductData.printing_cylinder,
          customerProductData.cutting_length_cm,
          customerProductData.raw_material,
          customerProductData.master_batch_id,
          customerProductData.is_printed,
          customerProductData.cutting_unit,
          customerProductData.unit_weight_kg,
          customerProductData.notes,
          customerProductData.punching,
          customerProductData.status
        ]);
        
        successCount++;
        
        // عرض التقدم كل 100 سجل
        if ((i + 1) % 100 === 0) {
          console.log(`✅ تم استيراد ${successCount} سجل من ${i + 1}`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ خطأ في السطر ${i + 1}:`, error.message);
        console.error('البيانات:', row);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
  } finally {
    await pool.end();
  }
  
  // عرض النتائج النهائية
  console.log('\n📋 تقرير الاستيراد:');
  console.log(`✅ تم استيراد: ${successCount} سجل`);
  console.log(`⚠️  سجلات مكررة: ${duplicateCount}`);
  console.log(`❌ أخطاء: ${errorCount}`);
  console.log(`📊 إجمالي المعالج: ${successCount + duplicateCount + errorCount}`);
  console.log('\n🎉 اكتمل الاستيراد!');
}

// تشغيل الاستيراد
if (require.main === module) {
  importCustomerProducts().catch(console.error);
}

module.exports = { importCustomerProducts };