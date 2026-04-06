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
    Building2,
    Globe,
    Zap,
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
const PROJECTS = ["P1 - Sky High", "P2 - Emerald Valley", "P3 - Urban Square", "P4 - Heritage Homes"]
const RESPONSE_SOURCES = ["All Responses", "Online", "Offline"]
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f472b6']

const chartConfig = {
    leads: {
        label: "Leads",
        color: "hsl(var(--primary))",
    },
    bookings: {
        label: "Bookings",
        color: "#10b981",
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
    "SVS", 
    "Cost per SVS", 
    "SV", 
    "Cost per SV", 
    "Booking", 
    "Cost per Booking"
]

// Mock Data Structure: Project -> {online: [], offline: []}
const generateMockData = () => {
    const data: any = {}
    PROJECTS.forEach(proj => {
        data[proj] = {
            online: [
                Math.floor(Math.random() * 20000) + 5000, // Budget
                Math.floor(Math.random() * 100) + 20, // Leads
                0, // CPL
                Math.floor(Math.random() * 30), // RNR
                Math.floor(Math.random() * 30), // Prospect
                5, // Unqualified
                5, // Lost
                10, // SVS
                0, // CpSVS
                8, // SV
                0, // CpSV
                4, // Booking
                0 // CpBooking
            ],
            offline: [
                Math.floor(Math.random() * 10000) + 2000,
                Math.floor(Math.random() * 50) + 10,
                0, Math.floor(Math.random() * 15), Math.floor(Math.random() * 15), 2, 2, 5, 0, 4, 0, 2, 0
            ]
        }
    })
    return data
}

const MOCK_PROJECT_DATA = generateMockData()

export default function ProjectLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [projectFilter, setProjectFilter] = useState("all")
    const [responseFilter, setResponseFilter] = useState("All Responses")
    const [dateFilter, setDateFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Project Level Report" },
        ])
    }, [setBreadcrumbs])

    const isFilterApplied = projectFilter !== "all" || responseFilter !== "All Responses" || dateFilter !== ""

    const clearFilters = () => {
        setProjectFilter("all")
        setResponseFilter("All Responses")
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

    const { processedData, globalSummary } = useMemo(() => {
        const result: any = {}
        let gLeads = 0, gProspects = 0, gSV = 0, gBookings = 0

        PROJECTS.forEach(proj => {
            const online = [...MOCK_PROJECT_DATA[proj].online]
            const offline = [...MOCK_PROJECT_DATA[proj].offline]
            const all = online.map((v, i) => v + offline[i])

            let targetedData = []
            if (responseFilter === "Online") targetedData = online
            else if (responseFilter === "Offline") targetedData = offline
            else targetedData = all

            result[proj] = calculateRates(targetedData)

            if (projectFilter === "all" || projectFilter === proj) {
                gLeads += targetedData[1]
                gProspects += targetedData[4]
                gSV += targetedData[9]
                gBookings += targetedData[11]
            }
        })

        return { processedData: result, globalSummary: { totalLeads: gLeads, totalProspects: gProspects, totalSV: gSV, totalBookings: gBookings } }
    }, [responseFilter, projectFilter])

    const displayProjects = useMemo(() => {
        return PROJECTS.filter(p => projectFilter === "all" || p === projectFilter)
    }, [projectFilter])

    const grandTotal = useMemo(() => {
        const total = Array(METRICS.length).fill(0)
        displayProjects.forEach(proj => {
            METRICS.forEach((_, i) => { if (![2, 8, 10, 12].includes(i)) total[i] += processedData[proj][i] })
        })
        return calculateRates(total)
    }, [displayProjects, processedData])

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new()
        const rows = [
            ["Project Level Performance Report"],
            ["Response Source:", responseFilter],
            ["Generated At:", new Date().toLocaleString()],
            [],
            ["Project Name", ...METRICS]
        ]
        displayProjects.forEach(p => {
            rows.push([p, ...processedData[p].map((val: number, i: number) => [0, 2, 8, 10, 12].includes(i) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN'))])
        })
        rows.push(["GRAND TOTAL", ...grandTotal.map((val: number, i: number) => [0, 2, 8, 10, 12].includes(i) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN'))])
        
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Project Report")
        XLSX.writeFile(wb, `Project_Level_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex flex-col gap-1 items-start text-left">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic text-left items-start text-left items-start">
                    Project Level Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-500" />
                    Comparative performance analytics across residential and commercial developments.
                </p>
            </div>

            <Card className="border-none shadow-md bg-background/60 backdrop-blur-md">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Building2 className="h-3 w-3" />
                                Focus Project
                            </Label>
                            <Select value={projectFilter} onValueChange={setProjectFilter}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50">
                                    <SelectValue placeholder="All Projects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Projects</SelectItem>
                                    {PROJECTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Globe className="h-3 w-3" />
                                Response Channel
                            </Label>
                            <Select value={responseFilter} onValueChange={setResponseFilter}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50">
                                    <SelectValue placeholder="Select Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RESPONSE_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <CalendarDays className="h-3 w-3" />
                                Analysis Period
                            </Label>
                            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Timestamp
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadExcel}
                            className="gap-2 text-sm h-9 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold shadow-sm"
                        >
                            <Download className="h-4 w-4" /> Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-none">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600"><Users className="h-6 w-6" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wider">Total Leads</p>
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

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden text-left items-start">
                            <CardHeader className="bg-muted/5 py-4 border-b">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-left items-start">
                                    <PieChartIcon className="h-4 w-4 text-blue-500" />
                                    Lead Volume per Project
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 h-[350px]">
                                <ChartContainer config={chartConfig} className="h-full">
                                    <PieChart>
                                        <Pie
                                            data={displayProjects.map(p => ({ name: p.split(' - ')[0], value: processedData[p][1] }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {displayProjects.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden text-left items-start">
                            <CardHeader className="bg-muted/5 py-4 border-b">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-left items-start">
                                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                                    Bookings vs Performance Target
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 h-[350px]">
                                <ChartContainer config={chartConfig} className="h-full">
                                    <BarChart
                                        data={displayProjects.map(p => ({ 
                                            name: p.split(' - ')[0], 
                                            leads: processedData[p][1], 
                                            bookings: processedData[p][11] 
                                        }))}
                                        margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="leads" fill="var(--color-leads)" radius={[4, 4, 0, 0]} barSize={24} />
                                        <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-top-6 duration-700">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="bg-muted/10 border-b border-primary/10">
                                            <th className="font-extrabold text-[11px] uppercase tracking-widest px-6 py-4 border-r border-muted/20">Project Name</th>
                                            {METRICS.map((m, idx) => (
                                                <th key={m} className={`font-extrabold text-[11px] uppercase tracking-widest text-center min-w-[105px] py-4 align-bottom ${idx < METRICS.length - 1 ? 'border-r border-muted/20' : ''}`}>
                                                    {m}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-background">
                                        {displayProjects.map(proj => (
                                            <tr key={proj} className="group hover:bg-primary/5 transition-all duration-200 border-b">
                                                <td className="font-bold px-6 py-4 text-xs text-foreground border-r border-muted/20 bg-white group-hover:bg-primary/5 uppercase">
                                                    {proj}
                                                </td>
                                                {processedData[proj].map((val: number, vIdx: number) => (
                                                    <td key={vIdx} className={`text-center px-4 py-4 text-xs font-medium ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'font-bold text-primary bg-primary/5' : ''}`}>
                                                        {[0, 2, 8, 10, 12].includes(vIdx) ? `₹${val.toLocaleString()}` : val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        <tr className="bg-primary/5 font-extrabold border-t-2 border-primary/20">
                                            <td className="px-6 py-4 text-xs uppercase tracking-wider text-primary">GRAND TOTAL</td>
                                            {grandTotal.map((val: number, vIdx: number) => (
                                                <td key={vIdx} className={`text-center px-4 py-4 text-xs ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'bg-primary/10 text-primary' : 'text-primary'}`}>
                                                    {[0, 2, 8, 10, 12].includes(vIdx) ? `₹${val.toLocaleString()}` : val}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
        </div>
    )
}
