import { useState, useEffect, useMemo } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { 
    Home, 
    RotateCcw, 
    Download,
    Building2,
    Search,
    ChevronDown,
    Check,
    ChevronsUpDown,
    Tag,
    Globe,
    Zap,
    Megaphone,
    Layers,
    Play,
    Filter,
    BarChart3,
    PieChart as PieChartIcon
} from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"
import { 
    useReactTable, 
    getCoreRowModel, 
    getSortedRowModel, 
    getFilteredRowModel, 
    flexRender, 
    type SortingState, 
    type ColumnFiltersState, 
    type VisibilityState,
    type ColumnDef
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCookie } from "@/utils/cookies"
import axios from "axios"
import { API } from "@/config/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"

// Types
type ApartmentData = {
    id: string
    campaign: "Online" | "Offline"
    source: string
    project: string
    lead: string
    apartment_type: string
    stage: "Prospect" | "SVS" | "SVS Done" | "Lost"
    status: "Hot" | "Warm" | "Cold" | "-"
}

type Filters = {
    campaign: string
    source: string
    project: string
    apartmentType: string
    stage: string
    status: string
}

const chartConfig = {
    interests: { label: "Interests", color: "#f43f5e" },
    prospect: { label: "Prospect", color: "#3b82f6" },
    svs: { label: "SVS", color: "#f59e0b" },
    svs_done: { label: "SVS Done", color: "#10b981" },
    lost: { label: "Lost", color: "#94a3b8" },
} satisfies ChartConfig

export default function ApartmentReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    
    // State
    const [data, setData] = useState<ApartmentData[]>([])
    
    const [filters, setFilters] = useState<Filters>({
        campaign: "all",
        source: "all",
        project: "all",
        apartmentType: "all",
        stage: "all",
        status: "all",
    })

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [globalFilter, setGlobalFilter] = useState("")

    // Popover states
    const [campaignOpen, setCampaignOpen] = useState(false)
    const [sourceOpen, setSourceOpen] = useState(false)
    const [projectOpen, setProjectOpen] = useState(false)
    const [aptTypeOpen, setAptTypeOpen] = useState(false)
    const [stageOpen, setStageOpen] = useState(false)
    const [statusOpen, setStatusOpen] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Property Interest Report" },
        ])
    }, [setBreadcrumbs])

    // Mock Data generation
    useEffect(() => {
        const campaigns = ["Online", "Offline"]
        const projects = ["Project A", "Project B", "Alpha", "Omega"]
        const sources = ["Meta", "Google", "Website", "Social Media"]
        const aptTypes = ["1BHK", "2BHK", "2.5BHK", "3BHK", "4BHK", "Penthouse"]
        const stages = ["Prospect", "SVS", "SVS Done", "Lost"]
        const statuses = ["Hot", "Warm", "Cold"]

        const mockData: ApartmentData[] = []
        for (let i = 1; i <= 50; i++) {
            const stage = stages[Math.floor(Math.random() * stages.length)] as any
            const status = stage === "Lost" ? "-" : statuses[Math.floor(Math.random() * statuses.length)] as any
            
            mockData.push({
                id: `${i}`,
                campaign: campaigns[Math.floor(Math.random() * campaigns.length)] as any,
                source: sources[Math.floor(Math.random() * sources.length)],
                project: projects[Math.floor(Math.random() * projects.length)],
                lead: `Prop Lead #${2000 + i}`,
                apartment_type: aptTypes[Math.floor(Math.random() * aptTypes.length)],
                stage,
                status
            })
        }
        setData(mockData)
    }, []) 

    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (filters.campaign !== "all" && item.campaign !== filters.campaign) return false
            if (filters.source !== "all" && item.source !== filters.source) return false
            if (filters.project !== "all" && item.project !== filters.project) return false
            if (filters.apartmentType !== "all" && item.apartment_type !== filters.apartmentType) return false
            if (filters.stage !== "all" && item.stage !== filters.stage) return false
            if (filters.status !== "all" && item.status !== filters.status) return false
            return true
        })
    }, [data, filters])

    // Chart Data
    const aptTypeChartData = useMemo(() => {
        const counts: Record<string, number> = {}
        filteredData.forEach(d => { counts[d.apartment_type] = (counts[d.apartment_type] || 0) + 1 })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [filteredData])

    const stageChartData = useMemo(() => {
        const counts: Record<string, number> = { Prospect: 0, SVS: 0, "SVS Done": 0, Lost: 0 }
        filteredData.forEach(d => { counts[d.stage] = (counts[d.stage] || 0) + 1 })
        return [
            { name: 'prospect', value: counts.Prospect, fill: 'var(--color-prospect)' },
            { name: 'svs', value: counts.SVS, fill: 'var(--color-svs)' },
            { name: 'svs_done', value: counts["SVS Done"], fill: 'var(--color-svs_done)' },
            { name: 'lost', value: counts.Lost, fill: 'var(--color-lost)' },
        ].filter(d => d.value > 0)
    }, [filteredData])

    const columns: ColumnDef<ApartmentData>[] = useMemo(() => [
        {
            accessorKey: "campaign",
            header: "Campaign",
            meta: { label: "Campaign" },
        },
        {
            accessorKey: "source",
            header: "Source",
            meta: { label: "Source" },
        },
        {
            accessorKey: "project",
            header: "Project",
            meta: { label: "Project" },
        },
        {
            accessorKey: "lead",
            header: "Lead",
            meta: { label: "Lead" },
        },
        {
            accessorKey: "apartment_type",
            header: "Property Type",
            meta: { label: "Property Type" },
        },
        {
            accessorKey: "stage",
            header: "Stage",
            meta: { label: "Stage" },
            cell: ({ row }) => {
                const stage = row.getValue("stage") as string
                return (
                    <div className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase w-fit mx-auto border",
                        stage === "Prospect" ? "border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20" :
                        stage === "SVS" ? "border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-900/20" :
                        stage === "SVS Done" ? "border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" :
                        "border-slate-200 text-slate-600 bg-slate-50 dark:bg-slate-900/20"
                    )}>
                        {stage}
                    </div>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            meta: { label: "Status" },
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                if (status === "-") return <div className="text-muted-foreground">-</div>
                return (
                    <div className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit mx-auto",
                        status === "Hot" ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                        status === "Warm" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30" :
                        "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    )}>
                        {status}
                    </div>
                )
            }
        }
    ], [])

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new()
        const rows = [
            ["Property Interest Report"],
            ["Generated At:", new Date().toLocaleString('en-IN')],
            [],
            ["Campaign", "Source", "Project", "Lead", "Property Type", "Stage", "Status"]
        ]

        filteredData.forEach(item => {
            rows.push([item.campaign, item.source, item.project, item.lead, item.apartment_type, item.stage, item.status])
        })

        rows.push([])
        rows.push(["GRAND TOTAL", "", "", filteredData.length.toLocaleString('en-IN')])

        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "PropertyInterest")
        XLSX.writeFile(wb, `Property_Interest_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    const clearFilters = () => {
        setFilters({
            campaign: "all",
            source: "all",
            project: "all",
            apartmentType: "all",
            stage: "all",
            status: "all",
        })
    }

    const isFilterApplied = Object.values(filters).some(v => v !== "all")

    const isCampaignVisible = table.getColumn("campaign")?.getIsVisible() ?? true
    const isSourceVisible = table.getColumn("source")?.getIsVisible() ?? true
    const isProjectVisible = table.getColumn("project")?.getIsVisible() ?? true
    const isAptTypeVisible = table.getColumn("apartment_type")?.getIsVisible() ?? true
    const isStageVisible = table.getColumn("stage")?.getIsVisible() ?? true
    const isStatusVisible = table.getColumn("status")?.getIsVisible() ?? true

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex flex-col gap-1 items-start text-left">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                    Property Interest Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    Analyzing unit-specific interest and conversion stages.
                </p>
            </div>

            <div className="rounded-xl bg-card border shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end transition-all duration-300">
                    
                    {isCampaignVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Megaphone className="h-3 w-3" /> Campaign
                            </Label>
                            <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs">
                                        <span className="truncate">{filters.campaign === "all" ? "All" : filters.campaign}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[150px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => { setFilters(f => ({ ...f, campaign: "all" })); setCampaignOpen(false) }}>
                                                <Check className={cn("mr-2 h-4 w-4", filters.campaign === "all" ? "opacity-100" : "opacity-0")} />
                                                All
                                            </CommandItem>
                                            {["Online", "Offline"].map(c => (
                                                <CommandItem key={c} onSelect={() => { setFilters(f => ({ ...f, campaign: c })); setCampaignOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.campaign === c ? "opacity-100" : "opacity-0")} />
                                                    {c}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {isSourceVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Search className="h-3 w-3" /> Source
                            </Label>
                            <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        <span className="truncate">{filters.source === "all" ? "All Sources" : filters.source}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[180px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => { setFilters(f => ({ ...f, source: "all" })); setSourceOpen(false) }}>
                                                <Check className={cn("mr-2 h-4 w-4", filters.source === "all" ? "opacity-100" : "opacity-0")} />
                                                All Sources
                                            </CommandItem>
                                            {["Meta", "Google", "Website", "Social Media"].map(s => (
                                                <CommandItem key={s} onSelect={() => { setFilters(f => ({ ...f, source: s })); setSourceOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.source === s ? "opacity-100" : "opacity-0")} />
                                                    {s}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {isProjectVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Project
                            </Label>
                            <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        {filters.project === "all" ? "All Projects" : filters.project}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => { setFilters(f => ({ ...f, project: "all" })); setProjectOpen(false) }}>
                                                <Check className={cn("mr-2 h-4 w-4", filters.project === "all" ? "opacity-100" : "opacity-0")} />
                                                All Projects
                                            </CommandItem>
                                            {["Project A", "Project B", "Alpha", "Omega"].map(p => (
                                                <CommandItem key={p} onSelect={() => { setFilters(f => ({ ...f, project: p })); setProjectOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.project === p ? "opacity-100" : "opacity-0")} />
                                                    {p}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {isAptTypeVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Layers className="h-3 w-3" /> Property Type
                            </Label>
                            <Popover open={aptTypeOpen} onOpenChange={setAptTypeOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        <span className="truncate">{filters.apartmentType === "all" ? "All Types" : filters.apartmentType}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[150px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => { setFilters(f => ({ ...f, apartmentType: "all" })); setAptTypeOpen(false) }}>
                                                <Check className={cn("mr-2 h-4 w-4", filters.apartmentType === "all" ? "opacity-100" : "opacity-0")} />
                                                All Types
                                            </CommandItem>
                                            {["1BHK", "2BHK", "3BHK", "4BHK", "Penthouse"].map(t => (
                                                <CommandItem key={t} onSelect={() => { setFilters(f => ({ ...f, apartmentType: t })); setAptTypeOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.apartmentType === t ? "opacity-100" : "opacity-0")} />
                                                    {t}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {isStageVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Zap className="h-3 w-3" /> Stage
                            </Label>
                            <Popover open={stageOpen} onOpenChange={setStageOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        {filters.stage === "all" ? "All Stages" : filters.stage}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[150px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => { setFilters(f => ({ ...f, stage: "all" })); setStageOpen(false) }}>
                                                <Check className={cn("mr-2 h-4 w-4", filters.stage === "all" ? "opacity-100" : "opacity-0")} />
                                                All Stages
                                            </CommandItem>
                                            {["Prospect", "SVS", "SVS Done", "Lost"].map(s => (
                                                <CommandItem key={s} onSelect={() => { setFilters(f => ({ ...f, stage: s })); setStageOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.stage === s ? "opacity-100" : "opacity-0")} />
                                                    {s}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {isStatusVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Tag className="h-3 w-3" /> Status
                            </Label>
                            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        {filters.status === "all" ? "All Status" : filters.status}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[150px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => { setFilters(f => ({ ...f, status: "all" })); setStatusOpen(false) }}>
                                                <Check className={cn("mr-2 h-4 w-4", filters.status === "all" ? "opacity-100" : "opacity-0")} />
                                                All Status
                                            </CommandItem>
                                            {["Hot", "Warm", "Cold"].map(s => (
                                                <CommandItem key={s} onSelect={() => { setFilters(f => ({ ...f, status: s })); setStatusOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.status === s ? "opacity-100" : "opacity-0")} />
                                                    {s}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center gap-3 pt-2">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search lead..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9 h-9 w-[250px] bg-muted/30 border-none" />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 border-none bg-muted/30 text-xs">
                                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table.getAllColumns().filter(col => col.getCanHide()).map(column => (
                                    <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                                        {(column.columnDef.meta as any)?.label || column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-3">
                        {isFilterApplied && (
                            <Button variant="ghost" onClick={clearFilters} className="text-xs h-9 hover:bg-destructive/10 hover:text-destructive">
                                <RotateCcw className="h-4 w-4 mr-2" /> Reset
                            </Button>
                        )}
                        <Button onClick={handleDownloadExcel} variant="outline" className="h-9 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-bold shadow-sm">
                            <Download className="h-4 w-4 mr-2" /> Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-rose-500" />
                            Interest by Property Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <BarChart data={aptTypeChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="var(--color-interests)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-purple-500" />
                            Prospect Stage Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <PieChart>
                                <Pie
                                    data={stageChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stageChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Table Section */}
            <div className="rounded-xl border shadow-md bg-card overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                <Table>
                    <TableHeader className="bg-muted/50 border-b">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-4 text-center">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="border-b transition-colors hover:bg-muted/30">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="text-center py-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-medium">No property interests found matching selected criteria.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
