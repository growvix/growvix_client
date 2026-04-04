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
import { CalendarDays, Clock, Filter, RotateCcw, TrendingUp, Users, Target, CheckCircle2, ChevronDown, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Metrics for Online/Offline/CP
const ONLINE_DATA = {
    budget: 800000,
    leads: 400,
    rnr: 10,
    prospect: 200,
    unqualified: 10,
    lost: 50,
    svs: 50,
    sv: 45,
    booking: 35
}

const OFFLINE_DATA = {
    budget: 1000000,
    leads: 400,
    rnr: 10,
    prospect: 200,
    unqualified: 10,
    lost: 50,
    svs: 50,
    sv: 45,
    booking: 35
}

const CP_DATA = {
    leads: 400,
    rnr: 10,
    prospect: 200,
    unqualified: 10,
    lost: 50,
    svs: 50,
    sv: 45,
    booking: 35
}

const CAMPAIGN_COLUMNS = ["BUDGET SPENT", "NO. OF LEADS", "CPL", "RNR", "PROSPECT", "UNQUALIFIED", "LOST", "SVS", "COST PER SVS", "SV", "COST PER SV", "BOOKING", "COST PER BOOKING"]
const CP_COLUMNS = ["NO. OF LEADS", "RNR", "PROSPECT", "UNQUALIFIED", "LOST", "SVS", "SV", "BOOKING"]

const campaignFilterMap: Record<string, string> = {
    "online": "Online Report",
    "offline": "Offline Report",
    "all_responses": "All Responses - Combined View",
}

export default function CampaignLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [campaignFilter, setCampaignFilter] = useState("all_responses")
    const [dateFilter, setDateFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Campaign Level Report" },
        ])
    }, [setBreadcrumbs])

    const tableHeading = campaignFilterMap[campaignFilter] || "Campaign Analysis Report"
    const isFilterApplied = campaignFilter !== "" || dateFilter !== "" || timeFilter !== ""

    const clearFilters = () => {
        setCampaignFilter("")
        setDateFilter("")
        setTimeFilter("")
    }

    const activeData = useMemo(() => {
        if (campaignFilter === "online") return ONLINE_DATA
        if (campaignFilter === "offline") return OFFLINE_DATA
        if (campaignFilter === "all_responses") {
            return {
                budget: ONLINE_DATA.budget + OFFLINE_DATA.budget,
                leads: ONLINE_DATA.leads + OFFLINE_DATA.leads,
                rnr: ONLINE_DATA.rnr + OFFLINE_DATA.rnr,
                prospect: ONLINE_DATA.prospect + OFFLINE_DATA.prospect,
                unqualified: ONLINE_DATA.unqualified + OFFLINE_DATA.unqualified,
                lost: ONLINE_DATA.lost + OFFLINE_DATA.lost,
                svs: ONLINE_DATA.svs + OFFLINE_DATA.svs,
                sv: ONLINE_DATA.sv + OFFLINE_DATA.sv,
                booking: ONLINE_DATA.booking + OFFLINE_DATA.booking
            }
        }
        return null
    }, [campaignFilter])

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
        // Simple export logic for now, can be refined
        const wb = XLSX.utils.book_new()

        if (campaignFilter === "online" || campaignFilter === "offline" || campaignFilter === "all_responses") {
            const campaignMetrics = calculateMetrics(activeData)
            const wsData = [
                CAMPAIGN_COLUMNS,
                [
                    campaignMetrics.budget.toLocaleString(),
                    campaignMetrics.leads,
                    campaignMetrics.cpl.toLocaleString(),
                    campaignMetrics.rnr,
                    campaignMetrics.prospect,
                    campaignMetrics.unqualified,
                    campaignMetrics.lost,
                    campaignMetrics.svs,
                    campaignMetrics.costPerSVS.toLocaleString(),
                    campaignMetrics.sv,
                    campaignMetrics.costPerSV.toLocaleString(),
                    campaignMetrics.booking,
                    campaignMetrics.costPerBooking.toLocaleString()
                ]
            ]
            const ws = XLSX.utils.aoa_to_sheet(wsData)
            XLSX.utils.book_append_sheet(wb, ws, "Campaign Report")
        }

        if (campaignFilter === "all_responses") {
            const cpWsData = [
                CP_COLUMNS,
                [
                    CP_DATA.leads,
                    CP_DATA.rnr,
                    CP_DATA.prospect,
                    CP_DATA.unqualified,
                    CP_DATA.lost,
                    CP_DATA.svs,
                    CP_DATA.sv,
                    CP_DATA.booking
                ]
            ]
            const cpWs = XLSX.utils.aoa_to_sheet(cpWsData)
            XLSX.utils.book_append_sheet(wb, cpWs, "CP Report")
        }

        XLSX.writeFile(wb, `Campaign_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
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
                        <div className="flex flex-col gap-2 min-w-[240px]">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Filter className="h-3 w-3" />
                                Response Category
                            </Label>
                            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none hover:bg-muted/50 transition-colors">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
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
                <div className="flex flex-col gap-12">
                    {/* Table 1: Campaign Report */}
                    {(campaignFilter === "online" || campaignFilter === "offline" || campaignFilter === "all_responses") && (
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
                                                {CAMPAIGN_COLUMNS.map((col) => (
                                                    <th key={`grid-${col}`} className={`p-0 h-5 ${(col === "CPL" || col === "UNQUALIFIED" || col === "COST PER SVS" || col === "COST PER SV") ? 'border-r' : ''}`}></th>
                                                ))}
                                            </tr>
                                            {/* Row 2: Actual header labels */}
                                            <tr>
                                                {CAMPAIGN_COLUMNS.map((col) => (
                                                    <th key={col} className={`font-extrabold text-[11px] uppercase tracking-widest text-center text-primary/80 min-w-[110px] py-4 align-bottom ${(col === "CPL" || col === "UNQUALIFIED" || col === "COST PER SVS" || col === "COST PER SV") ? 'border-r' : ''}`}>
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-background">
                                            {metrics ? (
                                                <tr key="campaign-data-row" className="group hover:bg-primary/5 transition-all duration-200 border-b">
                                                    <td className="text-center font-bold px-4 py-8 text-foreground border-r">{metrics.budget.toLocaleString()}</td>
                                                    <td className="text-center px-4 py-8 text-foreground border-r">{metrics.leads}</td>
                                                    <td className="text-center font-bold bg-primary/5 border-r px-4 py-8 text-primary">{metrics.cpl.toLocaleString()}</td>
                                                    <td className="text-center px-4 py-8 text-foreground border-r">{metrics.rnr}</td>
                                                    <td className="text-center px-4 py-8 text-foreground border-r">{metrics.prospect}</td>
                                                    <td className="text-center border-r px-4 py-8 text-foreground">{metrics.unqualified}</td>
                                                    <td className="text-center px-4 py-8 text-foreground border-r">{metrics.lost}</td>
                                                    <td className="text-center px-4 py-8 text-foreground border-r">{metrics.svs}</td>
                                                    <td className="text-center font-bold bg-primary/5 border-r px-4 py-8 text-primary">{metrics.costPerSVS.toLocaleString()}</td>
                                                    <td className="text-center px-4 py-8 text-foreground border-r">{metrics.sv}</td>
                                                    <td className="text-center font-bold bg-primary/5 border-r px-4 py-8 text-primary">{metrics.costPerSV.toLocaleString()}</td>
                                                    <td className="text-center font-black text-primary px-4 py-8 border-r">{metrics.booking}</td>
                                                    <td className="text-center font-bold bg-primary/10 px-4 py-8 text-primary">{metrics.costPerBooking.toLocaleString()}</td>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <td colSpan={CAMPAIGN_COLUMNS.length} className="text-center py-20 text-muted-foreground italic">
                                                        No metrics available for selected filter. ({campaignFilter})
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
                    {campaignFilter === "all_responses" && (
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
                                                <td className="text-center font-bold px-4 py-8 text-foreground border-r">{CP_DATA.leads}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{CP_DATA.rnr}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{CP_DATA.prospect}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{CP_DATA.unqualified}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{CP_DATA.lost}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{CP_DATA.svs}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{CP_DATA.sv}</td>
                                                <td className="text-center font-black text-primary px-4 py-8">{CP_DATA.booking}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
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
