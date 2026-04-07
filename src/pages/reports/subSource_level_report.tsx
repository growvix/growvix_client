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
    Layers,
    Share2,
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
    Legend,
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
const PAID_SOURCES = ["META", "Google", "Magic Bricks", "Housing.com", "99 Acres"]
const NON_PAID_SOURCES = ["Website", "Incoming Calls"]
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f472b6']
const BUDGET_INDICES = [0, 2, 8, 10, 12]

const chartConfig = {
    leads: {
        label: "Total Leads",
        color: "#3b82f6",
    },
    prospects: {
        label: "Total Prospects",
        color: "#8b5cf6",
    },
    others: {
        label: "Others",
        color: "#94a3b8",
    }
} satisfies ChartConfig

const SUBSOURCES: Record<string, string[]> = {
    "META": ["Facebook Ads", "Instagram Ads", "Lead Forms", "Messenger"],
    "Google": ["Search Ads", "Display Ads", "YouTube Ads", "GMB"],
    "Magic Bricks": ["Microsite", "Standard Listing", "Featured Ads"],
    "Housing.com": ["Premium Gold", "Standard Package", "Microsite"],
    "99 Acres": ["Banner Ads", "Microsite", "Standard Listing"],
    "Website": ["Organic Search", "Direct Traffic", "Blog/Content"],
    "Incoming Calls": ["IVR Main Line", "Direct Site Office"]
}

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
    "Site Visit", 
    "Cost per Site Visit", 
    "Booking", 
    "Cost per Booking"
]

// Mock Data Generator (Simulated data for subsources)
const generateMockData = () => {
    const data: any = {}
    Object.entries(SUBSOURCES).forEach(([source, subList]) => {
        data[source] = {}
        subList.forEach(sub => {
            const budget = source === "Incoming Calls" || source === "Website" ? 0 : Math.floor(Math.random() * 5000) + 1000
            const leads = Math.floor(Math.random() * 50) + 5
            data[source][sub] = [
                budget, // Budget
                leads, // Leads
                0, // CPL (calculated)
                Math.floor(leads * 0.4), // RNR
                Math.floor(leads * 0.3), // Prospect
                Math.floor(leads * 0.1), // Unqualified
                Math.floor(leads * 0.1), // Lost
                Math.floor(leads * 0.15), // SVS
                0, // CpSVS
                Math.floor(leads * 0.1), // SV
                0, // CpSV
                Math.floor(leads * 0.05), // Booking
                0 // CpBooking
            ]
        })
    })
    return data
}

const MOCK_SUBSOURCE_DATA = generateMockData()

export default function SubSourceLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [sourceFilter, setSourceFilter] = useState("all")
    const [subSourceFilter, setSubSourceFilter] = useState("all")
    const [leadTypeFilter, setLeadTypeFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Subsource Level Report" },
        ])
    }, [setBreadcrumbs])

    const isFilterApplied = sourceFilter !== "all" || subSourceFilter !== "all" || leadTypeFilter !== "all" || dateFilter !== ""

    const clearFilters = () => {
        setSourceFilter("all")
        setSubSourceFilter("all")
        setLeadTypeFilter("all")
        setDateFilter("")
        setTimeFilter("")
    }

    const handleApply = () => {
    }

    const calculateRates = (data: number[]) => {
        const [budget, leads, , , , , , svs, , sv, , booking] = data
        data[2] = leads > 0 ? Math.round(budget / leads) : 0
        data[8] = svs > 0 ? Math.round(budget / svs) : 0
        data[10] = sv > 0 ? Math.round(budget / sv) : 0
        data[12] = booking > 0 ? Math.round(budget / booking) : 0
        return data
    }

    const { subTotals, globalSummary } = useMemo(() => {
        const totals: any = {}
        let gLeads = 0, gProspects = 0, gSV = 0, gBookings = 0
        const leadMultiplier = leadTypeFilter === "all" ? 1.0 : leadTypeFilter === "new" ? 0.7 : 0.3

        Object.keys(MOCK_SUBSOURCE_DATA).forEach(source => {
            totals[source] = {}
            Object.keys(MOCK_SUBSOURCE_DATA[source]).forEach(sub => {
                const subData = MOCK_SUBSOURCE_DATA[source][sub].map((v: number, i: number) => 
                    ![0, 2, 8, 10, 12].includes(i) ? Math.round(v * leadMultiplier) : v
                )
                totals[source][sub] = calculateRates(subData)

                // Summary calculations based on view filters
                const matchesSource = sourceFilter === "all" || sourceFilter === source
                const matchesSub = subSourceFilter === "all" || subSourceFilter === sub
                
                if (matchesSource && matchesSub) {
                    gLeads += Math.round(subData[1])
                    gProspects += Math.round(subData[4])
                    gSV += Math.round(subData[9])
                    gBookings += Math.round(subData[11])
                }
            })
        })

        return { subTotals: totals, globalSummary: { totalLeads: gLeads, totalProspects: gProspects, totalSV: gSV, totalBookings: gBookings } }
    }, [sourceFilter, subSourceFilter, leadTypeFilter])

    const pieChartData = useMemo(() => {
        const rawData = Object.keys(subTotals)
            .filter(src => sourceFilter === "all" || src === sourceFilter)
            .flatMap(src => Object.keys(subTotals[src])
                .filter(sub => subSourceFilter === "all" || sub === subSourceFilter)
                .map(sub => ({ name: `${src} - ${sub}`, value: subTotals[src][sub][1] }))
            )

        const totalValue = rawData.reduce((acc, curr) => acc + curr.value, 0)
        if (totalValue === 0) return []

        const THRESHOLD = 0.03 // Group anything less than 3%
        let othersValue = 0
        const mainSlices = rawData.filter(d => {
            if (d.value / totalValue < THRESHOLD) {
                othersValue += d.value
                return false
            }
            return true
        })

        if (othersValue > 0) {
            mainSlices.push({ name: "Others", value: othersValue })
        }

        return mainSlices.sort((a, b) => b.value - a.value)
    }, [subTotals, sourceFilter, subSourceFilter])

    const barChartData = useMemo(() => {
        const rawData = Object.keys(subTotals)
            .filter(src => sourceFilter === "all" || src === sourceFilter)
            .flatMap(src => Object.keys(subTotals[src])
                .filter(sub => subSourceFilter === "all" || sub === subSourceFilter)
                .map(sub => ({ 
                    name: sub, 
                    leads: subTotals[src][sub][1], 
                    prospects: subTotals[src][sub][4] 
                }))
            )

        const totalLeads = rawData.reduce((acc, curr) => acc + curr.leads, 0)
        if (totalLeads === 0) return []

        const THRESHOLD = 0.03
        let othersLeads = 0
        let othersProspects = 0
        const mainBars = rawData.filter(d => {
            if (d.leads / totalLeads < THRESHOLD) {
                othersLeads += d.leads
                othersProspects += d.prospects
                return false
            }
            return true
        })

        if (othersLeads > 0) {
            mainBars.push({ name: "Others", leads: othersLeads, prospects: othersProspects })
        }

        return mainBars.sort((a, b) => b.leads - a.leads)
    }, [subTotals, sourceFilter, subSourceFilter])

    const renderTable = (title: string, sourceList: string[], colorClass: string) => {
        const filteredSources = sourceList.filter(s => sourceFilter === "all" || s === sourceFilter)
        if (filteredSources.length === 0) return null

        const isPaid = !title.includes("NON-PAID")
        const hideBudget = !isPaid || leadTypeFilter !== "all"
        
        const displayMetrics = METRICS.filter((_, i) => !(hideBudget && BUDGET_INDICES.includes(i)))

        const grandTotal = Array(METRICS.length).fill(0)
        let hasVisibleData = false

        return (
            <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden mb-8">
                <CardHeader className="bg-muted/5 py-4 border-b flex flex-row items-center justify-between">
                    <CardTitle className={`text-lg font-bold tracking-tight flex items-center gap-2 ${colorClass}`}>
                        {title}
                        <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">ANALYSIS</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-muted/10 border-b border-primary/10">
                                    <th className="font-extrabold text-[10px] uppercase tracking-widest px-6 py-4 border-r border-muted/20">Source</th>
                                    <th className="font-extrabold text-[10px] uppercase tracking-widest px-6 py-4 border-r border-muted/20">Sub-Source</th>
                                    {displayMetrics.map((m, idx) => (
                                        <th key={m} className={`font-extrabold text-[10px] uppercase tracking-widest text-center min-w-[100px] py-4 align-bottom ${idx < displayMetrics.length - 1 ? 'border-r border-muted/20' : ''}`}>
                                            {m}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-background ">
                                {filteredSources.map(source => {
                                    const visibleSubs = SUBSOURCES[source].filter(sub => subSourceFilter === "all" || subSourceFilter === sub)
                                    if (visibleSubs.length === 0) return null
                                    hasVisibleData = true

                                    return (
                                        <React.Fragment key={source}>
                                            {visibleSubs.map((sub, idx) => {
                                                const data = subTotals[source][sub]
                                                METRICS.forEach((_, i) => { if (![2, 8, 10, 12].includes(i)) grandTotal[i] += data[i] })
                                                
                                                return (
                                                    <tr key={sub} className="group hover:bg-primary/5 dark:bg-black   transition-all duration-200 border-b">
                                                        {idx === 0 && (
                                                            <td rowSpan={visibleSubs.length} className="font-bold px-6 py-4  dark:bg-black text-xs text-foreground border-r border-muted/20 bg-white group-hover:bg-primary/5 uppercase align-middle">
                                                                {source}
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 text-xs italic text-muted-foreground border-r border-muted/20 ">
                                                            {sub}
                                                        </td>
                                                        {data.map((val: number, vIdx: number) => {
                                                            if (hideBudget && BUDGET_INDICES.includes(vIdx)) return null
                                                            return (
                                                                <td key={vIdx} className={`text-center px-4 py-4 text-xs font-medium ${vIdx < displayMetrics.length && vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'font-bold text-primary bg-primary/5' : ''}`}>
                                                                    {BUDGET_INDICES.includes(vIdx) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN')}
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                )
                                            })}
                                        </React.Fragment>
                                    )
                                })}
                                {/* Grand Total for the Group */}
                                {hasVisibleData && (
                                    <tr className="bg-primary/5 font-bold border-t-2 border-primary/20">
                                        <td colSpan={2} className="px-6 py-4 text-xs uppercase tracking-wider  text-primary text-center">
                                            GRAND TOTAL ({title})
                                        </td>
                                        {calculateRates(grandTotal).map((val: number, vIdx: number) => {
                                            if (hideBudget && BUDGET_INDICES.includes(vIdx)) return null
                                            return (
                                                <td key={vIdx} className={`text-center px-4 py-4 text-xs ${vIdx < displayMetrics.length && vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'bg-primary/10 text-primary' : 'text-primary'}`}>
                                                    {BUDGET_INDICES.includes(vIdx) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN')}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new()
        const rows: any[][] = [["Sub-Source Level Performance Report"], ["Generated At:", new Date().toLocaleString()], []]
        
        const addSection = (title: string, sourceList: string[]) => {
            const isPaid = !title.includes("NON-PAID")
            const hideBudget = !isPaid || leadTypeFilter !== "all"
            const displayMetrics = METRICS.filter((_, i) => !(hideBudget && BUDGET_INDICES.includes(i)))

            rows.push([title])
            rows.push(["Source", "Sub-Source", ...displayMetrics])
            const sectionTotal = Array(METRICS.length).fill(0)
            sourceList.forEach(source => {
                SUBSOURCES[source].forEach(sub => {
                    if ((sourceFilter === "all" || source === sourceFilter) && (subSourceFilter === "all" || sub === subSourceFilter)) {
                        const data = subTotals[source][sub]
                        METRICS.forEach((_, i) => { if (![2, 8, 10, 12].includes(i)) sectionTotal[i] += data[i] })
                        
                        const rowData = [source, sub]
                        data.forEach((val: number, vIdx: number) => {
                            if (hideBudget && BUDGET_INDICES.includes(vIdx)) return
                            rowData.push(BUDGET_INDICES.includes(vIdx) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN'))
                        })
                        rows.push(rowData)
                    }
                })
            })
            const rates = calculateRates(sectionTotal)
            const totalRow = ["GRAND TOTAL", ""]
            rates.forEach((val: number, vIdx: number) => {
                if (hideBudget && BUDGET_INDICES.includes(vIdx)) return
                totalRow.push(BUDGET_INDICES.includes(vIdx) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN'))
            })
            rows.push(totalRow)
            rows.push([])
        }

        addSection("PAID CHANNELS", PAID_SOURCES)
        addSection("NON-PAID CHANNELS", NON_PAID_SOURCES)
        
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Subsource Report")
        XLSX.writeFile(wb, `SubSource_Level_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex flex-col gap-1 items-start text-left">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic text-left items-start">
                    Sub-Source Level Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-500" />
                    Drill-down analytics for specific channel assets and listings.
                </p>
            </div>

            <Card className="border-none shadow-md bg-background/80 backdrop-blur-md sticky top-12 z-30 ring-1 ring-border/50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Filter className="h-3 w-3" />
                                Master Source
                            </Label>
                            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setSubSourceFilter("all"); }}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50">
                                    <SelectValue placeholder="All Sources" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Share2 className="h-3 w-3" />
                                Specific Sub-Source
                            </Label>
                            <Select value={subSourceFilter} onValueChange={setSubSourceFilter} disabled={sourceFilter === "all"}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50">
                                    <SelectValue placeholder={sourceFilter === "all" ? "Select Source first" : "All Subsources"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subsources</SelectItem>
                                    {sourceFilter !== "all" && SUBSOURCES[sourceFilter].map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                Lead Type
                            </Label>
                            <Select value={leadTypeFilter} onValueChange={setLeadTypeFilter}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50">
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
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <CalendarDays className="h-3 w-3" />
                                Date Range
                            </Label>
                            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Action Time
                            </Label>
                            <Input type="time" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50" />
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

            {/* Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 mt-6">
                        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-none">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600"><Users className="h-6 w-6" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wider">Leads</p>
                                    <h3 className="text-xl font-bold">{globalSummary.totalLeads}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-none">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600"><Target className="h-6 w-6" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-purple-600/70 tracking-wider">Prospects</p>
                                    <h3 className="text-xl font-bold">{globalSummary.totalProspects}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-none">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600"><CheckCircle2 className="h-6 w-6" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-amber-600/70 tracking-wider">SV Done</p>
                                    <h3 className="text-xl font-bold">{globalSummary.totalSV}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-none">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600"><TrendingUp className="h-6 w-6" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-emerald-600/70 tracking-wider">Bookings</p>
                                    <h3 className="text-xl font-bold text-emerald-600">{globalSummary.totalBookings}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Visual Analytics Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
                        <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-muted/5 py-4 border-b">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-left items-start">
                                    <PieChartIcon className="h-4 w-4 text-blue-500" />
                                    Sub-Source Lead Contribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 h-[350px]">
                                <ChartContainer config={chartConfig} className="h-full">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={95}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.name === "Others" ? "var(--color-others)" : CHART_COLORS[index % CHART_COLORS.length]} 
                                                    stroke="rgba(0,0,0,0.1)"
                                                />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            align="center" 
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }}
                                        />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-muted/5 py-4 border-b">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-left items-start text-left items-start">
                                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                                    Leads vs Prospects by Sub-Source
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 h-[350px]">
                                <ChartContainer config={chartConfig} className="h-full">
                                    <BarChart
                                        data={barChartData}
                                        margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 500 }}
                                            tickFormatter={(value: string) => value.length > 12 ? value.substring(0, 10) + '..' : value}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="leads" fill="var(--color-leads)" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="prospects" fill="var(--color-prospects)" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="animate-in fade-in slide-in-from-top-6 duration-700 mt-6">
                        {renderTable("PAID CHANNELS", PAID_SOURCES, "text-blue-600 dark:text-blue-400")}
                        {renderTable("NON-PAID CHANNELS", NON_PAID_SOURCES, "text-emerald-600 dark:text-emerald-400")}
                    </div>
        </div>
    )
}
