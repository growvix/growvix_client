import { useState, useMemo, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Users,
    Info,
    CalendarIcon,
    RefreshCcw,
    ChartNoAxesCombined,
    Activity,
    PhoneCall,
    Clock,
    UserCheck,
    CheckCircle2,
    XCircle,
    UserX,
} from "lucide-react"

import { format } from "date-fns"
import { type DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import TeamProductivityTable from "@/components/team_productivity_table"

export default function ManagementDashboard() {
    const { setBreadcrumbs } = useBreadcrumb()
    const navigate = useNavigate()
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    })

    useEffect(() => {
        setBreadcrumbs([
            { label: "Management View" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Team Productivity & Call Metrics</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])


    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 mx-auto w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Management Dashboard</h1>
                <Select value="/management_dashboard" onValueChange={(val) => navigate(val)}>
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
                                    <SelectValue placeholder="Team Member" />
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
                        <Select defaultValue="today">
                            <SelectTrigger className="w-full bg-background dark:bg-background/80">
                                <SelectValue placeholder="Today" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="last7days">Last 7 days</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
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

            {/* Quick Metrics */}
            <Card className="shadow-none">
                <CardHeader className="px-3 py-0 flex justify-between">
                    <div className="pl-1 pt-3">
                        <Label className="text-md font-bold text-primary"><ChartNoAxesCombined className="inline-block mr-1 text-emerald-500" /> Daily Summary</Label>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
                        {/* Total Calls */}
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                            <PhoneCall className="h-5 w-5 text-blue-500 mb-2 opacity-75" />
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Total Calls</p>
                            <p className="text-5xl font-bold text-foreground">1,402</p>
                        </div>

                        {/* Total Talktime */}
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                            <Activity className="h-5 w-5 text-green-500 mb-2 opacity-75" />
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Total Talktime</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-foreground">42</span>
                                <span className="text-xl text-muted-foreground">h</span>
                                <span className="text-5xl font-bold text-foreground">15</span>
                                <span className="text-xl text-muted-foreground">m</span>
                            </div>
                        </div>

                        {/* Average Call Duration */}
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                            <Clock className="h-5 w-5 text-amber-500 mb-2 opacity-75" />
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Avg Call Duration</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-foreground">1</span>
                                <span className="text-xl text-muted-foreground">m</span>
                                <span className="text-5xl font-bold text-foreground">48</span>
                                <span className="text-xl text-muted-foreground">s</span>
                            </div>
                        </div>

                        {/* Site Visits Conducted */}
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors">
                            <UserCheck className="h-5 w-5 text-teal-500 mb-2 opacity-75" />
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Site Visits Conducted</p>
                            <p className="text-5xl font-bold text-foreground">24</p>
                        </div>

                        {/* Followups Missed */}
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/50 dark:bg-muted rounded-lg border transition-colors">
                            <UserX className="h-5 w-5 text-red-500 mb-2 opacity-75" />
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Missed Follow-ups</p>
                            <p className="text-5xl font-bold text-foreground">8</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Team Productivity Table */}
            <Card className="shadow-none">
                <CardHeader className="px-3 py-0 flex justify-between">
                    <div className="pl-1 pt-3">
                        <Label className="text-md font-bold text-primary">
                            <Users className="inline-block mr-1 text-purple-500" /> Team Productivity Logs
                        </Label>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <TeamProductivityTable />
                </CardContent>
            </Card>

        </div>
    )
}
