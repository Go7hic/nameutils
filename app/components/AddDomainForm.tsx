'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { createDomain, updateDomain, getStatusFromExpirationDate } from '@/lib/api/domains';
import type { Domain, DomainInsert } from '@/types/database';

interface AddDomainFormProps {
  domain?: Domain | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function AddDomainForm({ domain, onSaved, onCancel }: AddDomainFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    domain_name: '',
    registrar: '',
    registration_date: '',
    expiration_date: '',
    notes: '',
    auto_renew: false,
    price: '',
    currency: 'USD',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (domain) {
      setFormData({
        domain_name: domain.domain_name,
        registrar: domain.registrar,
        registration_date: domain.registration_date || '',
        expiration_date: domain.expiration_date || '',
        notes: domain.notes,
        auto_renew: domain.auto_renew,
        price: domain.price?.toString() || '',
        currency: domain.currency || 'USD',
      });
    }
  }, [domain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.domain_name.trim()) {
      setError(t('domains.form.required'));
      return;
    }

    try {
      setIsSubmitting(true);

      const status = getStatusFromExpirationDate(formData.expiration_date || null);

      const domainData: DomainInsert = {
        domain_name: formData.domain_name.trim().toLowerCase(),
        registrar: formData.registrar.trim(),
        registration_date: formData.registration_date || null,
        expiration_date: formData.expiration_date || null,
        notes: formData.notes.trim(),
        auto_renew: formData.auto_renew,
        price: formData.price ? parseFloat(formData.price) : null,
        currency: formData.currency || null,
        status,
      };

      if (domain) {
        await updateDomain(domain.id, domainData);
      } else {
        await createDomain(domainData);
      }

      onSaved();
    } catch (err: any) {
      console.error('Error saving domain:', err);
      // 处理特定错误消息的国际化
      let errorMessage = err.message || t('domains.form.saveError');
      if (errorMessage.includes('你已经添加过了')) {
        const domainMatch = errorMessage.match(/域名\s+([^\s]+)\s+你已经添加过了/);
        if (domainMatch) {
          errorMessage = t('domains.errors.domainAlreadyAdded', { domain: domainMatch[1] });
        } else {
          errorMessage = t('domains.bulkUpload.domainAlreadyAdded');
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50/80 border border-red-200/60 rounded-xl text-sm text-red-700 backdrop-blur-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="domain_name" className="block text-sm font-semibold text-slate-700 mb-2">
          {t('domains.form.domainName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="domain_name"
          value={formData.domain_name}
          onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
          placeholder="example.com"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all duration-200 bg-white/80"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="registrar" className="block text-sm font-semibold text-slate-700 mb-2">
          {t('domains.form.registrar')}
        </label>
        <input
          type="text"
          id="registrar"
          value={formData.registrar}
          onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
          placeholder="Namecheap, GoDaddy, etc."
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all duration-200 bg-white/80"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="registration_date" className="block text-sm font-semibold text-slate-700 mb-2">
            {t('domains.form.registrationDate')}
          </label>
          <input
            type="date"
            id="registration_date"
            value={formData.registration_date}
            onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all duration-200 bg-white/80"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="expiration_date" className="block text-sm font-semibold text-slate-700 mb-2">
            {t('domains.form.expirationDate')}
          </label>
          <input
            type="date"
            id="expiration_date"
            value={formData.expiration_date}
            onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all duration-200 bg-white/80"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 mb-2">
          {t('domains.form.notes')}
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any notes about this domain..."
          rows={3}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all duration-200 bg-white/80 resize-none"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-slate-700 mb-2">
            {t('domains.form.price')}
          </label>
          <input
            type="number"
            id="price"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all duration-200 bg-white/80"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-semibold text-slate-700 mb-2">
            {t('domains.form.currency')}
          </label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all duration-200 bg-white/80"
            disabled={isSubmitting}
          >
            <option value="USD">USD ($)</option>
            <option value="CNY">CNY (¥)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="auto_renew"
          checked={formData.auto_renew}
          onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          disabled={isSubmitting}
        />
        <label htmlFor="auto_renew" className="ml-2 text-sm text-slate-700">
          {t('domains.form.autoRenew')}
        </label>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {t('domains.form.cancel')}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {domain ? t('domains.form.update') : t('domains.form.submit')}
        </Button>
      </div>
    </form>
  );
}
