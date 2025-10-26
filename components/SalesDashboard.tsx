import React from 'react'
import { TrendingUp, Target, FileText, DollarSign, BarChart3, Briefcase, Package } from 'lucide-react'
import { ModuleDashboard, useModuleQuery } from '@erp-modules/shared'
import { OverviewTab } from './tabs/OverviewTab'
import { OpportunitiesTab } from './tabs/OpportunitiesTab'
import { QuotesTab } from './tabs/QuotesTab'
import { OrdersTab } from './tabs/OrdersTab'
import { InvoicesTab } from './tabs/InvoicesTab'
import { ReportsTab } from './tabs/ReportsTab'

interface SalesAnalytics {
  total_opportunities: number
  open_opportunities: number
  total_pipeline_value: number
  conversion_rate: number
}

export default function SalesDashboard() {
  const { data: analytics } = useModuleQuery<{ data: SalesAnalytics }>(
    ['sales-analytics'],
    '/api/v1/sales/analytics'
  )

  const analyticsData = analytics?.data

  return (
    <ModuleDashboard
      title="Sales Management"
      icon={TrendingUp}
      description="Sales pipeline, opportunities, quotes, and order management"
      kpis={[
        {
          id: 'opportunities',
          label: 'Open Opportunities',
          value: analyticsData?.open_opportunities || 0,
          icon: Target,
          color: 'blue',
        },
        {
          id: 'pipeline',
          label: 'Pipeline Value',
          value: `$${analyticsData?.total_pipeline_value?.toLocaleString() || 0}`,
          icon: DollarSign,
          color: 'green',
        },
        {
          id: 'total-opps',
          label: 'Total Opportunities',
          value: analyticsData?.total_opportunities || 0,
          icon: Briefcase,
          color: 'purple',
        },
        {
          id: 'conversion',
          label: 'Conversion Rate',
          value: `${analyticsData?.conversion_rate?.toFixed(1) || 0}%`,
          icon: TrendingUp,
          color: 'orange',
        },
      ]}
      actions={[
        {
          id: 'create-opportunity',
          label: 'New Opportunity',
          icon: Target,
          onClick: () => {},
          variant: 'primary',
        },
      ]}
      tabs={[
        {
          id: 'overview',
          label: 'Overview',
          icon: BarChart3,
          content: <OverviewTab analytics={analyticsData} />,
        },
        {
          id: 'opportunities',
          label: 'Opportunities',
          icon: Target,
          content: <OpportunitiesTab />,
        },
        {
          id: 'quotes',
          label: 'Quotes',
          icon: FileText,
          content: <QuotesTab />,
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: Package,
          content: <OrdersTab />,
        },
        {
          id: 'invoices',
          label: 'Invoices',
          icon: FileText,
          content: <InvoicesTab />,
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
          content: <ReportsTab />,
        },
      ]}
      defaultTab="overview"
    />
  )
}
