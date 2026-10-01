"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarRange } from "@/components/calendar-range"
import {
  RefreshCw,
  Calendar as CalendarIcon,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Download,
  Plus,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/ui/toast"
import { type DateRange } from "react-day-picker"
import { format } from "date-fns"

type ReconciliationStatus = "Matched" | "Partial Match" | "Mismatch"

interface ReconciliationData {
  id: string
  dateTime: string
  orderNumber: string
  product: string
  type: string
  appSales: number
  gymMasterSales: number
  inventoryDeduction: number
  status: ReconciliationStatus
  variance: number
  appOrderId?: string
  gymMasterId?: string
}

interface GymMasterSale {
  id: string
  externalId: string
  dateTime: string
  orderNumber: string | null
  product: string
  type: string
  amount: number
  quantity: number
  location: string
}

interface AppSale {
  id: string
  orderId: string
  dateTime: string
  product: string
  type: 'burnbox' | 'apparel'
  amount: number
  quantity: number
}

const currency = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatusBadge({ status }: { status: ReconciliationStatus }) {
  const styles: Record<ReconciliationStatus, string> = {
    "Matched": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Partial Match": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Mismatch": "bg-red-500/10 text-red-400 border-red-500/20",
  }
  return (
    <Badge variant="outline" className={`font-normal ${styles[status]}`}>
      {status}
    </Badge>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  tone = "default",
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext: string
  tone?: "default" | "warning" | "positive" | "negative"
}) {
  const toneClasses =
    tone === "warning"
      ? "text-amber-400"
      : tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
      ? "text-red-400"
      : "text-muted-foreground"

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtext}</p>
        </div>
        <Icon className={`h-5 w-5 ${toneClasses}`} />
      </div>
    </Card>
  )
}

export default function GymMasterReconcilationPage() {
  const [selectedLocation, setSelectedLocation] = useState("burnbox")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [addingSaleId, setAddingSaleId] = useState<string | null>(null)
  const [gymMasterSales, setGymMasterSales] = useState<GymMasterSale[]>([])
  const [appSales, setAppSales] = useState<AppSale[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [viewingItem, setViewingItem] = useState<ReconciliationData | null>(null)
  const [gymMasterSyncEnabled, setGymMasterSyncEnabled] = useState(false)

  // Fetch GymMaster sales data
  const fetchGymMasterSales = useCallback(async () => {
    try {
      let url = `/api/gymmaster/sales?location=${selectedLocation}&limit=500`
      
      // Add date range filters if selected
      if (dateRange?.from) {
        url += `&dateFrom=${format(dateRange.from, 'yyyy-MM-dd')}`
      }
      if (dateRange?.to) {
        url += `&dateTo=${format(dateRange.to, 'yyyy-MM-dd')}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched GymMaster sales:', data.sales?.length || 0)
        console.log('Sample GymMaster sale:', data.sales?.[0])
        console.log('Full response data:', data)
        setGymMasterSales(data.sales || [])
      } else {
        console.error('Failed to fetch GymMaster sales:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching GymMaster sales:', error)
    }
  }, [selectedLocation, dateRange?.from, dateRange?.to])

  // Fetch app sales data (both BurnBox and apparel)
  const fetchAppSales = useCallback(async () => {
    try {
      // Prepare date parameters
      const dateFrom = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
      const dateTo = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

      // Fetch BurnBox sales
      const burnboxParams = new URLSearchParams()
      if (dateFrom) burnboxParams.append('dateFrom', dateFrom)
      if (dateTo) burnboxParams.append('dateTo', dateTo)
      burnboxParams.append('allSales', 'true')

      const burnboxResponse = await fetch(`/api/burnbox-sales?${burnboxParams.toString()}`)
      const burnboxData = burnboxResponse.ok ? await burnboxResponse.json() : { sales: [] }

      // Fetch apparel sales
      const apparelParams = new URLSearchParams()
      if (dateFrom) apparelParams.append('dateFrom', dateFrom)
      if (dateTo) apparelParams.append('dateTo', dateTo)

      const apparelResponse = await fetch(`/api/sales?${apparelParams.toString()}`)
      const apparelData = apparelResponse.ok ? await apparelResponse.json() : { sales: [] }

      // Transform and combine app sales
      const transformedAppSales: AppSale[] = []

      // Transform BurnBox sales
      if (burnboxData.sales) {
        burnboxData.sales.forEach((sale: any) => {
          transformedAppSales.push({
            id: sale.id,
            orderId: sale.orderId || `BB-${sale.id}`,
            dateTime: sale.saleDate,
            product: sale.recipeName,
            type: 'burnbox',
            amount: sale.totalPrice,
            quantity: sale.quantity
          })
        })
      }

      // Transform apparel sales
      if (apparelData.sales) {
        apparelData.sales.forEach((sale: any) => {
          transformedAppSales.push({
            id: sale.id,
            orderId: sale.orderId || `AP-${sale.id}`,
            dateTime: sale.saleDate,
            product: sale.productName || 'Unknown Product',
            type: 'apparel',
            amount: sale.totalAmount || sale.totalPrice,
            quantity: sale.quantity
          })
        })
      }

      console.log('Fetched app sales:', transformedAppSales.length)
      setAppSales(transformedAppSales)
    } catch (error) {
      console.error('Error fetching app sales:', error)
    }
  }, [dateRange?.from, dateRange?.to])

  // Load data on mount and when location or date range changes
  useEffect(() => {
    const loadData = async () => {
      try {
        let url = `/api/gymmaster/sales?location=${selectedLocation}&limit=500`
        
        // Add date range filters if selected
        if (dateRange?.from) {
          url += `&dateFrom=${format(dateRange.from, 'yyyy-MM-dd')}`
        }
        if (dateRange?.to) {
          url += `&dateTo=${format(dateRange.to, 'yyyy-MM-dd')}`
        }
        
        console.log('Fetching GymMaster sales with URL:', url)
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          console.log('Fetched GymMaster sales:', data.sales?.length || 0)
          setGymMasterSales(data.sales || [])
        } else {
          console.error('Failed to fetch GymMaster sales:', response.status)
        }
      } catch (error) {
        console.error('Error fetching GymMaster sales:', error)
      }

      try {
        // Prepare date parameters
        const dateFrom = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
        const dateTo = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

        console.log('Fetching app sales with date range:', { dateFrom, dateTo })

        // Fetch BurnBox sales
        const burnboxParams = new URLSearchParams()
        if (dateFrom) burnboxParams.append('dateFrom', dateFrom)
        if (dateTo) burnboxParams.append('dateTo', dateTo)
        burnboxParams.append('allSales', 'true')

        const burnboxResponse = await fetch(`/api/burnbox-sales?${burnboxParams.toString()}`)
        const burnboxData = burnboxResponse.ok ? await burnboxResponse.json() : { sales: [] }

        // Fetch apparel sales
        const apparelParams = new URLSearchParams()
        if (dateFrom) apparelParams.append('dateFrom', dateFrom)
        if (dateTo) apparelParams.append('dateTo', dateTo)

        const apparelResponse = await fetch(`/api/sales?${apparelParams.toString()}`)
        const apparelData = apparelResponse.ok ? await apparelResponse.json() : { sales: [] }

        // Transform and combine app sales
        const transformedAppSales: AppSale[] = []

        // Transform BurnBox sales
        if (burnboxData.sales) {
          burnboxData.sales.forEach((sale: any) => {
            transformedAppSales.push({
              id: sale.id,
              orderId: sale.orderId || `BB-${sale.id}`,
              dateTime: sale.saleDate,
              product: sale.recipeName,
              type: 'burnbox',
              amount: sale.totalPrice,
              quantity: sale.quantity
            })
          })
        }

        // Transform apparel sales
        if (apparelData.sales) {
          apparelData.sales.forEach((sale: any) => {
            transformedAppSales.push({
              id: sale.id,
              orderId: sale.orderId || `AP-${sale.id}`,
              dateTime: sale.saleDate,
              product: sale.productName || 'Unknown Product',
              type: 'apparel',
              amount: sale.totalAmount || sale.totalPrice,
              quantity: sale.quantity
            })
          })
        }

        console.log('Fetched app sales:', transformedAppSales.length)
        console.log('Sample app sale:', transformedAppSales[0])
        setAppSales(transformedAppSales)
      } catch (error) {
        console.error('Error fetching app sales:', error)
      }
    }

    loadData()
  }, [selectedLocation, dateRange?.from, dateRange?.to])

  // Fetch settings to check GymMaster sync status
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setGymMasterSyncEnabled(data.gymMasterSyncEnabled || false)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // Transform GymMaster sales to reconciliation data format with app sales matching
  console.log('Transforming GymMaster sales:', gymMasterSales.length, 'App sales:', appSales.length)
  const reconciliationData: ReconciliationData[] = gymMasterSales
    .filter(sale => sale.amount > 0) // Filter out $0 sales (signups, voided, etc.)
    .map((sale) => {
      // Handle date parsing for display
      let formattedDateTime = 'Invalid Date'
      try {
        const date = new Date(sale.dateTime)
        if (!isNaN(date.getTime())) {
          formattedDateTime = date.toLocaleString()
        }
      } catch (e) {
        console.error('Error parsing date for display:', sale.dateTime, e)
      }

      // Try to match with app sales by amount and date
      const saleDate = new Date(sale.dateTime)
      const matchingAppSale = appSales.find(appSale => {
        const appDate = new Date(appSale.dateTime)
        // Match if same day and amount is close (within $0.01 tolerance)
        const sameDay = appDate.toDateString() === saleDate.toDateString()
        const amountMatch = Math.abs(appSale.amount - sale.amount) < 0.01
        return sameDay && amountMatch
      })

      if (matchingAppSale) {
        // Found a match
        const variance = sale.amount - matchingAppSale.amount
        return {
          id: sale.id,
          dateTime: formattedDateTime,
          orderNumber: sale.orderNumber || `GM-${sale.externalId}`,
          product: sale.product,
          type: sale.type,
          appSales: matchingAppSale.amount,
          gymMasterSales: sale.amount,
          inventoryDeduction: sale.quantity,
          status: Math.abs(variance) < 0.01 ? "Matched" : "Partial Match",
          variance: variance,
          appOrderId: matchingAppSale.id,
          gymMasterId: sale.id
        }
      } else {
        // No match found
        return {
          id: sale.id,
          dateTime: formattedDateTime,
          orderNumber: sale.orderNumber || `GM-${sale.externalId}`,
          product: sale.product,
          type: sale.type,
          appSales: 0,
          gymMasterSales: sale.amount,
          inventoryDeduction: sale.quantity,
          status: "Mismatch",
          variance: sale.amount,
          gymMasterId: sale.id
        }
      }
    })

  // Add app sales that don't have GymMaster matches
  const appSalesWithoutGymMaster = appSales.filter(appSale => {
    const appDate = new Date(appSale.dateTime)
    return !gymMasterSales.some(gmSale => {
      const gmDate = new Date(gmSale.dateTime)
      const sameDay = appDate.toDateString() === gmDate.toDateString()
      const amountMatch = Math.abs(appSale.amount - gmSale.amount) < 0.01
      return sameDay && amountMatch
    })
  })

  const appOnlyReconciliationData: ReconciliationData[] = appSalesWithoutGymMaster.map(appSale => {
    let formattedDateTime = 'Invalid Date'
    try {
      const date = new Date(appSale.dateTime)
      if (!isNaN(date.getTime())) {
        formattedDateTime = date.toLocaleString()
      }
    } catch (e) {
      console.error('Error parsing date for display:', appSale.dateTime, e)
    }

    return {
      id: appSale.id,
      dateTime: formattedDateTime,
      orderNumber: appSale.orderId,
      product: appSale.product,
      type: appSale.type === 'burnbox' ? 'BurnBox' : 'Apparel',
      appSales: appSale.amount,
      gymMasterSales: 0,
      inventoryDeduction: appSale.quantity,
      status: "Mismatch",
      variance: appSale.amount,
      appOrderId: appSale.id
    }
  })

  // Combine both datasets
  const allReconciliationData = [...reconciliationData, ...appOnlyReconciliationData]
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
  
  console.log('Final reconciliation data count:', allReconciliationData.length)

  const stats = {
    totalSalesApp: appSales.reduce((sum, sale) => sum + sale.amount, 0),
    totalTransactionsApp: appSales.length,
    totalSalesGymMaster: gymMasterSales.reduce((sum, sale) => sum + sale.amount, 0),
    totalTransactionsGymMaster: gymMasterSales.length,
    discrepancies: allReconciliationData.filter(d => d.status !== "Matched").length,
    matched: allReconciliationData.filter(d => d.status === "Matched").length,
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    await Promise.all([fetchGymMasterSales(), fetchAppSales()])
    setIsLoading(false)
  }

  const handleSync = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      console.error('Date range is required for sync')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/gymmaster/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom: format(dateRange.from, 'yyyy-MM-dd') + ' 00:00:00',
          dateTo: format(dateRange.to, 'yyyy-MM-dd') + ' 23:59:59',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setLastSyncTime(new Date())
        await Promise.all([fetchGymMasterSales(), fetchAppSales()]) // Refresh both data sources
        // Force a page refresh to show updated data
        setCurrentPage(1)
      }
    } catch (error) {
      console.error('Error syncing with GymMaster:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToApp = async (item: ReconciliationData) => {
    if (!item.gymMasterId) {
      console.error('No GymMaster ID found for this item')
      toast.add({
        title: "Error",
        description: "No GymMaster ID found for this item",
      })
      return
    }

    setAddingSaleId(item.id)
    try {
      // Find the original GymMaster sale
      const gymMasterSale = gymMasterSales.find(sale => sale.id === item.gymMasterId)
      if (!gymMasterSale) {
        console.error('GymMaster sale not found')
        toast.add({
          title: "Error",
          description: "GymMaster sale not found",
        })
        return
      }

      // Create a BurnBox sale entry for this GymMaster sale
      const response = await fetch('/api/burnbox-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isManualEntry: true,
          orderId: gymMasterSale.orderNumber || `GM-${gymMasterSale.externalId}`,
          recipeName: gymMasterSale.product,
          quantity: gymMasterSale.quantity,
          totalPrice: gymMasterSale.amount,
          userId: 'system', // System user for manual entries
          userName: 'System Sync',
          paymentMethod: 'GymMaster',
          notes: `Manually added from GymMaster reconciliation. Original order: ${gymMasterSale.orderNumber}, External ID: ${gymMasterSale.externalId}`,
        }),
      })

      if (response.ok) {
        toast.add({
          title: "Success",
          description: `Successfully added ${gymMasterSale.product} to app`,
        })
        // Refresh data to show the new entry
        await Promise.all([fetchGymMasterSales(), fetchAppSales()])
      } else {
        const errorData = await response.json()
        toast.add({
          title: "Error",
          description: errorData.error || "Failed to add sale to app",
        })
      }
    } catch (error) {
      console.error('Error adding sale to app:', error)
      toast.add({
        title: "Error",
        description: "Failed to add sale to app",
      })
    } finally {
      setAddingSaleId(null)
    }
  }

  const handleViewDetails = (item: ReconciliationData) => {
    setViewingItem(item)
  }

  const totalPages = Math.ceil(allReconciliationData.length / 10)
  const paginatedData = allReconciliationData.slice((currentPage - 1) * 10, currentPage * 10)

  // Export to CSV function
  const exportToCSV = () => {
    if (allReconciliationData.length === 0) {
      alert('No data to export')
      return
    }

    // Define CSV headers
    const headers = [
      'Date & Time',
      'Order Number',
      'Product',
      'Type',
      'App Sales',
      'GymMaster Sales',
      'Inventory Deduction',
      'Status',
      'Variance'
    ]

    // Add metadata rows at the top
    const metadata = [
      `Export Date,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
      `Location,${selectedLocation}`,
      `Date Range,${dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'Not specified'} to ${dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : 'Not specified'}`,
      `Total Records,${allReconciliationData.length}`,
      `Total GymMaster Sales,${stats.totalSalesGymMaster.toFixed(2)}`,
      `Total App Sales,${stats.totalSalesApp.toFixed(2)}`,
      `Total Variance,${(stats.totalSalesGymMaster - stats.totalSalesApp).toFixed(2)}`,
      ''
    ]

    // Convert data to CSV format
    const csvContent = [
      ...metadata,
      headers.join(','),
      ...allReconciliationData.map(item => [
        `"${item.dateTime}"`,
        `"${item.orderNumber}"`,
        `"${item.product}"`,
        `"${item.type}"`,
        item.appSales.toFixed(2),
        item.gymMasterSales.toFixed(2),
        item.inventoryDeduction,
        `"${item.status}"`,
        item.variance.toFixed(2)
      ].join(','))
    ].join('\n')

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // Generate filename with date range
    const dateStr = dateRange?.from 
      ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to || dateRange.from, 'yyyy-MM-dd')}`
      : format(new Date(), 'yyyy-MM-dd')
    
    link.setAttribute('href', url)
    link.setAttribute('download', `gymmaster_reconciliation_${dateStr}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="font-archivo">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>GymMaster Reconciliation</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">GymMaster Reconciliation</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Compare sales data between Burn Box app and GymMaster system
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarRange 
                      dateRange={dateRange}
                      setDateRange={setDateRange}
                      onApply={() => setIsCalendarOpen(false)}
                    />
                  </PopoverContent>
                </Popover>

                <Button 
                  variant="default" 
                  className="w-full sm:w-auto"
                  onClick={handleSync}
                  disabled={isLoading || !gymMasterSyncEnabled}
                  title={!gymMasterSyncEnabled ? "GymMaster Sync is disabled in settings" : "Sync with GymMaster"}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync with GymMaster
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={exportToCSV}
                  disabled={allReconciliationData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>

                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Refresh data"
                  className="hidden"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={DollarSign}
                label="Total Sales (App)"
                value={currency(stats.totalSalesApp)}
                subtext={`${stats.totalTransactionsApp} transactions`}
                tone="positive"
              />
              <StatCard
                icon={DollarSign}
                label="Total Sales (GymMaster)"
                value={currency(stats.totalSalesGymMaster)}
                subtext={`${stats.totalTransactionsGymMaster} transactions`}
                tone="default"
              />
              <StatCard
                icon={AlertCircle}
                label="Discrepancies"
                value={stats.discrepancies.toString()}
                subtext={allReconciliationData.length > 0 ? `${((stats.discrepancies / allReconciliationData.length) * 100).toFixed(1)}% of total` : 'No data'}
                tone="warning"
              />
              <StatCard
                icon={CheckCircle2}
                label="Matched"
                value={stats.matched.toString()}
                subtext={allReconciliationData.length > 0 ? `${((stats.matched / allReconciliationData.length) * 100).toFixed(1)}% of total` : 'No data'}
                tone="positive"
              />
            </div>

            {/* Last Sync Info */}
            {lastSyncTime && (
              <Card className="p-3 bg-muted/50 border-muted">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Last synced with GymMaster: {lastSyncTime.toLocaleString()}</span>
                </div>
              </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              {/* Reconciliation Details Table */}
              <div className="lg:col-span-3">
                <Card className="overflow-hidden">
                  <div className="border-b p-4">
                    <h2 className="text-lg font-semibold">Reconciliation Details</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Detailed comparison of individual transactions
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Order #</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">App Sales</TableHead>
                          <TableHead className="text-right">GymMaster Sales</TableHead>
                          <TableHead className="text-right">Inventory</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((item) => {
                            const isAppOnly = item.gymMasterSales === 0
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="text-sm">{item.dateTime}</TableCell>
                                <TableCell className="text-sm font-medium">{item.orderNumber}</TableCell>
                                <TableCell className="text-sm">{item.product}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {item.type}
                                  {isAppOnly && <span className="ml-2 text-xs text-amber-400">(App Only)</span>}
                                </TableCell>
                                <TableCell className="text-sm text-right tabular-nums">
                                  {currency(item.appSales)}
                                </TableCell>
                                <TableCell className="text-sm text-right tabular-nums">
                                  {currency(item.gymMasterSales)}
                                </TableCell>
                                <TableCell className="text-sm text-right tabular-nums">
                                  {item.inventoryDeduction}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={item.status} />
                                </TableCell>
                                <TableCell className={`text-sm text-right tabular-nums ${
                                  item.variance > 0 ? 'text-emerald-400' : item.variance < 0 ? 'text-red-400' : 'text-muted-foreground'
                                }`}>
                                  {item.variance !== 0 ? (
                                    <>
                                      {item.variance > 0 ? <ArrowUp className="h-3 w-3 inline mr-1" /> : <ArrowDown className="h-3 w-3 inline mr-1" />}
                                      {currency(Math.abs(item.variance))}
                                    </>
                                  ) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.status === "Mismatch" && item.gymMasterSales > 0 && item.appSales === 0 ? (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-emerald-400 hover:text-emerald-300"
                                      onClick={() => handleAddToApp(item)}
                                      title="Add to App"
                                      disabled={addingSaleId === item.id}
                                    >
                                      {addingSaleId === item.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Plus className="h-4 w-4" />
                                      )}
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => handleViewDetails(item)}
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                              No sales data found. Click "Sync with GymMaster" to fetch sales data from GymMaster system, and app sales will be loaded automatically.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {allReconciliationData.length > 0 && (
                    <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        Showing {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, allReconciliationData.length)} of {allReconciliationData.length} records
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Summary and Legend */}
              <div className="space-y-6">
                {/* Summary Card */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">App Sales Total</span>
                      <span className="text-sm font-semibold">{currency(stats.totalSalesApp)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">GymMaster Total</span>
                      <span className="text-sm font-semibold">{currency(stats.totalSalesGymMaster)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Variance</span>
                      <span className={`text-sm font-bold ${stats.totalSalesGymMaster !== stats.totalSalesApp ? 'text-red-400' : 'text-emerald-400'}`}>
                        {currency(stats.totalSalesGymMaster - stats.totalSalesApp)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Discrepancy Breakdown */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Discrepancy Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Unmatched Sales</span>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                        {allReconciliationData.filter(d => d.status === "Partial Match").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sales Mismatch</span>
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                        {allReconciliationData.filter(d => d.status === "Mismatch").length}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Discrepancies</span>
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                        {stats.discrepancies}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Status Legend */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Status Legend</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                      <div>
                        <p className="text-sm font-medium">Matched</p>
                        <p className="text-xs text-muted-foreground">No difference</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div>
                        <p className="text-sm font-medium">Partial Match</p>
                        <p className="text-xs text-muted-foreground">Minor variance ≤ $2</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div>
                        <p className="text-sm font-medium">Mismatch</p>
                        <p className="text-xs text-muted-foreground">Significant difference &gt; $2</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Tip */}
                <Card className="p-4 bg-muted/50 border-muted">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Tip</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click on any row to view detailed comparison data and investigate the discrepancy.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* View Details Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reconciliation Details</DialogTitle>
            <DialogDescription>
              Detailed comparison for this transaction
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="text-sm font-medium">{viewingItem.dateTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="text-sm font-medium">{viewingItem.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="text-sm font-medium">{viewingItem.product}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">{viewingItem.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">App Sales</p>
                  <p className="text-sm font-medium">{currency(viewingItem.appSales)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GymMaster Sales</p>
                  <p className="text-sm font-medium">{currency(viewingItem.gymMasterSales)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Deduction</p>
                  <p className="text-sm font-medium">{viewingItem.inventoryDeduction}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={viewingItem.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Variance</p>
                  <p className={`text-sm font-medium ${
                    viewingItem.variance > 0 ? 'text-emerald-400' : viewingItem.variance < 0 ? 'text-red-400' : 'text-muted-foreground'
                  }`}>
                    {viewingItem.variance !== 0 ? currency(Math.abs(viewingItem.variance)) : '$0.00'}
                  </p>
                </div>
              </div>
              
              {viewingItem.status === "Mismatch" && viewingItem.gymMasterSales > 0 && viewingItem.appSales === 0 && (
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => {
                      handleAddToApp(viewingItem)
                      setViewingItem(null)
                    }}
                    disabled={addingSaleId === viewingItem.id}
                  >
                    {addingSaleId === viewingItem.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add to App
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
