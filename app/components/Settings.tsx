'use client';

import { Download, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardContent, CardHeader } from './Card';
import Button from './Button';
import { SEO } from './SEO';
import { getAllDomains, createDomainsBatch, getStatusFromExpirationDate } from '@/lib/api/domains';
import type { DomainInsert, Domain } from '@/types/database';

export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    try {
      const domains = await getAllDomains();
      const dataStr = JSON.stringify(domains, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `domains-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting domains:', error);
      alert('Failed to export domains');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        // 确保是数组格式
        const domainsArray = Array.isArray(importedData) ? importedData : [importedData];
        
        if (domainsArray.length === 0) {
          setImportMessage({ type: 'error', text: '导入文件为空' });
          setIsImporting(false);
          return;
        }

        // 转换数据格式，移除不需要的字段
        const domainsToImport: DomainInsert[] = domainsArray.map((domain: Domain | any) => {
          const domainInsert: DomainInsert = {
            domain_name: domain.domain_name?.trim().toLowerCase() || '',
            registrar: domain.registrar || '',
            registration_date: domain.registration_date || null,
            expiration_date: domain.expiration_date || null,
            notes: domain.notes || '',
            is_favorite: domain.is_favorite || false,
            auto_renew: domain.auto_renew || false,
            price: domain.price || null,
            currency: domain.currency || 'USD',
            status: domain.status || getStatusFromExpirationDate(domain.expiration_date || null),
          };
          return domainInsert;
        });

        // 验证必需字段
        const invalidDomains = domainsToImport.filter(d => !d.domain_name);
        if (invalidDomains.length > 0) {
          setImportMessage({ type: 'error', text: `有 ${invalidDomains.length} 个域名缺少域名名称` });
          setIsImporting(false);
          return;
        }

        // 批量导入
        const result = await createDomainsBatch(domainsToImport);
        const skippedCount = domainsToImport.length - result.length;

        if (skippedCount > 0) {
          setImportMessage({
            type: 'success',
            text: `成功导入 ${result.length} 个域名，${skippedCount} 个域名已存在`,
          });
        } else {
          setImportMessage({
            type: 'success',
            text: `成功导入 ${result.length} 个域名`,
          });
        }

        // 清空文件输入
        event.target.value = '';

        // 延迟刷新页面以显示成功消息
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } catch (error: any) {
        console.error('Error importing domains:', error);
        setImportMessage({
          type: 'error',
          text: error.message || '导入失败，请检查文件格式是否正确',
        });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <SEO title={t('settings.title')} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('settings.title')}</h1>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Data Management</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Export Domains</h3>
              <p className="text-sm text-slate-600 mb-3">
                Download all your domain data as a JSON file
              </p>
              <Button variant="secondary" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-900 mb-2">Import Domains</h3>
              <p className="text-sm text-slate-600 mb-3">
                Import domain data from a JSON file
              </p>
              {importMessage && (
                <div
                  className={`mb-3 p-3 rounded-lg text-sm ${
                    importMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {importMessage.text}
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  id="file-upload"
                  className="hidden"
                  disabled={isImporting}
                />
                <label htmlFor="file-upload">
                  <span
                    className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm ${
                      isImporting
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 cursor-pointer'
                    }`}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? '导入中...' : 'Import Data'}
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
