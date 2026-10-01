'use client'

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  Bell,
  Building2,
  Calculator,
  CheckCircle2,
  CreditCard,
  Database,
  FileText,
  Globe,
  Info,
  Layers,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  XCircle,
  Zap
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SettingsData {
  businessName?: string
  businessEmail?: string
  businessPhone?: string
  businessAddress?: string
  businessCity?: string
  businessState?: string
  businessZip?: string
  businessCountry?: string
  weeklyReportRecipients?: string
  gymMasterClientId?: string
  gymMasterApiKey?: string
  gymMasterSyncEnabled?: boolean
  quickBooksAccountId?: string
  quickBooksApiKey?: string
  quickBooksSyncEnabled?: boolean
  quickBooksMapping?: any
  unitConversionRules?: any
  geminiApiKey?: string
  geminiExtractionEnabled?: boolean
  emailNotificationsEnabled?: boolean
  lowStockAlertsEnabled?: boolean
  lowStockThreshold?: number
  salesReportsEnabled?: boolean
  inventoryAlertsEnabled?: boolean
}

interface PaymentMethod {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

interface ProductCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

function SectionHeader({ label, description }: { label: string; description: string }) {
  return (
    <div className="pb-4 border-b border-white/[0.06]">
      <h2 className="text-sm font-semibold text-white tracking-wide">{label}</h2>
      <p className="mt-0.5 text-xs text-white/40">{description}</p>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-6 py-3">
      <Label className="pt-2.5 text-xs font-medium text-white/50 leading-none">{label}</Label>
      <div>{children}</div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-xs font-medium text-white/70">{label}</p>
        <p className="mt-0.5 text-xs text-white/30">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-emerald-500"
      />
    </div>
  )
}

const inputCls =
  "h-8 rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-white/20 transition-colors"

const textareaCls =
  "rounded-md bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-white/20 transition-colors resize-none"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState({ name: '', description: '' })
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  const [showAddProductCategory, setShowAddProductCategory] = useState(false)
  const [newProductCategory, setNewProductCategory] = useState({ name: '', description: '' })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    else if (status === 'authenticated' && session?.user?.role !== 'ADMIN')
      router.push('/dashboard/front-desk-role')
  }, [status, session, router])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/settings')
      if (res.ok) setSettings(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods')
      if (res.ok) {
        const data = await res.json()
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { fetchPaymentMethods() }, [])

  const fetchProductCategories = async () => {
    try {
      const res = await fetch('/api/product-categories')
      if (res.ok) {
        const data = await res.json()
        setProductCategories(data.productCategories || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { fetchProductCategories() }, [])

  const handleAddPaymentMethod = async () => {
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPaymentMethod),
      })
      if (res.ok) {
        setNewPaymentMethod({ name: '', description: '' })
        setShowAddPaymentMethod(false)
        fetchPaymentMethods()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) fetchPaymentMethods()
    } catch (e) {
      console.error(e)
    }
  }

  const handleTogglePaymentMethod = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) fetchPaymentMethods()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddProductCategory = async () => {
    try {
      const res = await fetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductCategory),
      })
      if (res.ok) {
        setNewProductCategory({ name: '', description: '' })
        setShowAddProductCategory(false)
        fetchProductCategories()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteProductCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/product-categories/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) fetchProductCategories()
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleProductCategory = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/product-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) fetchProductCategories()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveMessage(null)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaveMessage(
        res.ok
          ? { type: 'success', text: 'Changes saved.' }
          : { type: 'error', text: 'Failed to save.' }
      )
      if (res.ok) setTimeout(() => setSaveMessage(null), 3000)
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save.' })
    } finally {
      setIsSaving(false)
    }
  }

  const set = (field: keyof SettingsData, value: any) =>
    setSettings(prev => ({ ...prev, [field]: value }))

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-[#080808]">
        <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="font-archivo min-h-screen bg-[#080808]">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>

          {/* Top bar */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between px-6 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 text-white/40 hover:text-white transition-colors" />
              <div className="w-px h-4 bg-white/10" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard/admin" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                      Admin
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-white/20" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs text-white/60">Settings</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
              {saveMessage && (
                <span className={`flex items-center gap-1.5 text-xs font-medium animate-in fade-in slide-in-from-right-2 ${saveMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {saveMessage.type === 'success'
                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                    : <XCircle className="h-3.5 w-3.5" />}
                  {saveMessage.text}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSettings}
                disabled={isLoading}
                className="h-8 px-3 text-xs text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-4 text-xs bg-white text-black hover:bg-white/90 font-semibold transition-all"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </header>

          {/* Page body */}
          <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12 space-y-16">

            {/* Page title */}
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
              <p className="mt-1 text-sm text-white/40">Manage your business configuration and preferences.</p>
            </div>

            {/* ── Business Profile ── */}
            <section className="space-y-1">
              <SectionHeader
                label="Business Profile"
                description="Your public-facing business details and contact information."
              />
              <div className="divide-y divide-white/[0.04]">
                <FieldRow label="Business Name">
                  <Input
                    value={settings.businessName || ''}
                    onChange={e => set('businessName', e.target.value)}
                    placeholder="Acme Corp"
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="Email">
                  <Input
                    type="email"
                    value={settings.businessEmail || ''}
                    onChange={e => set('businessEmail', e.target.value)}
                    placeholder="hello@example.com"
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="Phone">
                  <Input
                    value={settings.businessPhone || ''}
                    onChange={e => set('businessPhone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="Country">
                  <Input
                    value={settings.businessCountry || ''}
                    onChange={e => set('businessCountry', e.target.value)}
                    placeholder="United States"
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="Street Address">
                  <Input
                    value={settings.businessAddress || ''}
                    onChange={e => set('businessAddress', e.target.value)}
                    placeholder="123 Main Street"
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="City / State / ZIP">
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      value={settings.businessCity || ''}
                      onChange={e => set('businessCity', e.target.value)}
                      placeholder="City"
                      className={inputCls}
                    />
                    <Input
                      value={settings.businessState || ''}
                      onChange={e => set('businessState', e.target.value)}
                      placeholder="State"
                      className={inputCls}
                    />
                    <Input
                      value={settings.businessZip || ''}
                      onChange={e => set('businessZip', e.target.value)}
                      placeholder="ZIP"
                      className={inputCls}
                    />
                  </div>
                </FieldRow>
              </div>
            </section>

            {/* ── Weekly Report Recipients ── */}
            <section className="space-y-1">
              <SectionHeader
                label="Weekly Report Recipients"
                description="Who receives automated weekly performance reports."
              />
              <div className="py-3">
                <Textarea
                  value={settings.weeklyReportRecipients || ''}
                  onChange={e => set('weeklyReportRecipients', e.target.value)}
                  placeholder="admin@company.com, manager@company.com"
                  rows={3}
                  className={textareaCls + ' w-full'}
                />
                <p className="mt-2 flex items-start gap-1.5 text-xs text-white/30">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-white/20" />
                  Separate multiple addresses with commas.
                </p>
              </div>
            </section>

            {/* ── Integrations ── */}
            <section className="space-y-1">
              <SectionHeader
                label="Integrations"
                description="Connect third-party services for syncing sales and financial data."
              />

              {/* GymMaster */}
              <div className="divide-y divide-white/[0.04]">
                <div className="py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                      <Database className="h-3 w-3 text-purple-400" />
                    </div>
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">GymMaster</span>
                  </div>
                  <div className="space-y-0 divide-y divide-white/[0.04]">
                    <ToggleRow
                      label="Enable GymMaster Sync"
                      description="Automatically pull sales data from GymMaster."
                      checked={settings.gymMasterSyncEnabled || false}
                      onChange={v => set('gymMasterSyncEnabled', v)}
                    />
                    <FieldRow label="Client Name">
                      <Input
                        value={settings.gymMasterClientId || ''}
                        onChange={e => set('gymMasterClientId', e.target.value)}
                        placeholder="your-gym-name"
                        className={inputCls}
                      />
                    </FieldRow>
                    <FieldRow label="API Key">
                      <Input
                        type="password"
                        value={settings.gymMasterApiKey || ''}
                        onChange={e => set('gymMasterApiKey', e.target.value)}
                        placeholder="••••••••••••••••"
                        className={inputCls}
                      />
                    </FieldRow>
                  </div>
                </div>

                {/* QuickBooks */}
                <div className="py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center">
                      <FileText className="h-3 w-3 text-orange-400" />
                    </div>
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">QuickBooks</span>
                  </div>
                  <div className="space-y-0 divide-y divide-white/[0.04]">
                    <ToggleRow
                      label="Enable QuickBooks Sync"
                      description="Sync financial data with QuickBooks automatically."
                      checked={settings.quickBooksSyncEnabled || false}
                      onChange={v => set('quickBooksSyncEnabled', v)}
                    />
                    <FieldRow label="Account ID">
                      <Input
                        value={settings.quickBooksAccountId || ''}
                        onChange={e => set('quickBooksAccountId', e.target.value)}
                        placeholder="QuickBooks account ID"
                        className={inputCls}
                      />
                    </FieldRow>
                    <FieldRow label="API Key">
                      <Input
                        type="password"
                        value={settings.quickBooksApiKey || ''}
                        onChange={e => set('quickBooksApiKey', e.target.value)}
                        placeholder="••••••••••••••••"
                        className={inputCls}
                      />
                    </FieldRow>
                    <FieldRow label="Account Mapping">
                      <Textarea
                        value={
                          typeof settings.quickBooksMapping === 'string'
                            ? settings.quickBooksMapping
                            : JSON.stringify(settings.quickBooksMapping || {}, null, 2)
                        }
                        onChange={e => {
                          try { set('quickBooksMapping', JSON.parse(e.target.value)) }
                          catch { set('quickBooksMapping', e.target.value) }
                        }}
                        placeholder={'{\n  "sales": "Sales Account",\n  "inventory": "Inventory Account"\n}'}
                        rows={5}
                        className={textareaCls + ' w-full font-mono text-xs'}
                      />
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-white/30">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-white/20" />
                        Map sales and inventory accounts to QuickBooks categories.
                      </p>
                    </FieldRow>
                  </div>
                </div>

                {/* Gemini AI */}
                <div className="py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                    </div>
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Gemini AI</span>
                  </div>
                  <div className="space-y-0 divide-y divide-white/[0.04]">
                    <ToggleRow
                      label="Enable Gemini Invoice Extraction"
                      description="Use Google Gemini AI for automatic invoice data extraction."
                      checked={settings.geminiExtractionEnabled || false}
                      onChange={v => set('geminiExtractionEnabled', v)}
                    />
                    <FieldRow label="API Key">
                      <Input
                        type="password"
                        value={settings.geminiApiKey || ''}
                        onChange={e => set('geminiApiKey', e.target.value)}
                        placeholder="••••••••••••••••"
                        className={inputCls}
                      />
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-white/30">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-white/20" />
                        Enter your Google Gemini API key for invoice extraction. Get one from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Google AI Studio</a>.
                      </p>
                    </FieldRow>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Unit Conversion ── */}
            <section className="space-y-1">
              <SectionHeader
                label="Unit Conversion Rules"
                description="Define conversion factors between units for inventory accuracy."
              />
              <div className="py-3 space-y-3">
                <Textarea
                  value={
                    typeof settings.unitConversionRules === 'string'
                      ? settings.unitConversionRules
                      : JSON.stringify(settings.unitConversionRules || {}, null, 2)
                  }
                  onChange={e => {
                    try { set('unitConversionRules', JSON.parse(e.target.value)) }
                    catch { set('unitConversionRules', e.target.value) }
                  }}
                  placeholder={`{
  "POUND_TO_OUNCE": 16,
  "OUNCE_TO_POUND": 0.0625,
  "KILOGRAM_TO_GRAM": 1000,
  "GRAM_TO_KILOGRAM": 0.001,
  "GALLON_TO_LITER": 3.785,
  "LITER_TO_GALLON": 0.264,
  "QUART_TO_LITER": 0.946,
  "CUP_TO_MILLILITER": 236.6,
  "TABLESPOON_TO_MILLILITER": 14.79,
  "TEASPOON_TO_MILLILITER": 4.93,
  "POUND_TO_KILOGRAM": 0.454,
  "KILOGRAM_TO_POUND": 2.205
}`}
                  rows={12}
                  className={textareaCls + ' w-full font-mono text-xs'}
                />
                <div className="space-y-2">
                  <p className="flex items-start gap-1.5 text-xs text-white/30">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-white/20" />
                    Define conversion factors as key-value pairs. Use descriptive names like "POUND_TO_OUNCE" for clarity.
                  </p>
                  <div className="rounded-md bg-white/2 border border-white/4 p-3">
                    <p className="text-xs font-medium text-white/50 mb-2">Example Usage:</p>
                    <pre className="text-xs text-white/30 font-mono">
{`// Convert 2 pounds to ounces:
ounces = 2 × POUND_TO_OUNCE = 32 oz

// Convert 500 grams to kilograms:
kg = 500 × GRAM_TO_KILOGRAM = 0.5 kg

// Convert 1 gallon to liters:
liters = 1 × GALLON_TO_LITER = 3.785 L`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Payment Methods ── */}
            <section className="space-y-1">
              <SectionHeader
                label="Payment Methods"
                description="Manage available payment methods for sales transactions."
              />
              <div className="py-3 space-y-3">
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-3 rounded-md bg-white/2 border border-white/4"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-white/40" />
                        <div>
                          <p className="text-sm font-medium text-white/70">{method.name}</p>
                          {method.description && (
                            <p className="text-xs text-white/30">{method.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={method.isActive}
                          onCheckedChange={() => handleTogglePaymentMethod(method.id, method.isActive)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="text-white/30 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {!showAddPaymentMethod ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPaymentMethod(true)}
                    className="w-full border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                ) : (
                  <div className="p-4 rounded-md bg-white/2 border border-white/4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-white/50">Name</Label>
                      <Input
                        value={newPaymentMethod.name}
                        onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                        placeholder="e.g., Cash, Credit Card, PayPal"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-white/50">Description (optional)</Label>
                      <Input
                        value={newPaymentMethod.description}
                        onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, description: e.target.value })}
                        placeholder="Brief description of the payment method"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={handleAddPaymentMethod}
                        disabled={!newPaymentMethod.name}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Add Method
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddPaymentMethod(false)
                          setNewPaymentMethod({ name: '', description: '' })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Product Categories ── */}
            <section className="space-y-1">
              <SectionHeader
                label="Product Categories"
                description="Manage product categories for organizing inventory."
              />
              <div className="py-3 space-y-3">
                <div className="space-y-2">
                  {productCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-md bg-white/2 border border-white/4"
                    >
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-white/40" />
                        <div>
                          <p className="text-sm font-medium text-white/70">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-white/30">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => handleToggleProductCategory(category.id, category.isActive)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProductCategory(category.id)}
                          className="text-white/30 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {!showAddProductCategory ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddProductCategory(true)}
                    className="w-full border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product Category
                  </Button>
                ) : (
                  <div className="p-4 rounded-md bg-white/2 border border-white/4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-white/50">Name</Label>
                      <Input
                        value={newProductCategory.name}
                        onChange={(e) => setNewProductCategory({ ...newProductCategory, name: e.target.value })}
                        placeholder="e.g., Electronics, Clothing, Food"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-white/50">Description (optional)</Label>
                      <Input
                        value={newProductCategory.description}
                        onChange={(e) => setNewProductCategory({ ...newProductCategory, description: e.target.value })}
                        placeholder="Brief description of the category"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={handleAddProductCategory}
                        disabled={!newProductCategory.name}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddProductCategory(false)
                          setNewProductCategory({ name: '', description: '' })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Notifications ── */}
            <section className="space-y-1">
              <SectionHeader
                label="Notifications"
                description="Control which alerts and reports are sent and when."
              />
              <div className="divide-y divide-white/[0.04]">
                <ToggleRow
                  label="Email Notifications"
                  description="Receive email alerts for important system events."
                  checked={settings.emailNotificationsEnabled || false}
                  onChange={v => set('emailNotificationsEnabled', v)}
                />
                <ToggleRow
                  label="Low Stock Alerts"
                  description="Get notified when inventory falls below your threshold."
                  checked={settings.lowStockAlertsEnabled || false}
                  onChange={v => set('lowStockAlertsEnabled', v)}
                />
                <FieldRow label="Low Stock Threshold">
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={settings.lowStockThreshold ?? 10}
                      onChange={e => set('lowStockThreshold', parseInt(e.target.value))}
                      className={inputCls + ' w-24'}
                    />
                    <span className="text-xs text-white/30">units</span>
                  </div>
                </FieldRow>
                <ToggleRow
                  label="Weekly Sales Reports"
                  description="Receive an automated summary every week."
                  checked={settings.salesReportsEnabled || false}
                  onChange={v => set('salesReportsEnabled', v)}
                />
                <ToggleRow
                  label="Inventory Alerts"
                  description="Get notified when significant inventory changes occur."
                  checked={settings.inventoryAlertsEnabled || false}
                  onChange={v => set('inventoryAlertsEnabled', v)}
                />
              </div>
            </section>

            {/* Bottom save */}
            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-3 pb-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSettings}
                className="h-8 px-4 text-xs text-white/40 hover:text-white hover:bg-white/[0.06]"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-5 text-xs bg-white text-black hover:bg-white/90 font-semibold"
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>

          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}