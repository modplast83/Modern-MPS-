module.exports = {
  locales: ['ar', 'en'],
  output: 'src/i18n/locales/$LOCALE.json',
  input: ['src/**/*.{js,jsx,ts,tsx}'],

  // لا ينشئ ملفات قديمة backup
  createOldCatalogs: false,

  // يحذف المفاتيح غير المستخدمة
  keepRemoved: false,

  // ترتيب المفاتيح
  sort: true,

  // اترك القيمة فاضية لو بدون ترجمة
  defaultValue: '',

  lexers: {
    js: ['JsxLexer'],
    jsx: ['JsxLexer'],
    ts: ['JsxLexer'],
    tsx: ['JsxLexer']
  }
};
