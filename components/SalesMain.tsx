import React from 'react'
import { 
  BarChart3, ShoppingCart, FileText, Receipt, 
  TrendingUp, Target 
} from 'lucide-react'
import { TabContainer } from '@erp-modules/shared'
import { SalesDashboard } from './SalesDashboard'
import { SalesOrderList } from './SalesOrderList'
import { SalesQuoteList } from './SalesQuoteList'
import { SalesInvoiceList } from './SalesInvoiceList'
import { SalesAnalytics } from './SalesAnalytics'
import { SalesPipeline } from './SalesPipeline'

export function SalesMain() {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      content: <SalesDashboard />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      content: <SalesOrderList />,
    },
    {
      id: 'quotes',
      label: 'Quotes',
      icon: FileText,
      content: <SalesQuoteList />,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: Receipt,
      content: <SalesInvoiceList />,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      content: <SalesAnalytics />,
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: Target,
      content: <SalesPipeline />,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <TabContainer tabs={tabs} defaultTab="dashboard" urlParam="tab" />
      </div>
    </div>
  )
}

export default SalesMain

