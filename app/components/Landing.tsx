'use client';

import { Globe, Search, Shield, BarChart3, Clock, Zap, Languages, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import Button from './Button';
import { SEO } from './SEO';

export default function Landing() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangMenuOpen(false);
  };

  const features = [
    {
      icon: Globe,
      title: t('landing.features.portfolio.title'),
      description: t('landing.features.portfolio.description'),
    },
    {
      icon: Search,
      title: t('landing.features.search.title'),
      description: t('landing.features.search.description'),
    },
    
    {
      icon: Sparkles,
      title: t('landing.features.aiRecommendation.title'),
      description: t('landing.features.aiRecommendation.description'),
    },
    {
      icon: BarChart3,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
    },
    {
      icon: Clock,
      title: t('landing.features.alerts.title'),
      description: t('landing.features.alerts.description'),
    },
    {
      icon: Zap,
      title: t('landing.features.export.title'),
      description: t('landing.features.export.description'),
    },
  ];

  return (
    <>
      <SEO
        title={t('landing.hero.title')}
        description={t('landing.hero.subtitle')}
        keywords="domain management, domain portfolio, domain search, domain registration"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <Globe className="w-8 h-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-slate-900">NameUtils</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Languages className="w-4 h-4" />
                  </button>
                  {isLangMenuOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full flex items-center px-4 py-2 text-sm hover:bg-slate-50 ${
                            i18n.language === lang.code ? 'text-blue-600 font-medium' : 'text-slate-700'
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" onClick={() => router.push('/login')}>
                  {t('nav.login')}
                </Button>
                <Button onClick={() => router.push('/signup')}>{t('nav.signup')}</Button>
              </div>
            </div>
          </div>
        </nav>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              {t('landing.hero.title')}
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => router.push('/signup')}>
                {t('landing.hero.cta')}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => router.push('/login')}>
                {t('nav.login')}
              </Button>
            </div>
          </div>

          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-slate-500/10 rounded-3xl blur-3xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
                  <div className="text-slate-600">Domains Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">5000+</div>
                  <div className="text-slate-600">Domain name investors</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
                  <div className="text-slate-600">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t('landing.features.title')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 md:p-16 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('landing.cta.title')}
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                {t('landing.cta.subtitle')}
              </p>

              <Button
                size="lg"
                onClick={() => router.push('/signup')}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                {t('landing.cta.button')}
              </Button>
            </div>
          </div>
        </section>

        <footer className="bg-slate-900 text-slate-300 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <Globe className="w-6 h-6 text-blue-400" />
                <span className="ml-2 text-lg font-semibold text-white">NameUtils</span>
              </div>
              <div className="text-sm text-slate-400">
                2026 NameUtils. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
