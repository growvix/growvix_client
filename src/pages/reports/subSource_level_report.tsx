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
    Share2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import React from "react"

// Constants
const SOURCES = ["META", "Google", "Incoming Calls", "Magic Bricks", "Housing.com", "99 Acres", "Website"]
const PAID_SOURCES = ["META", "Google", "Magic Bricks", "Housing.com", "99 Acres"]
const NON_PAID_SOURCES = ["Website", "Incoming Calls"]

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
    "SVS", 
    "Cost per SVS", 
    "SV", 
    "Cost per SV", 
    "Booking", 
    "Cost per Booking"
]

// Mock Data Generator (Simulated data for subsources)
const generateMockData = () => {
    const data: any = {}
    Object.entries(SUBSOURCES).forEach(([source, subList]) => {
        data[source] = {}
        subList.forEach(sub => {
            // [Budget, Leads, CPL, RNR, Prospect, Unqual, Lost, SVS, CpSVS, SV, CpSV, Booking, CpBooking]
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
    const [dateFilter, setDateFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Subsource Level Report" },
        ])
    }, [setBreadcrumbs])

    const isFilterApplied = sourceFilter !== "" || subSourceFilter !== "" || dateFilter !== ""

    const clearFilters = () => {
        setSourceFilter("all")
        setSubSourceFilter("all")
        setDateFilter("")
        setTimeFilter("")
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

        Object.keys(MOCK_SUBSOURCE_DATA).forEach(source => {
            totals[source] = {}
            Object.keys(MOCK_SUBSOURCE_DATA[source]).forEach(sub => {
                const subData = [...MOCK_SUBSOURCE_DATA[source][sub]]
                totals[source][sub] = calculateRates(subData)

                // Summary calculations based on view filters
                const matchesSource = sourceFilter === "all" || sourceFilter === source
                const matchesSub = subSourceFilter === "all" || subSourceFilter === sub
                
                if (matchesSource && matchesSub) {
                    gLeads += subData[1]
                    gProspects += subData[4]
                    gSV += subData[9]
                    gBookings += subData[11]
                }
            })
        })

        return { subTotals: totals, globalSummary: { totalLeads: gLeads, totalProspects: gProspects, totalSV: gSV, totalBookings: gBookings } }
    }, [sourceFilter, subSourceFilter])

    const renderTable = (title: string, sourceList: string[], colorClass: string) => {
        const filteredSources = sourceList.filter(s => sourceFilter === "all" || s === sourceFilter)
        if (filteredSources.length === 0) return null

        const grandTotal = Array(METRICS.length).fill(0)
        let hasVisibleData = false

        return (
            <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden mb-8">
                <CardHeader className="bg-muted/5 py-4 border-b">
                    <CardTitle className={`text-lg font-bold tracking-tight flex items-center gap-2 ${colorClass}`}>
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-muted/10 border-b border-primary/10">
                                    <th className="font-extrabold text-[10px] uppercase tracking-widest px-6 py-4 border-r border-muted/20">Source</th>
                                    <th className="font-extrabold text-[10px] uppercase tracking-widest px-6 py-4 border-r border-muted/20">Sub-Source</th>
                                    {METRICS.map((m, idx) => (
                                        <th key={m} className={`font-extrabold text-[10px] uppercase tracking-widest text-center min-w-[100px] py-4 align-bottom ${idx < METRICS.length - 1 ? 'border-r border-muted/20' : ''}`}>
                                            {m}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-background">
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
                                                    <tr key={sub} className="group hover:bg-primary/5 transition-all duration-200 border-b">
                                                        {idx === 0 && (
                                                            <td rowSpan={visibleSubs.length} className="font-bold px-6 py-4 text-xs text-foreground border-r border-muted/20 bg-white group-hover:bg-primary/5 uppercase align-middle">
                                                                {source}
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 text-xs italic text-muted-foreground border-r border-muted/20">
                                                            {sub}
                                                        </td>
                                                        {data.map((val: number, vIdx: number) => (
                                                            <td key={vIdx} className={`text-center px-4 py-4 text-xs font-medium ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'font-bold text-primary bg-primary/5' : ''}`}>
                                                                {[0, 2, 8, 10, 12].includes(vIdx) ? `₹${val.toLocaleString()}` : val}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                )
                                            })}
                                        </React.Fragment>
                                    )
                                })}
                                {/* Grand Total for the Group */}
                                {hasVisibleData && (
                                    <tr className="bg-primary/5 font-bold border-t-2 border-primary/20">
                                        <td colSpan={2} className="px-6 py-4 text-xs uppercase tracking-wider text-primary text-center">
                                            GRAND TOTAL ({title})
                                        </td>
                                        {calculateRates(grandTotal).map((val: number, vIdx: number) => (
                                            <td key={vIdx} className={`text-center px-4 py-4 text-xs ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'bg-primary/10 text-primary' : 'text-primary'}`}>
                                                {[0, 2, 8, 10, 12].includes(vIdx) ? `₹${val.toLocaleString()}` : val}
                                            </td>
                                        ))}
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
        const rows = [["Sub-Source Level Performance Report"], ["Generated At:", new Date().toLocaleString()], [], ["Source", "Sub-Source", ...METRICS]]
        
        const addSection = (title: string, sourceList: string[]) => {
            rows.push([title])
            sourceList.forEach(source => {
                SUBSOURCES[source].forEach(sub => {
                    if ((sourceFilter === "all" || source === sourceFilter) && (subSourceFilter === "all" || sub === subSourceFilter)) {
                        rows.push([source, sub, ...subTotals[source][sub].map((v: number, i: number) => [0, 2, 8, 10, 12].includes(i) ? `₹${v.toLocaleString()}` : v)])
                    }
                })
            })
            rows.push([])
        }

        addSection("PAID CHANNELS", PAID_SOURCES)
        addSection("NON-PAID CHANNELS", NON_PAID_SOURCES)
        
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Subsource Report")
        XLSX.writeFile(wb, `SubSource_Level_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                        Subsource Level Report
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Layers className="h-4 w-4 text-emerald-500" />
                        Drill-down analytics for specific channel assets and listings.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isFilterApplied && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2 text-xs h-8">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleDownloadExcel} className="gap-2 text-xs h-8 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary">
                        <Download className="h-3.5 w-3.5" />
                        Export Audit
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-md bg-background/60 backdrop-blur-md">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
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
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
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

            <div className="animate-in fade-in slide-in-from-top-6 duration-700">
                {renderTable("PAID CHANNELS", PAID_SOURCES, "text-blue-600 dark:text-blue-400")}
                {renderTable("NON-PAID CHANNELS", NON_PAID_SOURCES, "text-emerald-600 dark:text-emerald-400")}
            </div>
        </div>
    )
}
