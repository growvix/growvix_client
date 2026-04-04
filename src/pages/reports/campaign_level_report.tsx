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
    const [campaignFilter, setCampaignFilter] = useState("none")
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
        setCampaignFilter("none")
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
        // Simple export logic for now, can be refined
        const wb = XLSX.utils.book_new()

        if (campaignFilter === "online" || campaignFilter === "offline" || campaignFilter === "all_responses" || campaignFilter === "none") {
            const campaignMetrics = calculateMetrics(activeData)
            let wsRow = [];
            
            if (activeColumns.length === FULL_COLUMNS.length) {
                wsRow = [
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
            } else if (activeColumns.length === REDUCED_COLUMNS.length) {
                 wsRow = [
                    campaignMetrics.leads,
                    campaignMetrics.prospect,
                    campaignMetrics.rnr,
                    campaignMetrics.unqualified,
                    campaignMetrics.lost,
                    campaignMetrics.svs,
                    campaignMetrics.sv,
                    campaignMetrics.booking,
                    campaignMetrics.costPerBooking.toLocaleString()
                ]
            } else {
                // LEAD_ONLY_COLUMNS
                wsRow = [
                    campaignMetrics.leads,
                    campaignMetrics.prospect,
                    campaignMetrics.rnr,
                    campaignMetrics.unqualified,
                    campaignMetrics.lost,
                    campaignMetrics.svs,
                    campaignMetrics.sv,
                    campaignMetrics.booking
                ]
            }

            const wsData = [
                activeColumns,
                wsRow
            ]
            const ws = XLSX.utils.aoa_to_sheet(wsData)
            XLSX.utils.book_append_sheet(wb, ws, "Campaign Report")
        }

        if (campaignFilter === "all_responses" || campaignFilter === "none") {
            const cpWsData = [
                CP_COLUMNS,
                [
                    cpActiveData.leads,
                    cpActiveData.rnr,
                    cpActiveData.prospect,
                    cpActiveData.unqualified,
                    cpActiveData.lost,
                    cpActiveData.svs,
                    cpActiveData.sv,
                    cpActiveData.booking
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
                                                        </>
                                                    ) : campaignFilter === "cp" ? (
                                                        // CP Table View
                                                        <>
                                                            <td className="text-center font-bold px-4 py-8 text-foreground border-r">{metrics.leads}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.rnr}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.prospect}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.unqualified}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.lost}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.svs}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.sv}</td>
                                                            <td className="text-center font-black text-primary px-4 py-8 border-r">{metrics.booking}</td>
                                                        </>
                                                    ) : activeColumns.length === REDUCED_COLUMNS.length ? (
                                                        // Reduced Table View (Case 2: Source + Lead Type Selected)
                                                        <>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.leads}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.prospect}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.rnr}</td>
                                                            <td className="text-center border-r px-4 py-8 text-foreground">{metrics.unqualified}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.lost}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.svs}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.sv}</td>
                                                            <td className="text-center font-black text-primary px-4 py-8 border-r">{metrics.booking}</td>
                                                            <td className="text-center font-bold bg-primary/10 px-4 py-8 text-primary">{metrics.costPerBooking.toLocaleString()}</td>
                                                        </>
                                                    ) : (
                                                        // Lead Only View (Only lead type selected, no source)
                                                        <>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.leads}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.prospect}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.rnr}</td>
                                                            <td className="text-center border-r px-4 py-8 text-foreground">{metrics.unqualified}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.lost}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.svs}</td>
                                                            <td className="text-center px-4 py-8 text-foreground border-r">{metrics.sv}</td>
                                                            <td className="text-center font-black text-primary px-4 py-8 border-r">{metrics.booking}</td>
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
                                                <td className="text-center font-bold px-4 py-8 text-foreground border-r">{cpActiveData.leads}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.rnr}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.prospect}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.unqualified}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.lost}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.svs}</td>
                                                <td className="text-center px-4 py-8 text-foreground border-r">{cpActiveData.sv}</td>
                                                <td className="text-center font-black text-primary px-4 py-8">{cpActiveData.booking}</td>
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
