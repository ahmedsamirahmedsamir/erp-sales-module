import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Target, TrendingUp, Users, DollarSign } from 'lucide-react'
import { api, LoadingSpinner } from '@erp-modules/shared'

interface PipelineStage {
  stage: string
  deal_count: number
  total_value: number
  avg_deal_size: number
  conversion_rate: number
}

interface Deal {
  id: string
  name: string
  customer_name: string
  value: number
  stage: string
  probability: number
  expected_close_date: string
}

export function SalesPipeline() {
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['sales-pipeline'],
    queryFn: async () => {
      const response = await api.get<{ data: { stages: PipelineStage[], deals: Deal[] } }>(
        '/api/v1/sales/pipeline'
      )
      return response.data.data
    },
  })

  if (isLoading) {
    return <LoadingSpinner text="Loading pipeline..." />
  }

  const totalPipelineValue = pipeline?.stages?.reduce((sum, s) => sum + s.total_value, 0) || 0
  const totalDeals = pipeline?.stages?.reduce((sum, s) => sum + s.deal_count, 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sales Pipeline</h2>
        <p className="text-gray-600 mt-1">Track deals through your sales process</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Deals</p>
              <p className="text-2xl font-semibold text-purple-600">{totalDeals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pipeline Value</p>
              <p className="text-2xl font-semibold text-green-600">
                ${totalPipelineValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Deal Size</p>
              <p className="text-2xl font-semibold text-blue-600">
                ${totalDeals > 0 ? (totalPipelineValue / totalDeals).toLocaleString() : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Stages</h3>
        <div className="space-y-4">
          {pipeline?.stages?.map((stage, index) => (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-purple-500' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{stage.stage}</div>
                    <div className="text-sm text-gray-500">
                      {stage.deal_count} deals • ${stage.total_value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {stage.conversion_rate}%
                  </div>
                  <div className="text-xs text-gray-500">conversion</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${stage.conversion_rate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Deals</h3>
        <div className="space-y-3">
          {pipeline?.deals?.slice(0, 10).map((deal) => (
            <div key={deal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300">
              <div>
                <div className="font-medium text-gray-900">{deal.name}</div>
                <div className="text-sm text-gray-500">{deal.customer_name}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">${deal.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{deal.probability}% probability</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

