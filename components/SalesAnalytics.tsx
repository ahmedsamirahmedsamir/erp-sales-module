import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, DollarSign, ShoppingCart, Target, 
  Users, Calendar, BarChart3, PieChart 
} from 'lucide-react'
import { api, LoadingSpinner } from '@erp-modules/shared'

interface SalesAnalytics {
  total_revenue: number
  total_orders: number
  avg_order_value: number
  conversion_rate: number
  monthly_revenue: Array<{
    month: string
    revenue: number
    orders: number
  }>
  top_products: Array<{
    name: string
    revenue: number
    quantity: number
  }>
  sales_by_rep: Array<{
    name: string
    revenue: number
    order_count: number
  }>
}

export function SalesAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['sales-analytics'],
    queryFn: async () => {
      const response = await api.get<{ data: SalesAnalytics }>('/api/v1/sales/analytics')
      return response.data.data
    },
  })

  if (isLoading) {
    return <LoadingSpinner text="Loading analytics..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sales Analytics</h2>
        <p className="text-gray-600 mt-1">Performance metrics and insights</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-green-600">
                ${analytics?.total_revenue?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-blue-600">
                {analytics?.total_orders?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-semibold text-purple-600">
                ${analytics?.avg_order_value?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-semibold text-orange-600">
                {analytics?.conversion_rate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="h-64 flex items-end space-x-2">
            {analytics?.monthly_revenue?.slice(-12).map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-blue-500 rounded-t w-full mb-2"
                  style={{ 
                    height: `${(data.revenue / Math.max(...(analytics.monthly_revenue?.map(d => d.revenue) || [1]))) * 200}px` 
                  }}
                />
                <div className="text-xs text-gray-500">
                  {new Date(data.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                </div>
                <div className="text-xs text-gray-400">${(data.revenue / 1000).toFixed(0)}k</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {analytics?.top_products?.slice(0, 5).map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-3">#{index + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.quantity} units</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-green-600">
                  ${product.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

