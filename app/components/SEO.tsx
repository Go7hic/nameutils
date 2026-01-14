'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

export function SEO({
  title,
  description,
  keywords,
  ogImage = 'https://nameutils.com/og-image.jpg',
  canonical,
}: SEOProps) {
  const { i18n } = useTranslation();
  const siteName = 'NameUtils';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const currentUrl = typeof window !== 'undefined' ? (canonical || window.location.href) : '';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.title = fullTitle;

    const metaTags = [
      { name: 'description', content: description || 'Personal domain name management platform' },
      { name: 'keywords', content: keywords || 'domain management, domain portfolio, domain search' },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description || 'Personal domain name management platform' },
      { property: 'og:image', content: ogImage },
      { property: 'og:url', content: currentUrl },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: siteName },
      { property: 'og:locale', content: i18n.language === 'zh' ? 'zh_CN' : 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description || 'Personal domain name management platform' },
      { name: 'twitter:image', content: ogImage },
    ];

    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);

      if (!element) {
        element = document.createElement('meta');
        if (name) element.setAttribute('name', name);
        if (property) element.setAttribute('property', property);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    });

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', currentUrl);

    let linkAlternate = document.querySelector('link[rel="alternate"][hreflang]');
    if (!linkAlternate) {
      linkAlternate = document.createElement('link');
      linkAlternate.setAttribute('rel', 'alternate');
      document.head.appendChild(linkAlternate);
    }
    linkAlternate.setAttribute('hreflang', i18n.language);
    linkAlternate.setAttribute('href', currentUrl);
  }, [fullTitle, description, keywords, ogImage, currentUrl, i18n.language]);

  return null;
}
