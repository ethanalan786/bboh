'use client'

import React from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Badge
} from "@/components/ui/badge"
import {
  Bug,
  Lightbulb,
  Shield,
  Zap,
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  Plus,
  ChevronDown
} from "lucide-react"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const CATEGORY_OPTIONS = [
  { value: 'BUG_REPORT', label: 'Bug Report', icon: Bug, color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: Lightbulb, color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { value: 'UI_IMPROVEMENT', label: 'UI Improvement', icon: Star, color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { value: 'PERFORMANCE', label: 'Performance', icon: Zap, color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { value: 'SECURITY', label: 'Security', icon: Shield, color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { value: 'OTHER', label: 'Other', icon: MessageSquare, color: '#6b7280', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { value: 'MEDIUM', label: 'Medium', color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { value: 'HIGH', label: 'High', color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { value: 'URGENT', label: 'Urgent', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20' },
]

const STATUS_STYLES = {
  OPEN: { icon: AlertCircle, color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Open' },
  IN_PROGRESS: { icon: Clock, color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'In Progress' },
  RESOLVED: { icon: CheckCircle2, color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Resolved' },
  CLOSED: { icon: XCircle, color: '#6b7280', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Closed' },
}

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [feedbackList, setFeedbackList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    priority: 'MEDIUM'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      setIsAdmin(session?.user?.role === 'ADMIN')
      fetchFeedback()
    }
  }, [status, session, router])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterCategory !== 'all') params.append('category', filterCategory)

      const res = await fetch(`/api/feedback?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setFeedbackList(data)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [filterStatus, filterCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    try {
      setSubmitting(true)
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          ...formData
        })
      })

      if (res.ok) {
        setSuccessMessage('Feedback submitted successfully!')
        setFormData({ category: '', subject: '', message: '', priority: 'MEDIUM' })
        setShowSubmitForm(false)
        setTimeout(() => setSuccessMessage(null), 3000)
        fetchFeedback()
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        fetchFeedback()
      }
    } catch (error) {
      console.error('Error updating feedback status:', error)
    }
  }

  return (
    <div className="font-archivo min-h-screen bg-linear-to-br from-[#0a0a0a] to-[#111111]">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Top bar */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between px-6 border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 text-white/40 hover:text-white transition-colors" />
              <div className="w-px h-4 bg-white/10" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard" className="text-white/50 hover:text-white/80 transition-colors">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-white/90 font-medium">Software Feedback</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-3">
              {successMessage && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#668e2b]/10 border border-[#668e2b]/20 text-[#668e2b] text-sm animate-in slide-in-from-right">
                  <CheckCircle2 className="h-4 w-4" />
                  {successMessage}
                </div>
              )}
              <Dialog open={showSubmitForm} onOpenChange={setShowSubmitForm}>
                <DialogTrigger>
                  <Button className="bg-linear-to-r from-[#668e2b] text-white font-bold to-[#668e2b] hover:from-[#557a25] hover:to-[#557a25] shadow-lg shadow-[#668e2b]/20 border border-[#668e2b]/30">
                    <Plus className="h-4 w-4 mr-2" />
                    New Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0a0a0a] border border-white/[0.08] text-white max-w-2xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">Submit Software Feedback</DialogTitle>
                    <DialogDescription className="text-white/50">
                      Help us improve the Burn Box Operations Hub by sharing your feedback, suggestions, or bug reports.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-11 focus:ring-2 focus:ring-[#668e2b]/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/[0.08] shadow-xl">
                          {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/5 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-md ${option.bg} ${option.border}`}>
                                  {React.createElement(option.icon, { className: "h-4 w-4", style: { color: option.color } })}
                                </div>
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Subject</Label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief summary of your feedback"
                        className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-11 focus:ring-2 focus:ring-[#668e2b]/20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Message</Label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Provide detailed information about your feedback..."
                        rows={6}
                        className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 resize-none focus:ring-2 focus:ring-[#668e2b]/20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-11 focus:ring-2 focus:ring-[#668e2b]/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/[0.08] shadow-xl">
                          {PRIORITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/5 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: option.color }} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={submitting || !formData.category || !formData.subject || !formData.message}
                        className="bg-linear-to-r from-[#668e2b] to-[#668e2b] hover:from-[#557a25] hover:to-[#557a25] shadow-lg shadow-[#668e2b]/20 border border-[#668e2b]/30 h-11"
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Submit Feedback
                          </div>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowSubmitForm(false)}
                        className="text-white/60 hover:text-white hover:bg-white/5 h-11"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Main content */}
          <main className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Software Feedback</h1>
              <p className="text-white/50">Submit, track, and manage feedback for the Burn Box Operations Hub</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-linear-to-br from-[#0f0f0f] to-[#141414] rounded-xl p-5 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-sm mb-1">Total Feedback</p>
                    <p className="text-2xl font-bold text-white">{feedbackList.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="bg-linear-to-br from-[#0f0f0f] to-[#141414] rounded-xl p-5 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-sm mb-1">Open</p>
                    <p className="text-2xl font-bold text-white">{feedbackList.filter(f => f.status === 'OPEN').length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                </div>
              </div>
              <div className="bg-linear-to-br from-[#0f0f0f] to-[#141414] rounded-xl p-5 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-sm mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-white">{feedbackList.filter(f => f.status === 'IN_PROGRESS').length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="bg-linear-to-br from-[#0f0f0f] to-[#141414] rounded-xl p-5 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-sm mb-1">Resolved</p>
                    <p className="text-2xl font-bold text-white">{feedbackList.filter(f => f.status === 'RESOLVED').length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-white/40" />
                  <span className="text-sm text-white/50 font-medium">Filter by:</span>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36 bg-white/[0.04] border-white/[0.08] text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/[0.08] shadow-xl">
                    <SelectItem value="all" className="text-white">All Status</SelectItem>
                    <SelectItem value="OPEN" className="text-white">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS" className="text-white">In Progress</SelectItem>
                    <SelectItem value="RESOLVED" className="text-white">Resolved</SelectItem>
                    <SelectItem value="CLOSED" className="text-white">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-44 bg-white/[0.04] border-white/[0.08] text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/[0.08] shadow-xl">
                    <SelectItem value="all" className="text-white">All Categories</SelectItem>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Feedback List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="bg-linear-to-br from-[#0f0f0f] to-[#141414] rounded-xl border border-white/[0.08] p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-white/30" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No feedback yet</h3>
                <p className="text-white/40 mb-6">Be the first to share your thoughts and help us improve!</p>
                <Button onClick={() => setShowSubmitForm(true)} className="bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit First Feedback
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbackList.map((feedback) => {
                  const category = CATEGORY_OPTIONS.find(c => c.value === feedback.category)
                  const priority = PRIORITY_OPTIONS.find(p => p.value === feedback.priority)
                  const status = STATUS_STYLES[feedback.status as keyof typeof STATUS_STYLES]
                  const StatusIcon = status?.icon || AlertCircle
                  const CategoryIcon = category?.icon || MessageSquare

                  return (
                    <div key={feedback.id} className="bg-linear-to-br from-[#0f0f0f] to-[#141414] rounded-xl border border-white/[0.08] hover:border-white/[0.12] transition-all duration-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-2.5 rounded-lg ${category?.bg} ${category?.border} mt-1`}>
                              <CategoryIcon className="h-5 w-5" style={{ color: category?.color }} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold text-lg mb-2">{feedback.subject}</h3>
                              <div className="flex items-center gap-3 flex-wrap">
                                <Badge className={`${category?.bg} ${category?.border} text-white/80 text-xs font-medium`}>
                                  {category?.label}
                                </Badge>
                                <Badge className={`${priority?.bg} ${priority?.border} text-white/80 text-xs font-medium`}>
                                  {priority?.label} Priority
                                </Badge>
                                <span className="text-xs text-white/40">
                                  {new Date(feedback.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${status?.bg} ${status?.border} whitespace-nowrap`}>
                            <StatusIcon className="h-3.5 w-3.5" style={{ color: status?.color }} />
                            <span style={{ color: status?.color }}>{status?.label}</span>
                          </div>
                        </div>

                        <p className="text-white/60 text-sm leading-relaxed mb-5 pl-14">{feedback.message}</p>

                        <div className="flex items-center justify-between pl-14">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
                              <span className="text-sm font-semibold text-emerald-400">
                                {feedback.user?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm text-white/70 font-medium">{feedback.user?.name || 'Unknown User'}</p>
                              <p className="text-xs text-white/40">{feedback.user?.role || 'User'}</p>
                            </div>
                          </div>

                          {isAdmin && feedback.status !== 'RESOLVED' && feedback.status !== 'CLOSED' && (
                            <div className="flex items-center gap-2">
                              {feedback.status === 'OPEN' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(feedback.id, 'IN_PROGRESS')}
                                  className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 h-8"
                                >
                                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                                  Start Progress
                                </Button>
                              )}
                              {feedback.status === 'IN_PROGRESS' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(feedback.id, 'RESOLVED')}
                                  className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 h-8"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  Mark Resolved
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}