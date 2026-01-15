'use client';

import { useState } from 'react';
import { Globe, Languages, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function Footer() {
  const { i18n } = useTranslation();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangMenuOpen(false);
  };

  return (
    <footer className="bg-slate-900 text-slate-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Globe className="w-5 h-5 text-blue-400" />
            <span className="ml-2 text-base font-semibold text-white">NameUtils</span>
            <Link
              href="https://github.com/Go7hic/nameutils"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Languages className="w-4 h-4" />
                <span>{languages.find((lang) => lang.code === i18n.language)?.name || 'English'}</span>
              </button>
              {isLangMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-32 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1.5">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center px-4 py-2 text-sm hover:bg-slate-700 transition-colors duration-150 ${
                        i18n.language === lang.code
                          ? 'text-white font-semibold bg-slate-700'
                          : 'text-slate-300'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-6">
           
           
            <div className="text-sm text-slate-400">
              © 2026 NameUtils. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
