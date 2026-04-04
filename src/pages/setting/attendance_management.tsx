import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { API } from "@/config/api"
import { getCookie } from "@/utils/cookies"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Info,
    ChevronLeft,
    ChevronRight,
    Clock,
    CalendarDays,
    Users,
    UserCheck,
    UserX,
    Timer,
    ArrowLeft,
    LogIn,
    LogOut,
    Search,
    Coffee,
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────
interface Session {
    _id: string
    loginTime: string
    logoutTime: string | null
    duration: number
    isActive: boolean
}

interface UserAttendance {
    _id: string
    profile_id: number
    profile: {
        firstName: string
        lastName: string
        email: string
        profileImagePath?: string
    }
    role: string
    department?: string
    isOnline: boolean
    sessions: Session[]
    totalMinutesToday: number
}

interface DayData {
    date: string
    sessions: Session[]
    totalMinutes: number
    status: "present" | "absent" | "upcoming"
    isWeekend?: boolean
}

interface MonthlyData {
    year: number
    month: number
    days: DayData[]
    summary: {
        totalPresent: number
        totalAbsent: number
        totalWorkingHours: number
        totalWorkingMinutes: number
        avgHoursPerDay: string
    }
}

// ─── Helpers ──────────────────────────────────────────────
function formatTime(dateStr: string | null) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
}

function formatDuration(minutes: number) {
    if (minutes < 1) return "0m"
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
}

function getInitials(firstName: string, lastName: string) {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─── Main Component ────────────────────────────────────────
export default function AttendanceManagement() {
    const { setBreadcrumbs } = useBreadcrumb()
    const currentUserRole = getCookie("role")

    // View state
    const [view, setView] = useState<"list" | "monthly">("list")
    const [selectedUser, setSelectedUser] = useState<UserAttendance | null>(null)

    // List view state
    const [users, setUsers] = useState<UserAttendance[]>([])
    const [loading, setLoading] = useState(true)
    const [toggleLoading, setToggleLoading] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    // Monthly view state
    const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null)
    const [monthlyLoading, setMonthlyLoading] = useState(false)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

    // Expanded day for session details
    const [expandedDay, setExpandedDay] = useState<string | null>(null)

    // ── Breadcrumbs ──
    useEffect(() => {
        const crumbs: any[] = [
            { label: "Settings", href: "/settings" },
            { label: "Attendance Management", href: view === "monthly" ? undefined : undefined },
        ]
        if (view === "monthly" && selectedUser) {
            crumbs.push({
                label: `${selectedUser.profile.firstName} ${selectedUser.profile.lastName}`,
            })
        }
        crumbs.push({
            label: (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4.5 w-4.5" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                            <p className="font-medium">
                                {view === "list"
                                    ? "Toggle users Online/Offline to track attendance"
                                    : "Monthly attendance report"}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ),
        })
        setBreadcrumbs(crumbs)
    }, [setBreadcrumbs, view, selectedUser])

    // ── Fetch today's attendance data ──
    const fetchTodayStatus = useCallback(async () => {
        try {
            const token = getCookie("token")
            const response = await axios.get(API.ATTENDANCE.TODAY, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setUsers(response.data.data || [])
        } catch (err: any) {
            console.error("Failed to fetch attendance:", err)
            toast.error("Failed to fetch attendance data")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTodayStatus()
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchTodayStatus, 60000)
        return () => clearInterval(interval)
    }, [fetchTodayStatus])

    // ── Toggle handler ──
    const handleToggle = useCallback(async (user: UserAttendance) => {
        if (toggleLoading) return
        setToggleLoading(user._id)

        try {
            const token = getCookie("token")
            const endpoint = user.isOnline
                ? API.ATTENDANCE.TOGGLE_OFFLINE
                : API.ATTENDANCE.TOGGLE_ONLINE

            await axios.post(
                endpoint,
                { userId: user._id },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            toast.success(
                user.isOnline
                    ? `${user.profile.firstName} marked as offline`
                    : `${user.profile.firstName} marked as online`
            )
            await fetchTodayStatus()
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to toggle status")
        } finally {
            setToggleLoading(null)
        }
    }, [toggleLoading, fetchTodayStatus])

    // ── Monthly attendance ──
    const fetchMonthlyAttendance = useCallback(async (userId: string, year: number, month: number) => {
        setMonthlyLoading(true)
        try {
            const token = getCookie("token")
            const response = await axios.get(
                `${API.getMonthlyAttendance(userId)}?year=${year}&month=${month}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setMonthlyData(response.data.data)
        } catch (err: any) {
            console.error("Failed to fetch monthly attendance:", err)
            toast.error("Failed to fetch monthly attendance")
        } finally {
            setMonthlyLoading(false)
        }
    }, [])

    const openMonthlyView = useCallback((user: UserAttendance) => {
        setSelectedUser(user)
        setView("monthly")
        setExpandedDay(null)
        fetchMonthlyAttendance(user._id, selectedYear, selectedMonth)
    }, [fetchMonthlyAttendance, selectedYear, selectedMonth])

    const navigateMonth = useCallback((direction: -1 | 1) => {
        let newMonth = selectedMonth + direction
        let newYear = selectedYear
        if (newMonth < 1) {
            newMonth = 12
            newYear -= 1
        } else if (newMonth > 12) {
            newMonth = 1
            newYear += 1
        }
        setSelectedMonth(newMonth)
        setSelectedYear(newYear)
        setExpandedDay(null)
        if (selectedUser) {
            fetchMonthlyAttendance(selectedUser._id, newYear, newMonth)
        }
    }, [selectedMonth, selectedYear, selectedUser, fetchMonthlyAttendance])

    const backToList = () => {
        setView("list")
        setSelectedUser(null)
        setMonthlyData(null)
        setExpandedDay(null)
    }

    // ── Filter users ──
    const filteredUsers = users.filter((user) => {
        if (!search) return true
        const name = `${user.profile.firstName} ${user.profile.lastName}`.toLowerCase()
        const email = user.profile.email.toLowerCase()
        return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase())
    })

    // ── Stats ──
    const onlineCount = users.filter((u) => u.isOnline).length
    const offlineCount = users.filter((u) => !u.isOnline).length
    const totalUsers = users.length

    // ── Loading ──
    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading attendance...</p>
                </div>
            </div>
        )
    }

    // ════════════════════════════════════════════════
    //  MONTHLY ATTENDANCE VIEW
    // ════════════════════════════════════════════════
    if (view === "monthly" && selectedUser) {
        return (
            <div className="flex flex-1 flex-col gap-5 px-4 pb-8 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-3 pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={backToList}
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                {/* User Info Card */}
                <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        {getInitials(selectedUser.profile.firstName, selectedUser.profile.lastName)}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold">
                            {selectedUser.profile.firstName} {selectedUser.profile.lastName}
                        </h2>
                        <p className="text-sm text-muted-foreground">{selectedUser.profile.email}</p>
                    </div>
                    <Badge
                        variant={selectedUser.isOnline ? "default" : "secondary"}
                        className={cn(
                            "px-3 py-1",
                            selectedUser.isOnline
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}
                    >
                        <span className={cn(
                            "inline-block h-2 w-2 rounded-full mr-1.5",
                            selectedUser.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        )} />
                        {selectedUser.isOnline ? "Online" : "Offline"}
                    </Badge>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth(-1)}
                        className="gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                    </Button>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                    </h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth(1)}
                        className="gap-1"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Summary Cards */}
                {monthlyData && !monthlyLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-xl border bg-card p-4 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <UserCheck className="h-4 w-4 text-emerald-500" />
                                Present Days
                            </div>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {monthlyData.summary.totalPresent}
                            </p>
                        </div>
                        <div className="rounded-xl border bg-card p-4 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <UserX className="h-4 w-4 text-red-500" />
                                Absent Days
                            </div>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {monthlyData.summary.totalAbsent}
                            </p>
                        </div>
                        <div className="rounded-xl border bg-card p-4 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 text-blue-500" />
                                Total Hours
                            </div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {monthlyData.summary.totalWorkingHours}h {monthlyData.summary.totalWorkingMinutes}m
                            </p>
                        </div>
                        <div className="rounded-xl border bg-card p-4 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Timer className="h-4 w-4 text-amber-500" />
                                Avg / Day
                            </div>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {monthlyData.summary.avgHoursPerDay}h
                            </p>
                        </div>
                    </div>
                )}

                {/* Monthly Calendar Grid */}
                {monthlyLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                    </div>
                ) : monthlyData ? (
                    <div className="space-y-3">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {DAY_NAMES.map((day) => (
                                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar cells */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {/* Empty cells for start of month */}
                            {(() => {
                                const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay()
                                return Array.from({ length: firstDay }, (_, i) => (
                                    <div key={`empty-${i}`} className="rounded-lg p-2 min-h-[80px]" />
                                ))
                            })()}

                            {monthlyData.days.map((day) => {
                                const dayNum = parseInt(day.date.split("-")[2])
                                const isToday = day.date === new Date().toISOString().split("T")[0]
                                const isExpanded = expandedDay === day.date

                                return (
                                    <div
                                        key={day.date}
                                        className={cn(
                                            "rounded-lg border p-2 min-h-[80px] cursor-pointer transition-all duration-200 hover:shadow-md",
                                            day.status === "present" && "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
                                            day.status === "absent" && !day.isWeekend && "bg-red-50/30 border-red-100 dark:bg-red-950/10 dark:border-red-900/30",
                                            day.status === "upcoming" && "bg-muted/30 border-dashed opacity-60",
                                            day.isWeekend && day.status !== "present" && "bg-slate-50/50 dark:bg-slate-900/20",
                                            isToday && "ring-2 ring-primary ring-offset-1 dark:ring-offset-background",
                                            isExpanded && "col-span-7 min-h-0"
                                        )}
                                        onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className={cn(
                                                "text-sm font-medium",
                                                isToday && "text-primary font-bold",
                                                day.isWeekend && "text-muted-foreground"
                                            )}>
                                                {dayNum}
                                            </span>
                                            {day.status === "present" && (
                                                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    {formatDuration(day.totalMinutes)}
                                                </span>
                                            )}
                                        </div>
                                        {day.status === "present" && !isExpanded && (
                                            <div className="mt-1 flex items-center gap-1">
                                                <div className="h-1 flex-1 rounded-full bg-emerald-200 dark:bg-emerald-800 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500"
                                                        style={{ width: `${Math.min((day.totalMinutes / 480) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {day.isWeekend && day.status !== "present" && (
                                            <span className="text-[10px] text-muted-foreground">Weekend</span>
                                        )}

                                        {/* Expanded session details */}
                                        {isExpanded && day.sessions.length > 0 && (
                                            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sessions</p>
                                                {day.sessions.map((session, idx) => (
                                                    <div
                                                        key={session._id || idx}
                                                        className="flex items-center gap-3 rounded-lg bg-background border p-2.5 text-sm"
                                                    >
                                                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                            <LogIn className="h-3.5 w-3.5" />
                                                            <span className="font-mono text-xs">{formatTime(session.loginTime)}</span>
                                                        </div>
                                                        <span className="text-muted-foreground">→</span>
                                                        <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
                                                            <LogOut className="h-3.5 w-3.5" />
                                                            <span className="font-mono text-xs">
                                                                {session.logoutTime ? formatTime(session.logoutTime) : (
                                                                    <span className="text-emerald-500 animate-pulse">Active</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                                                            <Timer className="h-3 w-3" />
                                                            {formatDuration(session.duration)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        )
    }

    // ════════════════════════════════════════════════
    //  USER LIST VIEW (with toggles)
    // ════════════════════════════════════════════════
    return (
        <div className="flex flex-1 flex-col gap-5 px-4 pb-8 max-w-6xl mx-auto w-full">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{totalUsers}</p>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{onlineCount}</p>
                        <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <UserX className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-500">{offlineCount}</p>
                        <p className="text-xs text-muted-foreground">Offline</p>
                    </div>
                </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-input/30 dark:bg-input/50"
                    />
                </div>
                {(currentUserRole === "admin") && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            try {
                                const token = getCookie("token")
                                await axios.post(
                                    API.ATTENDANCE.AUTO_LOGOUT,
                                    {},
                                    { headers: { Authorization: `Bearer ${token}` } }
                                )
                                toast.success("All active sessions have been closed")
                                await fetchTodayStatus()
                            } catch (err: any) {
                                toast.error(err.response?.data?.message || "Failed to auto-logout")
                            }
                        }}
                        className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950/30"
                    >
                        <LogOut className="h-4 w-4" />
                        Auto Logout All
                    </Button>
                )}
            </div>

            {/* User List */}
            <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-muted p-5 rounded-2xl shadow-sm mb-4">
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold mb-1">No Users Found</h3>
                        <p className="text-sm text-muted-foreground">
                            {search ? "Try adjusting your search" : "No active users in your organization"}
                        </p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div
                            key={user._id}
                            className={cn(
                                "group rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md",
                                user.isOnline && "border-emerald-200/60 dark:border-emerald-800/40"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className={cn(
                                        "h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                        user.isOnline
                                            ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30"
                                            : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300"
                                    )}>
                                        {getInitials(user.profile.firstName, user.profile.lastName)}
                                    </div>
                                    <span className={cn(
                                        "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                                        user.isOnline ? "bg-emerald-500" : "bg-slate-400"
                                    )} />
                                </div>

                                {/* User Info */}
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => openMonthlyView(user)}
                                >
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                                            {user.profile.firstName} {user.profile.lastName}
                                        </h4>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                                            {user.role}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user.profile.email}
                                    </p>
                                </div>

                                {/* Today's sessions info */}
                                <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                                    {user.sessions.length > 0 && (
                                        <>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-1">
                                                            <Coffee className="h-3.5 w-3.5" />
                                                            <span>{user.sessions.length} session{user.sessions.length > 1 ? "s" : ""}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Sessions today: {user.sessions.length}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{formatDuration(user.totalMinutesToday)}</span>
                                            </div>
                                        </>
                                    )}
                                    {user.sessions.length > 0 && (
                                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                            <LogIn className="h-3.5 w-3.5" />
                                            <span className="font-mono">{formatTime(user.sessions[0].loginTime)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Toggle Switch */}
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-xs font-medium min-w-[42px] text-right",
                                        user.isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                                    )}>
                                        {user.isOnline ? "Online" : "Offline"}
                                    </span>
                                    <Switch
                                        checked={user.isOnline}
                                        onCheckedChange={() => handleToggle(user)}
                                        disabled={toggleLoading === user._id}
                                        className={cn(
                                            "data-[state=checked]:bg-emerald-500",
                                            toggleLoading === user._id && "opacity-50"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Sessions timeline (visible on mobile) */}
                            {user.sessions.length > 0 && (
                                <div className="mt-3 md:hidden flex items-center gap-2 text-xs text-muted-foreground">
                                    <Coffee className="h-3.5 w-3.5" />
                                    <span>{user.sessions.length} session{user.sessions.length > 1 ? "s" : ""}</span>
                                    <span className="mx-1">·</span>
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{formatDuration(user.totalMinutesToday)}</span>
                                    <span className="mx-1">·</span>
                                    <LogIn className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="font-mono">{formatTime(user.sessions[0].loginTime)}</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
