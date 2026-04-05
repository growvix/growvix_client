import { useState, useEffect, useMemo } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { 
    Lightbulb, 
    RotateCcw, 
    Download,
    Building2,
    Users,
    Search,
    ChevronDown,
    Check,
    ChevronsUpDown,
    Tag,
    Globe,
    UserCircle,
    UserCheck,
    Megaphone,
    Zap,
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
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
type OpportunityData = {
    id: string
    campaign: "Online" | "Offline"
    source: string
    project: string
    lead: string
    stage: "Prospect" | "SVS" | "SVS Done" | "Lost"
    status: "Hot" | "Warm" | "Cold"
    pre_sales_users: string[]
    sales_users: string[]
    last_note: string
    last_call: string
}

type Filters = {
    campaign: string
    source: string
    project: string
    status: string
    stage: string
    preSalesUsers: string[]
    salesUsers: string[]
}

const chartConfig = {
    opportunities: { label: "Opportunities", color: "#3b82f6" },
    hot: { label: "Hot", color: "#ef4444" },
    warm: { label: "Warm", color: "#f59e0b" },
    cold: { label: "Cold", color: "#3b82f6" },
} satisfies ChartConfig

const getInitials = (name: string) => {
    if (!name) return ""
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
}

export default function OpportunityReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const organization = getCookie("organization") || ""
    const userRole = getCookie("role") || ""
    const isAdminOrManager = userRole === "admin" || userRole === "manager"

    // State
    const [data, setData] = useState<OpportunityData[]>([])
    const [users, setUsers] = useState<{ _id: string, name: string }[]>([])
    
    const [filters, setFilters] = useState<Filters>({
        campaign: "all",
        source: "all",
        project: "all",
        status: "all",
        stage: "all",
        preSalesUsers: [],
        salesUsers: [],
    })

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        last_note: false // Hide by default for cleaner UI if many columns
    })
    const [globalFilter, setGlobalFilter] = useState("")

    // Popover states
    const [campaignOpen, setCampaignOpen] = useState(false)
    const [sourceOpen, setSourceOpen] = useState(false)
    const [projectOpen, setProjectOpen] = useState(false)
    const [statusOpen, setStatusOpen] = useState(false)
    const [stageOpen, setStageOpen] = useState(false)
    const [preSalesOpen, setPreSalesOpen] = useState(false)
    const [salesOpen, setSalesOpen] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Opportunity Report" },
        ])
    }, [setBreadcrumbs])

    // Fetch users
    useEffect(() => {
        async function fetchUsers() {
            if (!organization || !isAdminOrManager) return
            try {
                const token = getCookie("token")
                const response = await axios.get(`${API.USERS}?organization=${organization}&limit=1000`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const userData = response.data.data
                if (userData && userData.users) {
                    const mappedUsers = userData.users
                        .filter((u: any) => u.isActive !== false)
                        .map((u: any) => ({
                            _id: u._id || u.globalUserId,
                            name: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.name || "Unknown User"
                        }))
                    setUsers(mappedUsers)
                }
            } catch (err) {
                console.error("Failed to fetch users", err)
            }
        }
        fetchUsers()
    }, [organization, isAdminOrManager])

    // Mock Data generation
    useEffect(() => {
        const mockUsersList = users.length > 0 ? users.map(u => u.name) : ["Dinesh", "Dinesh Kumar", "Ramesh Kumar", "Suresh"]
        const projects = ["Project A", "Project B", "Alpha", "Omega"]
        const sources = ["Meta", "Google", "Website", "Social Media"]
        const statuses = ["Hot", "Warm", "Cold"]
        const campaigns = ["Online", "Offline"]
        const stages = ["Prospect", "SVS", "SVS Done", "Lost"]

        const mockData: OpportunityData[] = []
        for (let i = 1; i <= 50; i++) {
            const preCount = Math.floor(Math.random() * 2) + 1
            const salesCount = Math.floor(Math.random() * 2) + 1
            
            mockData.push({
                id: `${i}`,
                campaign: campaigns[Math.floor(Math.random() * campaigns.length)] as any,
                source: sources[Math.floor(Math.random() * sources.length)],
                project: projects[Math.floor(Math.random() * projects.length)],
                lead: `Opportunity Lead #${1000 + i}`,
                stage: stages[Math.floor(Math.random() * stages.length)] as any,
                status: statuses[Math.floor(Math.random() * statuses.length)] as any,
                pre_sales_users: Array.from({length: preCount}, () => mockUsersList[Math.floor(Math.random() * mockUsersList.length)]),
                sales_users: Array.from({length: salesCount}, () => mockUsersList[Math.floor(Math.random() * mockUsersList.length)]),
                last_note: "Customer is interested in 3BHK east facing unit.",
                last_call: format(new Date(2026, 3, Math.floor(Math.random() * 25) + 1), "dd/MM/yyyy HH:mm")
            })
        }
        setData(mockData)
    }, [users]) 

    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (filters.campaign !== "all" && item.campaign !== filters.campaign) return false
            if (filters.source !== "all" && item.source !== filters.source) return false
            if (filters.project !== "all" && item.project !== filters.project) return false
            if (filters.status !== "all" && item.status !== filters.status) return false
            if (filters.stage !== "all" && item.stage !== filters.stage) return false
            
            if (filters.preSalesUsers.length > 0) {
                const matches = filters.preSalesUsers.some(u => item.pre_sales_users.includes(u))
                if (!matches) return false
            }
            if (filters.salesUsers.length > 0) {
                const matches = filters.salesUsers.some(u => item.sales_users.includes(u))
                if (!matches) return false
            }
            return true
        })
    }, [data, filters])

    // Chart Data
    const projectChartData = useMemo(() => {
        const counts: Record<string, number> = {}
        filteredData.forEach(d => { counts[d.project] = (counts[d.project] || 0) + 1 })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [filteredData])

    const statusChartData = useMemo(() => {
        const counts: Record<string, number> = { Hot: 0, Warm: 0, Cold: 0 }
        filteredData.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1 })
        return [
            { name: 'hot', value: counts.Hot, fill: 'var(--color-hot)' },
            { name: 'warm', value: counts.Warm, fill: 'var(--color-warm)' },
            { name: 'cold', value: counts.Cold, fill: 'var(--color-cold)' },
        ].filter(d => d.value > 0)
    }, [filteredData])

    const columns: ColumnDef<OpportunityData>[] = useMemo(() => [
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
        },
        {
            accessorKey: "pre_sales_users",
            header: "Pre-Sales Users",
            meta: { label: "Pre-Sales Users" },
            cell: ({ row }) => {
                const usersList = row.getValue("pre_sales_users") as string[]
                const max = 3
                const display = usersList.slice(0, max)
                const remaining = usersList.length - max

                const getColor = (initials: string) => {
                    const colors = [
                        "text-blue-400 border-blue-400/20 bg-blue-400/10",
                        "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
                        "text-purple-400 border-purple-400/20 bg-purple-400/10",
                        "text-rose-400 border-rose-400/20 bg-rose-400/10",
                        "text-amber-400 border-amber-400/20 bg-amber-400/10"
                    ]
                    const charCode = initials.charCodeAt(0) || 0
                    return colors[charCode % colors.length]
                }

                return (
                    <div className="flex items-center justify-center -space-x-3">
                        <TooltipProvider>
                            {display.map((u, i) => {
                                const initials = getInitials(u)
                                return (
                                    <Tooltip key={i}>
                                        <TooltipTrigger>
                                            <div className={cn(
                                                "relative flex items-center justify-center rounded-full h-8 w-8 text-[11px] font-extrabold border-2 bg-background transition-transform hover:z-10 hover:scale-110",
                                                getColor(initials)
                                            )}>
                                                {initials}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs font-semibold">{u}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            })}
                        </TooltipProvider>
                        {remaining > 0 && (
                            <div className="flex items-center justify-center rounded-full h-8 w-8 text-[11px] font-bold border-2 border-muted bg-muted text-muted-foreground z-0">
                                +{remaining}
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "sales_users",
            header: "Sales Users",
            meta: { label: "Sales Users" },
            cell: ({ row }) => {
                const usersList = row.getValue("sales_users") as string[]
                const max = 3
                const display = usersList.slice(0, max)
                const remaining = usersList.length - max

                const getColor = (initials: string) => {
                    const colors = [
                        "text-sky-400 border-sky-400/20 bg-sky-400/10",
                        "text-green-400 border-green-400/20 bg-green-400/10",
                        "text-indigo-400 border-indigo-400/20 bg-indigo-400/10",
                        "text-pink-400 border-pink-400/20 bg-pink-400/10",
                        "text-orange-400 border-orange-400/20 bg-orange-400/10"
                    ]
                    const charCode = (initials.charCodeAt(0) || 0) + 2
                    return colors[charCode % colors.length]
                }

                return (
                    <div className="flex items-center justify-center -space-x-3">
                        <TooltipProvider>
                            {display.map((u, i) => {
                                const initials = getInitials(u)
                                return (
                                    <Tooltip key={i}>
                                        <TooltipTrigger>
                                            <div className={cn(
                                                "relative flex items-center justify-center rounded-full h-8 w-8 text-[11px] font-extrabold border-2 bg-background transition-transform hover:z-10 hover:scale-110",
                                                getColor(initials)
                                            )}>
                                                {initials}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs font-semibold">{u}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            })}
                        </TooltipProvider>
                        {remaining > 0 && (
                            <div className="flex items-center justify-center rounded-full h-8 w-8 text-[11px] font-bold border-2 border-muted bg-muted text-muted-foreground z-0">
                                +{remaining}
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "last_note",
            header: "Last Note",
            meta: { label: "Last Note" },
            cell: ({ row }) => (
                <div className="truncate max-w-[200px] text-xs text-muted-foreground italic group-hover:whitespace-normal group-hover:overflow-visible transition-all duration-300">
                    {row.getValue("last_note")}
                </div>
            )
        },
        {
            accessorKey: "last_call",
            header: "Last Call",
            meta: { label: "Last Call" },
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
            ["Opportunity Report"],
            ["Generated At:", new Date().toLocaleString('en-IN')],
            [],
            ["Campaign", "Source", "Project", "Lead", "Stage", "Status", "Pre-Sales Users", "Sales Users", "Last Note", "Last Call"]
        ]

        filteredData.forEach(item => {
            rows.push([
                item.campaign, 
                item.source, 
                item.project, 
                item.lead, 
                item.stage,
                item.status, 
                item.pre_sales_users.join(", "), 
                item.sales_users.join(", "), 
                item.last_note, 
                item.last_call
            ])
        })

        rows.push([])
        rows.push(["GRAND TOTAL", "", "", filteredData.length.toLocaleString('en-IN')])

        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "Opportunities")
        XLSX.writeFile(wb, `Opportunity_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    const clearFilters = () => {
        setFilters({
            campaign: "all",
            source: "all",
            project: "all",
            status: "all",
            stage: "all",
            preSalesUsers: [],
            salesUsers: [],
        })
    }

    const isFilterApplied = filters.campaign !== "all" || filters.source !== "all" || filters.project !== "all" || filters.status !== "all" || filters.stage !== "all" || filters.preSalesUsers.length > 0 || filters.salesUsers.length > 0

    const isCampaignVisible = table.getColumn("campaign")?.getIsVisible() ?? true
    const isSourceVisible = table.getColumn("source")?.getIsVisible() ?? true
    const isProjectVisible = table.getColumn("project")?.getIsVisible() ?? true
    const isStatusVisible = table.getColumn("status")?.getIsVisible() ?? true
    const isStageVisible = table.getColumn("stage")?.getIsVisible() ?? true
    const isPreSalesVisible = table.getColumn("pre_sales_users")?.getIsVisible() ?? true
    const isSalesVisible = table.getColumn("sales_users")?.getIsVisible() ?? true

    const toggleUserFilter = (type: 'preSalesUsers' | 'salesUsers', name: string) => {
        setFilters(prev => {
            const current = [...prev[type]]
            const index = current.indexOf(name)
            if (index > -1) {
                current.splice(index, 1)
            } else {
                current.push(name)
            }
            return { ...prev, [type]: current }
        })
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex flex-col gap-1 items-start text-left">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                    Opportunity Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Tracking high-value prospects and cross-team engagement.
                </p>
            </div>

            <div className="rounded-xl bg-card border shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end transition-all duration-300">
                    
                    {isCampaignVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Globe className="h-3 w-3" /> Campaign
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
                                        <CommandInput placeholder="Search source..." />
                                        <CommandList>
                                            <CommandEmpty>No source found.</CommandEmpty>
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
                                        </CommandList>
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
                                        <CommandInput placeholder="Search project..." />
                                        <CommandList>
                                            <CommandEmpty>No project found.</CommandEmpty>
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
                                        </CommandList>
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
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left text-left">
                                        {filters.stage === "all" ? "All Stages" : filters.stage}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[180px] p-0">
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

                    {isPreSalesVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3" /> Pre-Sales Users
                            </Label>
                            <Popover open={preSalesOpen} onOpenChange={setPreSalesOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        <span className="truncate">
                                            {filters.preSalesUsers.length === 0 ? "All Users" : `${filters.preSalesUsers.length} Selected`}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[220px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map(u => (
                                                    <CommandItem key={u._id} onSelect={() => toggleUserFilter('preSalesUsers', u.name)}>
                                                        <Check className={cn("mr-2 h-4 w-4", filters.preSalesUsers.includes(u.name) ? "opacity-100" : "opacity-0")} />
                                                        {u.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {isSalesVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3" /> Sales Users
                            </Label>
                            <Popover open={salesOpen} onOpenChange={setSalesOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        <span className="truncate">
                                            {filters.salesUsers.length === 0 ? "All Users" : `${filters.salesUsers.length} Selected`}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[220px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map(u => (
                                                    <CommandItem key={u._id} onSelect={() => toggleUserFilter('salesUsers', u.name)}>
                                                        <Check className={cn("mr-2 h-4 w-4", filters.salesUsers.includes(u.name) ? "opacity-100" : "opacity-0")} />
                                                        {u.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
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
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Opportunities by Project
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <BarChart data={projectChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="var(--color-opportunities)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-purple-500" />
                            Opportunity Status Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <PieChart>
                                <Pie
                                    data={statusChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusChartData.map((entry, index) => (
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
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-medium">No opportunities found matching selected criteria.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
