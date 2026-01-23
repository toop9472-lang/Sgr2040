import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const InvoicesPage = () => {
  const { isRTL } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total_revenue: 0, pending_amount: 0 });
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      
      const response = await fetch(`${API_URL}/api/invoices/admin/all${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      setInvoices(data.invoices || []);
      setStats({
        total_revenue: data.total_revenue || 0,
        pending_amount: data.pending_amount || 0
      });
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      paid: isRTL ? 'مدفوعة' : 'Paid',
      pending: isRTL ? 'معلقة' : 'Pending',
      cancelled: isRTL ? 'ملغية' : 'Cancelled',
      refunded: isRTL ? 'مستردة' : 'Refunded'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} data-testid="invoices-page">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{isRTL ? 'الفواتير' : 'Invoices'}</h2>
        
        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'paid', 'pending'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? (isRTL ? 'الكل' : 'All') :
               f === 'paid' ? (isRTL ? 'مدفوعة' : 'Paid') :
               (isRTL ? 'معلقة' : 'Pending')}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.total_revenue.toFixed(2)} ر.س</p>
              <p className="text-gray-500 text-sm">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.pending_amount.toFixed(2)} ر.س</p>
              <p className="text-gray-500 text-sm">{isRTL ? 'مبالغ معلقة' : 'Pending Amount'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'قائمة الفواتير' : 'Invoice List'}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{isRTL ? 'لا توجد فواتير' : 'No invoices found'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-2">{isRTL ? 'رقم الفاتورة' : 'Invoice #'}</th>
                    <th className="text-right py-3 px-2">{isRTL ? 'المعلن' : 'Advertiser'}</th>
                    <th className="text-right py-3 px-2">{isRTL ? 'الإعلان' : 'Ad'}</th>
                    <th className="text-right py-3 px-2">{isRTL ? 'المبلغ' : 'Amount'}</th>
                    <th className="text-right py-3 px-2">{isRTL ? 'الحالة' : 'Status'}</th>
                    <th className="text-right py-3 px-2">{isRTL ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 font-mono text-sm">{invoice.invoice_number}</td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{invoice.advertiser_name}</p>
                          <p className="text-xs text-gray-500">{invoice.advertiser_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 max-w-[150px] truncate">{invoice.ad_title}</td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-bold">{invoice.total?.toFixed(2)} ر.س</p>
                          <p className="text-xs text-gray-500">
                            {isRTL ? 'شامل الضريبة' : 'Inc. VAT'} ({invoice.tax_amount?.toFixed(2)})
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-2">{getStatusBadge(invoice.status)}</td>
                      <td className="py-3 px-2 text-sm text-gray-500">{formatDate(invoice.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesPage;
