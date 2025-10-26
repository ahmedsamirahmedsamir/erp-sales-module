import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Receipt, Download, DollarSign } from 'lucide-react'
import { 
  api, DataTable, LoadingSpinner, StatusBadge, 
  ActionButtons, EmptyState 
} from '@erp-modules/shared'
import toast from 'react-hot-toast'

interface SalesInvoice {
  id: string
  invoice_number: string
  customer_name: string
  invoice_date: string
  due_date: string
  total_amount: number
  paid_amount: number
  balance: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  payment_status: 'unpaid' | 'partial' | 'paid'
}

export function SalesInvoiceList() {
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['sales-invoices', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const response = await api.get<{ data: SalesInvoice[] }>(
        `/api/v1/sales/invoices?${params.toString()}`
      )
      return response.data.data
    },
  })

  const columns = [
    {
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Receipt className="h-4 w-4 text-green-600 mr-2" />
          <span className="font-medium">{row.getValue('invoice_number')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
    },
    {
      accessorKey: 'invoice_date',
      header: 'Invoice Date',
      cell: ({ row }: any) => (
        <span className="text-sm">
          {new Date(row.getValue('invoice_date')).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }: any) => (
        <span className="text-sm">
          {new Date(row.getValue('due_date')).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ row }: any) => (
        <span className="font-semibold">${row.getValue('total_amount').toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }: any) => {
        const balance = row.getValue('balance')
        return (
          <span className={balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
            ${balance.toLocaleString()}
          </span>
        )
      },
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment',
      cell: ({ row }: any) => <StatusBadge status={row.getValue('payment_status')} />,
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
          />
          <button
            className="p-1 text-green-600 hover:text-green-800"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingSpinner text="Loading invoices..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Invoices</h2>
          <p className="text-gray-600 mt-1">Manage customer invoices</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </button>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
      </select>

      {invoices && invoices.length > 0 ? (
        <DataTable data={invoices} columns={columns} />
      ) : (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="Create your first invoice"
        />
      )}
    </div>
  )
}

