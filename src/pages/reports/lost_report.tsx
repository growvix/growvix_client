import { useState, useEffect, useMemo } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import {
    XCircle,
    RotateCcw,
    Download,
    Building2,
    Users,
    Search,
    ChevronDown,
    Check,
    ChevronsUpDown,
    Globe,
    UserCircle,
    UserCheck,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
type LostData = {
    id: string
    campaign: "Online" | "Offline"
    source: string
    project: string
    lead: string
    pre_sales_users: string[]
    sales_users: string[]
    last_note: string
    last_call: string
    leadType: "new" | "reengaged"
}

type Filters = {
    campaign: string
    source: string
    project: string
    team: "All" | "Pre-Sales Team" | "Sales Team"
    users: string[]
    leadType: string
}

const chartConfig = {
    lost: { label: "Lost Leads", color: "#64748b" },
} satisfies ChartConfig

const getInitials = (name: string) => {
    if (!name) return ""
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
}

export default function LostReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const organization = getCookie("organization") || ""
    const userRole = getCookie("role") || ""
    const isAdminOrManager = userRole === "admin" || userRole === "manager"

    // State
    const [data, setData] = useState<LostData[]>([])
    const [allUsers, setAllUsers] = useState<{ _id: string, name: string }[]>([])

    const [filters, setFilters] = useState<Filters>({
        campaign: "all",
        source: "all",
        project: "all",
        team: "All",
        users: [],
        leadType: "all",
    })

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        last_note: false
    })
    const [globalFilter, setGlobalFilter] = useState("")

    // Popover states
    const [campaignOpen, setCampaignOpen] = useState(false)
    const [sourceOpen, setSourceOpen] = useState(false)
    const [projectOpen, setProjectOpen] = useState(false)
    const [teamOpen, setTeamOpen] = useState(false)
    const [userOpen, setUserOpen] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Lost Report" },
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
                    setAllUsers(mappedUsers)
                }
            } catch (err) {
                console.error("Failed to fetch users", err)
            }
        }
        fetchUsers()
    }, [organization, isAdminOrManager])

    // Mock Data generation
    useEffect(() => {
        const mockUsersList = allUsers.length > 0 ? allUsers.map(u => u.name) : ["User 1", "User 2", "User 3", "User 4"]
        const projectsList = PROJECTS.length > 0 ? PROJECTS : ["P1 - Sky High", "P2 - Emerald Valley"]
        const sources = ["Meta", "Google", "Website", "Social Media"]
        const campaigns = ["Online", "Offline"]

        const mockData: LostData[] = []
        for (let i = 1; i <= 60; i++) {
            mockData.push({
                id: `${i}`,
                campaign: campaigns[Math.floor(Math.random() * campaigns.length)] as any,
                source: sources[Math.floor(Math.random() * sources.length)],
                project: projectsList[Math.floor(Math.random() * projectsList.length)],
                lead: ["Aditi Nair", "Vivek Oberoi", "Zoya Hussain", "Kunal Nayyar"][Math.floor(Math.random() * 4)],
                pre_sales_users: [mockUsersList[Math.floor(Math.random() * mockUsersList.length)]],
                sales_users: [mockUsersList[Math.floor(Math.random() * mockUsersList.length)]],
                last_note: "Budget mismatched. Opted for other project.",
                last_call: format(new Date(2026, 3, Math.floor(Math.random() * 20) + 1), "dd/MM/yyyy HH:mm"),
                leadType: Math.random() > 0.5 ? "new" : "reengaged"
            })
        }
        setData(mockData)
    }, [allUsers, PROJECTS])

    // Handle Team Filter Column Visibility
    useEffect(() => {
        if (filters.team === "Sales Team") {
            setColumnVisibility(prev => ({ ...prev, pre_sales_users: false, sales_users: true }))
        } else if (filters.team === "Pre-Sales Team") {
            setColumnVisibility(prev => ({ ...prev, sales_users: false, pre_sales_users: true }))
        } else {
            setColumnVisibility(prev => ({ ...prev, sales_users: true, pre_sales_users: true }))
        }
    }, [filters.team])

    const filteredData = useMemo(() => {
        let result = data.filter(item => {
            if (filters.campaign !== "all" && item.campaign !== filters.campaign) return false
            if (filters.source !== "all" && item.source !== filters.source) return false
            if (filters.project !== "all" && item.project !== filters.project) return false
            if (filters.leadType !== "all" && item.leadType !== filters.leadType) return false

            // Team-based filtering
            if (filters.team === "Pre-Sales Team") {
                if (!item.pre_sales_users || item.pre_sales_users.length === 0) return false
            } else if (filters.team === "Sales Team") {
                if (!item.sales_users || item.sales_users.length === 0) return false
            }

            if (filters.users.length > 0) {
                const relevantUsers = filters.team === "Pre-Sales Team"
                    ? item.pre_sales_users
                    : filters.team === "Sales Team"
                        ? item.sales_users
                        : [...item.pre_sales_users, ...item.sales_users]
                const matches = filters.users.some(u => relevantUsers.includes(u))
                if (!matches) return false
            }
            return true
        })

        // Sort by team user name when a specific team is selected
        if (filters.team === "Pre-Sales Team") {
            result = [...result].sort((a, b) => {
                const nameA = (a.pre_sales_users?.[0] || "").toLowerCase()
                const nameB = (b.pre_sales_users?.[0] || "").toLowerCase()
                return nameA.localeCompare(nameB)
            })
        } else if (filters.team === "Sales Team") {
            result = [...result].sort((a, b) => {
                const nameA = (a.sales_users?.[0] || "").toLowerCase()
                const nameB = (b.sales_users?.[0] || "").toLowerCase()
                return nameA.localeCompare(nameB)
            })
        }

        return result
    }, [data, filters])

    // Chart Data
    const projectChartData = useMemo(() => {
        const counts: Record<string, number> = {}
        filteredData.forEach(d => { counts[d.project] = (counts[d.project] || 0) + 1 })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [filteredData])

    const sourceMixData = useMemo(() => {
        const counts: Record<string, number> = {}
        filteredData.forEach(d => { counts[d.source] = (counts[d.source] || 0) + 1 })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [filteredData])

    const columns: ColumnDef<LostData>[] = useMemo(() => [
        {
            accessorKey: "campaign",
            header: "Campaign Type",
            meta: { label: "Campaign Type" },
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
            header: "Lead Name",
            meta: { label: "Lead Name" },
        },
        {
            accessorKey: "pre_sales_users",
            header: "Pre-Sales Users",
            meta: { label: "Pre-Sales Users" },
            cell: ({ row }) => {
                const usersList = row.getValue("pre_sales_users") as string[]
                return (
                    <div className="flex items-center justify-center -space-x-3">
                        <TooltipProvider>
                            {usersList.map((u, i) => {
                                const initials = getInitials(u)
                                return (
                                    <Tooltip key={i}>
                                        <TooltipTrigger>
                                            <div className="relative flex items-center justify-center rounded-full h-8 w-8 text-[11px] font-extrabold border-2 bg-background text-rose-400 border-rose-400/20 bg-rose-400/10 hover:z-10 hover:scale-110 transition-transform">
                                                {initials}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p className="text-xs">{u}</p></TooltipContent>
                                    </Tooltip>
                                )
                            })}
                        </TooltipProvider>
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
                return (
                    <div className="flex items-center justify-center -space-x-3">
                        <TooltipProvider>
                            {usersList.map((u, i) => {
                                const initials = getInitials(u)
                                return (
                                    <Tooltip key={i}>
                                        <TooltipTrigger>
                                            <div className="relative flex items-center justify-center rounded-full h-8 w-8 text-[11px] font-extrabold border-2 bg-background text-indigo-400 border-indigo-400/20 bg-indigo-400/10 hover:z-10 hover:scale-110 transition-transform">
                                                {initials}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p className="text-xs">{u}</p></TooltipContent>
                                    </Tooltip>
                                )
                            })}
                        </TooltipProvider>
                    </div>
                )
            }
        },
        {
            accessorKey: "last_note",
            header: "Last Note",
            meta: { label: "Last Note" },
            cell: ({ row }) => (
                <div className="truncate max-w-[200px] text-xs text-muted-foreground italic group-hover:whitespace-normal transition-all duration-300">
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
            ["Lost Report"],
            ["Generated At:", new Date().toLocaleString('en-IN')],
            [],
            ["Campaign Type", "Source", "Project", "Lead Name", "Pre-Sales Users", "Sales Users", "Last Note", "Last Call"]
        ]
        filteredData.forEach(item => {
            rows.push([item.campaign, item.source, item.project, item.lead, item.pre_sales_users.join(", "), item.sales_users.join(", "), item.last_note, item.last_call])
        })

        rows.push([])
        rows.push(["GRAND TOTAL", "", "", filteredData.length.toLocaleString('en-IN')])

        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "LostLeads")
        XLSX.writeFile(wb, `Lost_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    const clearFilters = () => {
        setFilters({
            campaign: "all",
            source: "all",
            project: "all",
            team: "All",
            users: [],
            leadType: "all",
        })
    }

    const isFilterApplied = filters.campaign !== "all" || filters.source !== "all" || filters.project !== "all" || filters.team !== "All" || filters.users.length > 0 || filters.leadType !== "all"

    const toggleUserFilter = (name: string) => {
        setFilters(prev => {
            const current = [...prev.users]
            const index = current.indexOf(name)
            if (index > -1) current.splice(index, 1)
            else current.push(name)
            return { ...prev, users: current }
        })
    }

    const isCampaignVisible = table.getColumn("campaign")?.getIsVisible() ?? true
    const isSourceVisible = table.getColumn("source")?.getIsVisible() ?? true
    const isProjectVisible = table.getColumn("project")?.getIsVisible() ?? true

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex flex-col gap-1 items-start text-left">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                    Lost Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-500" />
                    Identifying churn patterns and optimizing re-engagement strategies.
                </p>
            </div>

            <Card className="border-none shadow-md bg-background/80 backdrop-blur-md sticky top-12 z-30 ring-1 ring-border/50">
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end transition-all duration-300">

                        {isCampaignVisible && (
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                    <Globe className="h-3 w-3" /> Campaign Type
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
                                        <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs">
                                            {filters.source === "all" ? "All Sources" : filters.source}
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
                                        <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs">
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

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                Lead Type
                            </Label>
                            <Select value={filters.leadType} onValueChange={(val) => setFilters(f => ({ ...f, leadType: val }))}>
                                <SelectTrigger className="h-10 w-full border-none hover:bg-muted/50 transition-colors text-xs">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="new">New Lead</SelectItem>
                                    <SelectItem value="reengaged">Re-engaged Lead</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3" /> Team Filter
                            </Label>
                            <Popover open={teamOpen} onOpenChange={setTeamOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                                        {filters.team}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[180px] p-0">
                                    <Command>
                                        <CommandGroup>
                                            {["All", "Pre-Sales Team", "Sales Team"].map(t => (
                                                <CommandItem key={t} onSelect={() => { setFilters(f => ({ ...f, team: t as any })); setTeamOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.team === t ? "opacity-100" : "opacity-0")} />
                                                    {t}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <UserCircle className="h-3 w-3" /> User Filter
                            </Label>
                            <Popover open={userOpen} onOpenChange={setUserOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs">
                                        <span className="truncate">{filters.users.length === 0 ? "All Users" : `${filters.users.length} Selected`}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[220px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandList>
                                            <CommandGroup>
                                                {allUsers.map(u => (
                                                    <CommandItem key={u._id} onSelect={() => toggleUserFilter(u.name)}>
                                                        <Check className={cn("mr-2 h-4 w-4", filters.users.includes(u.name) ? "opacity-100" : "opacity-0")} />
                                                        {u.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
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
                </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-rose-500" />
                            Lost Leads by Project
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <BarChart data={projectChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-purple-500" />
                            Lost Mix by Source
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <PieChart>
                                <Pie
                                    data={sourceMixData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {sourceMixData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={['#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'][index % 4]} />
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
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-medium">No lost leads found matching selected criteria.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
