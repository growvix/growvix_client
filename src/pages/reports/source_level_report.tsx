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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import React from "react"

// Constants
const SOURCES = ["META", "Google", "Incoming Calls", "Magic Bricks", "Housing.com", "99 Acres", "Website"]
const PROJECTS = ["P1", "P2", "P3", "P4"]
const METRICS = ["New Leads", "RNR", "Prospect", "Not Connected", "Lost", "SVS", "SV Done", "Booking"]

// Static Raw Data Map (Ensures data consistency and satisfying the "statis data" requirement)
const MOCK_SOURCE_DATA: any = {
    "META": {
        "P1": [120, 45, 50, 5, 6, 4, 7, 3],
        "P2": [85, 30, 35, 2, 4, 3, 5, 2],
        "P3": [65, 25, 28, 1, 3, 2, 4, 1],
        "P4": [45, 15, 18, 1, 2, 1, 3, 1]
    },
    "Google": {
        "P1": [110, 40, 45, 4, 5, 4, 6, 2],
        "P2": [75, 28, 30, 2, 3, 2, 4, 1],
        "P3": [55, 20, 22, 1, 2, 1, 3, 1],
        "P4": [35, 12, 12, 0, 1, 1, 2, 0]
    },
    "Incoming Calls": {
        "P1": [50, 15, 20, 1, 2, 2, 3, 1],
        "P2": [40, 10, 15, 1, 1, 1, 2, 1],
        "P3": [30, 8, 10, 0, 1, 1, 1, 0],
        "P4": [20, 5, 5, 0, 0, 0, 1, 0]
    },
    "Magic Bricks": {
        "P1": [140, 55, 60, 6, 8, 5, 9, 4],
        "P2": [100, 40, 45, 4, 6, 4, 7, 3],
        "P3": [80, 30, 35, 3, 4, 3, 5, 2],
        "P4": [60, 22, 25, 2, 3, 2, 4, 1]
    },
    "Housing.com": {
        "P1": [130, 30, 40, 5, 7, 6, 8, 3],
        "P2": [95, 35, 40, 4, 5, 4, 6, 2],
        "P3": [75, 25, 30, 2, 4, 3, 5, 2],
        "P4": [50, 15, 20, 1, 3, 2, 3, 1]
    },
    "99 Acres": {
        "P1": [125, 50, 55, 5, 6, 5, 7, 3],
        "P2": [90, 35, 40, 3, 5, 4, 6, 2],
        "P3": [70, 28, 32, 2, 4, 3, 5, 2],
        "P4": [40, 18, 20, 1, 2, 1, 3, 1]
    },
    "Website": {
        "P1": [70, 25, 30, 2, 3, 3, 4, 2],
        "P2": [50, 18, 22, 1, 2, 2, 3, 1],
        "P3": [40, 12, 15, 1, 1, 1, 2, 1],
        "P4": [30, 10, 12, 0, 1, 1, 1, 0]
    }
}

export default function SourceLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [sourceFilter, setSourceFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Source Level Report" },
        ])
    }, [setBreadcrumbs])

    const isFilterApplied = sourceFilter !== "" || dateFilter !== "" || timeFilter !== ""

    const clearFilters = () => {
        setSourceFilter("")
        setDateFilter("")
        setTimeFilter("")
    }

    // Calculation Logic for Totals - Ensuring strict column isolation
    const { sourceTotals, globalSummary } = useMemo(() => {
        const totalsMap: any = {}
        let gLeads = 0, gProspects = 0, gSVDone = 0, gBookings = 0;

        SOURCES.forEach(source => {
            // Initialize totals for each column (Index 0 is Count/New Leads, Index 1-7 are Stage Metrics)
            const colTotals = Array(METRICS.length).fill(0)
            
            PROJECTS.forEach(proj => {
                const projectData = MOCK_SOURCE_DATA[source][proj]
                METRICS.forEach((_, colIdx) => {
                    // Vertical summation only - No horizontal mixing between columns
                    colTotals[colIdx] += projectData[colIdx]
                })
            })
            
            totalsMap[source] = colTotals

            // Aggregate for display cards (only if source is in current view)
            if (sourceFilter === "all" || sourceFilter === source) {
                gLeads += colTotals[0]      // Total Leads (Independent Count)
                gProspects += colTotals[2]  // Total Prospects (Discrete Column)
                gSVDone += colTotals[6]     // SV Done (Discrete Column)
                gBookings += colTotals[7]   // Final Bookings (Discrete Column)
            }
        })

        return { 
            sourceTotals: totalsMap, 
            globalSummary: { 
                totalLeads: gLeads, 
                totalProspects: gProspects, 
                totalSVDone: gSVDone, 
                totalBookings: gBookings 
            } 
        }
    }, [sourceFilter]) // Recalculate based on filter selection

    const displaySources = useMemo(() => {
        if (sourceFilter === "all" || sourceFilter === "") return SOURCES
        return [sourceFilter]
    }, [sourceFilter])

    const summaryStats = globalSummary;

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new()
        const rows = []
        rows.push(["Source Level Performance Report"])
        rows.push(["Generated At:", new Date().toLocaleString()])
        rows.push([])
        rows.push(["Source", "Projects", ...METRICS])
        
        displaySources.forEach(source => {
            PROJECTS.forEach((project, pIdx) => {
                rows.push([
                    pIdx === 0 ? source : "",
                    project,
                    ...MOCK_SOURCE_DATA[source][project]
                ])
            })
            rows.push(["", `${source} Total`, ...sourceTotals[source]])
            rows.push([])
        })
        
        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "Source Report")
        XLSX.writeFile(wb, `Source_Level_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                        Source Level Report
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Detailed performance analysis by acquisition channel.
                    </p>
                </div>
                {isFilterApplied && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2 text-xs h-8">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset All
                    </Button>
                )}
            </div>

            {/* Filters Row - Balanced and Consistent */}
            <Card className="border-none shadow-md bg-background/60 backdrop-blur-md">
                <CardContent className="p-6">
                    <div className="flex flex-wrap items-end gap-6">
                        <div className="flex flex-col gap-2 min-w-[240px]">
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
            {isFilterApplied && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-blue-600/70 dark:text-blue-400/70 uppercase">Total Leads</p>
                                <h3 className="text-2xl font-bold">{summaryStats.totalLeads}</h3>
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
                                <p className="text-xs font-semibold text-amber-600/70 dark:text-amber-400/70 uppercase">SV Done</p>
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
                                <p className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70 uppercase">Final Booking</p>
                                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summaryStats.totalBookings}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Hierarchical Table Section */}
            {isFilterApplied ? (
                <Card className="border-none shadow-xl animate-in fade-in slide-in-from-top-6 duration-700 bg-background/40 backdrop-blur-sm">
                    <CardHeader className="bg-muted/5 py-3 border-b">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    Source Breakdown
                                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">LIVE</Badge>
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    Stage-wise distribution of leads per project under each source.
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
                                            Export Audit
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Process Excel Export?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Generate a full hierarchical report including project breakdowns and source totals.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDownloadExcel}>Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/20">
                            <table className="w-full border-collapse">
                                <thead className="bg-muted/5 border-b-2 border-primary/10">
                                    {/* Super Header */}
                                    <tr className="border-b border-muted/20">
                                        <th colSpan={2} className="border-r border-muted/20"></th>
                                        <th colSpan={8} className="py-2.5 font-bold text-center tracking-[0.2em] text-primary/40 uppercase text-[10px]">
                                            ONLINE CONVERSION FUNNEL
                                        </th>
                                    </tr>
                                    {/* Standard Header */}
                                    <tr>
                                        <th className="font-extrabold text-[11px] uppercase tracking-widest text-center text-primary/80 min-w-[160px] py-4 border-r border-muted/20">Source</th>
                                        <th className="font-extrabold text-[11px] uppercase tracking-widest text-center text-muted-foreground/60 italic min-w-[120px] py-4 border-r border-muted/20">Projects</th>
                                        {METRICS.map((m, idx) => (
                                            <th key={m} className={`font-extrabold text-[11px] uppercase tracking-widest text-center text-primary/80 min-w-[100px] py-4 align-bottom ${idx < METRICS.length - 1 ? 'border-r border-muted/20' : ''}`}>
                                                {m}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-background">
                                    {displaySources.map((source) => (
                                        <React.Fragment key={source}>
                                            {PROJECTS.map((project, pIdx) => (
                                                <tr key={`${source}-${project}`} className="group hover:bg-primary/5 transition-all duration-200 border-b">
                                                    {pIdx === 0 && (
                                                        <td 
                                                            rowSpan={PROJECTS.length + 1} 
                                                            className="text-center font-bold px-4 py-6 text-[14px] text-foreground border-r border-muted/20 align-middle bg-white group-hover:bg-primary/5 uppercase tracking-tight"
                                                        >
                                                            {source}
                                                        </td>
                                                    )}
                                                    <td className="text-center italic text-muted-foreground/70 px-4 py-4 border-r border-muted/20">
                                                        {project}
                                                    </td>
                                                    {MOCK_SOURCE_DATA[source][project].map((val: number, vIdx: number) => (
                                                        <td key={vIdx} className={`text-center px-4 py-4 text-foreground ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 7 ? 'font-bold text-primary bg-primary/5' : ''}`}>
                                                            {val}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {/* Group Total Row */}
                                            <tr className="bg-muted/5 font-bold border-b-2 border-primary/10">
                                                <td className="text-center italic text-primary/70 px-4 py-3 border-r border-muted/20 uppercase text-[10px] tracking-wider">
                                                    {source} Combined
                                                </td>
                                                {sourceTotals[source].map((val: number, vIdx: number) => (
                                                    <td key={vIdx} className={`text-center px-4 py-3 text-foreground ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 7 ? 'bg-primary/10 text-primary' : ''}`}>
                                                        {val}
                                                    </td>
                                                ))}
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl bg-muted/5 border-muted-foreground/10 group hover:border-primary/20 hover:bg-primary/5 transition-all duration-500 cursor-default">
                    <div className="p-6 rounded-full bg-muted/20 text-muted-foreground/40 mb-6 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-700">
                        <Filter className="w-16 h-16" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground/80 mb-2 group-hover:text-primary transition-colors">Awaiting Source Parameters</h3>
                    <p className="text-muted-foreground text-sm max-w-sm text-center leading-relaxed font-bold italic opacity-80 group-hover:opacity-100">
                        Select a channel category to generate the drill-down performance report.
                    </p>
                </div>
            )}
        </div>
    )
}
