import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Eye, Edit, Send, X } from 'lucide-react'
import { 
  api, DataTable, LoadingSpinner, StatusBadge, 
  ActionButtons, EmptyState 
} from '@erp-modules/shared'
import toast from 'react-hot-toast'

interface SalesQuote {
  id: string
  quote_number: string
  customer_id: string
  customer_name: string
  sales_rep_name: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  quote_date: string
  valid_until: string
  total_amount: number
  created_at: string
}

export function SalesQuoteList() {
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['sales-quotes', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const response = await api.get<{ data: SalesQuote[] }>(
        `/api/v1/sales/quotes?${params.toString()}`
      )
      return response.data.data
    },
  })

  const sendQuote = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/v1/sales/quotes/${id}/send`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotes'] })
      toast.success('Quote sent successfully')
    },
  })

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/sales/quotes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotes'] })
      toast.success('Quote deleted successfully')
    },
  })

  const columns = [
    {
      accessorKey: 'quote_number',
      header: 'Quote #',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <FileText className="h-4 w-4 text-blue-600 mr-2" />
          <span className="font-medium">{row.getValue('quote_number')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }: any) => (
        <span className="text-sm">{row.getValue('customer_name')}</span>
      ),
    },
    {
      accessorKey: 'sales_rep_name',
      header: 'Sales Rep',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">{row.getValue('sales_rep_name')}</span>
      ),
    },
    {
      accessorKey: 'quote_date',
      header: 'Quote Date',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {new Date(row.getValue('quote_date')).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'valid_until',
      header: 'Valid Until',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {new Date(row.getValue('valid_until')).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }: any) => (
        <span className="text-sm font-semibold text-gray-900">
          ${row.getValue('total_amount').toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <ActionButtons
            onView={() => console.log('View', row.original)}
            onEdit={() => console.log('Edit', row.original)}
            onDelete={() => deleteQuote.mutate(row.original.id)}
          />
          {row.original.status === 'draft' && (
            <button
              onClick={() => sendQuote.mutate(row.original.id)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Send Quote"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingSpinner text="Loading quotes..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Quotes</h2>
          <p className="text-gray-600 mt-1">Manage customer quotations</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Quote
        </button>
      </div>

      {/* Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
        <option value="expired">Expired</option>
      </select>

      {quotes && quotes.length > 0 ? (
        <DataTable data={quotes} columns={columns} />
      ) : (
        <EmptyState
          icon={FileText}
          title="No quotes found"
          description="Create your first sales quote"
        />
      )}
    </div>
  )
}

