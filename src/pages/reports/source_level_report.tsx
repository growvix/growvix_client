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
import { 
    CalendarDays, 
    Clock, 
    Filter, 
    RotateCcw, 
    TrendingUp, 
    Users, 
    Target, 
    CheckCircle2, 
    Download,
    BarChart3,
    PieChart as PieChartIcon,
    Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import React from "react"
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

// Constants
const SOURCES = ["META", "Google", "Incoming Calls", "Magic Bricks", "Housing.com", "99 Acres", "Website"]
const PROJECTS = ["P1", "P2", "P3", "P4"]
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f472b6']
const BUDGET_INDICES = [0, 2, 8, 10, 12]

const chartConfig = {
    leads: {
        label: "Leads",
        color: "hsl(var(--primary))",
    },
    budget: {
        label: "Budget",
        color: "#3b82f6",
    },
} satisfies ChartConfig
const METRICS = [
    "Budget Spent", 
    "Number of Leads", 
    "CPL", 
    "RNR", 
    "Prospect", 
    "Unqualified", 
    "Lost", 
    "SV Scheduled", 
    "Cost per SV Scheduled", 
    "SV", 
    "Cost per SV", 
    "Booking", 
    "Cost per Booking"
]

// Static Raw Data Map (Indices correspond to METRICS above)
// Values: [Budget, Leads, CPL, RNR, Prospect, Unqual, Lost, SVS, CpSVS, SV, CpSV, Booking, CpBooking]
const MOCK_SOURCE_DATA: any = {
    "META": {
        "P1": [12000, 120, 100, 45, 50, 5, 6, 4, 3000, 7, 1714, 3, 4000],
        "P2": [8000, 81, 98, 30, 35, 2, 4, 3, 2666, 5, 1600, 2, 4000],
        "P3": [6000, 64, 93, 25, 28, 1, 3, 2, 3000, 4, 1500, 1, 6000],
        "P4": [4000, 41, 97, 15, 18, 1, 2, 1, 4000, 3, 1333, 1, 4000]
    },
    "Google": {
        "P1": [15000, 103, 145, 40, 45, 4, 5, 4, 3750, 6, 2500, 2, 7500],
        "P2": [10000, 70, 142, 28, 30, 2, 3, 2, 5000, 4, 2500, 1, 10000],
        "P3": [8000, 51, 156, 20, 22, 1, 2, 1, 8000, 3, 2666, 1, 8000],
        "P4": [5000, 26, 192, 12, 12, 0, 1, 1, 5000, 2, 2500, 0, 0]
    },
    "Incoming Calls": {
        "P1": [0, 44, 0, 15, 20, 1, 2, 2, 0, 3, 0, 1, 0],
        "P2": [0, 30, 0, 10, 15, 1, 1, 1, 0, 2, 0, 0, 0],
        "P3": [0, 21, 0, 8, 10, 0, 1, 1, 0, 1, 0, 0, 0],
        "P4": [0, 11, 0, 5, 5, 0, 0, 0, 0, 1, 0, 0, 0]
    },
    "Magic Bricks": {
        "P1": [20000, 137, 145, 55, 60, 6, 8, 5, 4000, 9, 2222, 10, 2000],
        "P2": [15000, 104, 144, 40, 45, 4, 6, 4, 3750, 7, 2142, 10, 1500],
        "P3": [10000, 77, 129, 30, 35, 3, 4, 3, 3333, 5, 2000, 2, 5000],
        "P4": [8000, 54, 148, 22, 25, 2, 3, 2, 4000, 4, 2000, 1, 8000]
    },
    "Housing.com": {
        "P1": [11000, 99, 111, 30, 40, 5, 7, 6, 1833, 8, 1375, 3, 3666],
        "P2": [9000, 80, 112, 35, 40, 4, 5, 4, 2250, 6, 1500, 2, 4500],
        "P3": [7000, 64, 109, 25, 30, 2, 4, 3, 2333, 5, 1400, 2, 3500],
        "P4": [5000, 45, 111, 15, 20, 1, 3, 2, 2500, 3, 1666, 1, 5000]
    },
    "99 Acres": {
        "P1": [13000, 128, 101, 50, 55, 5, 6, 5, 2600, 7, 1857, 3, 4333],
        "P2": [10000, 92, 108, 35, 40, 3, 5, 4, 2500, 6, 1666, 2, 5000],
        "P3": [7500, 68, 110, 28, 32, 2, 4, 3, 2500, 5, 1500, 2, 3750],
        "P4": [4000, 36, 111, 15, 15, 1, 2, 1, 4000, 3, 1333, 0, 0]
    },
    "Website": {
        "P1": [0, 66, 0, 25, 30, 2, 3, 3, 0, 4, 0, 2, 0],
        "P2": [0, 47, 0, 18, 22, 1, 2, 2, 0, 3, 0, 1, 0],
        "P3": [0, 30, 0, 12, 15, 1, 1, 1, 0, 2, 0, 0, 0],
        "P4": [0, 24, 0, 10, 12, 0, 1, 1, 0, 1, 0, 0, 0]
    }
}

const PAID_SOURCES = ["META", "Google", "Magic Bricks", "Housing.com", "99 Acres"]
const NON_PAID_SOURCES = ["Website", "Incoming Calls"]

export default function SourceLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [sourceFilter, setSourceFilter] = useState("all")
    const [leadTypeFilter, setLeadTypeFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Source Level Report" },
        ])
    }, [setBreadcrumbs])

    const isFilterApplied = sourceFilter !== "all" || leadTypeFilter !== "all" || dateFilter !== "" || timeFilter !== ""

    const clearFilters = () => {
        setSourceFilter("all")
        setLeadTypeFilter("all")
        setDateFilter("")
        setTimeFilter("")
    }

    const handleApply = () => {
        // isApplied is removed, but we keep this for the button if needed, or remove button
    }

    // Helper to calculate rates correctly for totals
    const calculateRates = (dataArray: number[]) => {
        const budget = dataArray[0]
        const leads = dataArray[1]
        const svs = dataArray[7]
        const sv = dataArray[9]
        const booking = dataArray[11]

        dataArray[2] = leads > 0 ? Math.round(budget / leads) : 0 // CPL
        dataArray[8] = svs > 0 ? Math.round(budget / svs) : 0 // CpSVS
        dataArray[10] = sv > 0 ? Math.round(budget / sv) : 0 // CpSV
        dataArray[12] = booking > 0 ? Math.round(budget / booking) : 0 // CpBooking
        return dataArray
    }

    // Calculation Logic for Totals
    const { sourceTotals, globalSummary } = useMemo(() => {
        const totalsMap: any = {}
        const allSources = [...PAID_SOURCES, ...NON_PAID_SOURCES]
        let gLeads = 0, gProspects = 0, gSV = 0, gBookings = 0;
        const leadMultiplier = leadTypeFilter === "all" ? 1.0 : leadTypeFilter === "new" ? 0.7 : 0.3

        allSources.forEach(source => {
            const colTotals = Array(METRICS.length).fill(0)
            PROJECTS.forEach(proj => {
                const projectData = MOCK_SOURCE_DATA[source][proj].map((v: number, i: number) => 
                    // Apply multiplier to count columns, but not to rates (CPL etc calculated later)
                    ![2, 8, 10, 12, 0].includes(i) ? v * leadMultiplier : v
                )
                METRICS.forEach((_, colIdx) => {
                    // Sum vertical counts
                    if (![2, 8, 10, 12].includes(colIdx)) {
                        colTotals[colIdx] += Math.round(projectData[colIdx])
                    }
                })
            })
            // Recalculate rates for the source total
            totalsMap[source] = calculateRates(colTotals)

            const matchesSource = sourceFilter === "all" || sourceFilter === source
            if (matchesSource) {
                gLeads += colTotals[1]
                gProspects += colTotals[4]
                gSV += colTotals[9]
                gBookings += colTotals[11]
            }
        })

        return { 
            sourceTotals: totalsMap, 
            globalSummary: { totalLeads: gLeads, totalProspects: gProspects, totalSV: gSV, totalBookings: gBookings } 
        }
    }, [sourceFilter, leadTypeFilter])

    const getGroupData = (sourceList: string[]) => {
        const filtered = sourceList.filter(s => sourceFilter === "all" || s === sourceFilter)
        if (filtered.length === 0) return null

        const grandTotal = Array(METRICS.length).fill(0)
        filtered.forEach(source => {
            const data = sourceTotals[source]
            METRICS.forEach((_, i) => {
                if (![2, 8, 10, 12].includes(i)) grandTotal[i] += data[i]
            })
        })
        return { sources: filtered, total: calculateRates(grandTotal) }
    }

    const paidData = getGroupData(PAID_SOURCES)
    const nonPaidData = getGroupData(NON_PAID_SOURCES)

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new()
        const rows = []
        rows.push(["Source Level Performance Report"])
        rows.push(["Generated At:", new Date().toLocaleString()])
        rows.push([])

        const hideBudget = leadTypeFilter !== "all" // Budget is shown for the integrated 'All Types' view but hidden for segments

        const addTableToExcel = (title: string, group: any) => {
            if (!group) return
            const isNonPaid = title === "NON-PAID SOURCES"
            const hideBudgetInThisTable = hideBudget || isNonPaid
            
            rows.push([title])
            const headers = ["Source", ...METRICS.filter((_, i) => !(hideBudgetInThisTable && BUDGET_INDICES.includes(i)))]
            rows.push(headers)
            
            group.sources.forEach((s: string) => {
                const sourceData = sourceTotals[s]
                const row = [s]
                METRICS.forEach((_, i) => {
                    if (hideBudgetInThisTable && BUDGET_INDICES.includes(i)) return
                    const val = sourceData[i]
                    row.push(BUDGET_INDICES.includes(i) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN'))
                })
                rows.push(row)
            })
            const totalRow = ["GRAND TOTAL"]
            METRICS.forEach((_, i) => {
                if (hideBudgetInThisTable && BUDGET_INDICES.includes(i)) return
                const val = group.total[i]
                totalRow.push(BUDGET_INDICES.includes(i) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN'))
            })
            rows.push(totalRow)
            rows.push([])
        }

        addTableToExcel("PAID SOURCES", paidData)
        addTableToExcel("NON-PAID SOURCES", nonPaidData)

        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "Source Report")
        XLSX.writeFile(wb, `Source_Level_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const renderTable = (title: string, groupData: any, colorClass: string) => {
        if (!groupData) return null
        const hideBudget = leadTypeFilter !== "all" 
        const isNonPaid = title === "NON-PAID SOURCES"
        const hideBudgetInThisTable = hideBudget || isNonPaid
        const displayMetrics = METRICS.filter((_, i) => !(hideBudgetInThisTable && BUDGET_INDICES.includes(i)))

        return (
            <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden mb-8">
                <CardHeader className="bg-muted/5 py-4 border-b">
                    <div className="flex items-center justify-between px-2">
                        <CardTitle className={`text-lg font-bold tracking-tight flex items-center gap-2 ${colorClass}`}>
                            {title}
                            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">LIVE</Badge>
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted/10 border-b border-primary/10">
                                    <th className="font-extrabold text-[11px] uppercase tracking-widest text-left px-6 py-4 border-r border-muted/20">Source</th>
                                    {displayMetrics.map((m, idx) => (
                                        <th key={m} className={`font-extrabold text-[11px] uppercase tracking-widest text-center min-w-[110px] py-4 align-bottom ${idx < displayMetrics.length - 1 ? 'border-r border-muted/20' : ''}`}>
                                            {m}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-background">
                                {groupData.sources.map((source: string) => (
                                    <tr key={source} className="group hover:bg-primary/5 transition-all duration-200 border-b">
                                        <td className="font-bold px-6 py-4 text-sm text-foreground border-r border-muted/20 dark:bg-black group-hover:bg-primary/5 uppercase">
                                            {source}
                                        </td>
                                        {sourceTotals[source].map((val: number, vIdx: number) => {
                                            if (hideBudgetInThisTable && BUDGET_INDICES.includes(vIdx)) return null
                                            return (
                                                <td key={vIdx} className={`text-center px-4 py-4 text-xs font-medium ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'font-bold text-primary bg-primary/5 italic' : ''}`}>
                                                    {BUDGET_INDICES.includes(vIdx) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN')}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                                {/* Grand Total Row */}
                                <tr className="bg-primary/5 font-bold border-t-2 border-primary/20">
                                    <td className="px-6 py-4 text-sm uppercase tracking-wider text-primary">
                                        GRAND TOTAL
                                    </td>
                                    {groupData.total.map((val: number, vIdx: number) => {
                                        if (hideBudgetInThisTable && BUDGET_INDICES.includes(vIdx)) return null
                                        return (
                                            <td key={vIdx} className={`text-center px-4 py-4 text-xs ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'bg-primary/10 text-primary' : 'text-primary'}`}>
                                                {BUDGET_INDICES.includes(vIdx) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN')}
                                            </td>
                                        )
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex flex-col gap-1 items-start text-left">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic text-left items-start text-left items-start">
                    Source Level Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Spend vs Performance breakdown for paid and organic channels.
                </p>
            </div>

            {/* Filters Row */}
            <Card className="border-none shadow-md bg-background/80 backdrop-blur-md sticky top-12 z-30 ring-1 ring-border/50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Filter className="h-3 w-3" />
                                Source Channel
                            </Label>
                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none hover:bg-muted/50 transition-colors">
                                    <SelectValue placeholder="All Sources" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Channels</SelectItem>
                                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                Lead Type
                            </Label>
                            <Select value={leadTypeFilter} onValueChange={setLeadTypeFilter}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none hover:bg-muted/50 transition-colors">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="new">New Lead</SelectItem>
                                    <SelectItem value="reengaged">Re-engaged Lead</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <CalendarDays className="h-3 w-3" />
                                Date Range
                            </Label>
                            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-10 bg-muted/30 border-none hover:bg-muted/50 transition-colors" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Action Time
                            </Label>
                            <Input type="time" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="h-10 bg-muted/30 border-none hover:bg-muted/50 transition-colors" />
                        </div>
                    </div>

                    <div className="flex justify-end mt-6 gap-3">
                        {isFilterApplied && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 text-xs h-9 hover:bg-red-500/10 hover:text-red-600 transition-colors">
                                <RotateCcw className="h-4 w-4" /> Reset
                            </Button>
                        )}
                        <Button onClick={handleDownloadExcel} variant="outline" className="h-9 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-bold shadow-sm">
                            <Download className="h-4 w-4 mr-2" /> Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary & Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 border-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-blue-600/70 dark:text-blue-400/70 uppercase">Total Leads</p>
                            <h3 className="text-2xl font-bold">{globalSummary.totalLeads}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30 border-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Target className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-purple-600/70 dark:text-purple-400/70 uppercase">Total Prospects</p>
                            <h3 className="text-2xl font-bold">{globalSummary.totalProspects}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 border-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-amber-600/70 dark:text-amber-400/70 uppercase">SV Done</p>
                            <h3 className="text-2xl font-bold">{globalSummary.totalSV}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 border-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70 uppercase">Final Booking</p>
                            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{globalSummary.totalBookings}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-left items-start">
                            <PieChartIcon className="h-4 w-4 text-blue-500" />
                            Leads Distribution by Source
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <PieChart>
                                <Pie
                                    data={Object.keys(sourceTotals)
                                        .filter(s => sourceFilter === "all" || s === sourceFilter)
                                        .map(s => ({ name: s, value: sourceTotals[s][1] }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {Object.keys(sourceTotals).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-left items-start">
                            <BarChart3 className="h-4 w-4 text-emerald-500" />
                            Budget vs Leads Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <BarChart
                                data={Object.keys(sourceTotals)
                                    .filter(s => sourceFilter === "all" || s === sourceFilter)
                                    .map(s => ({ 
                                        name: s, 
                                        budget: sourceTotals[s][0] / 100, 
                                        leads: sourceTotals[s][1] 
                                    }))}
                                margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <ChartTooltip 
                                    content={<ChartTooltipContent />}
                                    formatter={(value: any, name: string) => name === 'budget' ? [`₹${(value * 100).toLocaleString()}`, "Budget"] : [value, "Leads"]}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="budget" fill="var(--color-budget)" radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="leads" fill="var(--color-leads)" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="animate-in fade-in slide-in-from-top-6 duration-700">
                {renderTable("PAID SOURCES", paidData, "text-blue-600 dark:text-blue-400")}
                {renderTable("NON-PAID SOURCES", nonPaidData, "text-emerald-600 dark:text-emerald-400")}
            </div>
        </div>
    )
}
