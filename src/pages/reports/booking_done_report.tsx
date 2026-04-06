import { useState, useEffect, useMemo } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { 
    CheckCircle2, 
    Clock, 
    RotateCcw, 
    Download,
    Building2,
    Users,
    Search,
    ChevronDown,
    ArrowUpDown,
    Check,
    ChevronsUpDown,
    UserCheck,
    Globe,
    Zap,
    Trophy,
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
type BookingDoneData = {
    id: string
    project: string
    source: string
    booking_done_lead: string
    sales_user: string
    response_type: "Online" | "Offline"
    lead_type: "New Lead" | "Re-engaged Lead"
    booking_done_date: string
    booking_done_time: string
}

type Filters = {
    project: string
    source: string
    salesUser: string
    responseType: string
    leadType: string
    bookingDoneDate: string
    startTime: string
    endTime: string
}

const chartConfig = {
    bookings: { label: "Bookings", color: "#10b981" },
} satisfies ChartConfig

export default function BookingDoneReport() {
    const { setBreadcrumbs } = useBreadcrumb()
    const organization = getCookie("organization") || ""
    const userRole = getCookie("role") || ""
    const isAdminOrManager = userRole === "admin" || userRole === "manager"

    // State
    const [data, setData] = useState<BookingDoneData[]>([])
    const [users, setUsers] = useState<{ _id: string, name: string }[]>([])
    
    const [filters, setFilters] = useState<Filters>({
        project: "all",
        source: "all",
        salesUser: "all",
        responseType: "all",
        leadType: "all",
        bookingDoneDate: "",
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
    const [salesOpen, setSalesOpen] = useState(false)
    const [responseTypeOpen, setResponseTypeOpen] = useState(false)
    const [leadTypeOpen, setLeadTypeOpen] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Booking Done Report" },
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
        const mockUsersList = users.length > 0 ? users.map(u => u.name) : ["User 1", "User 2", "User 3", "User 4"]
        
        const projects = ["Project A", "Project B", "Alpha", "Omega"]
        const sources = ["Meta", "Google", "Website", "Social Media"]
        const leads = ["Lead #100", "Lead #101", "Lead #102", "Lead #103", "Lead #104"]
        const responseTypes = ["Online", "Offline"]
        const leadTypes = ["New Lead", "Re-engaged Lead"]

        const mockData: BookingDoneData[] = []
        for (let i = 1; i <= 50; i++) {
            mockData.push({
                id: `${i}`,
                project: projects[Math.floor(Math.random() * projects.length)],
                source: sources[Math.floor(Math.random() * sources.length)],
                booking_done_lead: leads[Math.floor(Math.random() * leads.length)] + i,
                sales_user: mockUsersList[Math.floor(Math.random() * mockUsersList.length)],
                response_type: responseTypes[Math.floor(Math.random() * responseTypes.length)] as any,
                lead_type: leadTypes[Math.floor(Math.random() * leadTypes.length)] as any,
                booking_done_date: format(new Date(2026, 3, Math.floor(Math.random() * 15) + 1), "yyyy-MM-dd"),
                booking_done_time: `${Math.floor(Math.random() * 11) + 1}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')} AM`,
            })
        }
        setData(mockData)
    }, [users]) 

    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (filters.project !== "all" && item.project !== filters.project) return false
            if (filters.source !== "all" && item.source !== filters.source) return false
            if (filters.salesUser !== "all" && item.sales_user !== filters.salesUser) return false
            if (filters.responseType !== "all" && item.response_type !== filters.responseType) return false
            if (filters.leadType !== "all" && item.lead_type !== filters.leadType) return false
            if (filters.bookingDoneDate && item.booking_done_date !== filters.bookingDoneDate) return false
            
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
                const itemTime = parseTime(item.booking_done_time)
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
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
        return sorted.map(([name, value]) => ({ name, value }))
    }, [filteredData])

    const columns: ColumnDef<BookingDoneData>[] = useMemo(() => [
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
            accessorKey: "booking_done_lead",
            header: "Booking Lead",
            meta: { label: "Booking Lead" },
        },
        {
            accessorKey: "sales_user",
            header: "Sales User",
            meta: { label: "Sales User" },
        },
        {
            accessorKey: "response_type",
            header: "Campaign",
            meta: { label: "Campaign" },
        },
        {
            accessorKey: "lead_type",
            header: "Lead Type",
            meta: { label: "Lead Type" },
        },
        {
            accessorKey: "booking_done_date",
            header: "Date",
            meta: { label: "Date" },
            cell: ({ row }) => format(new Date(row.getValue("booking_done_date")), "dd/MM/yyyy")
        },
        {
            accessorKey: "booking_done_time",
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
            ["Booking Done Report"],
            ["Generated At:", new Date().toLocaleString('en-IN')],
            [],
            ["Project", "Source", "Booking Lead", "Sales User", "Campaign", "Lead Type", "Date", "Time"]
        ]

        filteredData.forEach(item => {
            rows.push([item.project, item.source, item.booking_done_lead, item.sales_user, item.response_type, item.lead_type, item.booking_done_date, item.booking_done_time])
        })

        rows.push([])
        rows.push(["GRAND TOTAL", "", filteredData.length.toLocaleString('en-IN')])

        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, "Booking Done")
        XLSX.writeFile(wb, `Booking_Done_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    const clearFilters = () => {
        setFilters({
            project: "all",
            source: "all",
            salesUser: "all",
            responseType: "all",
            leadType: "all",
            bookingDoneDate: "",
            startTime: "",
            endTime: "",
        })
    }

    const isFilterApplied = Object.values(filters).some(v => v !== "all" && v !== "")

    const isProjectVisible = table.getColumn("project")?.getIsVisible() ?? true
    const isSourceVisible = table.getColumn("source")?.getIsVisible() ?? true
    const isSalesVisible = table.getColumn("sales_user")?.getIsVisible() ?? true
    const isResponseTypeVisible = table.getColumn("response_type")?.getIsVisible() ?? true
    const isLeadTypeVisible = table.getColumn("lead_type")?.getIsVisible() ?? true
    const isDateVisible = table.getColumn("booking_done_date")?.getIsVisible() ?? true

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-4 max-w-[98%] mx-auto w-full">
            <div className="flex flex-col gap-1 items-start text-left">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                    Booking Done Report
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Celebrating sales success and tracking booking velocity.
                </p>
            </div>

            <div className="rounded-xl bg-card border shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9 gap-4 items-end transition-all duration-300">
                    
                    {isProjectVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Project
                            </Label>
                            <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs">
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

                    {isSourceVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Search className="h-3 w-3" /> Source
                            </Label>
                            <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs">
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

                    {isSalesVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <UserCheck className="h-3 w-3" /> Sales User
                            </Label>
                            <Popover open={salesOpen} onOpenChange={setSalesOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs text-left">
                                        <span className="truncate">{filters.salesUser === "all" ? "All Users" : filters.salesUser}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem onSelect={() => { setFilters(f => ({ ...f, salesUser: "all" })); setSalesOpen(false) }}>
                                                    <Check className={cn("mr-2 h-4 w-4", filters.salesUser === "all" ? "opacity-100" : "opacity-0")} />
                                                    All Users
                                                </CommandItem>
                                                {users.map(u => (
                                                    <CommandItem key={u._id} onSelect={() => { setFilters(f => ({ ...f, salesUser: u.name })); setSalesOpen(false) }}>
                                                        <Check className={cn("mr-2 h-4 w-4", filters.salesUser === u.name ? "opacity-100" : "opacity-0")} />
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
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs">
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
                                    <Button variant="outline" className="w-full justify-between font-normal h-10 border-none bg-muted/30 text-xs">
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

                    {isDateVisible && (
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3" /> Booking Date
                            </Label>
                            <DatePicker
                                date={filters.bookingDoneDate ? new Date(filters.bookingDoneDate) : undefined}
                                setDate={(date) => setFilters(f => ({ ...f, bookingDoneDate: date ? format(date, "yyyy-MM-dd") : "" }))}
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
                            <BarChart3 className="h-4 w-4 text-emerald-500" />
                            Bookings by Project
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ChartContainer config={chartConfig} className="h-full">
                            <BarChart data={projectChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/5 py-4 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-purple-500" />
                            Booking Source Mix
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
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {sourceChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]} />
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
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-medium">No bookings found matching selected criteria.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
