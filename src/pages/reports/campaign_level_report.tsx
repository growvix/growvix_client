import { useEffect, useState, useMemo } from "react"
import * as XLSX from "xlsx"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarDays, Clock, Filter, RotateCcw, TrendingUp, Users, Target, CheckCircle2, ChevronDown, Download, BarChart3, PieChart as PieChartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
} from 'recharts'
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f472b6']

const chartConfig = {
    leads: {
        label: "Leads",
        color: "#3b82f6",
    },
    prospects: {
        label: "Prospects",
        color: "#8b5cf6",
    },
    sv: {
        label: "SV Done",
        color: "#f59e0b",
    },
    bookings: {
        label: "Bookings",
        color: "#10b981",
    },
    hot: {
        label: "Hot Leads",
        color: "#ef4444",
    },
    warm: {
        label: "RNR/Warm",
        color: "#f59e0b",
    },
    unqualified: {
        label: "Unqualified/Lost",
        color: "#94a3b8",
    },
} satisfies ChartConfig

// Metrics for Online/Offline/CP (Structured by Lead Type)
const ONLINE_DATA = {
    budget: 800000,
    new: { leads: 200, prospect: 80, rnr: 40, unqualified: 15, lost: 20, svs: 18, sv: 12, booking: 15 },
    reengaged: { leads: 100, prospect: 40, rnr: 25, unqualified: 10, lost: 10, svs: 10, sv: 5, booking: 5 }
}

const OFFLINE_DATA = {
    budget: 1000000,
    new: { leads: 152, prospect: 60, rnr: 30, unqualified: 10, lost: 15, svs: 12, sv: 10, booking: 15 },
    reengaged: { leads: 113, prospect: 40, rnr: 25, unqualified: 10, lost: 10, svs: 10, sv: 8, booking: 5 }
}

const CP_DATA = {
    budget: 0, // CP usually doesnt have direct budget spent in this context
    new: { leads: 200, prospect: 100, rnr: 50, unqualified: 10, lost: 20, svs: 10, sv: 5, booking: 5 },
    reengaged: { leads: 135, prospect: 50, rnr: 30, unqualified: 10, lost: 20, svs: 10, sv: 10, booking: 5 }
}

const FULL_COLUMNS = ["BUDGET SPENT", "NO. OF LEADS", "CPL", "RNR", "PROSPECT", "UNQUALIFIED", "LOST", "SVS", "COST PER SVS", "SV", "COST PER SV", "BOOKING", "COST PER BOOKING"]
const REDUCED_COLUMNS = ["NO. OF LEADS", "PROSPECT", "RNR", "UNQUALIFIED", "LOST", "SVS", "SV DONE", "BOOKING", "COST PER BOOKING"]
const LEAD_ONLY_COLUMNS = ["NO. OF LEADS", "PROSPECT", "RNR", "UNQUALIFIED", "LOST", "SVS", "SV DONE", "BOOKING"]
const CP_COLUMNS = ["NO. OF LEADS", "RNR", "PROSPECT", "UNQUALIFIED", "LOST", "SVS", "SV", "BOOKING"]

const campaignFilterMap: Record<string, string> = {
    "none": "Campaign Report",
    "online": "Online Report",
    "offline": "Offline Report",
    "cp": "Channel Partner Report",
    "all_responses": "All Responses - Combined View",
}

export default function CampaignLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [campaignFilter, setCampaignFilter] = useState("all_responses")
    const [leadType, setLeadType] = useState("all") // Default to All Types
    const [dateFilter, setDateFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Campaign Level Report" },
        ])
    }, [setBreadcrumbs])

    const isFilterApplied = campaignFilter !== "none" || dateFilter !== "" || timeFilter !== "" || leadType !== "all"

    const clearFilters = () => {
        setCampaignFilter("all_responses")
        setLeadType("all")
        setDateFilter("")
        setTimeFilter("")
    }

    // Determine which columns to show based on filter state rules
    const activeColumns = useMemo(() => {
        if (campaignFilter === "cp") return CP_COLUMNS;

        const isDefaultSource = campaignFilter === "none" || campaignFilter === "all_responses";
        const isSpecificType = leadType === "new" || leadType === "reengaged";

        // Case: Source selecting All Responses + Lead Type selecting All Types
        if (isDefaultSource && leadType === "all") return FULL_COLUMNS;

        // Case: Only Lead Type filter selected (Default/None source)
        if (isDefaultSource) return LEAD_ONLY_COLUMNS;
        
        // Case: Source (Online/Offline) + Specific Lead Type Selected
        if (!isDefaultSource && isSpecificType) return REDUCED_COLUMNS;

        return FULL_COLUMNS;
    }, [campaignFilter, leadType]);

    // Helper to sum new + reengaged
    const combineLeadTypes = (sourceData: any) => ({
        budget: sourceData.budget,
        leads: sourceData.new.leads + sourceData.reengaged.leads,
        rnr: sourceData.new.rnr + sourceData.reengaged.rnr,
        prospect: sourceData.new.prospect + sourceData.reengaged.prospect,
        unqualified: sourceData.new.unqualified + sourceData.reengaged.unqualified,
        lost: sourceData.new.lost + sourceData.reengaged.lost,
        svs: sourceData.new.svs + sourceData.reengaged.svs,
        sv: sourceData.new.sv + sourceData.reengaged.sv,
        booking: sourceData.new.booking + sourceData.reengaged.booking
    })
    
    // Helper to extract specific lead type
    const extractLeadType = (sourceData: any, type: "new" | "reengaged") => ({
        budget: sourceData.budget,
        ...sourceData[type]
    })

    const activeData = useMemo(() => {
        // 1. Get the base data depending on source
        let baseData = null;
        if (campaignFilter === "online") baseData = ONLINE_DATA;
        if (campaignFilter === "offline") baseData = OFFLINE_DATA;
        if (campaignFilter === "cp") baseData = CP_DATA;
        
        // 2. If All Responses/None (Source) is selected, combine Online + Offline first
        if (campaignFilter === "all_responses" || campaignFilter === "none") {
            const combinedSource = {
                budget: ONLINE_DATA.budget + OFFLINE_DATA.budget,
                new: {
                    leads: ONLINE_DATA.new.leads + OFFLINE_DATA.new.leads,
                    rnr: ONLINE_DATA.new.rnr + OFFLINE_DATA.new.rnr,
                    prospect: ONLINE_DATA.new.prospect + OFFLINE_DATA.new.prospect,
                    unqualified: ONLINE_DATA.new.unqualified + OFFLINE_DATA.new.unqualified,
                    lost: ONLINE_DATA.new.lost + OFFLINE_DATA.new.lost,
                    svs: ONLINE_DATA.new.svs + OFFLINE_DATA.new.svs,
                    sv: ONLINE_DATA.new.sv + OFFLINE_DATA.new.sv,
                    booking: ONLINE_DATA.new.booking + OFFLINE_DATA.new.booking
                },
                reengaged: {
                    leads: ONLINE_DATA.reengaged.leads + OFFLINE_DATA.reengaged.leads,
                    rnr: ONLINE_DATA.reengaged.rnr + OFFLINE_DATA.reengaged.rnr,
                    prospect: ONLINE_DATA.reengaged.prospect + OFFLINE_DATA.reengaged.prospect,
                    unqualified: ONLINE_DATA.reengaged.unqualified + OFFLINE_DATA.reengaged.unqualified,
                    lost: ONLINE_DATA.reengaged.lost + OFFLINE_DATA.reengaged.lost,
                    svs: ONLINE_DATA.reengaged.svs + OFFLINE_DATA.reengaged.svs,
                    sv: ONLINE_DATA.reengaged.sv + OFFLINE_DATA.reengaged.sv,
                    booking: ONLINE_DATA.reengaged.booking + OFFLINE_DATA.reengaged.booking
                }
            }
            baseData = combinedSource;
        }

        if (!baseData) return null;

        // 3. Apply the Lead Type filter
        if (leadType === "all") {
            return combineLeadTypes(baseData);
        } else {
            return extractLeadType(baseData, leadType as "new" | "reengaged");
        }
    }, [campaignFilter, leadType])

    // CP Data logic update (keep for summary card / independent calc)
    const cpActiveData = useMemo(() => {
        if (leadType === "all") return combineLeadTypes(CP_DATA);
        return extractLeadType(CP_DATA, leadType as "new" | "reengaged");
    }, [leadType])

    // Calculation Helpers
    const calculateMetrics = (data: any) => {
        if (!data) return null
        return {
            ...data,
            cpl: data.leads > 0 ? Math.round(data.budget / data.leads) : 0,
            costPerSVS: data.svs > 0 ? Math.round(data.budget / data.svs) : 0,
            costPerSV: data.sv > 0 ? Math.round(data.budget / data.sv) : 0,
            costPerBooking: data.booking > 0 ? Math.round(data.budget / data.booking) : 0
        }
    }

    const metrics = useMemo(() => calculateMetrics(activeData), [activeData])

    // Summary stats for the top cards
    const summaryStats = useMemo(() => {
        if (!activeData) return { totalLeads: 0, totalProspects: 0, totalSVDone: 0, totalBookings: 0 }
        return {
            totalLeads: activeData.leads,
            totalProspects: activeData.prospect,
            totalSVDone: activeData.svs,
            totalBookings: activeData.booking
        }
    }, [activeData])

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new()
        const rows = [
            ["Campaign Level Performance Report"],
            ["Response Source:", campaignFilterMap[campaignFilter] || campaignFilter],
            ["Lead Type:", leadType === "all" ? "All Types" : leadType === "new" ? "New Leads" : "Re-engaged Leads"],
            ["Generated At:", new Date().toLocaleString()],
            [],
            activeColumns
        ]

        if (metrics) {
            const dataRow = activeColumns.map(col => {
                if (col === "BUDGET SPENT") return `₹${metrics.budget.toLocaleString('en-IN')}`;
                if (col === "NO. OF LEADS") return metrics.leads.toLocaleString('en-IN');
                if (col === "CPL") return `₹${metrics.cpl.toLocaleString('en-IN')}`;
                if (col === "RNR") return metrics.rnr.toLocaleString('en-IN');
                if (col === "PROSPECT") return metrics.prospect.toLocaleString('en-IN');
                if (col === "UNQUALIFIED") return metrics.unqualified.toLocaleString('en-IN');
                if (col === "LOST") return metrics.lost.toLocaleString('en-IN');
                if (col === "SVS") return metrics.svs.toLocaleString('en-IN');
                if (col === "COST PER SVS") return `₹${metrics.costPerSVS.toLocaleString('en-IN')}`;
                if (col === "SV" || col === "SV DONE") return metrics.sv.toLocaleString('en-IN');
                if (col === "COST PER SV") return `₹${metrics.costPerSV.toLocaleString('en-IN')}`;
                if (col === "BOOKING") return metrics.booking.toLocaleString('en-IN');
                if (col === "COST PER BOOKING") return `₹${metrics.costPerBooking.toLocaleString('en-IN')}`;
                return "";
            });
            rows.push(dataRow);
        }

        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "Campaign Report")

        if ((campaignFilter === "all_responses" || campaignFilter === "none") && cpActiveData) {
            const cpRows = [
                ["Channel Partner (CP) Report"],
                [],
                CP_COLUMNS,
                [
                    cpActiveData.leads.toLocaleString('en-IN'),
                    cpActiveData.rnr.toLocaleString('en-IN'),
                    cpActiveData.prospect.toLocaleString('en-IN'),
                    cpActiveData.unqualified.toLocaleString('en-IN'),
                    cpActiveData.lost.toLocaleString('en-IN'),
                    cpActiveData.svs.toLocaleString('en-IN'),
                    cpActiveData.sv.toLocaleString('en-IN'),
                    cpActiveData.booking.toLocaleString('en-IN')
                ]
            ]
            const cpWs = XLSX.utils.aoa_to_sheet(cpRows)
            XLSX.utils.book_append_sheet(wb, cpWs, "CP Report")
        }

        XLSX.writeFile(wb, `Campaign_Level_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">Campaign Level Report</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Comprehensive lead analytics and conversion tracking.
                    </p>
                </div>
                {isFilterApplied && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2 text-xs h-8">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset All
                    </Button>
                )}
            </div>

            {/* Filters Row */}
            <Card className="border-none shadow-md bg-background/60 backdrop-blur-md">
                <CardContent className="p-6">
                    <div className="flex flex-wrap items-end gap-6">
                        {/* Campaign Filter */}
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Filter className="h-3 w-3" />
                                Response Source
                            </Label>
                            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none hover:bg-muted/50 transition-colors">
                                    <SelectValue placeholder="Select Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                    <SelectItem value="cp">CP</SelectItem>
                                    <SelectItem value="all_responses">All Responses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* New Lead Type Filter */}
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                Lead Type
                            </Label>
                            <Select value={leadType} onValueChange={setLeadType}>
                                <SelectTrigger className="h-10 bg-emerald-500/10 text-emerald-700 border-none hover:bg-emerald-500/20 transition-colors font-semibold">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New Leads</SelectItem>
                                    <SelectItem value="reengaged">Re-engaged Leads</SelectItem>
                                    <SelectItem value="all">All Types</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Filter */}
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <CalendarDays className="h-3 w-3" />
                                Date Range
                            </Label>
                            <Input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="h-10 bg-muted/30 border-none hover:bg-muted/50 transition-colors"
                            />
                        </div>

                        {/* Time Filter */}
                        <div className="flex flex-col gap-2 min-w-[180px]">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Specific Time
                            </Label>
                            <Input
                                type="time"
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                className="h-10 bg-muted/30 border-none hover:bg-muted/50 transition-colors"
                            />
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-blue-600/70 dark:text-blue-400/70 uppercase">Total Leads</p>
                                <h3 className="text-2xl font-bold">{summaryStats.totalLeads.toLocaleString('en-IN')}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Target className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-purple-600/70 dark:text-purple-400/70 uppercase">Total Prospects</p>
                                <h3 className="text-2xl font-bold">{summaryStats.totalProspects}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-amber-600/70 dark:text-amber-400/70 uppercase">SV Completed</p>
                                <h3 className="text-2xl font-bold">{summaryStats.totalSVDone}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70 uppercase">Final Bookings</p>
                                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summaryStats.totalBookings.toLocaleString('en-IN')}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            {/* Visual Analytics Section */}
            {activeData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-muted/5 py-4 border-b">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Campaign Conversion Funnel
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-[350px]">
                            <ChartContainer config={chartConfig} className="h-full">
                                <BarChart
                                    data={[
                                        { name: 'Leads', value: activeData.leads, fill: 'var(--color-leads)' },
                                        { name: 'Prospects', value: activeData.prospect, fill: 'var(--color-prospects)' },
                                        { name: 'SV Done', value: activeData.sv, fill: 'var(--color-sv)' },
                                        { name: 'Bookings', value: activeData.booking, fill: 'var(--color-bookings)' }
                                    ]}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-muted/5 py-4 border-b">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4 text-purple-500" />
                                Lead Quality Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-[350px]">
                            <ChartContainer config={chartConfig} className="h-full">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'hot', value: activeData.prospect, fill: 'var(--color-hot)' },
                                            { name: 'warm', value: activeData.rnr, fill: 'var(--color-warm)' },
                                            { name: 'unqualified', value: activeData.unqualified + activeData.lost, fill: 'var(--color-unqualified)' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${chartConfig[name as keyof typeof chartConfig].label} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        <Cell fill="var(--color-hot)" />
                                        <Cell fill="var(--color-warm)" />
                                        <Cell fill="var(--color-unqualified)" />
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Report Table Section */}
            <div className="flex flex-col gap-12">
                    {/* Table 1: Campaign Report */}
                    {(campaignFilter === "online" || campaignFilter === "offline" || campaignFilter === "cp" || campaignFilter === "all_responses" || campaignFilter === "none") && (
                        <Card className="border-none shadow-xl animate-in fade-in slide-in-from-top-6 duration-700 bg-background/40 backdrop-blur-sm">
                            <CardHeader className="bg-muted/5 py-3 border-b">
                                <div className="flex items-center justify-between px-2">
                                    <div>
                                        <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                            Campaign Report
                                            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">LIVE</Badge>
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            Aggregated performance metrics based on spending and conversion.
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 text-xs h-8 font-semibold bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    Download Report
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Download</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to download the Campaign Level Report in Excel format?
                                                        The file will include current filtering based on Response Category and Date/Time selection.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDownloadExcel}>Confirm</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full ring-1 ring-border shadow-sm">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Data Updated: Just now
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/20">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-muted/5 border-b-2 border-primary/10">
                                            {/* Row 1: Top grid row for layout accuracy */}
                                            <tr className="h-5 border-none">
                                                {activeColumns.map((col) => (
                                                    <th key={`grid-${col}`} className={`p-0 h-5 ${(col === "CPL" || col === "UNQUALIFIED" || col === "COST PER SVS" || col === "COST PER SV") ? 'border-r' : ''}`}></th>
                                                ))}
                                            </tr>
                                            {/* Row 2: Actual header labels */}
                                            <tr>
                                                {activeColumns.map((col) => (
                                                    <th key={col} className={`font-extrabold text-[11px] uppercase tracking-widest text-center text-primary/80 min-w-[110px] py-4 align-bottom ${(col === "CPL" || col === "UNQUALIFIED" || col === "COST PER SVS" || col === "COST PER SV") ? 'border-r' : ''}`}>
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-background">
                                            {metrics ? (
                                                <tr key="campaign-data-row" className="group hover:bg-primary/5 transition-all duration-200 border-b">
                                                    {activeColumns.length === FULL_COLUMNS.length ? (
                                                        // Full Table View (Case 1 & 3)
                                                        <>
                                                            <td className="text-center font-bold px-4 py-8 text-foreground border-r">₹{metrics.budget.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.leads.toLocaleString('en-IN')}</td>
                                                            <td className="text-center font-bold bg-primary/5 border-r px-4 py-8 text-primary">₹{metrics.cpl.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.rnr.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.prospect.toLocaleString('en-IN')}</td>
                                                            <td className="text-center border-r px-4 py-8 text-foreground">{metrics.unqualified.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.lost.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.svs.toLocaleString('en-IN')}</td>
                                                            <td className="text-center font-bold bg-primary/5 border-r px-4 py-8 text-primary">₹{metrics.costPerSVS.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.sv.toLocaleString('en-IN')}</td>
                                                            <td className="text-center font-bold bg-primary/5 border-r px-4 py-8 text-primary">₹{metrics.costPerSV.toLocaleString('en-IN')}</td>
                                                            <td className="text-center font-black text-primary px-4 py-8 border-r">{metrics.booking.toLocaleString('en-IN')}</td>
                                                            <td className="text-center font-bold bg-primary/10 px-4 py-8 text-primary">₹{metrics.costPerBooking.toLocaleString('en-IN')}</td>
                                                        </>
                                                    ) : campaignFilter === "cp" ? (
                                                        // CP Table View
                                                        <>
                                                            <td className="text-center font-bold px-4 py-8 text-foreground border-r">{metrics.leads.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.rnr.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.prospect.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.unqualified.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.lost.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.svs.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.sv.toLocaleString('en-IN')}</td>
                                                            <td className="text-center font-black text-primary px-4 py-8 border-r">{metrics.booking.toLocaleString('en-IN')}</td>
                                                        </>
                                                    ) : activeColumns.length === REDUCED_COLUMNS.length ? (
                                                        // Reduced Table View (Case 2: Source + Lead Type Selected)
                                                        <>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.leads.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.prospect.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.rnr.toLocaleString('en-IN')}</td>
                                                            <td className="text-center border-r px-4 py-8 text-foreground">{metrics.unqualified.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.lost.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.svs.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.sv.toLocaleString('en-IN')}</td>
                                                            <td className="text-center font-black text-primary px-4 py-8 border-r">{metrics.booking.toLocaleString('en-IN')}</td>
                                                            <td className="text-center font-bold bg-primary/10 px-4 py-8 text-primary">₹{metrics.costPerBooking.toLocaleString('en-IN')}</td>
                                                        </>
                                                    ) : (
                                                        // Lead Only View (Only lead type selected, no source)
                                                        <>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.leads.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.prospect.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.rnr.toLocaleString('en-IN')}</td>
                                                            <td className="text-center border-r px-4 py-8 text-foreground">{metrics.unqualified.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.lost.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.svs.toLocaleString('en-IN')}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.sv.toLocaleString('en-IN')}</td>
                                                            <td className="text-center font-black text-primary px-4 py-8 border-r">{metrics.booking.toLocaleString('en-IN')}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <td colSpan={activeColumns.length} className="text-center py-20 text-muted-foreground italic">
                                                        No metrics available for selected filter combination.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Table 2: CP Report */}
                    {(campaignFilter === "all_responses" || campaignFilter === "none") && (
                        <Card className="border-none shadow-xl animate-in fade-in slide-in-from-top-6 duration-700 bg-background/40 backdrop-blur-sm">
                            <CardHeader className="bg-muted/5 py-3 border-b">
                                <div>
                                    <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                        CP Report
                                        <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-primary/30 text-primary/70">CHANNEL PARTNER</Badge>
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        Performance breakdown for Channel Partner leads.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/20">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-muted/5 border-b-2 border-primary/10">
                                            <tr>
                                                {CP_COLUMNS.map((col) => (
                                                    <th key={col} className="font-extrabold text-[11px] uppercase tracking-widest text-center text-primary/80 min-w-[110px] py-6">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-background">
                                            <tr key="cp-data-row" className="group hover:bg-primary/5 transition-all duration-200 border-b">
                                                <td className="text-center font-bold px-4 py-8 text-foreground border-r">{cpActiveData.leads.toLocaleString('en-IN')}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.rnr.toLocaleString('en-IN')}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.prospect.toLocaleString('en-IN')}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.unqualified.toLocaleString('en-IN')}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.lost.toLocaleString('en-IN')}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.svs.toLocaleString('en-IN')}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.sv.toLocaleString('en-IN')}</td>
                                                <td className="text-center font-black text-primary px-4 py-8">{cpActiveData.booking.toLocaleString('en-IN')}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
            </div>
        </div>
    )
}
