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
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { getCookie } from "@/utils/cookies"
import type { GetAllProjectsQueryResponse, GetAllProjectsQueryVariables } from "@/types"

const GET_ALL_PROJECTS = gql`
  query GetAllProjects($organization: String!) {
    getAllProjects(organization: $organization) {
      product_id
      name
    }
  }
`;

// Constants
const RESPONSE_SOURCES = ["All Responses", "Online", "Offline"]
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f472b6']
const BUDGET_INDICES = [0, 2, 8, 10, 12]

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
    "Site Visit Scheduled", 
    "Cost per Site Visit Scheduled", 
    "Site Visit", 
    "Cost per Site Visit", 
    "Booking", 
    "Cost per Booking"
]

// Mock Data Structure: Project -> {online: [], offline: []}
export default function ProjectLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [projectFilter, setProjectFilter] = useState("all")
    const [responseFilter, setResponseFilter] = useState("all_responses")
    const [leadTypeFilter, setLeadTypeFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState("")
    const [timeFilter, setTimeFilter] = useState("")
 
    const org = getCookie('organization') || ''
    const { data: projectsData } = useQuery<GetAllProjectsQueryResponse, GetAllProjectsQueryVariables>(GET_ALL_PROJECTS, {
        variables: { organization: org },
        skip: !org
    });

    const PROJECTS = useMemo(() => {
        if (!projectsData?.getAllProjects) return []
        return projectsData.getAllProjects
            .filter((p: any) => p && p.name)
            .map((p: any) => `P${p.product_id} - ${p.name}`)
    }, [projectsData])

    const sourceData = useMemo(() => {
        const data: any = {}
        PROJECTS.forEach((proj: string) => {
            data[proj] = {
                online: [
                    Math.floor(Math.random() * 20000) + 5000,
                    Math.floor(Math.random() * 100) + 20,
                    0,
                    Math.floor(Math.random() * 30),
                    Math.floor(Math.random() * 30),
                    5,
                    5,
                    10,
                    0,
                    8,
                    0,
                    4,
                    0
                ],
                offline: [
                    0,
                    Math.floor(Math.random() * 50) + 10,
                    0,
                    Math.floor(Math.random() * 15),
                    Math.floor(Math.random() * 15),
                    2,
                    2,
                    5,
                    0,
                    3,
                    0,
                    1,
                    0
                ]
            }
        })
        return data
    }, [PROJECTS])

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Project Level Report" },
        ])
    }, [setBreadcrumbs])

    const isFilterApplied = projectFilter !== "all" || responseFilter !== "all_responses" || leadTypeFilter !== "all" || dateFilter !== ""

    const clearFilters = () => {
        setProjectFilter("all")
        setResponseFilter("all_responses")
        setLeadTypeFilter("all")
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

    const { projectTotals, globalSummary } = useMemo(() => {
        const totals: any = {}
        let gLeads = 0, gProspects = 0, gSV = 0, gBookings = 0
        const leadMultiplier = leadTypeFilter === "all" ? 1.0 : leadTypeFilter === "new" ? 0.7 : 0.3

        PROJECTS.forEach((proj: string) => {
            const online = [...sourceData[proj].online]
            const offline = [...sourceData[proj].offline]

            let combined = Array(METRICS.length).fill(0)
            if (responseFilter === "all_responses") {
                combined = online.map((v, i) => v + offline[i])
            } else if (responseFilter === "online") {
                combined = online
            } else {
                combined = offline
            }

            const scaledData = combined.map((v, i) => !BUDGET_INDICES.includes(i) ? Math.round(v * leadMultiplier) : v)
            totals[proj] = calculateRates(scaledData)

            if (projectFilter === "all" || projectFilter === proj) {
                gLeads += totals[proj][1]
                gProspects += totals[proj][4]
                gSV += totals[proj][9]
                gBookings += totals[proj][11]
            }
        })

        return { projectTotals: totals, globalSummary: { totalLeads: gLeads, totalProspects: gProspects, totalSV: gSV, totalBookings: gBookings } }
    }, [PROJECTS, projectFilter, responseFilter, leadTypeFilter, sourceData])

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new()
        const rows: any[][] = [["Project Level Performance Report"], ["Generated At:", new Date().toLocaleString()], []]
        
        const hideBudget = leadTypeFilter !== "all"
        const isOffline = responseFilter === "offline"
        const hideBudgetInThisView = hideBudget || isOffline
        const displayMetrics = METRICS.filter((_, i) => !(hideBudgetInThisView && BUDGET_INDICES.includes(i)))

        rows.push(["Project Name", ...displayMetrics])
        PROJECTS.forEach((proj: string) => {
            const rowData = [proj]
            projectTotals[proj].forEach((val: number, vIdx: number) => {
                if (hideBudgetInThisView && BUDGET_INDICES.includes(vIdx)) return
                rowData.push(BUDGET_INDICES.includes(vIdx) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN'))
            })
            rows.push(rowData)
        })

        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "Project Report")
        XLSX.writeFile(wb, `Project_Level_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const renderTable = () => {
        const filteredProjects = PROJECTS.filter((p: string) => projectFilter === "all" || p === projectFilter)
        if (filteredProjects.length === 0) return null

        const hideBudget = leadTypeFilter !== "all"
        const isOffline = responseFilter === "offline"
        const hideBudgetInThisView = hideBudget || isOffline
        const displayMetrics = METRICS.filter((_, i) => !(hideBudgetInThisView && BUDGET_INDICES.includes(i)))

        return (
            <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden mb-8">
                <CardHeader className="bg-muted/5 py-4 border-b">
                    <div className="flex items-center justify-between px-2">
                        <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            PROJECT ANALYSIS
                            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">LIVE</Badge>
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted/10 border-b border-primary/10">
                                    <th className="font-extrabold text-[11px] uppercase tracking-widest text-left px-6 py-4 border-r border-muted/20">Project Name</th>
                                    {displayMetrics.map((m, idx) => (
                                        <th key={m} className={`font-extrabold text-[11px] uppercase tracking-widest text-center min-w-[110px] py-4 align-bottom ${idx < displayMetrics.length - 1 ? 'border-r border-muted/20' : ''}`}>
                                            {m}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-background">
                                {filteredProjects.map((proj: string) => (
                                    <tr key={proj} className="group hover:bg-primary/5 transition-all duration-200 border-b">
                                        <td className="font-bold px-6 py-4 text-xs text-foreground border-r border-muted/20 dark:bg-black group-hover:bg-primary/5 uppercase">
                                            {proj}
                                        </td>
                                        {projectTotals[proj].map((val: number, vIdx: number) => {
                                            if (hideBudgetInThisView && BUDGET_INDICES.includes(vIdx)) return null
                                            return (
                                                <td key={vIdx} className={`text-center px-4 py-4 text-xs font-medium ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'font-bold text-primary bg-primary/5 italic' : ''}`}>
                                                    {BUDGET_INDICES.includes(vIdx) ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN')}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
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
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic text-left">
                    Project Level Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-500" />
                    Comparative performance analytics across residential and commercial developments.
                </p>
            </div>

            <Card className="border-none shadow-md bg-background/80 backdrop-blur-md sticky top-12 z-30 ring-1 ring-border/50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
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
                                    {PROJECTS.map((p: string) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Globe className="h-3 w-3" />
                                Campaign Type
                            </Label>
                            <Select value={responseFilter} onValueChange={setResponseFilter}>
                                <SelectTrigger className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50">
                                    <SelectValue placeholder="All Responses" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RESPONSE_SOURCES.map(source => (
                                        <SelectItem key={source} value={source.toLowerCase().replace(" ", "_")}>
                                            {source}
                                        </SelectItem>
                                    ))}
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
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-left items-start w-[280px]">
                            <PieChartIcon className="h-4 w-4 text-blue-500" />
                            Lead Volume per Project
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <PieChart>
                                <Pie
                                    data={PROJECTS.filter((p: string) => projectFilter === 'all' || p === projectFilter).map((p: string, index: number) => ({ 
                                        name: p.split(' - ')[0], 
                                        value: projectTotals[p]?.[1] || 0 
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }: { name: string, percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {PROJECTS.map((_: string, index: number) => (
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
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-left items-start w-[280px]">
                            <BarChart3 className="h-4 w-4 text-emerald-500" />
                            Bookings vs Performance Target
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <BarChart
                                data={PROJECTS.filter((p: string) => projectFilter === 'all' || p === projectFilter).map((p: string) => ({ 
                                    name: p.split(' - ')[0], 
                                    leads: projectTotals[p]?.[1] || 0, 
                                    bookings: projectTotals[p]?.[11] || 0 
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

            <div className="animate-in fade-in slide-in-from-top-6 duration-700">
                {renderTable()}
            </div>
        </div>
    )
}
