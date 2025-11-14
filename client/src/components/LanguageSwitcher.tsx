import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useEffect } from 'react';

const languages = [
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const normalizedLang = i18n.language.split('-')[0];
    const currentLang = languages.find(lang => lang.code === normalizedLang);
    const direction = currentLang?.dir || 'rtl';
    
    document.documentElement.dir = direction;
    document.documentElement.lang = normalizedLang;
  }, [i18n.language]);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const normalizedCurrentLang = i18n.language.split('-')[0];
  const currentLanguage = languages.find(lang =>{t('components.LanguageSwitcher.lang.code_===_normalizedcurrentlang)_||_languages[0];_return_(')}<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={t("components.languageswitcher.name.gap_2")}
          data-testid="language-switcher-button"
        >
          <Languages className={t("components.languageswitcher.name.h_4_w_4")} />
          <span className={t("components.languageswitcher.name.hidden_sm_inline")}>{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={normalizedCurrentLang === lang.code ? 'bg-accent' : ''}
            data-testid={`language-option-${lang.code}`}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
