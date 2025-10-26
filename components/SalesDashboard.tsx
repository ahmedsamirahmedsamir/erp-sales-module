import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Search, Filter, ShoppingCart, Edit, Trash2, Eye, BarChart3, 
  TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle, 
  Clock, Download, Upload, Settings, Zap, Bell, Globe, 
  FileText, PieChart, LineChart, Activity, Target, 
  RefreshCw, Play, Pause, MoreHorizontal, Star, DollarSign, X,
  Users, Phone, Mail, MapPin, CreditCard, Receipt,
  Send, MessageSquare, Calendar as CalendarIcon, Clock as ClockIcon,
  ArrowUpRight, ArrowDownRight, ArrowRight, ArrowLeft,
  Calculator, Percent, Hash, Tag, Barcode, ScanLine,
  Database, Cloud, Wifi, WifiOff, Signal, Battery,
  Thermometer, Droplets, Sun, Moon, Wind, Snowflake,
  UserCheck, UserX, UserPlus, UserMinus, Award, Gift,
  Package, Truck, Plane, Ship, Building, Home,
  Briefcase, Handshake, Clipboard, CheckSquare, Square,
  FileSpreadsheet, FileImage, FileVideo, FileAudio,
  Smartphone, Monitor, Tablet, Laptop, Headphones,
  Camera, Mic, Speaker, Printer, Scanner, Fax
} from 'lucide-react'
import { DataTable } from '../../components/table/DataTable'
import { api } from '../../lib/api'

interface SalesOrder {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  sales_rep_id: string
  sales_rep_name: string
  status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  order_date: string
  required_date: string
  shipped_date?: string
  delivery_date?: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  shipping_amount: number
  total_amount: number
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue'
  payment_terms: string
  shipping_address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  billing_address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  notes: string
  internal_notes: string
  tags: string[]
  source: 'website' | 'phone' | 'email' | 'walk-in' | 'referral'
  campaign_id?: string
  created_at: string
  updated_at: string
}

interface SalesQuote {
  id: string
  quote_number: string
  customer_id: string
  customer_name: string
  sales_rep_id: string
  sales_rep_name: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  valid_until: string
  quote_date: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  probability: number
  expected_close_date: string
  notes: string
  terms_conditions: string
  created_at: string
  updated_at: string
}

interface SalesInvoice {
  id: string
  invoice_number: string
  customer_id: string
  customer_name: string
  order_id?: string
  order_number?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  invoice_date: string
  due_date: string
  paid_date?: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  payment_terms: string
  notes: string
  created_at: string
  updated_at: string
}

interface SalesPayment {
  id: string
  payment_number: string
  customer_id: string
  customer_name: string
  invoice_id: string
  invoice_number: string
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe'
  amount: number
  payment_date: string
  reference_number: string
  notes: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
  updated_at: string
}

interface SalesReturn {
  id: string
  return_number: string
  customer_id: string
  customer_name: string
  order_id: string
  order_number: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'refunded'
  return_date: string
  processed_date?: string
  refund_amount: number
  refund_method: string
  notes: string
  created_at: string
  updated_at: string
}

interface SalesRep {
  id: string
  name: string
  email: string
  phone: string
  territory: string
  commission_rate: number
  quota: number
  current_sales: number
  status: 'active' | 'inactive'
  hire_date: string
  created_at: string
  updated_at: string
}

interface SalesTerritory {
  id: string
  name: string
  description: string
  manager_id: string
  manager_name: string
  region: string
  zip_codes: string[]
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

interface PriceList {
  id: string
  name: string
  description: string
  valid_from: string
  valid_to: string
  currency: string
  status: 'active' | 'inactive'
  customer_segments: string[]
  products_count: number
  created_at: string
  updated_at: string
}

interface SalesAnalytics {
  total_orders: number
  total_quotes: number
  total_invoices: number
  total_revenue: number
  total_payments: number
  conversion_rate: number
  average_order_value: number
  customer_count: number
  repeat_customer_rate: number
  monthly_trends: Array<{
    month: string
    orders: number
    revenue: number
    quotes: number
    invoices: number
  }>
  sales_rep_performance: Array<{
    rep_id: string
    rep_name: string
    orders_count: number
    revenue: number
    quota_achievement: number
    commission_earned: number
  }>
  product_performance: Array<{
    product_id: string
    product_name: string
    quantity_sold: number
    revenue: number
    profit_margin: number
  }>
  customer_segments: Array<{
    segment: string
    customer_count: number
    total_revenue: number
    average_order_value: number
  }>
}

export function AdvancedSalesManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedRep, setSelectedRep] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState('')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  // Fetch sales analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['sales-analytics'],
    queryFn: async () => {
      const response = await api.get('/sales/analytics')
      return response.data.data as SalesAnalytics
    },
  })

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['sales-orders', currentPage, searchQuery, selectedStatus, selectedRep],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })
      if (searchQuery) params.append('search', searchQuery)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedRep) params.append('sales_rep_id', selectedRep)
      
      const response = await api.get(`/sales/orders?${params}`)
      return response.data
    },
  })

  // Fetch quotes
  const { data: quotesData } = useQuery({
    queryKey: ['sales-quotes'],
    queryFn: async () => {
      const response = await api.get('/sales/quotes')
      return response.data.data as SalesQuote[]
    },
  })

  // Fetch invoices
  const { data: invoicesData } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: async () => {
      const response = await api.get('/sales/invoices')
      return response.data.data as SalesInvoice[]
    },
  })

  // Fetch payments
  const { data: paymentsData } = useQuery({
    queryKey: ['sales-payments'],
    queryFn: async () => {
      const response = await api.get('/sales/payments')
      return response.data.data as SalesPayment[]
    },
  })

  // Fetch returns
  const { data: returnsData } = useQuery({
    queryKey: ['sales-returns'],
    queryFn: async () => {
      const response = await api.get('/sales/returns')
      return response.data.data as SalesReturn[]
    },
  })

  // Fetch sales reps
  const { data: salesRepsData } = useQuery({
    queryKey: ['sales-reps'],
    queryFn: async () => {
      const response = await api.get('/sales/representatives')
      return response.data.data as SalesRep[]
    },
  })

  // Fetch territories
  const { data: territoriesData } = useQuery({
    queryKey: ['sales-territories'],
    queryFn: async () => {
      const response = await api.get('/sales/territories')
      return response.data.data as SalesTerritory[]
    },
  })

  // Fetch price lists
  const { data: priceListsData } = useQuery({
    queryKey: ['price-lists'],
    queryFn: async () => {
      const response = await api.get('/sales/price-lists')
      return response.data.data as PriceList[]
    },
  })

  // Create order mutation
  const createOrder = useMutation({
    mutationFn: async (orderData: Partial<SalesOrder>) => {
      const response = await api.post('/sales/orders', orderData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      setShowOrderForm(false)
    },
  })

  // Create quote mutation
  const createQuote = useMutation({
    mutationFn: async (quoteData: Partial<SalesQuote>) => {
      const response = await api.post('/sales/quotes', quoteData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotes'] })
      setShowQuoteForm(false)
    },
  })

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (invoiceData: Partial<SalesInvoice>) => {
      const response = await api.post('/sales/invoices', invoiceData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
      setShowInvoiceForm(false)
    },
  })

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.put(`/sales/orders/${id}/status`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    },
  })

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'sent': 'bg-blue-100 text-blue-800',
      'viewed': 'bg-green-100 text-green-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'partial': 'bg-orange-100 text-orange-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const orders = ordersData?.data?.orders || []
  const quotes = quotesData || []
  const invoices = invoicesData || []
  const payments = paymentsData || []
  const returns = returnsData || []
  const salesReps = salesRepsData || []
  const territories = territoriesData || []
  const priceLists = priceListsData || []
  const analytics = analyticsData

  const orderColumns = [
    {
      accessorKey: 'order_number',
      header: 'Order #',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <ShoppingCart className="h-4 w-4 text-blue-600 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{row.getValue('order_number')}</div>
            <div className="text-sm text-gray-500">{row.original.customer_name}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{row.getValue('customer_name')}</div>
            <div className="text-sm text-gray-500">{row.original.customer_email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'sales_rep_name',
      header: 'Sales Rep',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-700">{row.getValue('sales_rep_name')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status')
        return (
          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }: any) => {
        const priority = row.getValue('priority')
        return (
          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(priority)}`}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
        )
      },
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ row }: any) => (
        <span className="font-medium text-green-600">
          ${row.getValue('total_amount')?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment',
      cell: ({ row }: any) => {
        const status = row.getValue('payment_status')
        return (
          <span className={`px-2 py-1 text-xs rounded ${getPaymentStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
    },
    {
      accessorKey: 'order_date',
      header: 'Order Date',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-500">
          {new Date(row.getValue('order_date')).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedOrder(row.original)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedOrder(row.original)}
            className="p-1 text-green-600 hover:text-green-800"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-600 hover:text-gray-800">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ShoppingCart className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Advanced Sales Management</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowQuoteForm(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            New Quote
          </button>
          <button
            onClick={() => setShowInvoiceForm(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Receipt className="h-4 w-4 mr-2" />
            New Invoice
          </button>
          <button
            onClick={() => setShowOrderForm(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics?.total_orders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${analytics?.total_revenue?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics?.conversion_rate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics?.customer_count || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Quotes</p>
              <p className="text-2xl font-semibold text-gray-900">{quotes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Receipt className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Outstanding Invoices</p>
              <p className="text-2xl font-semibold text-gray-900">
                {invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {payments.filter(p => p.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ArrowUpRight className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${analytics?.average_order_value?.toFixed(2) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'quotes', label: 'Quotes', icon: FileText },
            { id: 'invoices', label: 'Invoices', icon: Receipt },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'returns', label: 'Returns', icon: ArrowDownRight },
            { id: 'reps', label: 'Sales Reps', icon: Users },
            { id: 'territories', label: 'Territories', icon: MapPin },
            { id: 'pricing', label: 'Price Lists', icon: Tag },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Monthly Trends Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales Trends</h3>
            <div className="h-64 flex items-end space-x-2">
              {analytics?.monthly_trends?.slice(0, 12).map((trend, index) => (
                <div key={trend.month} className="flex-1 flex flex-col items-center">
                  <div 
                    className="bg-blue-500 rounded-t w-full mb-2"
                    style={{ height: `${(trend.revenue / Math.max(...analytics.monthly_trends.map(t => t.revenue))) * 200}px` }}
                  />
                  <div className="text-xs text-gray-500 text-center">
                    {new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-xs text-gray-400">
                    ${(trend.revenue / 1000).toFixed(0)}k
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Rep Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Sales Reps</h3>
            <div className="space-y-3">
              {analytics?.sales_rep_performance?.slice(0, 5).map((rep, index) => (
                <div key={rep.rep_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">#{index + 1}</span>
                    <span className="text-sm text-gray-700">{rep.rep_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ${rep.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {rep.orders_count} orders • {rep.quota_achievement.toFixed(1)}% quota
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-3">
              {analytics?.product_performance?.slice(0, 5).map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">#{index + 1}</span>
                    <span className="text-sm text-gray-700">{product.product_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ${product.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.quantity_sold} sold • {product.profit_margin.toFixed(1)}% margin
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
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

              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sales Reps</option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>{rep.name}</option>
                ))}
              </select>

              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>

              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedStatus('')
                  setSelectedRep('')
                  setSelectedDateRange('')
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
              columns={orderColumns}
              isLoading={ordersLoading}
            />
          </div>
        </div>
      )}

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sales Quotes</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {quotes.slice(0, 10).map((quote) => (
                <div key={quote.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {quote.quote_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quote.customer_name} • {quote.sales_rep_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Valid until: {new Date(quote.valid_until).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                    <span className="font-medium text-green-600">
                      ${quote.total_amount.toFixed(2)}
                    </span>
                    <button className="p-1 text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sales Invoices</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {invoices.slice(0, 10).map((invoice) => (
                <div key={invoice.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Receipt className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.customer_name} • Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Order: {invoice.order_number || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    <span className="font-medium text-green-600">
                      ${invoice.total_amount.toFixed(2)}
                    </span>
                    <button className="p-1 text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sales Payments</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {payments.slice(0, 10).map((payment) => (
                <div key={payment.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.payment_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.customer_name} • Invoice: {payment.invoice_number}
                      </div>
                      <div className="text-xs text-gray-400">
                        {payment.payment_method} • {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                    <span className="font-medium text-green-600">
                      ${payment.amount.toFixed(2)}
                    </span>
                    <button className="p-1 text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sales Returns</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {returns.slice(0, 10).map((returnItem) => (
                <div key={returnItem.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <ArrowDownRight className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {returnItem.return_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {returnItem.customer_name} • Order: {returnItem.order_number}
                      </div>
                      <div className="text-xs text-gray-400">
                        Reason: {returnItem.reason}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(returnItem.status)}`}>
                      {returnItem.status}
                    </span>
                    <span className="font-medium text-red-600">
                      ${returnItem.refund_amount.toFixed(2)}
                    </span>
                    <button className="p-1 text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sales Reps Tab */}
      {activeTab === 'reps' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sales Representatives</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {salesReps.map((rep) => (
                <div key={rep.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {rep.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {rep.email} • {rep.phone}
                      </div>
                      <div className="text-xs text-gray-400">
                        Territory: {rep.territory} • Commission: {rep.commission_rate}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${rep.current_sales.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Quota: ${rep.quota.toLocaleString()} ({((rep.current_sales / rep.quota) * 100).toFixed(1)}%)
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      rep.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Territories Tab */}
      {activeTab === 'territories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sales Territories</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {territories.map((territory) => (
                <div key={territory.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {territory.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {territory.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        Manager: {territory.manager_name} • Region: {territory.region}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {territory.zip_codes.length} zip codes
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      territory.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {territory.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Price Lists Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Price Lists</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {priceLists.map((priceList) => (
                <div key={priceList.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {priceList.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {priceList.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        Valid: {new Date(priceList.valid_from).toLocaleDateString()} - {new Date(priceList.valid_to).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {priceList.products_count} products
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      priceList.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {priceList.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Order</h3>
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select Customer</option>
                    <option value="customer1">Customer 1</option>
                    <option value="customer2">Customer 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rep</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select Sales Rep</option>
                    {salesReps.map(rep => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="website">Website</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="walk-in">Walk-in</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowOrderForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createOrder.mutate({})}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Form Modal */}
      {showQuoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Quote</h3>
              <button
                onClick={() => setShowQuoteForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Customer</option>
                  <option value="customer1">Customer 1</option>
                  <option value="customer2">Customer 2</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowQuoteForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createQuote.mutate({})}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
              >
                Create Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Invoice</h3>
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Customer</option>
                  <option value="customer1">Customer 1</option>
                  <option value="customer2">Customer 2</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order (Optional)</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Order</option>
                  <option value="order1">Order #1001</option>
                  <option value="order2">Order #1002</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </form>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createInvoice.mutate({})}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
