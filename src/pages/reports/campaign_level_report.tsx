import { useEffect, useState, useMemo } from "react"
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
import { CalendarDays, Clock, Filter, RotateCcw, TrendingUp, Users, Target, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Static data for the report
const sources = ["Meta", "Google", "Incoming Calls", "MagicBricks", "Housing.com", "99 Acres", "Website"]
const projects = ["P1", "P2", "P3", "P4"]

// High-level Campaign Data structure
const CAMPAIGN_DATA: Record<string, Record<string, Record<string, number[]>>> = {
    "new_responses": {
        "Meta": {
            "P1": [20, 5, 6, 2, 1, 2, 1, 3],
            "P2": [25, 6, 8, 3, 2, 3, 1, 2],
            "P3": [23, 5, 7, 2, 2, 4, 1, 2],
            "P4": [22, 4, 6, 3, 1, 3, 2, 3],
        },
        "Google": {
            "P1": [18, 3, 5, 2, 2, 2, 1, 3],
            "P2": [22, 4, 6, 3, 2, 3, 1, 3],
            "P3": [20, 3, 6, 2, 2, 4, 1, 2],
            "P4": [24, 5, 7, 3, 2, 3, 1, 3],
        },
        "Incoming Calls": {
            "P1": [15, 2, 4, 1, 1, 3, 2, 2],
            "P2": [12, 1, 3, 1, 1, 2, 1, 3],
            "P3": [16, 2, 5, 1, 2, 3, 1, 2],
            "P4": [14, 2, 4, 2, 1, 2, 1, 2],
        },
        "MagicBricks": {
            "P1": [35, 6, 12, 4, 3, 4, 2, 4],
            "P2": [30, 5, 10, 3, 2, 5, 1, 4],
            "P3": [32, 6, 11, 4, 2, 4, 2, 3],
            "P4": [38, 7, 13, 5, 3, 5, 2, 3],
        },
        "Housing.com": {
            "P1": [28, 5, 9, 3, 2, 4, 2, 3],
            "P2": [32, 6, 11, 4, 3, 4, 1, 3],
            "P3": [30, 5, 10, 3, 2, 4, 2, 4],
            "P4": [34, 7, 12, 4, 2, 4, 2, 3],
        },
        "99 Acres": {
            "P1": [26, 4, 8, 3, 2, 4, 2, 3],
            "P2": [28, 5, 10, 3, 2, 4, 1, 3],
            "P3": [30, 6, 11, 4, 2, 4, 1, 2],
            "P4": [32, 7, 12, 4, 2, 3, 2, 2],
        },
        "Website": {
            "P1": [15, 2, 4, 1, 1, 3, 2, 2],
            "P2": [18, 3, 5, 2, 2, 3, 1, 2],
            "P3": [14, 2, 3, 1, 1, 3, 2, 2],
            "P4": [16, 3, 4, 2, 1, 3, 1, 2],
        },
    },
    "re_engaged_responses": {
        "Meta": {
            "P1": [10, 2, 3, 1, 1, 1, 1, 1],
            "P2": [12, 3, 4, 1, 1, 1, 1, 1],
            "P3": [15, 4, 5, 2, 1, 1, 1, 1],
            "P4": [11, 2, 3, 2, 1, 1, 1, 1],
        },
        "Google": {
            "P1": [8, 1, 2, 1, 1, 1, 1, 1],
            "P2": [10, 2, 3, 1, 1, 1, 1, 2],
            "P3": [12, 3, 4, 1, 1, 1, 1, 1],
            "P4": [9, 1, 3, 1, 1, 1, 1, 1],
        },
        "Incoming Calls": {
            "P1": [5, 1, 1, 1, 0, 1, 0, 1],
            "P2": [6, 1, 1, 1, 1, 1, 0, 1],
            "P3": [7, 1, 2, 1, 1, 1, 1, 0],
            "P4": [4, 1, 1, 1, 0, 0, 1, 0],
        },
        "MagicBricks": {
            "P1": [15, 3, 5, 2, 1, 2, 1, 1],
            "P2": [12, 2, 4, 2, 1, 1, 1, 1],
            "P3": [18, 4, 6, 2, 2, 2, 1, 1],
            "P4": [14, 3, 4, 2, 1, 2, 1, 1],
        },
        "Housing.com": {
            "P1": [12, 2, 4, 1, 1, 2, 1, 1],
            "P2": [14, 3, 5, 1, 1, 2, 1, 1],
            "P3": [10, 2, 3, 1, 1, 1, 1, 1],
            "P4": [15, 3, 5, 2, 1, 2, 1, 1],
        },
        "99 Acres": {
            "P1": [10, 2, 3, 1, 1, 1, 1, 1],
            "P2": [12, 3, 4, 1, 1, 1, 1, 1],
            "P3": [14, 3, 4, 2, 1, 2, 1, 1],
            "P4": [11, 2, 3, 2, 1, 1, 1, 1],
        },
        "Website": {
            "P1": [8, 1, 2, 1, 1, 1, 1, 1],
            "P2": [10, 2, 3, 1, 1, 1, 1, 2],
            "P3": [7, 1, 2, 1, 1, 1, 1, 1],
            "P4": [9, 1, 3, 1, 1, 1, 1, 1],
        },
    }
}

const columns = ["New Leads", "RNR", "Prospect", "Not Connected", "Lost", "SVS", "SV Done", "Booking"]

const campaignFilterMap: Record<string, string> = {
    "new_responses": "Online - New Lead",
    "re_engaged_responses": "Online - Re-engaged Lead",
    "all_responses": "Online",
}

export default function CampaignLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [campaignFilter, setCampaignFilter] = useState("")
    const [dateFilter, setDateFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Campaign Level Report" },
        ])
    }, [setBreadcrumbs])

    const tableHeading = campaignFilterMap[campaignFilter] || "Online Report"
    const isFilterApplied = campaignFilter !== "" || dateFilter !== "" || timeFilter !== ""

    const clearFilters = () => {
        setCampaignFilter("")
        setDateFilter("")
        setTimeFilter("")
    }

    // Dynamic Data Selection and Calculation
    const activeData = useMemo(() => {
        if (!campaignFilter || campaignFilter === "all_responses") {
            // Compute sum of new and re-engaged
            const newData = CAMPAIGN_DATA["new_responses"]
            const reEngagedData = CAMPAIGN_DATA["re_engaged_responses"]
            const combined: Record<string, Record<string, number[]>> = {}

            sources.forEach(source => {
                combined[source] = {}
                projects.forEach(project => {
                    const array1 = newData[source]?.[project] || new Array(columns.length).fill(0)
                    const array2 = reEngagedData[source]?.[project] || new Array(columns.length).fill(0)
                    combined[source][project] = array1.map((val, idx) => val + array2[idx])
                })
            })
            return combined
        }
        return CAMPAIGN_DATA[campaignFilter] || {}
    }, [campaignFilter])

    // Calculate totals based on activeData
    const summaryStats = useMemo(() => {
        const stats = {
            totalLeads: 0,
            totalProspects: 0,
            totalSVDone: 0,
            totalBookings: 0
        }

        Object.values(activeData).forEach(sourceProjects => {
            Object.values(sourceProjects).forEach(data => {
                stats.totalLeads += data[0] // New Leads
                stats.totalProspects += data[2] // Prospect
                stats.totalSVDone += data[6] // SV Done
                stats.totalBookings += data[7] // Booking
            })
        })

        return stats
    }, [activeData])

    const columnTotals = useMemo(() => {
        const totals = new Array(columns.length).fill(0)
        Object.values(activeData).forEach(sourceProjects => {
            Object.values(sourceProjects).forEach(data => {
                data.forEach((val, idx) => {
                    totals[idx] += val
                })
            })
        })
        return totals
    }, [activeData])

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
                        <div className="flex flex-col gap-2 min-w-[240px]">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Filter className="h-3 w-3" />
                                Response Category
                            </Label>
                            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none hover:bg-muted/50 transition-colors">
                                    <SelectValue placeholder="Select Campaign Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new_responses">New Responses</SelectItem>
                                    <SelectItem value="re_engaged_responses">Re-engaged Responses</SelectItem>
                                    <SelectItem value="all_responses">All Responses</SelectItem>
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
                                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summaryStats.totalBookings}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Report Table Section */}
            {isFilterApplied ? (
                <Card className="border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-6 duration-700 bg-background/40 backdrop-blur-sm">
                    <CardHeader className="bg-muted/10 pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    {tableHeading}
                                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">LIVE</Badge>
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    Displaying metrics for all sources and projects based on active filters.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full ring-1 ring-border shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Data Updated: Just now
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/20">
                            <Table>
                                <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm shadow-sm">
                                    <TableRow className="hover:bg-transparent border-b-2">
                                        <TableHead className="font-extrabold text-[11px] uppercase tracking-widest w-[160px] text-primary/80 py-4">Source</TableHead>
                                        <TableHead className="font-extrabold text-[11px] uppercase tracking-widest w-[100px] text-primary/80 py-4">Projects</TableHead>
                                        {columns.map((col) => (
                                            <TableHead key={col} className="font-extrabold text-[11px] uppercase tracking-widest text-center text-primary/80 min-w-[100px] py-4">
                                                {col}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sources.map((source) => (
                                        projects.map((project, projectIdx) => (
                                            <TableRow
                                                key={`${source}-${project}`}
                                                className={`
                                                    ${projectIdx === projects.length - 1 ? 'border-b-4 border-muted/30' : 'border-b border-muted/10'}
                                                    group hover:bg-primary/5 transition-all duration-200
                                                `}
                                            >
                                                {/* Source name only on first project row */}
                                                {projectIdx === 0 ? (
                                                    <TableCell
                                                        rowSpan={projects.length}
                                                        className="font-bold text-sm align-middle border-r-2 border-muted/20 bg-muted/5 group-hover:bg-primary/10 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-8 rounded-full bg-primary/20 group-hover:bg-primary/50 transition-all" />
                                                            {source}
                                                        </div>
                                                    </TableCell>
                                                ) : null}
                                                <TableCell className="text-xs font-semibold text-muted-foreground border-r group-hover:text-primary transition-colors pl-4 italic">
                                                    {project}
                                                </TableCell>
                                                {activeData[source][project].map((value, colIdx) => {
                                                    const isNewLeads = colIdx === 0;
                                                    const isHighValue = (colIdx === 7 && value > 2);
                                                    return (
                                                        <TableCell
                                                            key={colIdx}
                                                            className={`text-center py-4 tabular-nums transition-all 
                                                                ${isNewLeads ? 'font-black text-foreground bg-muted/30 border-x border-muted-foreground/10' : ''}
                                                                ${isHighValue ? 'font-bold text-primary bg-primary/5' : 'text-sm text-foreground/80'}
                                                            `}
                                                        >
                                                            {value === 0 ? <span className="text-muted-foreground/30 ring-1 ring-muted/20 px-2 py-0.5 rounded italic opacity-50">0</span> : value}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))
                                    ))}
                                    {/* Grand Total Row */}
                                    <TableRow className="bg-primary/5 border-t-2 border-primary/20 hover:bg-primary/10">
                                        <TableCell colSpan={2} className="font-extrabold text-xs uppercase tracking-wider text-primary py-6 text-center ring-1 ring-primary/20 rounded-l-lg">
                                            Grand Total
                                        </TableCell>
                                        {columnTotals.map((total, idx) => (
                                            <TableCell key={idx} className="text-center font-extrabold text-base text-primary tabular-nums py-6 bg-primary/5">
                                                {total}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl bg-muted/5 border-muted-foreground/10 group hover:border-primary/20 hover:bg-primary/5 transition-all duration-500 cursor-default">
                    <div className="p-6 rounded-full bg-muted/20 text-muted-foreground/40 mb-6 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-700">
                        <Filter className="w-16 h-16" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground/80 mb-2 group-hover:text-primary transition-colors">Awaiting Filter Parameters</h3>
                    <p className="text-muted-foreground text-sm max-w-sm text-center leading-relaxed font-medium italic opacity-80 group-hover:opacity-100">
                        Please define your criteria above to generate the campaign performance report. 
                        Data will appear here instantly once filters are applied.
                    </p>
                    <div className="mt-8 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '200ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                </div>
            )}
        </div>
    )
}
