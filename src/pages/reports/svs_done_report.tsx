import { useState, useEffect, useMemo } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { 
    CalendarCheck, 
    Clock, 
    RotateCcw, 
    Download,
    Building2,
    Users,
    Search,
    ChevronDown,
    Check,
    ChevronsUpDown,
    UserCheck,
    Globe,
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
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import type { GetAllProjectsQueryResponse, GetAllProjectsQueryVariables } from "@/types"

const GET_ALL_PROJECTS = gql`
  query GetAllProjects($organization: String!) {
    getAllProjects(organization: $organization) {
      product_id
      name
    }
  }
`;
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
type SVSDoneData = {
    id: string
    project: string
    source: string
    svs_lead: string
    user: string
    campaign_type: "Online" | "Offline"
    lead_type: "New Lead" | "Re-engaged Lead"
    svs_at: string
    svs_on: string
    time: string
}

type Filters = {
    project: string
    source: string
    user: string
    responseType: string
    leadType: string
    svsAt: string
    svsOn: string
    startTime: string
    endTime: string
}

const chartConfig = {
    visits: { label: "Site Visits", color: "#3b82f6" },
} satisfies ChartConfig

export default function SVSDoneReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const organization = getCookie("organization") || ""
    const userRole = getCookie("role") || ""
    const isAdminOrManager = userRole === "admin" || userRole === "manager"

    // State
    const [data, setData] = useState<SVSDoneData[]>([])
    const [users, setUsers] = useState<{ _id: string, name: string }[]>([])
    
    const [filters, setFilters] = useState<Filters>({
        project: "all",
        source: "all",
        user: "all",
        responseType: "all",
        leadType: "all",
        svsAt: "",
        svsOn: "",
        startTime: "",
        endTime: "",
    })

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [globalFilter, setGlobalFilter] = useState("")

    // Popover states
    const [projectOpen, setProjectOpen] = useState(false)
    const [sourceOpen, setSourceOpen] = useState(false)
    const [userOpen, setUserOpen] = useState(false)
    const [responseTypeOpen, setResponseTypeOpen] = useState(false)
    const [leadTypeOpen, setLeadTypeOpen] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Site Visit Done Report" },
        ])
    }, [setBreadcrumbs])

    const { data: projectsData } = useQuery<GetAllProjectsQueryResponse, GetAllProjectsQueryVariables>(GET_ALL_PROJECTS, {
        variables: { organization },
        skip: !organization
    });

    const PROJECTS = useMemo(() => {
        if (!projectsData?.getAllProjects) return []
        return projectsData.getAllProjects
            .filter((p: any) => p && p.name)
            .map((p: any) => `P${p.product_id} - ${p.name}`)
    }, [projectsData])

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
        const mockUsersList = users.length > 0 ? users.map(u => u.name) : ["User 1", "User 2", "User 3", "User 4"]
        
        const projectsList = PROJECTS.length > 0 ? PROJECTS : ["P1 - Sky High", "P2 - Emerald Valley"]
        const sources = ["Meta", "Google", "Website", "Social Media"]
        const leads = ["Amit Verma", "Neha Kapoor", "Rahul Singh", "Pooja Sharma", "Vikram Malhotra", "Meera Reddy"]
        const responseTypes = ["Online", "Offline"]
        const leadTypes = ["New Lead", "Re-engaged Lead"]

        const mockData: SVSDoneData[] = []
        for (let i = 1; i <= 50; i++) {
            mockData.push({
                id: `${i}`,
                project: projectsList[Math.floor(Math.random() * projectsList.length)],
                source: sources[Math.floor(Math.random() * sources.length)],
                svs_lead: leads[Math.floor(Math.random() * leads.length)],
                user: mockUsersList[Math.floor(Math.random() * mockUsersList.length)],
                campaign_type: responseTypes[Math.floor(Math.random() * responseTypes.length)] as any,
                lead_type: leadTypes[Math.floor(Math.random() * leadTypes.length)] as any,
                svs_at: format(new Date(2026, 3, Math.floor(Math.random() * 5) + 1), "yyyy-MM-dd"),
                svs_on: format(new Date(2026, 3, Math.floor(Math.random() * 10) + 10), "yyyy-MM-dd"),
                time: `${Math.floor(Math.random() * 12) + 1}:00 PM`,
            })
        }
        setData(mockData)
    }, [PROJECTS, users]) 

    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (filters.project !== "all" && item.project !== filters.project) return false
            if (filters.source !== "all" && item.source !== filters.source) return false
            if (filters.user !== "all" && item.user !== filters.user) return false
            if (filters.responseType !== "all" && item.campaign_type !== filters.responseType) return false
            if (filters.leadType !== "all" && item.lead_type !== filters.leadType) return false
            if (filters.svsAt && item.svs_at !== filters.svsAt) return false
            if (filters.svsOn && item.svs_on !== filters.svsOn) return false
            
            if (filters.startTime || filters.endTime) {
                const parseTime = (t: string) => {
                    const [time, period] = t.split(" ")
                    let [h, m] = time.split(":").map(Number)
                    if (period === "PM" && h < 12) h += 12
                    if (period === "AM" && h === 12) h = 0
                    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                }
                const itemTime = parseTime(item.time)
                if (filters.startTime && itemTime < filters.startTime) return false
                if (filters.endTime && itemTime > filters.endTime) return false
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

    const sourceChartData = useMemo(() => {
        const counts: Record<string, number> = {}
        filteredData.forEach(d => { counts[d.source] = (counts[d.source] || 0) + 1 })
        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
        return Object.entries(counts).map(([name, value], i) => ({ 
            name, 
            value, 
            fill: colors[i % colors.length] 
        }))
    }, [filteredData])

    const columns: ColumnDef<SVSDoneData>[] = useMemo(() => [
        {
            accessorKey: "project",
            header: "Project",
            meta: { label: "Project" },
        },
        {
            accessorKey: "source",
            header: "Source",
            meta: { label: "Source" },
        },
        {
            accessorKey: "svs_lead",
            header: "Lead Name",
            meta: { label: "Lead Name" },
        },
        {
            accessorKey: "user",
            header: "Sales User",
            meta: { label: "Sales User" },
        },
        {
            accessorKey: "campaign_type",
            header: "Campaign Type",
            meta: { label: "Campaign Type" },
        },
        {
            accessorKey: "lead_type",
            header: "Lead Type",
            meta: { label: "Lead Type" },
        },
        {
            accessorKey: "svs_on",
            header: "SV Date",
            meta: { label: "SV Date" },
            cell: ({ row }) => format(new Date(row.getValue("svs_on")), "dd/MM/yyyy")
        },
        {
            accessorKey: "time",
            header: "Time",
            meta: { label: "Time" },
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
            ["Site Visit Done Report"],
            ["Generated At:", new Date().toLocaleString('en-IN')],
            [],
            ["Project", "Source", "Lead Name", "Campaign Type", "Lead Type", "User", "SVS At", "SVS On"]
        ]

        filteredData.forEach(item => {
            rows.push([item.project, item.source, item.svs_lead, item.campaign_type, item.lead_type, item.user, item.svs_at, item.svs_on])
        })

        rows.push([])
        rows.push(["GRAND TOTAL", "", filteredData.length.toLocaleString('en-IN')])

        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "SiteVisits")
        XLSX.writeFile(wb, `SV_Done_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    const clearFilters = () => {
        setFilters({
            project: "all",
            source: "all",
            user: "all",
            responseType: "all",
            leadType: "all",
            svsAt: "",
            svsOn: "",
            startTime: "",
            endTime: "",
        })
    }

    const isFilterApplied = Object.values(filters).some(v => v !== "all" && v !== "")

    const isProjectVisible = table.getColumn("project")?.getIsVisible() ?? true
    const isSourceVisible = table.getColumn("source")?.getIsVisible() ?? true
    const isUserVisible = table.getColumn("user")?.getIsVisible() ?? true
    const isResponseTypeVisible = table.getColumn("response_type")?.getIsVisible() ?? true
    const isLeadTypeVisible = table.getColumn("lead_type")?.getIsVisible() ?? true
    const isSvsOnVisible = table.getColumn("svs_on")?.getIsVisible() ?? true

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex flex-col gap-1 items-start text-left">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                    Site Visit Done Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    Tracking completed site tours and client conversions.
                </p>
            </div>

            <div className="rounded-xl bg-card border shadow-sm p-6 space-y-6 sticky top-12 z-30 ring-1 ring-border/50 bg-background/80 backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9 gap-4 items-end transition-all duration-300">
                    
                    {isProjectVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Project
                            </Label>
                            <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        <span className="truncate">{filters.project === "all" ? "All Projects" : filters.project}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[180px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => { setFilters(f => ({ ...f, project: "all" })); setProjectOpen(false) }}>
                                                <Check className={cn("mr-2 h-4 w-4", filters.project === "all" ? "opacity-100" : "opacity-0")} />
                                                All Projects
                                            </CommandItem>
                                            {PROJECTS.map(p => (
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

                    {isUserVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <UserCheck className="h-3 w-3" /> Sales User
                            </Label>
                            <Popover open={userOpen} onOpenChange={setUserOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        <span className="truncate">{filters.user === "all" ? "All Users" : filters.user}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem onSelect={() => { setFilters(f => ({ ...f, user: "all" })); setUserOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.user === "all" ? "opacity-100" : "opacity-0")} />
                                                    All Users
                                                </CommandItem>
                                                {users.map(u => (
                                                    <CommandItem key={u._id} onSelect={() => { setFilters(f => ({ ...f, user: u.name })); setUserOpen(false) }}>
                                                        <Check className={cn("mr-2 h-4 w-4", filters.user === u.name ? "opacity-100" : "opacity-0")} />
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

                    {isResponseTypeVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Globe className="h-3 w-3" /> Campaign Type
                            </Label>
                            <Popover open={responseTypeOpen} onOpenChange={setResponseTypeOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        {filters.responseType === "all" ? "All" : filters.responseType}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[150px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => { setFilters(f => ({ ...f, responseType: "all" })); setResponseTypeOpen(false) }}>
                                                <Check className={cn("mr-2 h-4 w-4", filters.responseType === "all" ? "opacity-100" : "opacity-0")} />
                                                All
                                            </CommandItem>
                                            {["Online", "Offline"].map(t => (
                                                <CommandItem key={t} onSelect={() => { setFilters(f => ({ ...f, responseType: t })); setResponseTypeOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.responseType === t ? "opacity-100" : "opacity-0")} />
                                                    {t}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {isLeadTypeVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Zap className="h-3 w-3" /> Lead Type
                            </Label>
                            <Popover open={leadTypeOpen} onOpenChange={setLeadTypeOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        <span className="truncate">{filters.leadType === "all" ? "All" : filters.leadType}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[180px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => { setFilters(f => ({ ...f, leadType: "all" })); setLeadTypeOpen(false) }}>
                                                <Check className={cn("mr-2 h-4 w-4", filters.leadType === "all" ? "opacity-100" : "opacity-0")} />
                                                All
                                            </CommandItem>
                                            {["New Lead", "Re-engaged Lead"].map(t => (
                                                <CommandItem key={t} onSelect={() => { setFilters(f => ({ ...f, leadType: t })); setLeadTypeOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.leadType === t ? "opacity-100" : "opacity-0")} />
                                                    {t}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {isSvsOnVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <CalendarCheck className="h-3 w-3" /> SV Date
                            </Label>
                            <DatePicker
                                date={filters.svsOn ? new Date(filters.svsOn) : undefined}
                                setDate={(date) => setFilters(f => ({ ...f, svsOn: date ? format(date, "yyyy-MM-dd") : "" }))}
                                className="w-full h-10 border-none bg-muted/30 text-xs"
                            />
                        </div>
                    )}

                    <div className="space-y-2 xl:col-span-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" /> Time Range
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input type="time" value={filters.startTime} onChange={e => setFilters(f => ({ ...f, startTime: e.target.value }))} className="h-10 border-none bg-muted/30 text-xs" />
                            <span className="text-muted-foreground">-</span>
                            <Input type="time" value={filters.endTime} onChange={e => setFilters(f => ({ ...f, endTime: e.target.value }))} className="h-10 border-none bg-muted/30 text-xs" />
                        </div>
                    </div>
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
                            <PieChartIcon className="h-4 w-4 text-emerald-500" />
                            Source Contribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <PieChart>
                                <Pie
                                    data={sourceChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {sourceChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-emerald-500" />
                            SV Done by Project
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <BarChart data={projectChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="var(--color-svs)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
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
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-medium">No site visits found matching selected criteria.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
