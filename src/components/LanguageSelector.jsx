import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const LanguageSelector = ({ variant = 'outline', size = 'sm', className = '' }) => {
  const { language, setLanguage, languages } = useLanguage();
  const currentLang = languages.find(l => l.code === language) || languages[0];

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    try {
      localStorage.setItem('findback_language', code);
      document.documentElement.lang = code;
    } catch (e) {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`flex items-center gap-1.5 font-medium ${className}`}>
          <Globe className="h-4 w-4 text-sky-400" />
          <span>{currentLang.flag}</span>
          <span className="hidden sm:inline">{currentLang.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-slate-900 border-slate-800 text-white backdrop-blur-md z-50">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={() => handleSelectLanguage(lang.code)}
            onClick={() => handleSelectLanguage(lang.code)}
            className={`flex items-center justify-between cursor-pointer text-sm px-3 py-2 ${
              language === lang.code ? 'bg-sky-600/20 text-sky-400 font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
            {language === lang.code && <Check className="w-3.5 h-3.5 text-sky-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
