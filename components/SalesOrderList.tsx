import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, ShoppingCart, Edit, Trash2, Eye, FileText } from 'lucide-react'
import { DataTable, api } from '@erp-modules/shared'

interface SalesOrder {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  order_date: string
  status: string
  total_amount: number
  tax_amount: number
  discount_amount: number
  payment_terms: string
  notes: string
  created_at: string
  updated_at: string
}

interface SalesOrderListResponse {
  success: boolean
  data: {
    orders: SalesOrder[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export function SalesOrderList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  // Fetch sales orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['sales-orders', currentPage, searchQuery, selectedStatus, selectedCustomer],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })
      if (searchQuery) params.append('search', searchQuery)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedCustomer) params.append('customer_id', selectedCustomer)
      
      const response = await api.get(`/sales/orders?${params}`)
      return response.data as SalesOrderListResponse
    },
  })

  // Delete order mutation
  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      await api.delete(`/sales/orders/${orderId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    },
  })

  const handleDelete = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      deleteOrder.mutate(orderId)
    }
  }

  const columns = [
    {
      accessorKey: 'order_number',
      header: 'Order Number',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <ShoppingCart className="h-4 w-4 text-blue-600 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{row.getValue('order_number')}</div>
            <div className="text-sm text-gray-500">{row.getValue('customer_name')}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'order_date',
      header: 'Order Date',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-900">
          {new Date(row.getValue('order_date')).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status')
        const statusColors = {
          draft: 'bg-gray-100 text-gray-800',
          pending: 'bg-yellow-100 text-yellow-800',
          confirmed: 'bg-blue-100 text-blue-800',
          shipped: 'bg-purple-100 text-purple-800',
          delivered: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
        }
        return (
          <span className={`px-2 py-1 text-xs rounded ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
        )
      },
    },
    {
      accessorKey: 'total_amount',
      header: 'Total Amount',
      cell: ({ row }: any) => (
        <span className="font-medium text-green-600">
          ${row.getValue('total_amount').toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'payment_terms',
      header: 'Payment Terms',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-500">
          {row.getValue('payment_terms').replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-500">
          {new Date(row.getValue('created_at')).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {/* Navigate to order detail */}}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {/* Navigate to edit order */}}
            className="p-1 text-green-600 hover:text-green-800"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {/* Generate invoice */}}
            className="p-1 text-purple-600 hover:text-purple-800"
            title="Generate Invoice"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const orders = ordersData?.data.orders || []
  const pagination = ordersData?.data.pagination

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ShoppingCart className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
        </div>
        <button
          onClick={() => {/* Navigate to new order */}}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Customer Filter */}
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Customers</option>
            {/* Customer options would be populated from API */}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedStatus('')
              setSelectedCustomer('')
            }}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={orders}
          columns={columns}
          isLoading={isLoading}
        />
        
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
