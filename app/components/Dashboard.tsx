'use client';

import { useEffect, useState } from 'react';
import { Globe, AlertCircle, Star, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card, { CardContent, CardHeader } from './Card';
import { SEO } from './SEO';
import { getAllDomains } from '@/lib/api/domains';
import type { Domain } from '@/types/database';

export default function Dashboard() {
  const { t } = useTranslation();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const data = await getAllDomains();
      setDomains(data);
    } catch (error) {
      console.error('Error loading domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: domains.length,
    active: domains.filter(d => d.status === 'active').length,
    expiringSoon: domains.filter(d => d.status === 'expiring_soon').length,
    expired: domains.filter(d => d.status === 'expired').length,
    favorites: domains.filter(d => d.is_favorite).length,
  };

  const registrarCounts = domains.reduce((acc, domain) => {
    const registrar = domain.registrar || 'Unknown';
    acc[registrar] = (acc[registrar] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topRegistrars = Object.entries(registrarCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const recentDomains = domains
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const upcomingExpirations = domains
    .filter(d => d.expiration_date)
    .sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <SEO title={t('dashboard.title')} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('dashboard.stats.totalDomains')}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('domains.status.active')}</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('dashboard.stats.expiringDomains')}</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.expiringSoon}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Favorites</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.favorites}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Top Registrars</h2>
            </CardHeader>
            <CardContent>
              {topRegistrars.length > 0 ? (
                <div className="space-y-3">
                  {topRegistrars.map(([registrar, count]) => (
                    <div key={registrar} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{registrar}</span>
                      <div className="flex items-center">
                        <div className="w-32 h-2 bg-slate-200 rounded-full mr-3">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No domains yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Recent Additions</h2>
            </CardHeader>
            <CardContent>
              {recentDomains.length > 0 ? (
                <div className="space-y-3">
                  {recentDomains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{domain.domain_name}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(domain.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No domains yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {upcomingExpirations.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Upcoming Expirations</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingExpirations.map((domain) => {
                  const daysUntil = Math.ceil(
                    (new Date(domain.expiration_date!).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const isUrgent = daysUntil <= 30;

                  return (
                    <div key={domain.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{domain.domain_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${isUrgent ? 'text-orange-600' : 'text-slate-600'}`}>
                          {daysUntil > 0 ? `${daysUntil} days` : 'Expired'}
                        </span>
                        {isUrgent && <AlertCircle className="w-4 h-4 text-orange-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
