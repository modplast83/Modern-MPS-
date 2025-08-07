/**
 * تنسيق الأرقام لإزالة الفاصلة العشرية للأرقام الصحيحة
 * Format numbers to remove decimal places for whole numbers
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0';
  }
  
  // إذا كان الرقم صحيحاً (بدون كسور)، أظهره بدون فاصلة عشرية
  if (num % 1 === 0) {
    return num.toString();
  }
  
  // إذا كان الرقم يحتوي على كسور، أظهره بفاصلة عشرية محدودة
  return num.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * تنسيق الأرقام مع فواصل الآلاف
 * Format numbers with thousands separators
 */
export function formatNumberWithCommas(value: number | string | null | undefined): string {
  const formatted = formatNumber(value);
  const num = parseFloat(formatted);
  
  if (isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-US');
}

/**
 * تنسيق الأوزان (كيلوغرام)
 * Format weights (kilograms)
 */
export function formatWeight(value: number | string | null | undefined): string {
  return formatNumber(value) + ' كغ';
}

/**
 * تنسيق الأبعاد (سم)
 * Format dimensions (centimeters)
 */
export function formatDimension(value: number | string | null | undefined): string {
  return formatNumber(value) + ' سم';
}

/**
 * تنسيق السماكة (ميكرون)
 * Format thickness (microns)
 */
export function formatThickness(value: number | string | null | undefined): string {
  return formatNumber(value) + ' ميكرون';
}

/**
 * تنسيق النسب المئوية
 * Format percentages
 */
export function formatPercentage(value: number | string | null | undefined): string {
  return formatNumber(value) + '%';
}