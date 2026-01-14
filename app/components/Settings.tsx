'use client';

import { Download, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card, { CardContent, CardHeader } from './Card';
import Button from './Button';
import { SEO } from './SEO';
import { getAllDomains } from '@/lib/api/domains';

export default function Settings() {
  const { t } = useTranslation();

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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const domains = JSON.parse(content);
        console.log('Imported domains:', domains);
        alert(`Successfully imported ${domains.length} domains. (Import functionality would be implemented here)`);
      } catch (error) {
        console.error('Error importing domains:', error);
        alert('Failed to import domains. Please check the file format.');
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
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  id="file-upload"
                  className="hidden"
                />
                <label htmlFor="file-upload">
                  <span className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
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
