'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Globe, Star, Trash2, Edit, Upload, FileText, Image, ChevronDown, Filter, X, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card, { CardContent } from './Card';
import Button from './Button';
import Modal from './Modal';
import AddDomainForm from './AddDomainForm';
import BulkUploadForm from './BulkUploadForm';
import { SEO } from './SEO';
import { getAllDomains, deleteDomain, toggleFavorite } from '@/lib/api/domains';
import type { Domain } from '@/types/database';

export default function Domains() {
  const { t } = useTranslation();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'csv' | 'image' | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [selectedRegistrar, setSelectedRegistrar] = useState<string>('');
  const [selectedTld, setSelectedTld] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const loadDomains = async () => {
    try {
      setIsLoading(true);
      const data = await getAllDomains();
      setDomains(data);
    } catch (error) {
      console.error('Error loading domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      await deleteDomain(id);
      setDomains(domains.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting domain:', error);
      alert('Failed to delete domain');
    }
  };

  const handleToggleFavorite = async (domain: Domain) => {
    try {
      await toggleFavorite(domain.id, !domain.is_favorite);
      setDomains(domains.map(d =>
        d.id === domain.id ? { ...d, is_favorite: !d.is_favorite } : d
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingDomain(null);
  };

  const handleSaved = () => {
    loadDomains();
    handleCloseModal();
  };

  // 提取所有注册商和后缀用于筛选
  const { registrars, tlds } = useMemo(() => {
    const registrarSet = new Set<string>();
    const tldSet = new Set<string>();
    
    domains.forEach(domain => {
      if (domain.registrar) {
        registrarSet.add(domain.registrar);
      }
      // 提取后缀（TLD）
      const parts = domain.domain_name.split('.');
      if (parts.length > 1) {
        tldSet.add('.' + parts.slice(1).join('.'));
      }
    });
    
    return {
      registrars: Array.from(registrarSet).sort(),
      tlds: Array.from(tldSet).sort(),
    };
  }, [domains]);

  // 筛选域名
  const filteredDomains = useMemo(() => {
    return domains.filter(domain => {
      // 搜索筛选
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const domainName = domain.domain_name.toLowerCase();
        if (!domainName.includes(query)) {
          return false;
        }
      }
      
      // 注册商筛选
      if (selectedRegistrar && domain.registrar !== selectedRegistrar) {
        return false;
      }
      
      // 后缀筛选
      if (selectedTld) {
        const domainTld = '.' + domain.domain_name.split('.').slice(1).join('.');
        if (domainTld !== selectedTld) {
          return false;
        }
      }
      
      return true;
    });
  }, [domains, selectedRegistrar, selectedTld, searchQuery]);

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // 格式化价格
  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null || price === undefined) return '-';
    const currencySymbols: Record<string, string> = {
      USD: '$',
      CNY: '¥',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
    };
    const symbol = currencySymbols[currency || 'USD'] || currency || '';
    return `${symbol}${price.toFixed(2)}`;
  };

  // 获取状态标签样式
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { labelKey: string; className: string }> = {
      active: { labelKey: 'domains.status.active', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' },
      expiring_soon: { labelKey: 'domains.status.expiring', className: 'bg-amber-50 text-amber-700 border border-amber-200/60' },
      expired: { labelKey: 'domains.status.expired', className: 'bg-red-50 text-red-700 border border-red-200/60' },
      pending: { labelKey: 'domains.status.pending', className: 'bg-blue-50 text-blue-700 border border-blue-200/60' },
    };
    
    const statusInfo = statusMap[status] || { labelKey: status, className: 'bg-slate-50 text-slate-700 border border-slate-200/60' };
    
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${statusInfo.className}`}>
        {t(statusInfo.labelKey)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  return (
    <>
      <SEO title={t('domains.title')} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{t('domains.title')}</h1>
            <p className="text-sm text-slate-500 mt-1.5">{t('domains.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onMouseEnter={() => setIsDropdownOpen(true)}
                className="relative"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('domains.uploadAdd')}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/60 z-50 overflow-hidden"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button
                    onClick={() => {
                      setUploadType('csv');
                      setIsBulkUploadModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50/80 flex items-center space-x-3 transition-colors duration-150"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">{t('domains.bulkUpload.uploadCsv')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setUploadType('image');
                      setIsBulkUploadModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50/80 flex items-center space-x-3 transition-colors duration-150 border-t border-slate-100"
                  >
                    <Image className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">{t('domains.bulkUpload.uploadImage')}</span>
                  </button>
                </div>
              )}
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('domains.add')}
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        {domains.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="space-y-4">
              

                {/* 筛选选项 */}
                <div className="flex items-center flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{t('domains.filter')}</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('domains.searchPlaceholder')}
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 bg-white/80 transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-slate-600 font-medium">{t('domains.registrar')}</label>
                    <select
                      value={selectedRegistrar}
                      onChange={(e) => setSelectedRegistrar(e.target.value)}
                      className="px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 bg-white/80 transition-all duration-200"
                    >
                      <option value="">全部</option>
                      {registrars.map(registrar => (
                        <option key={registrar} value={registrar}>{registrar}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-slate-600 font-medium">{t('domains.tld')}</label>
                    <select
                      value={selectedTld}
                      onChange={(e) => setSelectedTld(e.target.value)}
                      className="px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 bg-white/80 transition-all duration-200"
                    >
                      <option value="">全部</option>
                      {tlds.map(tld => (
                        <option key={tld} value={tld}>{tld}</option>
                      ))}
                    </select>
                  </div>

                  {(selectedRegistrar || selectedTld || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedRegistrar('');
                        setSelectedTld('');
                        setSearchQuery('');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors duration-200"
                    >
                    <X className="w-4 h-4" />
                    <span>{t('domains.clear')}</span>
                  </button>
                )}

                <div className="ml-auto text-sm text-slate-500 font-medium">
                  {t('domains.total')} <span className="text-slate-900">{filteredDomains.length}</span> {t('domains.domains')}
                </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {domains.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Globe className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">{t('domains.empty')}</p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                {t('domains.add')}
              </Button>
            </CardContent>
          </Card>
        ) : filteredDomains.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Filter className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">{t('domains.noMatch')}</p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedRegistrar('');
                  setSelectedTld('');
                  setSearchQuery('');
                }}
              >
                {t('domains.clearFilter')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
                        <Star className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('domains.table.domain')}</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('domains.table.registrar')}</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('domains.table.price')}</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('domains.table.registrationDate')}</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('domains.table.expirationDate')}</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('domains.table.status')}</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('domains.table.autoRenew')}</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">{t('domains.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDomains.map((domain) => (
                      <tr key={domain.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleToggleFavorite(domain)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors duration-150"
                          >
                            <Star
                              className={`w-4 h-4 transition-all duration-200 ${
                                domain.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-slate-400'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{domain.domain_name}</div>
                          {domain.notes && (
                            <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">
                              {domain.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {domain.registrar || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                          {formatPrice(domain.price, domain.currency)}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(domain.registration_date)}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(domain.expiration_date)}
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(domain.status)}
                        </td>
                        <td className="px-5 py-4">
                          {domain.auto_renew ? (
                            <span className="text-xs text-emerald-600 font-medium">{t('domains.autoRenew.yes')}</span>
                          ) : (
                            <span className="text-xs text-slate-400">{t('domains.autoRenew.no')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(domain)}
                              className="p-1.5"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(domain.id)}
                              className="p-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Modal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          title={editingDomain ? t('domains.form.title') : t('domains.form.title')}
        >
          <AddDomainForm
            domain={editingDomain}
            onSaved={handleSaved}
            onCancel={handleCloseModal}
          />
        </Modal>

        <Modal
          isOpen={isBulkUploadModalOpen}
          onClose={() => {
            setIsBulkUploadModalOpen(false);
            setUploadType(null);
          }}
          title={t('domains.bulkUpload.title')}
        >
          <BulkUploadForm
            initialUploadType={uploadType}
            onSaved={() => {
              loadDomains();
              setIsBulkUploadModalOpen(false);
              setUploadType(null);
            }}
            onCancel={() => {
              setIsBulkUploadModalOpen(false);
              setUploadType(null);
            }}
          />
        </Modal>
      </div>
    </>
  );
}
