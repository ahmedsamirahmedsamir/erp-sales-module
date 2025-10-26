import React from 'react'
import { TrendingUp, Target } from 'lucide-react'

interface OverviewTabProps {
  analytics?: {
    total_opportunities: number
    open_opportunities: number
    total_pipeline_value: number
    conversion_rate: number
  }
}

export function OverviewTab({ analytics }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Sales Pipeline
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Open Opportunities</div>
            <div className="text-2xl font-bold text-blue-600">{analytics?.open_opportunities || 0}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Pipeline Value</div>
            <div className="text-2xl font-bold text-green-600">${analytics?.total_pipeline_value?.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Performance Metrics
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Total Opportunities</span>
            <span className="text-lg font-semibold">{analytics?.total_opportunities || 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Conversion Rate</span>
            <span className="text-lg font-semibold">{analytics?.conversion_rate?.toFixed(1) || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

