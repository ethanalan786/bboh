"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Calendar,
    Download,
    Mail,
    RefreshCw,
    Send,
    FileText,
    DollarSign,
    Package,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Settings,
    Plus,
    X,
    Play,
    Pause
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";

interface WeeklyReportSummary {
    id: string;
    weekStart: string;
    weekEnd: string;
    generatedAt: string;
    sentAt: string | null;
    status: "PENDING" | "SENT" | "FAILED";
    recipients: string[];
    summary: {
        businessName: string;
        totalRevenue: number;
        grossProfit: number;
        grossMargin: number;
        beginningInventory: number;
        endingInventory: number;
        totalPurchases: number;
        totalWastage: number;
        unresolvedDiscrepancies: number;
    };
    reportData?: any; // Add full report data for debugging
}

export default function WeeklyReportsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: new Date(2026, 8, 1),
        to: new Date(2026, 8, 7),
    });
    const [reports, setReports] = useState<WeeklyReportSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<WeeklyReportSummary | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [schedulerSettings, setSchedulerSettings] = useState({
        enabled: false,
        schedule: '0 9 * * 1',
        recipients: [] as string[]
    });
    const [schedulePickerOpen, setSchedulePickerOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState('1'); // Default to Monday
    const [selectedHour, setSelectedHour] = useState('9'); // Default to 9 AM
    const [selectedMinute, setSelectedMinute] = useState('0'); // Default to 0 minutes
    const [showSchedulerSettings, setShowSchedulerSettings] = useState(false);
    const [newRecipient, setNewRecipient] = useState('');
    const [schedulerLoading, setSchedulerLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
            router.push("/dashboard/front-desk-role");
        }
    }, [status, session, router]);

    useEffect(() => {
        fetchReports();
        fetchSchedulerSettings();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/reports/weekly/history');
            if (!response.ok) throw new Error('Failed to fetch reports');

            const data = await response.json();
            setReports(data.reports || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async () => {
        if (!dateRange.from || !dateRange.to) {
            alert('Please select a date range');
            return;
        }

        setGenerating(true);
        try {
            const response = await fetch('/api/reports/weekly/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weekStart: dateRange.from.toISOString().split('T')[0],
                    weekEnd: dateRange.to.toISOString().split('T')[0]
                })
            });

            if (!response.ok) throw new Error('Failed to generate report');

            const data = await response.json();
            alert('Weekly report generated successfully!');
            fetchReports();
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const sendReport = async (reportId: string) => {
        setSending(reportId);
        try {
            const response = await fetch('/api/reports/weekly/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId })
            });

            if (!response.ok) throw new Error('Failed to send report');

            const data = await response.json();
            alert('Weekly report sent successfully!');
            fetchReports();
        } catch (error) {
            console.error('Error sending report:', error);
            alert('Failed to send report. Please try again.');
        } finally {
            setSending(null);
        }
    };

    const viewReportDetails = async (reportId: string) => {
        try {
            const response = await fetch(`/api/reports/weekly/${reportId}?id=${reportId}`);
            if (!response.ok) throw new Error('Failed to fetch report details');

            const data = await response.json();
            
            // Transform the full report to match the expected structure
            const reportData = data.report.reportData as any;
            const transformedReport = {
                id: data.report.id,
                weekStart: data.report.weekStart,
                weekEnd: data.report.weekEnd,
                generatedAt: data.report.generatedAt,
                sentAt: data.report.sentAt,
                status: data.report.status,
                recipients: data.report.recipients,
                summary: {
                    businessName: reportData?.metadata?.businessName || 'Burn Box',
                    totalRevenue: reportData?.sales?.combined?.netRevenue || 0,
                    grossProfit: reportData?.grossProfit?.total || 0,
                    grossMargin: reportData?.grossProfit?.margin || 0,
                    beginningInventory: reportData?.beginningInventory?.totalValue || 0,
                    endingInventory: reportData?.endingInventory?.totalValue || 0,
                    totalPurchases: reportData?.purchases?.totalSpend || 0,
                    totalWastage: reportData?.wastage?.costImpact || 0,
                    unresolvedDiscrepancies: reportData?.discrepancies?.unresolvedDiscrepancies || 0
                }
            };
            
            setSelectedReport(transformedReport);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching report details:', error);
            alert('Failed to fetch report details');
        }
    };

    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getDayName = (day: string) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[parseInt(day)] || 'Mon';
    };

    const getScheduleDescription = () => {
        const hour = parseInt(selectedHour);
        const minute = parseInt(selectedMinute);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        const dayName = getDayName(selectedDay);
        
        return `Every ${dayName} at ${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    };

    const fetchSchedulerSettings = async () => {
        try {
            const response = await fetch('/api/reports/weekly/scheduler');
            if (!response.ok) throw new Error('Failed to fetch scheduler settings');

            const data = await response.json();
            const schedule = data.schedule || '0 9 * * 1';
            
            // Parse the cron expression to set initial picker values
            const parts = schedule.split(' ');
            if (parts.length >= 5) {
                setSelectedMinute(parts[0] || '0');
                setSelectedHour(parts[1] || '9');
                setSelectedDay(parts[4] || '1');
            }
            
            setSchedulerSettings({
                enabled: data.enabled,
                schedule: schedule,
                recipients: JSON.parse(data.recipients || '[]')
            });
        } catch (error) {
            console.error('Error fetching scheduler settings:', error);
        }
    };

    const generateCronExpression = useCallback(() => {
        return `${selectedMinute} ${selectedHour} * * ${selectedDay}`;
    }, [selectedMinute, selectedHour, selectedDay]);

    // Update schedule when picker values change
    useEffect(() => {
        setSchedulerSettings(prev => ({
            ...prev,
            schedule: generateCronExpression()
        }));
    }, [selectedDay, selectedHour, selectedMinute, generateCronExpression]);

    const updateSchedulerSettings = async () => {
        setSchedulerLoading(true);
        try {
            // Generate cron expression from picker values
            const cronExpression = generateCronExpression();
            
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weeklyReportEnabled: schedulerSettings.enabled,
                    weeklyReportSchedule: cronExpression,
                    weeklyReportRecipients: JSON.stringify(schedulerSettings.recipients)
                })
            });

            if (!response.ok) throw new Error('Failed to update settings');

            // Restart scheduler if enabled and schedule changed
            if (schedulerSettings.enabled) {
                await fetch('/api/reports/weekly/scheduler', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'restart', schedule: cronExpression })
                });
            }

            alert('Scheduler settings updated successfully!');
            setShowSchedulerSettings(false);
            fetchSchedulerSettings();
        } catch (error) {
            console.error('Error updating scheduler settings:', error);
            alert('Failed to update scheduler settings. Please try again.');
        } finally {
            setSchedulerLoading(false);
        }
    };

    const addRecipient = () => {
        if (newRecipient && !schedulerSettings.recipients.includes(newRecipient)) {
            setSchedulerSettings({
                ...schedulerSettings,
                recipients: [...schedulerSettings.recipients, newRecipient]
            });
            setNewRecipient('');
        }
    };

    const removeRecipient = (email: string) => {
        setSchedulerSettings({
            ...schedulerSettings,
            recipients: schedulerSettings.recipients.filter(r => r !== email)
        });
    };

    const toggleScheduler = async () => {
        const newEnabled = !schedulerSettings.enabled;
        setSchedulerSettings({ ...schedulerSettings, enabled: newEnabled });

        try {
            const action = newEnabled ? 'start' : 'stop';
            const response = await fetch('/api/reports/weekly/scheduler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (!response.ok) throw new Error('Failed to toggle scheduler');

            // Also update settings
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weeklyReportEnabled: newEnabled
                })
            });

            alert(newEnabled ? 'Scheduler started successfully!' : 'Scheduler stopped successfully!');
        } catch (error) {
            console.error('Error toggling scheduler:', error);
            // Revert on error
            setSchedulerSettings({ ...schedulerSettings, enabled: !newEnabled });
            alert('Failed to toggle scheduler. Please try again.');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SENT':
                return <CheckCircle size={16} className="text-emerald-400" />;
            case 'FAILED':
                return <XCircle size={16} className="text-red-400" />;
            case 'PENDING':
            default:
                return <Clock size={16} className="text-yellow-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SENT':
                return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
            case 'FAILED':
                return 'bg-red-500/15 text-red-300 border-red-500/20';
            case 'PENDING':
            default:
                return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20';
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="font-archivo">
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-14 shrink-0 items-center gap-2 border-b">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="/dashboard/admin/reports">Reports</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Weekly Reports</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-6 px-4 sm:px-6 py-6">
                        {/* Page Header */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    Weekly Reports
                                </h1>
                                <p className="text-sm text-white/40">
                                    Generate and manage automatic weekly inventory and sales reports.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchReports}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw size={16} />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Generate Report Section */}
                        <div className="rounded-2xl bg-linear-to-br from-blue-950/20 to-blue-900/10 border border-blue-500/20 p-6">
                            <h2 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                                <FileText size={20} />
                                Generate New Weekly Report
                            </h2>

                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm text-white/60 mb-2">Week Period</label>
                                    <DateRangePicker
                                        value={dateRange}
                                        onChange={setDateRange}
                                        className="w-full"
                                    />
                                </div>
                                <button
                                    onClick={generateReport}
                                    disabled={generating}
                                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generating ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Calendar size={16} />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Scheduler Settings Section */}
                        <div className="rounded-2xl bg-linear-to-br from-purple-950/20 to-purple-900/10 border border-purple-500/20 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                                    <Settings size={20} />
                                    Automatic Scheduling
                                </h2>
                                <button
                                    onClick={toggleScheduler}
                                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                        schedulerSettings.enabled
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                                >
                                    {schedulerSettings.enabled ? (
                                        <>
                                            <Pause size={16} />
                                            Stop Scheduler
                                        </>
                                    ) : (
                                        <>
                                            <Play size={16} />
                                            Start Scheduler
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-xs text-white/50 mb-1">Status</p>
                                    <p className={`text-sm font-semibold ${schedulerSettings.enabled ? 'text-emerald-400' : 'text-white/60'}`}>
                                        {schedulerSettings.enabled ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-xs text-white/50 mb-1">Schedule</p>
                                    <p className="text-sm font-semibold text-white">
                                        {schedulerSettings.schedule === '0 9 * * 1' ? 'Monday 9:00 AM' : schedulerSettings.schedule}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-xs text-white/50 mb-1">Recipients</p>
                                    <p className="text-sm font-semibold text-white">
                                        {schedulerSettings.recipients.length} configured
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowSchedulerSettings(true)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors flex items-center gap-2"
                            >
                                <Settings size={16} />
                                Configure Settings
                            </button>
                        </div>

                        {/* Reports List */}
                        <div className="rounded-2xl bg-linear-to-br from-emerald-950/20 to-emerald-900/10 border border-emerald-500/20 p-6">
                            <h2 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                                <FileText size={20} />
                                Report History
                            </h2>

                            {reports.length === 0 ? (
                                <div className="text-center py-12 text-white/50">
                                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No weekly reports generated yet.</p>
                                    <p className="text-sm mt-2">Generate your first report using the form above.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reports.map((report) => (
                                        <div
                                            key={report.id}
                                            className="bg-[#0a0a0a] rounded-xl p-5 border border-white/6 hover:border-white/10 transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h3 className="text-base font-semibold text-white">
                                                            {format(new Date(report.weekStart), 'MMM d, yyyy')} - {format(new Date(report.weekEnd), 'MMM d, yyyy')}
                                                        </h3>
                                                        <span className={`text-xs px-2 py-1 rounded-md border ${getStatusColor(report.status)}`}>
                                                            <div className="flex items-center gap-1">
                                                                {getStatusIcon(report.status)}
                                                                {report.status}
                                                            </div>
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                        <div>
                                                            <p className="text-xs text-white/50">Total Revenue</p>
                                                            <p className="text-sm font-semibold text-white">{formatCurrency(report.summary.totalRevenue)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white/50">Gross Profit</p>
                                                            <p className="text-sm font-semibold text-emerald-400">{formatCurrency(report.summary.grossProfit)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white/50">Inventory Value</p>
                                                            <p className="text-sm font-semibold text-white">{formatCurrency(report.summary.endingInventory)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white/50">Discrepancies</p>
                                                            <p className={`text-sm font-semibold ${report.summary.unresolvedDiscrepancies > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                                {report.summary.unresolvedDiscrepancies}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-white/40">
                                                        <span>Generated: {format(new Date(report.generatedAt), 'MMM d, yyyy HH:mm')}</span>
                                                        {report.sentAt && (
                                                            <span>Sent: {format(new Date(report.sentAt), 'MMM d, yyyy HH:mm')}</span>
                                                        )}
                                                        {report.recipients.length > 0 && (
                                                            <span>Recipients: {report.recipients.length}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => viewReportDetails(report.id)}
                                                        className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                                                        title="View Details"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                    {report.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => sendReport(report.id)}
                                                            disabled={sending === report.id}
                                                            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-emerald-400 disabled:opacity-50"
                                                            title="Send Report"
                                                        >
                                                            {sending === report.id ? (
                                                                <RefreshCw size={18} className="animate-spin" />
                                                            ) : (
                                                                <Send size={18} />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* Detail Modal */}
            {showDetailModal && selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0a0a0a] rounded-xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    Weekly Report Details
                                </h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Report Metadata */}
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-white mb-3">Report Information</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-white/50">Business</p>
                                            <p className="text-white">{selectedReport.summary.businessName}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50">Period</p>
                                            <p className="text-white">
                                                {format(new Date(selectedReport.weekStart), 'MMM d, yyyy')} - {format(new Date(selectedReport.weekEnd), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-white/50">Generated</p>
                                            <p className="text-white">{format(new Date(selectedReport.generatedAt), 'MMM d, yyyy HH:mm')}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50">Status</p>
                                            <p className="text-white">{selectedReport.status}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign size={16} className="text-blue-400" />
                                            <p className="text-xs text-white/50">Total Revenue</p>
                                        </div>
                                        <p className="text-lg font-semibold text-white">{formatCurrency(selectedReport.summary.totalRevenue)}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign size={16} className="text-emerald-400" />
                                            <p className="text-xs text-white/50">Gross Profit</p>
                                        </div>
                                        <p className="text-lg font-semibold text-emerald-400">{formatCurrency(selectedReport.summary.grossProfit)}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package size={16} className="text-purple-400" />
                                            <p className="text-xs text-white/50">Inventory Value</p>
                                        </div>
                                        <p className="text-lg font-semibold text-white">{formatCurrency(selectedReport.summary.endingInventory)}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle size={16} className="text-yellow-400" />
                                            <p className="text-xs text-white/50">Discrepancies</p>
                                        </div>
                                        <p className={`text-lg font-semibold ${selectedReport.summary.unresolvedDiscrepancies > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {selectedReport.summary.unresolvedDiscrepancies}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-white mb-3">Additional Metrics</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-white/50">Gross Margin</p>
                                            <p className="text-white">{selectedReport.summary.grossMargin.toFixed(1)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50">Beginning Inventory</p>
                                            <p className="text-white">{formatCurrency(selectedReport.summary.beginningInventory)}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50">Total Purchases</p>
                                            <p className="text-white">{formatCurrency(selectedReport.summary.totalPurchases)}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50">Total Wastage</p>
                                            <p className="text-white">{formatCurrency(selectedReport.summary.totalWastage)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recipients */}
                                {selectedReport.recipients.length > 0 && (
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-white mb-3">Email Recipients</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedReport.recipients.map((email, index) => (
                                                <span key={index} className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">
                                                    {email}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scheduler Settings Modal */}
            {showSchedulerSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0a0a0a] rounded-xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    Scheduler Settings
                                </h2>
                                <button
                                    onClick={() => setShowSchedulerSettings(false)}
                                    className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Enable/Disable */}
                                <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Enable Automatic Reports</h3>
                                        <p className="text-xs text-white/50">Automatically generate and send weekly reports</p>
                                    </div>
                                    <button
                                        onClick={() => setSchedulerSettings({ ...schedulerSettings, enabled: !schedulerSettings.enabled })}
                                        className={`w-12 h-6 rounded-full transition-colors ${
                                            schedulerSettings.enabled ? 'bg-emerald-500' : 'bg-white/20'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                            schedulerSettings.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Schedule */}
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-white mb-3">Schedule</h3>
                                    
                                    {/* Current schedule display */}
                                    <div className="mb-4 p-3 bg-black/50 border border-white/10 rounded-lg">
                                        <p className="text-xs text-white/50 mb-1">Current Schedule:</p>
                                        <p className="text-sm font-mono text-white">{generateCronExpression()}</p>
                                        <p className="text-xs text-white/50 mt-1">
                                            {getScheduleDescription()}
                                        </p>
                                    </div>

                                    {/* Schedule Picker */}
                                    <div className="space-y-4">
                                        {/* Day of Week */}
                                        <div>
                                            <label className="text-xs text-white/70 mb-2 block">Day of Week</label>
                                            <div className="grid grid-cols-7 gap-2">
                                                {['0', '1', '2', '3', '4', '5', '6'].map((day) => (
                                                    <button
                                                        key={day}
                                                        onClick={() => setSelectedDay(day)}
                                                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                                                            selectedDay === day
                                                                ? 'bg-purple-500 text-white'
                                                                : 'bg-black/30 text-white/70 hover:bg-black/50'
                                                        }`}
                                                    >
                                                        {getDayName(day)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Hour */}
                                        <div>
                                            <label className="text-xs text-white/70 mb-2 block">Hour (12-hour format)</label>
                                            <div className="grid grid-cols-12 gap-2">
                                                {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map((hour) => (
                                                    <button
                                                        key={hour}
                                                        onClick={() => setSelectedHour(hour)}
                                                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                                                            selectedHour === hour
                                                                ? 'bg-purple-500 text-white'
                                                                : 'bg-black/30 text-white/70 hover:bg-black/50'
                                                        }`}
                                                    >
                                                        {hour}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Minute */}
                                        <div>
                                            <label className="text-xs text-white/70 mb-2 block">Minute</label>
                                            <div className="grid grid-cols-6 gap-2">
                                                {['0', '15', '30', '45'].map((minute) => (
                                                    <button
                                                        key={minute}
                                                        onClick={() => setSelectedMinute(minute)}
                                                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                                                            selectedMinute === minute
                                                                ? 'bg-purple-500 text-white'
                                                                : 'bg-black/30 text-white/70 hover:bg-black/50'
                                                        }`}
                                                    >
                                                        {minute}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recipients */}
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-white mb-3">Email Recipients</h3>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="email"
                                            value={newRecipient}
                                            onChange={(e) => setNewRecipient(e.target.value)}
                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="email@example.com"
                                        />
                                        <button
                                            onClick={addRecipient}
                                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {schedulerSettings.recipients.map((email, index) => (
                                            <span key={index} className="bg-white/10 px-3 py-1 rounded-full text-white/80 text-sm flex items-center gap-2">
                                                {email}
                                                <button
                                                    onClick={() => removeRecipient(email)}
                                                    className="hover:text-red-400 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowSchedulerSettings(false)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={updateSchedulerSettings}
                                        disabled={schedulerLoading}
                                        className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {schedulerLoading ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Settings size={16} />
                                                Save Settings
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}