import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    if (lng === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <span>{t('language')}:</span>
      <button
        onClick={() => changeLanguage('ar')}
        className={
          i18n.language === 'ar'
            ? 'font-bold underline text-primary'
            : 'text-muted-foreground'
        }
      >
        {t('arabic')}
      </button>
      <span>|</span>
      <button
        onClick={() => changeLanguage('en')}
        className={
          i18n.language === 'en'
            ? 'font-bold underline text-primary'
            : 'text-muted-foreground'
        }
      >
        {t('english')}
      </button>
    </div>
  );
}
