import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { API } from "@/config/api"
import { getCookie } from "@/utils/cookies"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Info,
    ChevronLeft,
    ChevronRight,
    Users,
    CalendarDays,
    UserCheck,
    UserX,
    Search,
    ShieldAlert,
    ArrowRightLeft,
    X,
    CheckCircle2,
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
interface UserAvailability {
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
    availability: {
        _id: string | null
        days: Record<string, boolean>
        fallbackUsers: Record<string, string | null>
    }
}

interface WeeklyData {
    weekStart: string
    users: UserAvailability[]
}

// ─── Constants ────────────────────────────────────────────
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
const DAY_LABELS: Record<string, string> = {
    monday: "MON",
    tuesday: "TUE",
    wednesday: "WED",
    thursday: "THU",
    friday: "FRI",
    saturday: "SAT",
    sunday: "SUN",
}
const DAY_FULL_LABELS: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
}

// ─── Helpers ──────────────────────────────────────────────
function getInitials(firstName: string, lastName: string) {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
}

function getWeekStart(date: Date = new Date()): string {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().split("T")[0]
}

function getWeekDates(weekStart: string): Record<string, string> {
    const start = new Date(weekStart)
    const dates: Record<string, string> = {}
    DAYS.forEach((day, i) => {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        dates[day] = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    })
    return dates
}

function getWeekRange(weekStart: string): string {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    return `${fmt(start)} – ${fmt(end)}`
}

function getTodayDayName(): string {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    return days[new Date().getDay()]
}

// ─── Main Component ────────────────────────────────────────
export default function AvailabilityChart() {
    const { setBreadcrumbs } = useBreadcrumb()
    const currentUserRole = getCookie("role")
    const isAdmin = currentUserRole === "admin" || currentUserRole === "manager"

    // State
    const [weekStart, setWeekStart] = useState(getWeekStart())
    const [data, setData] = useState<WeeklyData | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [toggleLoading, setToggleLoading] = useState<string | null>(null) // "userId-day"

    // Modal state for fallback assignment
    const [modalOpen, setModalOpen] = useState(false)
    const [modalUser, setModalUser] = useState<UserAvailability | null>(null)
    const [modalDay, setModalDay] = useState("")
    const [modalSearch, setModalSearch] = useState("")
    const [selectedFallback, setSelectedFallback] = useState<string | null>(null)
    const [submittingFallback, setSubmittingFallback] = useState(false)

    const todayDay = getTodayDayName()

    // ── Breadcrumbs ──
    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Availability & Leave" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">
                                    Manage weekly availability for pre-sales users. Toggle off to mark leave and assign fallback users.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
            },
        ])
    }, [setBreadcrumbs])

    // ── Fetch weekly availability ──
    const fetchAvailability = useCallback(async (ws: string) => {
        setLoading(true)
        try {
            const token = getCookie("token")
            const response = await axios.get(
                `${API.AVAILABILITY.WEEKLY}?weekStart=${ws}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setData(response.data.data || null)
        } catch (err: any) {
            console.error("Failed to fetch availability:", err)
            toast.error("Failed to fetch availability data")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAvailability(weekStart)
    }, [weekStart, fetchAvailability])

    // ── Week navigation ──
    const navigateWeek = (direction: -1 | 1) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + direction * 7)
        const newWs = d.toISOString().split("T")[0]
        setWeekStart(newWs)
    }

    const goToThisWeek = () => {
        setWeekStart(getWeekStart())
    }

    // ── Toggle availability ──
    const handleToggle = useCallback(async (user: UserAvailability, day: string, currentlyAvailable: boolean) => {
        if (!isAdmin) return

        if (currentlyAvailable) {
            // Going from available → unavailable → show fallback modal
            setModalUser(user)
            setModalDay(day)
            setSelectedFallback(null)
            setModalSearch("")
            setModalOpen(true)
        } else {
            // Going from unavailable → available → toggle directly
            const key = `${user._id}-${day}`
            setToggleLoading(key)
            try {
                const token = getCookie("token")
                await axios.post(
                    API.AVAILABILITY.TOGGLE,
                    {
                        userId: user._id,
                        weekStart,
                        day,
                        available: true,
                        fallbackUserId: null,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                toast.success(`${user.profile.firstName} marked available on ${DAY_FULL_LABELS[day]}`)
                await fetchAvailability(weekStart)
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to toggle availability")
            } finally {
                setToggleLoading(null)
            }
        }
    }, [isAdmin, weekStart, fetchAvailability])

    // ── Submit fallback assignment ──
    const handleSubmitFallback = useCallback(async () => {
        if (!modalUser || !selectedFallback || !modalDay) return
        setSubmittingFallback(true)
        try {
            const token = getCookie("token")
            await axios.post(
                API.AVAILABILITY.TOGGLE,
                {
                    userId: modalUser._id,
                    weekStart,
                    day: modalDay,
                    available: false,
                    fallbackUserId: selectedFallback,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            toast.success(
                `${modalUser.profile.firstName} marked as leave on ${DAY_FULL_LABELS[modalDay]}. Work forwarded.`
            )
            setModalOpen(false)
            await fetchAvailability(weekStart)
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update availability")
        } finally {
            setSubmittingFallback(false)
        }
    }, [modalUser, selectedFallback, modalDay, weekStart, fetchAvailability])

    // ── Filter users ──
    const filteredUsers = data?.users?.filter((user) => {
        if (!search) return true
        const name = `${user.profile.firstName} ${user.profile.lastName}`.toLowerCase()
        return name.includes(search.toLowerCase())
    }) || []

    // Fallback user candidates (all users except the one going on leave)
    const fallbackCandidates = data?.users?.filter(
        (u) => u._id !== modalUser?._id
    ).filter((u) => {
        if (!modalSearch) return true
        const name = `${u.profile.firstName} ${u.profile.lastName}`.toLowerCase()
        return name.includes(modalSearch.toLowerCase())
    }) || []

    // ── Stats ──
    const totalUsers = data?.users?.length || 0
    const weekDates = data ? getWeekDates(data.weekStart) : {}

    // Count today's availability
    const availableToday = data?.users?.filter(u => u.availability.days[todayDay] !== false).length || 0
    const onLeaveToday = totalUsers - availableToday

    // ─── Loading ───
    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading availability...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-5 px-4 pb-8 max-w-[1400px] mx-auto w-full">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{totalUsers}</p>
                        <p className="text-xs text-muted-foreground">Pre-Sales Users</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{availableToday}</p>
                        <p className="text-xs text-muted-foreground">Available Today</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                        <UserX className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{onLeaveToday}</p>
                        <p className="text-xs text-muted-foreground">On Leave Today</p>
                    </div>
                </div>
            </div>

            {/* Week Navigation & Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)} className="gap-1">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card min-w-[240px] justify-center">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{data ? getWeekRange(data.weekStart) : ""}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigateWeek(1)} className="gap-1">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    {weekStart !== getWeekStart() && (
                        <Button variant="ghost" size="sm" onClick={goToThisWeek} className="text-xs text-primary">
                            This Week
                        </Button>
                    )}
                </div>
                <div className="relative flex-1 max-w-sm ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="availability-search"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-input/30 dark:bg-input/50"
                    />
                </div>
            </div>

            {/* Availability Grid */}
            <div className="rounded-xl border bg-card overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[minmax(200px,1.5fr)_repeat(7,1fr)] border-b bg-muted/30">
                    <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        Name
                    </div>
                    {DAYS.map((day) => (
                        <div
                            key={day}
                            className={cn(
                                "px-2 py-3 text-center",
                                todayDay === day && "bg-primary/5"
                            )}
                        >
                            <p className={cn(
                                "text-xs font-semibold uppercase tracking-wider",
                                todayDay === day
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}>
                                {DAY_LABELS[day]}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                {weekDates[day] || ""}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Table Rows */}
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-muted p-5 rounded-2xl shadow-sm mb-4">
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold mb-1">No Pre-Sales Users Found</h3>
                        <p className="text-sm text-muted-foreground">
                            {search ? "Try adjusting your search" : "No active pre-sales users in your organization"}
                        </p>
                    </div>
                ) : (
                    filteredUsers.map((user, idx) => {
                        const fallbackMap = user.availability.fallbackUsers || {}
                        return (
                            <div
                                key={user._id}
                                className={cn(
                                    "grid grid-cols-[minmax(200px,1.5fr)_repeat(7,1fr)] border-b last:border-0 transition-colors hover:bg-accent/30",
                                    idx % 2 === 0 ? "" : "bg-muted/10"
                                )}
                            >
                                {/* User Info */}
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                                        {getInitials(user.profile.firstName, user.profile.lastName)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {user.profile.firstName} {user.profile.lastName}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate capitalize">
                                            {user.role} · {user.department}
                                        </p>
                                    </div>
                                </div>

                                {/* Day Cells */}
                                {DAYS.map((day) => {
                                    const isAvailable = user.availability.days[day] !== false
                                    const isToggling = toggleLoading === `${user._id}-${day}`
                                    const fallbackId = fallbackMap[day]
                                    const fallbackUser = fallbackId
                                        ? data?.users?.find(u => u._id === fallbackId?.toString())
                                        : null

                                    return (
                                        <div
                                            key={day}
                                            className={cn(
                                                "px-2 py-3 flex flex-col items-center justify-center gap-1.5 transition-colors",
                                                todayDay === day && "bg-primary/5",
                                                !isAvailable && "bg-red-50/50 dark:bg-red-950/10"
                                            )}
                                        >
                                            {/* Status indicator */}
                                            <div className={cn(
                                                "h-2.5 w-2.5 rounded-full transition-all",
                                                isAvailable
                                                    ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                                                    : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                                            )} />

                                            {/* Toggle */}
                                            {isAdmin ? (
                                                <Switch
                                                    checked={isAvailable}
                                                    onCheckedChange={() => handleToggle(user, day, isAvailable)}
                                                    disabled={isToggling}
                                                    className={cn(
                                                        "scale-[0.85]",
                                                        isAvailable
                                                            ? "data-[state=checked]:bg-emerald-500"
                                                            : "data-[state=unchecked]:bg-red-400",
                                                        isToggling && "opacity-50"
                                                    )}
                                                />
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0",
                                                        isAvailable
                                                            ? "text-emerald-600 border-emerald-200 bg-emerald-50/50 dark:text-emerald-400 dark:border-emerald-800"
                                                            : "text-red-600 border-red-200 bg-red-50/50 dark:text-red-400 dark:border-red-800"
                                                    )}
                                                >
                                                    {isAvailable ? "Available" : "Leave"}
                                                </Badge>
                                            )}

                                            {/* Fallback indicator */}
                                            {!isAvailable && fallbackUser && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-0.5 text-[10px] text-orange-600 dark:text-orange-400 cursor-help">
                                                                <ArrowRightLeft className="h-3 w-3" />
                                                                <span className="truncate max-w-[60px]">
                                                                    {fallbackUser.profile.firstName}
                                                                </span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-black text-white dark:bg-white dark:text-black">
                                                            <p className="text-xs">
                                                                Work assigned to{" "}
                                                                <span className="font-semibold">
                                                                    {fallbackUser.profile.firstName} {fallbackUser.profile.lastName}
                                                                </span>
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })
                )}
            </div>

            {/*  LEAVE MANAGEMENT MODAL                     */}
            {/* ═══════════════════════════════════════════ */}
            {modalOpen && modalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-background border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg">
                                    <ShieldAlert className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Manage Leave</h3>
                                    <p className="text-xs text-muted-foreground">
                                        For {modalUser.profile.firstName} on {DAY_FULL_LABELS[modalDay]}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Leave Info */}
                        <div className="px-6 py-3 bg-muted/20 border-b">
                            <p className="text-[12px] text-muted-foreground">
                                Select a specific replacement OR redistribution via Round Robin.
                            </p>
                        </div>

                        {/* Search & List */}
                        <div className="px-6 pt-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="modal-search"
                                    placeholder="Search replacement..."
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                    className="pl-9 bg-input/30"
                                />
                            </div>

                            <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar pb-2">
                                {fallbackCandidates.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">No users found</p>
                                ) : (
                                    fallbackCandidates.map((u) => {
                                        const isSelected = selectedFallback === u._id
                                        const isAlsoOnLeave = u.availability.days[modalDay] === false
                                        return (
                                            <button
                                                key={u._id}
                                                onClick={() => setSelectedFallback(u._id)}
                                                disabled={isAlsoOnLeave}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                                                    isSelected
                                                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                                                        : "border-transparent hover:bg-accent/50",
                                                    isAlsoOnLeave && "opacity-40 cursor-not-allowed grayscale"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-sm",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground"
                                                )}>
                                                    {getInitials(u.profile.firstName, u.profile.lastName)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {u.profile.firstName} {u.profile.lastName}
                                                    </p>
                                                    {isAlsoOnLeave && <p className="text-[10px] text-red-500 font-medium">Also on leave</p>}
                                                </div>
                                                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Modal Footer - 3 Buttons */}
                        <div className="flex flex-col gap-2.5 p-6 border-t bg-muted/10 rounded-b-2xl">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setModalOpen(false)}
                                    disabled={submittingFallback}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 gap-1.5"
                                    onClick={() => {
                                        const markAsRR = async () => {
                                            setSubmittingFallback(true);
                                            try {
                                                const token = getCookie("token");
                                                await axios.post(API.AVAILABILITY.TOGGLE, {
                                                    userId: modalUser._id,
                                                    weekStart,
                                                    day: modalDay,
                                                    available: false,
                                                    fallbackUserId: null,
                                                }, { headers: { Authorization: `Bearer ${token}` } });
                                                toast.success(`${modalUser.profile.firstName}'s work will be redistributed via Round Robin`);
                                                setModalOpen(false);
                                                fetchAvailability(weekStart);
                                            } catch (err) { toast.error("Failed to redistribute"); }
                                            finally { setSubmittingFallback(false); }
                                        };
                                        markAsRR();
                                    }}
                                    disabled={submittingFallback}
                                >
                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                    Make as Round Robin
                                </Button>
                            </div>
                            <Button
                                size="default"
                                className="w-full gap-2 bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 transition-all"
                                onClick={handleSubmitFallback}
                                disabled={!selectedFallback || submittingFallback}
                            >
                                {submittingFallback ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                Assign & Approve Leave
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
