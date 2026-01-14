'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, Image, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from './Button';
import { createDomainsBatch, getStatusFromExpirationDate } from '@/lib/api/domains';
import type { DomainInsert } from '@/types/database';

interface ParsedDomain {
  domain_name: string;
  registrar?: string;
  registration_date?: string | null;
  expiration_date?: string | null;
  notes?: string;
  auto_renew: boolean;
  status?: string;
  price?: number | null;
  currency?: string | null;
}

interface BulkUploadFormProps {
  onSaved: () => void;
  onCancel: () => void;
  initialUploadType?: 'csv' | 'image' | null;
}

export default function BulkUploadForm({ onSaved, onCancel, initialUploadType = null }: BulkUploadFormProps) {
  const { t } = useTranslation();
  const [uploadType, setUploadType] = useState<'csv' | 'image' | null>(initialUploadType);
  const [parsedDomains, setParsedDomains] = useState<ParsedDomain[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUploadType) {
      setUploadType(initialUploadType);
    }
  }, [initialUploadType]);

  // 解析日期格式: "2027/07/25 00:00 PST" -> "2027-07-25"
  const parseDate = (dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    
    // 处理 "2027/07/25 00:00 PST" 格式
    const match = dateStr.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${year}-${month}-${day}`;
    }
    
    // 尝试直接解析ISO格式
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // ignore
    }
    
    return null;
  };

  // 解析CSV文件
  const parseCSV = async (file: File): Promise<ParsedDomain[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV文件至少需要包含标题行和一行数据'));
            return;
          }

          // 解析标题行
          const headers = lines[0].split(',').map(h => h.trim());
          const domainIndex = headers.findIndex(h => h.toLowerCase().includes('domain'));
          const renewalIndex = headers.findIndex(h => h.toLowerCase().includes('renewal'));
          const expirationIndex = headers.findIndex(h => h.toLowerCase().includes('expiration date') && !h.toLowerCase().includes('timestamp'));
          const registrationIndex = headers.findIndex(h => h.toLowerCase().includes('registration date') && !h.toLowerCase().includes('timestamp'));
          const notesIndex = headers.findIndex(h => h.toLowerCase().includes('note'));
          const emailIndex = headers.findIndex(h => h.toLowerCase().includes('admin email'));

          if (domainIndex === -1) {
            reject(new Error(t('domains.bulkUpload.csvNoDomainColumn')));
            return;
          }

          const domains: ParsedDomain[] = [];

          // 解析数据行
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // 处理CSV中的引号和逗号
            const values: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());

            const domainName = values[domainIndex]?.trim();
            if (!domainName || domainName === '') continue;

            const renewalStatus = values[renewalIndex]?.toLowerCase() || '';
            const autoRenew = renewalStatus.includes('auto');

            const expirationDate = expirationIndex >= 0 ? parseDate(values[expirationIndex] || '') : null;
            const registrationDate = registrationIndex >= 0 ? parseDate(values[registrationIndex] || '') : null;

            // 组合notes
            let notes = '';
            if (notesIndex >= 0 && values[notesIndex]) {
              notes = values[notesIndex].trim();
            }
            if (emailIndex >= 0 && values[emailIndex] && values[emailIndex] !== 'privacy@dynadot.com') {
              if (notes) notes += ' | ';
              notes += `Email: ${values[emailIndex]}`;
            }

            const status = getStatusFromExpirationDate(expirationDate);

            domains.push({
              domain_name: domainName.toLowerCase(),
              registrar: 'Dynadot', // 可以根据需要从CSV中提取
              registration_date: registrationDate,
              expiration_date: expirationDate,
              notes: notes || '',
              auto_renew: autoRenew,
              status,
              price: null,
              currency: null,
            });
          }

          if (domains.length === 0) {
            reject(new Error(t('domains.bulkUpload.csvNoValidDomains')));
            return;
          }

          resolve(domains);
        } catch (err: any) {
          reject(new Error(`${t('domains.bulkUpload.csvParseError')}: ${err.message}`));
        }
      };

      reader.onerror = () => reject(new Error(t('domains.bulkUpload.fileReadError')));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // 解析图片（OCR）
  const parseImage = async (file: File): Promise<ParsedDomain[]> => {
    setIsProcessing(true);
    setError('');

    try {
      // 动态导入Tesseract（仅在需要时加载，减少初始包大小）
      const Tesseract = (await import('tesseract.js')).default;
      
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // 可以显示进度
          }
        },
      });

      // 解析OCR文本，尝试提取域名信息
      const lines = text.split('\n').filter(line => line.trim());
      const domains: ParsedDomain[] = [];

      for (const line of lines) {
        // 尝试匹配域名格式
        const domainMatch = line.match(/([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}/i);
        if (domainMatch) {
          const domainName = domainMatch[0].toLowerCase();
          
          // 尝试提取日期
          const dateMatch = line.match(/(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
          const expirationDate = dateMatch ? parseDate(dateMatch[1]) : null;

          domains.push({
            domain_name: domainName,
            registrar: '',
            expiration_date: expirationDate,
            notes: line.trim(),
            auto_renew: false,
            status: getStatusFromExpirationDate(expirationDate),
            price: null,
            currency: null,
          });
        }
      }

      if (domains.length === 0) {
        throw new Error(t('domains.bulkUpload.ocrNoDomains'));
      }

      return domains;
    } catch (err: any) {
      throw new Error(`${t('domains.bulkUpload.ocrError')}: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setParsedDomains([]);
    setIsProcessing(true);

    try {
      let domains: ParsedDomain[] = [];

      if (uploadType === 'csv') {
        if (!file.name.endsWith('.csv')) {
          throw new Error(t('domains.bulkUpload.csvFormat'));
        }
        domains = await parseCSV(file);
      } else if (uploadType === 'image') {
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!imageTypes.includes(file.type)) {
          throw new Error(t('domains.bulkUpload.imageError'));
        }
        domains = await parseImage(file);
      }

      setParsedDomains(domains);
      setSuccess(`${t('domains.bulkUpload.parseSuccess')} ${domains.length} ${t('domains.domains')}`);
    } catch (err: any) {
      setError(err.message || t('domains.bulkUpload.fileProcessError'));
      setParsedDomains([]);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveDomain = (index: number) => {
    setParsedDomains(parsedDomains.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (parsedDomains.length === 0) {
      setError(t('domains.bulkUpload.noDomains'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const domainData: DomainInsert[] = parsedDomains.map(d => ({
        domain_name: d.domain_name,
        registrar: d.registrar || '',
        registration_date: d.registration_date || null,
        expiration_date: d.expiration_date || null,
        notes: d.notes || '',
        auto_renew: d.auto_renew,
        price: d.price || null,
        currency: d.currency || null,
        status: d.status || 'active',
      }));

      const result = await createDomainsBatch(domainData);
      const skippedCount = parsedDomains.length - result.length;
      
      if (skippedCount > 0) {
        setSuccess(`${t('domains.bulkUpload.addSuccess')} ${result.length} ${t('domains.domains')}，${skippedCount} ${t('domains.bulkUpload.domainsAlreadyAdded')}`);
      } else {
        setSuccess(`${t('domains.bulkUpload.addSuccess')} ${result.length} ${t('domains.domains')}`);
      }
      
      setTimeout(() => {
        onSaved();
      }, 1000);
    } catch (err: any) {
      console.error('Error adding domains:', err);
      // 处理特定错误消息的国际化
      let errorMessage = err.message || t('domains.bulkUpload.addError');
      if (errorMessage.includes('所有域名你都已经添加过了')) {
        errorMessage = t('domains.bulkUpload.allAlreadyAdded');
      } else if (errorMessage.includes('你已经添加过了')) {
        errorMessage = t('domains.bulkUpload.domainAlreadyAdded');
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          {success}
        </div>
      )}

      {!uploadType ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{t('domains.bulkUpload.selectMethod')}</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUploadType('csv')}
              className="p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-900">{t('domains.bulkUpload.uploadCsv')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('domains.bulkUpload.csvDescription')}</p>
            </button>
            <button
              type="button"
              onClick={() => setUploadType('image')}
              className="p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <Image className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-900">{t('domains.bulkUpload.uploadImage')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('domains.bulkUpload.imageDescription')}</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {uploadType === 'csv' ? t('domains.bulkUpload.currentType') : t('domains.bulkUpload.currentTypeImage')}
            </p>
            <button
              type="button"
              onClick={() => {
                setUploadType(null);
                setParsedDomains([]);
                setError('');
                setSuccess('');
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              {t('domains.bulkUpload.reSelect')}
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept={uploadType === 'csv' ? '.csv' : 'image/*'}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 mb-1">
                {isProcessing ? t('domains.bulkUpload.processing') : t('domains.bulkUpload.selectFile')}
              </p>
              <p className="text-xs text-slate-500">
                {uploadType === 'csv' ? t('domains.bulkUpload.csvFormat') : t('domains.bulkUpload.imageFormat')}
              </p>
            </label>
          </div>
        </div>
      )}

      {parsedDomains.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {t('domains.bulkUpload.parseResult')} ({parsedDomains.length} {t('domains.domains')})
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setParsedDomains([])}
            >
              {t('domains.bulkUpload.clear')}
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">{t('domains.table.domain')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">{t('domains.table.registrar')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">{t('domains.table.price')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">{t('domains.table.expirationDate')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">{t('domains.table.autoRenew')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">{t('domains.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parsedDomains.map((domain, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">{domain.domain_name}</td>
                    <td className="px-4 py-2 text-slate-600">{domain.registrar || '-'}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {domain.price ? `${domain.currency || 'USD'} ${domain.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {domain.expiration_date || '-'}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {domain.auto_renew ? t('domains.autoRenew.yes') : t('domains.autoRenew.no')}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              {t('domains.bulkUpload.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={parsedDomains.length === 0}
            >
              {t('domains.bulkUpload.confirmAdd')} {parsedDomains.length} {t('domains.domains')}
            </Button>
          </div>
        </div>
      )}

      {parsedDomains.length === 0 && uploadType && !isProcessing && (
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('domains.bulkUpload.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
}
