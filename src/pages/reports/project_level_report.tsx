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
    Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import React from "react"

// Constants
const PROJECTS = ["P1 - Sky High", "P2 - Emerald Valley", "P3 - Urban Square", "P4 - Heritage Homes"]
const RESPONSE_SOURCES = ["All Responses", "Online", "Offline"]

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
                0, // Budget
                Math.floor(Math.random() * 50) + 10, // Leads
                0, // CPL
                Math.floor(Math.random() * 15), // RNR
                Math.floor(Math.random() * 15), // Prospect
                2, // Unqualified
                2, // Lost
                5, // SVS
                0, // CpSVS
                4, // SV
                0, // CpSV
                2, // Booking
                0 // CpBooking
            ]
        }
    })
    return data
}

const MOCK_PROJECT_DATA = generateMockData()

export default function ProjectLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [projectFilter, setProjectFilter] = useState("all")
    const [responseSource, setResponseSource] = useState("All Responses")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Project Level Report" },
        ])
    }, [setBreadcrumbs])

    const isFilterApplied = projectFilter !== "all" || responseSource !== "All Responses" || startDate !== ""

    const clearFilters = () => {
        setProjectFilter("all")
        setResponseSource("All Responses")
        setStartDate("")
        setEndDate("")
        setStartTime("")
        setEndTime("")
    }

    const calculateRates = (data: number[]) => {
        const [budget, leads, , , , , , svs, , sv, , booking] = data
        data[2] = leads > 0 ? Math.round(budget / leads) : 0
        data[8] = svs > 0 ? Math.round(budget / svs) : 0
        data[10] = sv > 0 ? Math.round(budget / sv) : 0
        data[12] = booking > 0 ? Math.round(budget / booking) : 0
        return data
    }

    const { tableData, grandTotal, globalSummary } = useMemo(() => {
        const results: any[] = []
        let gLeads = 0, gProspects = 0, gSV = 0, gBookings = 0
        const displayProjects = projectFilter === "all" ? PROJECTS : [projectFilter]

        displayProjects.forEach(proj => {
            const combined = Array(METRICS.length).fill(0)
            const data = MOCK_PROJECT_DATA[proj]
            
            if (responseSource === "All Responses" || responseSource === "Online") {
                data.online.forEach((v: number, i: number) => { if (i !== 2 && i !== 8 && i !== 10 && i !== 12) combined[i] += v })
            }
            if (responseSource === "All Responses" || responseSource === "Offline") {
                data.offline.forEach((v: number, i: number) => { if (i !== 2 && i !== 8 && i !== 10 && i !== 12) combined[i] += v })
            }

            const calculated = calculateRates([...combined])
            results.push({ name: proj, data: calculated })

            gLeads += calculated[1]
            gProspects += calculated[4]
            gSV += calculated[9]
            gBookings += calculated[11]
        })

        const totalRow = Array(METRICS.length).fill(0)
        results.forEach(r => {
            r.data.forEach((v: number, i: number) => { if (![2, 8, 10, 12].includes(i)) totalRow[i] += v })
        })

        return { 
            tableData: results, 
            grandTotal: calculateRates(totalRow),
            globalSummary: { totalLeads: gLeads, totalProspects: gProspects, totalSV: gSV, totalBookings: gBookings } 
        }
    }, [projectFilter, responseSource])

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new()
        const rows = [["Project Level Performance Report"], ["Response Category:", responseSource], ["Generated At:", new Date().toLocaleString()], [], ["Project Name", ...METRICS]]
        
        tableData.forEach(r => {
            const row: any[] = [r.name, ...r.data.map((v: number, i: number) => {
                if ([0, 2, 8, 10, 12].includes(i)) return `₹${v.toLocaleString()}`
                return v
            })]
            rows.push(row)
        })
        const totalRow: any[] = ["GRAND TOTAL", ...grandTotal.map((v: number, i: number) => {
            if ([0, 2, 8, 10, 12].includes(i)) return `₹${v.toLocaleString()}`
            return v
        })]
        rows.push(totalRow)
        
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Project Report")
        XLSX.writeFile(wb, `Project_Level_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                        Project Level Report
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-orange-500" />
                        Sales velocity and inventory conversion insights per project.
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
                                <Globe className="h-3 w-3" />
                                Response Source
                            </Label>
                            <Select value={responseSource} onValueChange={setResponseSource}>
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
                                <Building2 className="h-3 w-3" />
                                Target Project
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
                                <CalendarDays className="h-3 w-3" />
                                Date Range
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50 text-xs" />
                                <span className="text-muted-foreground">-</span>
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50 text-xs" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground/80 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Time Window
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50 text-xs" />
                                <span className="text-muted-foreground">-</span>
                                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-10 bg-muted/30 border-none transition-all hover:bg-muted/50 text-xs" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600"><Users className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wider">Project Leads</p>
                            <h3 className="text-xl font-bold">{globalSummary.totalLeads}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600"><Target className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-purple-600/70 tracking-wider">Hot Prospects</p>
                            <h3 className="text-xl font-bold">{globalSummary.totalProspects}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600"><CheckCircle2 className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-amber-600/70 tracking-wider">SV Done</p>
                            <h3 className="text-xl font-bold">{globalSummary.totalSV}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600"><Zap className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-emerald-600/70 tracking-wider">Bookings</p>
                            <h3 className="text-xl font-bold text-emerald-600">{globalSummary.totalBookings}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-top-6 duration-700">
                <CardHeader className="bg-muted/5 py-4 border-b">
                    <div className="flex items-center justify-between px-2">
                        <CardTitle className="text-lg font-bold tracking-tight text-orange-600 dark:text-orange-400 flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Inventory Performance Audit
                        </CardTitle>
                        <Badge variant="secondary" className="font-mono text-[10px]">{responseSource.toUpperCase()}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-muted/10 border-b border-primary/10">
                                    <th className="font-extrabold text-[10px] uppercase tracking-widest px-6 py-4 border-r border-muted/20 min-w-[200px]">Project Name</th>
                                    {METRICS.map((m, idx) => (
                                        <th key={m} className={`font-extrabold text-[10px] uppercase tracking-widest text-center min-w-[110px] py-4 align-bottom ${idx < METRICS.length - 1 ? 'border-r border-muted/20' : ''}`}>
                                            {m}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-background">
                                {tableData.map((row) => (
                                    <tr key={row.name} className="group hover:bg-primary/5 transition-all duration-200 border-b">
                                        <td className="font-bold px-6 py-4 text-xs text-foreground border-r dark:bg-black border-muted/20 bg-white group-hover:bg-primary/5 uppercase">
                                            {row.name}
                                        </td>
                                        {row.data.map((val: number, vIdx: number) => (
                                            <td key={vIdx} className={`text-center px-4 py-4 text-xs font-medium ${vIdx < METRICS.length - 1 ? 'border-r border-muted/20' : ''} ${vIdx === 11 ? 'font-bold text-primary bg-primary/5' : ''}`}>
                                                {[0, 2, 8, 10, 12].includes(vIdx) ? `₹${val.toLocaleString()}` : val}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {/* Grand Total Row */}
                                <tr className="bg-primary/5 font-bold border-t-2 border-primary/20">
                                    <td className="px-6 py-4 text-xs uppercase tracking-wider text-primary">
                                        TOTAL PORTFOLIO
                                    </td>
                                    {calculateRates(tableData.reduce((acc, curr) => {
                                        curr.data.forEach((v: number, i: number) => { if (![2, 8, 10, 12].includes(i)) acc[i] += v })
                                        return acc
                                    }, Array(METRICS.length).fill(0))).map((val: number, vIdx: number) => (
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
