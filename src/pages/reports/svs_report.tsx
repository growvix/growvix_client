import { useState, useEffect, useMemo } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { 
    CalendarDays, 
    Clock, 
    RotateCcw, 
    Download,
    Building2,
    Users,
    Globe,
    Zap,
    BarChart3,
    PieChart as PieChartIcon,
    Tag,
    Search,
    ChevronDown,
    Check,
    ChevronsUpDown
} from "lucide-react"
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

// Types
type SVSData = {
    id: string
    source: string
    project: string
    svs_lead: string
    status: string
    user: string
    response_type: "Online" | "Offline"
    lead_type: "New Lead" | "Re-engaged Lead"
    svs_at: string
    svs_on: string
    time: string
}

type Filters = {
    project: string
    status: string
    user: string
    responseType: string
    leadType: string
    svsAt: string
    svsOn: string
    startTime: string
    endTime: string
}

const chartConfig = {
    svs: { label: "Scheduled Visits", color: "#3b82f6" },
    hot: { label: "Hot", color: "#ef4444" },
    warm: { label: "Warm", color: "#f59e0b" },
    cold: { label: "Cold", color: "#3b82f6" },
} satisfies ChartConfig

export default function SVSReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const organization = getCookie("organization") || ""
    const userRole = getCookie("role") || ""
    const isAdminOrManager = userRole === "admin" || userRole === "manager"

    // State
    const [data, setData] = useState<SVSData[]>([])
    const [users, setUsers] = useState<{ _id: string, name: string }[]>([])
    
    const [filters, setFilters] = useState<Filters>({
        project: "all",
        status: "all",
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
    const [statusOpen, setStatusOpen] = useState(false)
    const [userOpen, setUserOpen] = useState(false)
    const [responseTypeOpen, setResponseTypeOpen] = useState(false)
    const [leadTypeOpen, setLeadTypeOpen] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Site Visit Schedule Report" },
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
        
        if (data.length > 0 && PROJECTS.length > 0 && !data.some(d => PROJECTS.includes(d.project))) {
            // Force refresh if data was generated with old/static projects
        } else if (data.length > 0 && users.length > 0) return
        if (data.length > 0 && PROJECTS.length === 0) return; // Wait for projects to load if not already there

        const sources = ["Meta", "Google", "Magic Bricks", "Housing.com", "99 Acres", "Website", "Incoming Calls", "Banner"]
        const projectsList = PROJECTS.length > 0 ? PROJECTS : ["P1 - Sky High", "P2 - Emerald Valley"]
        const leads = ["Rahul Sharma", "Priya Singh", "Amit Kumar", "Sneha Rao", "Vikram Malhotra", "Ananya Gupta"]
        const statuses = ["Hot", "Warm", "Cold"]
        const responseTypes = ["Online", "Offline"]
        const leadTypes = ["New Lead", "Re-engaged Lead"]
 
        const mockData: SVSData[] = []
        let idCount = 1
 
        sources.forEach(source => {
            projectsList.forEach(project => {
                leads.forEach((lead) => {
                    mockData.push({
                        id: `${idCount++}`,
                        source,
                        project,
                        svs_lead: lead,
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                        user: mockUsersList[Math.floor(Math.random() * mockUsersList.length)],
                        response_type: responseTypes[Math.floor(Math.random() * responseTypes.length)] as any,
                        lead_type: leadTypes[Math.floor(Math.random() * leadTypes.length)] as any,
                        svs_at: format(new Date(2026, 3, Math.floor(Math.random() * 5) + 1), "yyyy-MM-dd"),
                        svs_on: format(new Date(2026, 3, Math.floor(Math.random() * 10) + 10), "yyyy-MM-dd"),
                        time: `${Math.floor(Math.random() * 12) + 1}:00 PM`
                    })
                })
            })
        })
        setData(mockData)
    }, [users, PROJECTS]) 
 
    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (filters.project !== "all" && item.project !== filters.project) return false
            if (filters.status !== "all" && item.status !== filters.status) return false
            if (filters.user !== "all" && item.user !== filters.user) return false
            if (filters.responseType !== "all" && item.response_type !== filters.responseType) return false
            if (filters.leadType !== "all" && item.lead_type !== filters.leadType) return false
            if (filters.svsAt && item.svs_at !== filters.svsAt) return false
            if (filters.svsOn && item.svs_on !== filters.svsOn) return false
            
            if (filters.startTime || filters.endTime) {
                const parseTime = (t: string) => {
                    if (!t) return ""
                    if (t.includes("AM") || t.includes("PM")) {
                        const [time, period] = t.split(" ")
                        let [h, m] = time.split(":").map(Number)
                        if (period === "PM" && h < 12) h += 12
                        if (period === "AM" && h === 12) h = 0
                        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                    }
                    return t
                }
                const itemTime = parseTime(item.time)
                if (filters.startTime && itemTime < filters.startTime) return false
                if (filters.endTime && itemTime > filters.endTime) return false
            }
            return true
        })
    }, [data, filters])

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

    const columns: ColumnDef<SVSData>[] = useMemo(() => [
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
            accessorKey: "svs_lead",
            header: "Lead Name",
            meta: { label: "Lead Name" },
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
            accessorKey: "response_type",
            header: "Campaign Type",
            meta: { label: "Campaign Type" },
        },
        {
            accessorKey: "lead_type",
            header: "Lead Type",
            meta: { label: "Lead Type" },
        },
        {
            accessorKey: "user",
            header: "User",
            meta: { label: "User" },
        },
        {
            accessorKey: "svs_at",
            header: "SV Scheduled At",
            meta: { label: "SV Scheduled At" },
            cell: ({ row }) => format(new Date(row.getValue("svs_at")), "dd/MM/yyyy")
        },
        {
            accessorKey: "svs_on",
            header: "SV Scheduled On",
            meta: { label: "SV Scheduled On" },
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

    const rowSpans = useMemo(() => {
        const sourceSpans: number[] = new Array(filteredData.length).fill(0);
        const projectSpans: number[] = new Array(filteredData.length).fill(0);

        let i = 0;
        while (i < filteredData.length) {
            let s = i;
            while (s < filteredData.length && filteredData[s].source === filteredData[i].source) {
                s++;
            }
            const sourceCount = s - i;
            sourceSpans[i] = sourceCount;

            let j = i;
            while (j < s) {
                let p = j;
                while (p < s && filteredData[p].project === filteredData[j].project) {
                    p++;
                }
                const projectCount = p - j;
                projectSpans[j] = projectCount;
                j = p;
            }
            i = s;
        }
        return { sourceSpans, projectSpans };
    }, [filteredData]);

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new()
        const rows = [
            ["Site Visit Schedule Report"],
            ["Generated At:", new Date().toLocaleString('en-IN')],
            [],
            ["Source", "Project", "Lead Name", "Status", "Campaign Type", "Lead Type", "User", "SV Scheduled At", "SV Scheduled On", "Time"]
        ]

        filteredData.forEach(item => {
            rows.push([item.source, item.project, item.svs_lead, item.status, item.response_type, item.lead_type, item.user, item.svs_at, item.svs_on, item.time])
        })

        rows.push([])
        rows.push(["GRAND TOTAL", "", filteredData.length.toLocaleString('en-IN')])

        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "SV Scheduled Report")
        XLSX.writeFile(wb, `SVS_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    const clearFilters = () => {
        setFilters({
            project: "all",
            status: "all",
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

    // Column visibility for filters
    const isSourceVisible = table.getColumn("source")?.getIsVisible() ?? true
    const isProjectVisible = table.getColumn("project")?.getIsVisible() ?? true
    const isStatusVisible = table.getColumn("status")?.getIsVisible() ?? true
    const isUserVisible = table.getColumn("user")?.getIsVisible() ?? true
    const isResponseTypeVisible = table.getColumn("response_type")?.getIsVisible() ?? true
    const isLeadTypeVisible = table.getColumn("lead_type")?.getIsVisible() ?? true
    const isSvsAtVisible = table.getColumn("svs_at")?.getIsVisible() ?? true
    const isSvsOnVisible = table.getColumn("svs_on")?.getIsVisible() ?? true


    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                    Site Visit Schedule Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Monitor and manage scheduled site visits.
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
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30">
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
                                                {PROJECTS.map((p: string) => (
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

                    {isStatusVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Tag className="h-3 w-3" /> Status
                            </Label>
                            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30">
                                        {filters.status === "all" ? "All Status" : filters.status}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search status..." />
                                        <CommandList>
                                            <CommandEmpty>No status found.</CommandEmpty>
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
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {isUserVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3" /> User
                            </Label>
                            <Popover open={userOpen} onOpenChange={setUserOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30" disabled={!isAdminOrManager}>
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
                                <Globe className="h-3 w-3" /> Campaign
                            </Label>
                            <Popover open={responseTypeOpen} onOpenChange={setResponseTypeOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30">
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
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30">
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

                    {isSvsAtVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <CalendarDays className="h-3 w-3" /> SV Scheduled At
                            </Label>
                            <DatePicker
                                date={filters.svsAt ? new Date(filters.svsAt) : undefined}
                                setDate={(date) => setFilters(f => ({ ...f, svsAt: date ? format(date, "yyyy-MM-dd") : "" }))}
                                className="w-full h-10 border-none bg-muted/30 text-xs"
                            />
                        </div>
                    )}

                    {isSvsOnVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <CalendarDays className="h-3 w-3" /> SV Scheduled On
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

                <div className="flex justify-end items-center gap-3 pt-2">
                    <div className="flex items-center gap-3 mr-auto">
                        {isSourceVisible && (
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search source..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9 h-9 w-[250px] bg-muted/30 border-none" />
                            </div>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 border-none bg-muted/30">
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

                    {isFilterApplied && (
                        <Button variant="ghost" onClick={clearFilters} className="text-xs h-9 hover:bg-destructive/10 hover:text-destructive">
                            <RotateCcw className="h-4 w-4 mr-2" /> Reset Filters
                        </Button>
                    )}
                    <Button onClick={handleDownloadExcel} variant="outline" className="h-9 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-bold shadow-sm">
                        <Download className="h-4 w-4 mr-2" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-purple-500" />
                            SV Scheduled Status Distribution
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

                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            SV Scheduled by Project
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <BarChart data={projectChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Bar dataKey="value" fill="var(--color-svs)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl border shadow-md bg-card overflow-hidden">
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
                            table.getRowModel().rows.map((row, rowIndex) => (
                                <TableRow key={row.id} className="group hover:bg-muted/30 transition-colors border-b">
                                    {row.getVisibleCells().map((cell) => {
                                        const columnId = cell.column.id;
                                        if (columnId === "source") {
                                            const span = rowSpans.sourceSpans[rowIndex];
                                            if (span === 0) return null;
                                            return <TableCell key={cell.id} rowSpan={span} className="font-bold text-center border-r bg-muted/5 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>;
                                        }
                                        if (columnId === "project") {
                                            const span = rowSpans.projectSpans[rowIndex];
                                            if (span === 0) return null;
                                            return <TableCell key={cell.id} rowSpan={span} className="text-center border-r font-medium bg-background py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>;
                                        }
                                        return <TableCell key={cell.id} className="text-center py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>;
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">No results found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
