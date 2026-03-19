import { useState, useMemo, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    ChartCandlestick,
    Users,
    Info,
    CalendarIcon,
    RefreshCcw,
    TrendingUp,
    MapPin,
    Bookmark,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from "lucide-react"

import { format } from "date-fns"
import { type DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"

import { CHART_COLORS } from "@/constants"

// Mock Data

const PERFORMANCE_TREND_DATA = [
    { date: "Mar 11", leads: 12, visits: 3, bookings: 1 },
    { date: "Mar 12", leads: 18, visits: 5, bookings: 2 },
    { date: "Mar 13", leads: 15, visits: 2, bookings: 0 },
    { date: "Mar 14", leads: 22, visits: 6, bookings: 4 },
    { date: "Mar 15", leads: 28, visits: 8, bookings: 3 },
    { date: "Mar 16", leads: 35, visits: 10, bookings: 5 },
    { date: "Mar 17", leads: 40, visits: 12, bookings: 7 },
]

const LEAD_BY_SALES_DATA = [
    { name: "Rohit Pune", leads: 35 },
    { name: "Tejas Sales", leads: 28 },
    { name: "Amit PreSales", leads: 15 },
    { name: "Nisha Sales", leads: 12 },
    { name: "Rahul Deshmukh", leads: 8 },
]

const LEAD_BY_STAGE_DATA = [
    { stage: "Incoming", count: 42 },
    { stage: "Prospect", count: 28 },
    { stage: "Booked", count: 15 },
    { stage: "Cold", count: 8 },
    { stage: "Lost", count: 5 },
]

export default function MasterDashboard() {
    const { setBreadcrumbs } = useBreadcrumb()
    const navigate = useNavigate()
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2026, 2, 1),
        to: new Date(2026, 2, 17),
    })

    useEffect(() => {
        setBreadcrumbs([
            { label: "Master Dashboard" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Admin & Executive Insights</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    // Chart configs
    const trendChartConfig = {
        leads: { label: "Total Leads", color: CHART_COLORS.desktop || "hsl(var(--chart-1))" },
        visits: { label: "Site Visits", color: CHART_COLORS.mobile || "hsl(var(--chart-2))" },
        bookings: { label: "Bookings", color: "hsl(var(--chart-3))" },
    } satisfies ChartConfig

    const salesChartConfig = {
        leads: { label: "Unique Leads", color: "hsl(var(--chart-1))" },
    } satisfies ChartConfig

    const stageChartConfig = {
        count: { label: "Total Leads", color: "hsl(var(--chart-2))" },
    } satisfies ChartConfig

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 mx-auto w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Master Dashboard</h1>
                <Select value="/master_dashboard" onValueChange={(val) => navigate(val)}>
                    <SelectTrigger className="w-[220px] bg-background">
                        <SelectValue placeholder="Select Dashboard View" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="/executive_dashboard">Executive View</SelectItem>
                        <SelectItem value="/master_dashboard">Master View</SelectItem>
                        <SelectItem value="/management_dashboard">Management View</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Header / Filter Section */}
            <div className="flex flex-col gap-4 bg-card dark:bg-card/50 p-4 rounded-xl border shadow-sm backdrop-blur-sm">
                {/* Row 1 */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-1 gap-4">
                        <div className="flex-1">
                            <Select defaultValue="all">
                                <SelectTrigger className="w-full bg-background dark:bg-background/80">
                                    <SelectValue placeholder="Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Projects</SelectItem>
                                    <SelectItem value="p1">Project Alpha</SelectItem>
                                    <SelectItem value="p2">Project Beta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Select defaultValue="all">
                                <SelectTrigger className="w-full bg-background dark:bg-background/80">
                                    <SelectValue placeholder="Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    <SelectItem value="facebook">Facebook Ads</SelectItem>
                                    <SelectItem value="google">Google Ads</SelectItem>
                                    <SelectItem value="organic">Organic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Select defaultValue="all">
                                <SelectTrigger className="w-full bg-background dark:bg-background/80">
                                    <SelectValue placeholder="Sales Person" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Team Members</SelectItem>
                                    <SelectItem value="opt1">Rohit Pune</SelectItem>
                                    <SelectItem value="opt2">Tejas Sales</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button variant="outline" size="icon" className="shrink-0 bg-background dark:bg-background/80">
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>

                {/* Row 2 */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-none w-[180px]">
                        <Select defaultValue="custom">
                            <SelectTrigger className="w-full bg-background dark:bg-background/80">
                                <SelectValue placeholder="Custom" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="custom">Custom</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="last7days">Last 7 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 flex-1 relative">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-background dark:bg-background/80 hover:bg-background/90",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, yyyy, hh:mm a")} -{" "}
                                                {format(date.to, "LLL dd, yyyy, hh:mm a")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, yyyy, hh:mm a")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button variant="default" className="w-[100px] bg-primary hover:bg-primary/90 text-primary-foreground">
                        Apply
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left Side: KPIs and Charts */}
                <div className="xl:col-span-3 flex flex-col gap-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        Total Leads
                                    </CardTitle>
                                    <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <div className="text-4xl font-bold tracking-tight">1,248</div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 flex items-center">
                                    <ArrowUpRight className="h-3 w-3 mr-1 text-primary/70" />
                                    <span className="text-primary font-medium mr-1">+12.5%</span> from last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        Site Visits
                                    </CardTitle>
                                    <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <div className="text-4xl font-bold tracking-tight">142</div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 flex items-center">
                                    <ArrowUpRight className="h-3 w-3 mr-1 text-primary/70" />
                                    <span className="text-primary font-medium mr-1">+4.1%</span> from last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        Bookings
                                    </CardTitle>
                                    <Bookmark className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <div className="text-4xl font-bold tracking-tight">36</div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 flex items-center">
                                    <ArrowDownRight className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <span className="text-muted-foreground font-medium mr-1">-2.0%</span> from last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        Agreement Value
                                    </CardTitle>
                                    <Wallet className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <div className="text-3xl font-bold tracking-tight text-foreground">₹12.4 Cr</div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3 flex items-center">
                                    <ArrowUpRight className="h-3 w-3 mr-1 text-primary/70" />
                                    <span className="text-primary font-medium mr-1">+18.2%</span> from last month
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Line Chart */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/20 border-b pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-primary" />
                                        Performance Trend
                                    </CardTitle>
                                    <CardDescription>Metrics spanning across selected dates</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
                                <LineChart
                                    accessibilityLayer
                                    data={PERFORMANCE_TREND_DATA}
                                    margin={{ top: 10, left: -20, right: 10, bottom: 0 }}
                                >
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={12}
                                        fontSize={12}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={12}
                                        fontSize={12}
                                        className="text-muted-foreground"
                                    />
                                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Line
                                        type="monotone"
                                        dataKey="leads"
                                        stroke="var(--color-leads)"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: "var(--color-leads)", fillOpacity: 1 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="visits"
                                        stroke="var(--color-visits)"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: "var(--color-visits)", fillOpacity: 1 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="bookings"
                                        stroke="var(--color-bookings)"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ r: 3, strokeWidth: 1, fill: "var(--color-bookings)", fillOpacity: 1 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Breakdowns section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="bg-muted/20 border-b pb-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Lead by Sales
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ChartContainer config={salesChartConfig} className="h-[250px] w-full">
                                    <BarChart
                                        accessibilityLayer
                                        data={LEAD_BY_SALES_DATA}
                                        layout="vertical"
                                        margin={{ left: 0, right: 0 }}
                                    >
                                        <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
                                            width={100}
                                            fontSize={12}
                                            tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + "..." : value}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar
                                            dataKey="leads"
                                            fill="var(--color-leads)"
                                            radius={[0, 4, 4, 0]}
                                            barSize={16}
                                        >
                                            {/* Adds label manually if needed, or rely on tooltip */}
                                        </Bar>
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="bg-muted/20 border-b pb-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ChartCandlestick className="h-4 w-4 text-primary" />
                                    Lead by Stage
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ChartContainer config={stageChartConfig} className="h-[250px] w-full">
                                    <BarChart
                                        accessibilityLayer
                                        data={LEAD_BY_STAGE_DATA}
                                        layout="vertical"
                                        margin={{ left: 0, right: 0 }}
                                    >
                                        <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="stage"
                                            type="category"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
                                            width={100}
                                            fontSize={12}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar
                                            dataKey="count"
                                            fill="var(--color-count)"
                                            radius={[0, 4, 4, 0]}
                                            barSize={16}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                </div>

                {/* Right Side: Extras and Tasks */}
                <div className="flex flex-col gap-6">
                    {/* Availability Card */}
                    <Card className="border-t-4 border-t-primary">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base truncate">User Availability</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-2 text-center divide-x dark:divide-gray-800">
                                <div className="flex flex-col justify-center px-1">
                                    <p className="text-xs text-muted-foreground whitespace-nowrap mb-2">Total In</p>
                                    <p className="text-2xl font-bold text-primary">24</p>
                                </div>
                                <div className="flex flex-col justify-center px-1">
                                    <p className="text-xs text-muted-foreground whitespace-nowrap mb-2">Not In</p>
                                    <p className="text-2xl font-bold text-muted-foreground">11</p>
                                </div>
                                <div className="flex flex-col justify-center px-1">
                                    <p className="text-xs text-muted-foreground whitespace-nowrap mb-2">On Leave</p>
                                    <p className="text-2xl font-bold text-muted-foreground/70">1</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Today's Agenda Tabs */}
                    <Card className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-card">
                        <CardHeader className="shrink-0 pt-6 pb-2 border-b">
                            <div className="flex justify-between items-center w-full">
                                <CardTitle className="text-sm font-semibold flex items-center">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(new Date(), "E, d MMM yyyy")}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-0">
                            <Tabs defaultValue="site_visits" className="w-full flex-1 flex flex-col">
                                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
                                    <TabsTrigger
                                        value="site_visits"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 px-4 py-3"
                                    >
                                        Site Visits (5)
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="follow_ups"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 px-4 py-3"
                                    >
                                        Follow Ups (12)
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="site_visits" className="flex-1 p-4 grid gap-3 m-0">
                                    {/* Mock items */}
                                    <div className="py-2.5 px-3 bg-background rounded-lg border shadow-xs flex justify-between items-center transition-all hover:border-primary/50 cursor-pointer">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium">Anita Desai - Prj Alpha</span>
                                            <span className="text-xs text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1" /> 10:30 AM</span>
                                        </div>
                                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Confirmed</div>
                                    </div>
                                    <div className="py-2.5 px-3 bg-background rounded-lg border shadow-xs flex justify-between items-center transition-all hover:border-primary/50 cursor-pointer">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium">Rahul Verma - 3BHK</span>
                                            <span className="text-xs text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1" /> 2:00 PM</span>
                                        </div>
                                        <div className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Pending</div>
                                    </div>
                                    <div className="py-2.5 px-3 bg-background rounded-lg border shadow-xs flex justify-between items-center transition-all hover:border-primary/50 cursor-pointer">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium">Sneha Kapoor</span>
                                            <span className="text-xs text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1" /> 4:30 PM</span>
                                        </div>
                                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Confirmed</div>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <Button variant="ghost" size="sm" className="text-primary text-xs">View All</Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="follow_ups" className="flex-1 p-4 m-0 text-center text-muted-foreground text-sm flex items-center justify-center flex-col gap-2 min-h-[200px]">
                                    <Activity className="h-8 w-8 opacity-20" />
                                    No immediate follow ups scheduled for the morning.
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}