'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle, XCircle, Loader, ShoppingCart, X, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card, { CardContent } from './Card';
import Button from './Button';
import { SEO } from './SEO';
import { 
  checkDomainAvailability, 
  getSupportedTLDs, 
  popularExtensions,
  parseDomainInput,
  getRelatedDomainSuggestions,
  getTopResults,
  bulkCheckDomainAvailability
} from '@/lib/api/domainSearch';
import { getRegistrationLinks } from '@/lib/utils/registrationPlatforms';
import type { DomainSearchResult } from '@/types/database';

const VERCEL_TOKEN = process.env.NEXT_PUBLIC_VERCEL_API_TOKEN;
const VERCEL_TEAM_ID = process.env.NEXT_PUBLIC_VERCEL_TEAM_ID;

export default function DomainSearch() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [topResults, setTopResults] = useState<DomainSearchResult[]>([]);
  const [allResults, setAllResults] = useState<DomainSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableTLDs, setAvailableTLDs] = useState<string[]>(popularExtensions);
  const [isLoadingTLDs, setIsLoadingTLDs] = useState(false);
  const [hasExplicitTLD, setHasExplicitTLD] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load supported TLDs on component mount
  useEffect(() => {
    const loadSupportedTLDs = async () => {
      if (!VERCEL_TOKEN) return;

      setIsLoadingTLDs(true);
      try {
        const tlds = await getSupportedTLDs(VERCEL_TOKEN, VERCEL_TEAM_ID);
        if (tlds.length > 0) {
          setAvailableTLDs(tlds);
        }
      } catch (error) {
        console.error('Error loading supported TLDs:', error);
        // Fallback to popular extensions on error
      } finally {
        setIsLoadingTLDs(false);
      }
    };

    loadSupportedTLDs();
  }, []);

  // 生成下拉建议（只显示域名列表，不检查可用性）
  useEffect(() => {
    const parsed = parseDomainInput(searchQuery);
    
    // 如果输入包含明确后缀，不显示建议
    if (parsed.hasTLD || !searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 生成常用 TLD 建议
    const commonTLDs = ['com', 'net', 'org', 'io', 'co', 'dev', 'app', 'cn', 'xyz', 'ai', 'online'];
    const domainSuggestions = commonTLDs.map(tld => `${parsed.baseName}.${tld}`);
    setSuggestions(domainSuggestions);
    
    if (inputFocused && domainSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [searchQuery, inputFocused]);

  // 点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query?: string) => {
    const queryToUse = query || searchQuery;
    if (!queryToUse.trim()) return;

    setIsSearching(true);
    setTopResults([]);
    setAllResults([]);

    try {
      const parsed = parseDomainInput(queryToUse);
      setHasExplicitTLD(parsed.hasTLD);
      
      let results: DomainSearchResult[] = [];

      if (parsed.hasTLD && parsed.fullDomain) {
        // 情况1：输入了明确后缀 - 先检查这个域名
        const mainResult = await checkDomainAvailability(
          parsed.fullDomain,
          VERCEL_TOKEN || undefined,
          VERCEL_TEAM_ID || undefined
        );
        
        results = [mainResult];
        
        // 如果已注册，推荐几个主流后缀
        if (!mainResult.available) {
          const popularTLDs = ['com', 'net', 'org', 'io', 'co', 'dev', 'app'];
          const recommendedDomains = popularTLDs
            .filter(tld => tld !== parsed.tld)
            .map(tld => `${parsed.baseName}.${tld}`);
          
          // 批量查询推荐域名
          const recommendedResults = await Promise.all(
            recommendedDomains.map(domain =>
              checkDomainAvailability(
                domain,
                VERCEL_TOKEN || undefined,
                VERCEL_TEAM_ID || undefined
              )
            )
          );
          
          results = [mainResult, ...recommendedResults];
        }
        // 如果没注册，只显示这个域名的结果（价格已在 checkDomainAvailability 中查询）
      } else {
        // 情况2：无后缀 - 查询多个 TLD
        const tldsToCheck = availableTLDs.slice(0, 20); // 检查前 20 个 TLD
        results = await bulkCheckDomainAvailability(
          parsed.baseName,
          tldsToCheck,
          VERCEL_TOKEN || undefined,
          VERCEL_TEAM_ID || undefined
        );
      }

      // 筛选 Top Results 和 All Results
      const top = getTopResults(results);
      setTopResults(top);
      setAllResults(results);
    } catch (error) {
      console.error('Error searching domains:', error);
      alert('Failed to search domains. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <SEO title={t('search.title')} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('search.title')}</h1>
          <p className="text-slate-600 mt-2">{t('search.subtitle')}</p>
        </div>

        <Card>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      setInputFocused(true);
                      const parsed = parseDomainInput(searchQuery);
                      if (!parsed.hasTLD && searchQuery.trim()) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setInputFocused(false);
                      // 延迟关闭，允许点击建议项
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setShowSuggestions(false);
                        handleSearch();
                      }
                    }}
                    placeholder={t('search.placeholder')}
                    className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  
                  {/* 下拉建议框 */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-2 bg-white rounded-lg border border-slate-200 shadow-lg max-h-96 overflow-y-auto"
                    >
                      <div className="py-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={(e) => {
                              e.preventDefault();
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                              // 直接使用选中的域名进行搜索
                              handleSearch(suggestion);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <span className="font-medium text-slate-900">
                              {suggestion}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button onClick={() => handleSearch()} isLoading={isSearching}>
                  {t('search.button')}
                </Button>
              </div>
              {isLoadingTLDs && (
                <div className="flex items-center text-sm text-slate-600">
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Loading supported TLDs...
                </div>
              )}
              {!isLoadingTLDs && VERCEL_TOKEN && (
                <div className="text-sm text-slate-600">
                  Checking {availableTLDs.length} supported TLDs
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {(topResults.length > 0 || allResults.length > 0) && (
          <div className="space-y-8">
            {/* Top Results Section */}
            {topResults.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Top Results</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topResults.map((result) => (
                    <Card 
                      key={result.domain}
                      className={`transition-all ${
                        result.available 
                          ? 'border-green-300 hover:border-green-400' 
                          : 'border-slate-200'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">
                              {result.domain}
                            </h3>
                            {result.available ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                          </div>
                          
                          {result.available && result.price && (
                            <div className="pt-2 border-t border-slate-200">
                              <div className="flex items-center justify-between">
                                <p className="text-lg font-bold text-slate-900">
                                  {result.currency} {result.price}
                                </p>
                                <ShoppingCart className="w-5 h-5 text-slate-400" />
                              </div>
                            </div>
                          )}
                          
                          <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                            result.available
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {result.available ? t('search.available') : 'Unavailable'}
                          </span>
                          
                          {result.available && (
                            <div className="pt-2 border-t border-slate-200">
                              <p className="text-xs text-slate-600 mb-2">快速注册：</p>
                              <div className="flex flex-wrap gap-1.5">
                                {getRegistrationLinks(result.domain).map((platform) => (
                                  <a
                                    key={platform.name}
                                    href={platform.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                                  >
                                    {platform.name}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Results Section */}
            {allResults.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">All Results</h2>
                <div className="space-y-2">
                  {allResults.map((result) => (
                    <Card 
                      key={result.domain}
                      className={`transition-all ${
                        result.available 
                          ? 'border-green-200 hover:border-green-300' 
                          : 'border-slate-200'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {result.available ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate">
                                {result.domain}
                              </h3>
                              {result.available && result.price && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-sm text-slate-600">
                                    {result.currency} {result.price}
                                  </p>
                                  <ShoppingCart className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                              {result.available && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <p className="text-xs text-slate-600 mb-1.5">快速注册：</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {getRegistrationLinks(result.domain).map((platform) => (
                                      <a
                                        key={platform.name}
                                        href={platform.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                                      >
                                        {platform.name}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ${
                            result.available
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {result.available ? t('search.available') : 'Unavailable'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
