/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useMemo } from "react"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { apolloClient } from "@/lib/apolloClient"
import axios from "axios"
import { getCookie } from "@/utils/cookies"
import { API } from "@/config/api"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { useNavigate } from "react-router-dom"
import type { GetAllProjectsQueryResponse, GetAllProjectsQueryVariables } from "@/types"

// UI Components
import {
  CalendarBody,
  CalendarDate,
  CalendarDatePagination,
  CalendarDatePicker,
  CalendarHeader,
  CalendarItem,
  CalendarMonthPicker,
  CalendarProvider,
  CalendarYearPicker,
} from "@/components/ui/shadcn-io/calendar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  Info,
  CalendarCheck,
  CalendarClock,
  MapPin,
  User,
  ExternalLink,
  X,
  Building2,
  ChevronsUpDown,
  Check,
} from "lucide-react"

// ─── GraphQL Query ───────────────────────────────────────
const GET_SITE_VISIT_ACTIVITIES = gql`
  query GetSiteVisitActivities(
    $organization: String!
    $startDate: String
    $endDate: String
    $userId: String
    $teamId: String
    $projectId: Int
  ) {
    getSiteVisitActivities(
      organization: $organization
      startDate: $startDate
      endDate: $endDate
      userId: $userId
      teamId: $teamId
      projectId: $projectId
    ) {
      id
      lead_id
      lead_name
      profile_id
      user_id
      user_name
      site_visit_date
      site_visit_completed
      site_visit_completed_at
      site_visit_completed_by_name
      site_visit_project_id
      site_visit_project_name
      createdAt
    }
  }
`

const GET_ALL_PROJECTS = gql`
  query GetAllProjects($organization: String!) {
    getAllProjects(organization: $organization) {
      product_id
      name
      location
      property
    }
  }
`

// ─── Types ───────────────────────────────────────────────
interface SiteVisitEntry {
  id: string
  lead_id: string
  lead_name: string
  profile_id: number
  user_id: string
  user_name: string
  site_visit_date: string
  site_visit_completed: boolean
  site_visit_completed_at: string | null
  site_visit_completed_by_name: string | null
  site_visit_project_id: number | null
  site_visit_project_name: string | null
  createdAt: string
}

interface TeamData {
  _id: string
  name: string
  members: string[]
}

interface UserData {
  _id: string
  profile_id: number
  profile: { firstName: string; lastName: string }
  teams: { teamId: string; teamName: string }[]
}

interface BookedUnitEntry {
  id: string
  label: string
  type: string
  bookedBy: {
    leadName: string
    leadUuid: string
    phone: string
    userId?: string
    userName?: string
    bookedAt?: string
  }
  project_name: string
  project_id: number
}

// ─── Statuses for CalendarItem ───────────────────────────
const statuses = {
  scheduled: { id: "scheduled", name: "Scheduled", color: "#6366F1" },
  completed: { id: "completed", name: "Completed", color: "#10B981" },
  booked: { id: "booked", name: "Booked", color: "#F59E0B" } // Amber
}

// ─── Helpers ─────────────────────────────────────────────
function getDateKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ─── Component ───────────────────────────────────────────
export default function UserCalendar() {
  const { setBreadcrumbs } = useBreadcrumb()
  const navigate = useNavigate()

  const organization = getCookie("organization") || ""
  const role = getCookie("role") || "user"
  const currentProfileId = getCookie("profile_id") || ""
  const isAdmin = role === "admin"

  // ── Filter state ──
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all")
  const [selectedUserId, setSelectedUserId] = useState<string>("all")
  const [teams, setTeams] = useState<TeamData[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")

  // ── Combobox open states ──
  const [teamOpen, setTeamOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)

  // ── Day detail sheet ──
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // ── Breadcrumb ──
  useEffect(() => {
    setBreadcrumbs([
      { label: "Calendar" },
      {
        label: (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4.5 w-4.5" />
              </TooltipTrigger>
              <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                <p className="font-medium">Site Visit Schedule & Tracking</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
    ])
  }, [setBreadcrumbs])

  // ── Fetch teams & users ──
  const fetchTeamsAndUsers = useCallback(async () => {
    try {
      const token = getCookie("token")
      if (!organization) return

      // Fetch teams
      const teamsRes = await axios.get(`${API.TEAMS}?organization=${organization}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const allTeams: TeamData[] = teamsRes.data.data || []

      // Fetch users (paginated API returns { users, total, ... })
      const usersRes = await axios.get(`${API.USERS}?organization=${organization}&limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const usersPayload = usersRes.data.data
      const allUsers: UserData[] = Array.isArray(usersPayload) ? usersPayload : (usersPayload?.users || [])

      if (isAdmin) {
        setTeams(allTeams)
        setUsers(allUsers)
      } else {
        // Regular user: only their teams
        const userTeamIds = allUsers
          .find((u) => String(u.profile_id) === currentProfileId)
          ?.teams?.map((t) => t.teamId) || []
        setTeams(allTeams.filter((t) => userTeamIds.includes(t._id)))
        // Only show users who share a team with current user
        setUsers(
          allUsers.filter(
            (u) =>
              u.teams?.some((t) => userTeamIds.includes(t.teamId)) ||
              String(u.profile_id) === currentProfileId
          )
        )
      }
    } catch (err) {
      console.error("Failed to fetch teams/users:", err)
    } finally {
      setTeamsLoading(false)
    }
  }, [organization, isAdmin, currentProfileId])

  useEffect(() => {
    fetchTeamsAndUsers()
  }, [fetchTeamsAndUsers])

  // Filter users when team changes
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return []
    if (selectedTeamId === "all") return users
    const team = teams.find((t) => t._id === selectedTeamId)
    if (!team) return users
    return users.filter((u) => team.members.includes(u._id))
  }, [selectedTeamId, teams, users])

  // Reset user filter when team changes
  useEffect(() => {
    setSelectedUserId("all")
  }, [selectedTeamId])

  // ── GraphQL query variables ──
  const queryVars = useMemo(() => {
    const vars: any = { organization }
    if (selectedTeamId !== "all") vars.teamId = selectedTeamId
    if (selectedUserId !== "all") vars.userId = selectedUserId
    if (selectedProjectId !== "all") vars.projectId = parseInt(selectedProjectId, 10)
    return vars
  }, [organization, selectedTeamId, selectedUserId, selectedProjectId])

  const { data, loading, error } = useQuery<{
    getSiteVisitActivities: SiteVisitEntry[]
  }>(GET_SITE_VISIT_ACTIVITIES, {
    variables: queryVars,
    client: apolloClient,
    skip: !organization,
    fetchPolicy: "cache-and-network",
  })

  const visits = data?.getSiteVisitActivities || []

  // Fetch all org projects for filter
  const { data: projectsData } = useQuery<GetAllProjectsQueryResponse, GetAllProjectsQueryVariables>(GET_ALL_PROJECTS, {
    variables: { organization },
    skip: !organization,
  })
  const allProjects = projectsData?.getAllProjects || []

  // ── Fetch Booked Units ──
  const [bookedUnits, setBookedUnits] = useState<BookedUnitEntry[]>([])
  const [bookedLoading, setBookedLoading] = useState(false)

  useEffect(() => {
    const fetchBookedUnits = async () => {
      if (!organization) return
      setBookedLoading(true)
      try {
        const token = getCookie("token")
        let url = `${API.getAllBookedUnits()}?organization=${organization}`
        if (selectedTeamId !== "all") url += `&teamId=${selectedTeamId}`
        if (selectedUserId !== "all") url += `&userId=${selectedUserId}`
        if (selectedProjectId !== "all") url += `&projectId=${selectedProjectId}`

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setBookedUnits(res.data.data || [])
      } catch (err) {
        console.error("Failed to fetch booked units:", err)
      } finally {
        setBookedLoading(false)
      }
    }
    fetchBookedUnits()
  }, [organization, selectedTeamId, selectedUserId, selectedProjectId])

  // ── Group items by date ──
  const itemsByDate = useMemo(() => {
    const map = new Map<string, { visits: SiteVisitEntry[], booked: BookedUnitEntry[] }>()

    for (const v of visits) {
      const key = getDateKey(v.site_visit_date)
      if (!map.has(key)) map.set(key, { visits: [], booked: [] })
      map.get(key)!.visits.push(v)
    }

    for (const b of bookedUnits) {
      if (!b.bookedBy?.bookedAt) continue
      const key = getDateKey(b.bookedBy.bookedAt)
      if (!map.has(key)) map.set(key, { visits: [], booked: [] })
      map.get(key)!.booked.push(b)
    }

    return map
  }, [visits, bookedUnits])

  // ── Build calendar features (items that appear on the grid) ──
  const calendarFeatures = useMemo(() => {
    const features: any[] = []
    itemsByDate.forEach((dayItems, dateKey) => {
      const [y, m, d] = dateKey.split("-").map(Number)
      const date = new Date(y, m - 1, d)

      const scheduled = dayItems.visits.filter((v) => !v.site_visit_completed).length
      const completed = dayItems.visits.filter((v) => v.site_visit_completed).length
      const bookedCount = dayItems.booked.length

      if (scheduled > 0) {
        features.push({
          id: `sched-${dateKey}`,
          name: `Scheduled [${scheduled}]`,
          startAt: new Date(date),
          endAt: new Date(date),
          status: statuses.scheduled,
        })
      }
      if (completed > 0) {
        features.push({
          id: `done-${dateKey}`,
          name: `Completed [${completed}]`,
          startAt: new Date(date),
          endAt: new Date(date),
          status: statuses.completed,
        })
      }
      if (bookedCount > 0) {
        features.push({
          id: `booked-${dateKey}`,
          name: `Booked [${bookedCount}]`,
          startAt: new Date(date),
          endAt: new Date(date),
          status: statuses.booked,
        })
      }
    })
    return features
  }, [itemsByDate])

  // ── Selected day items ──
  const selectedDayItems = useMemo(() => {
    if (!selectedDate) return { visits: [], booked: [] }
    return itemsByDate.get(selectedDate) || { visits: [], booked: [] }
  }, [selectedDate, itemsByDate])

  // ── Stats ──
  const totalScheduled = visits.filter((v) => !v.site_visit_completed).length
  const totalCompleted = visits.filter((v) => v.site_visit_completed).length
  const totalBooked = bookedUnits.length

  const hasFilters = selectedTeamId !== "all" || selectedUserId !== "all" || selectedProjectId !== "all"

  const clearFilters = () => {
    setSelectedTeamId("all")
    setSelectedUserId("all")
    setSelectedProjectId("all")
  }

  // ── Year range for picker ──
  const currentYear = new Date().getFullYear()
  const earliestYear = currentYear - 1
  const latestYear = currentYear + 1

  return (
    <div className="px-4 md:px-6 pb-6 space-y-4">
      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 p-2">
            <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Visits</p>
            <p className="text-lg font-bold">{visits.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-2">
            <CalendarClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
            <p className="text-lg font-bold">{totalScheduled}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 p-2">
            <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-lg font-bold">{totalCompleted}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/40 p-2">
            <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Booked Units</p>
            <p className="text-lg font-bold">
              {totalBooked}
            </p>
          </div>
        </div>
      </div>

      {/* ── Calendar ── */}
      {(loading && !data) || bookedLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          Failed to load site visit data. Please try again.
        </div>
      ) : (
        <CalendarProvider className="p-3 border rounded-lg shadow-sm bg-white dark:bg-zinc-900">
          <CalendarDate>
            <CalendarDatePicker className="flex-wrap gap-2">
              <CalendarMonthPicker />
              <CalendarYearPicker start={earliestYear} end={latestYear} />

              <div className="hidden h-6 w-px bg-border md:block mx-1"></div>

              {/* Team Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Team</label>
                <Popover open={teamOpen} onOpenChange={setTeamOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={teamOpen} className="w-[180px] h-9 justify-between font-normal">
                      <span className="truncate">
                        {selectedTeamId === "all" ? "All Teams" : teams.find((t) => t._id === selectedTeamId)?.name || "All Teams"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[180px] p-0">
                    <Command>
                      <CommandInput placeholder="Search team..." />
                      <CommandList>
                        <CommandEmpty>No team found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setSelectedTeamId("all"); setTeamOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedTeamId === "all" ? "opacity-100" : "opacity-0")} />
                            All Teams
                          </CommandItem>
                          {teamsLoading ? (
                            <CommandItem disabled>Loading...</CommandItem>
                          ) : (
                            teams.map((t) => (
                              <CommandItem key={t._id} value={t.name} onSelect={() => { setSelectedTeamId(t._id); setTeamOpen(false) }}>
                                <Check className={cn("mr-2 h-4 w-4", selectedTeamId === t._id ? "opacity-100" : "opacity-0")} />
                                {t.name}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* User Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">User</label>
                <Popover open={userOpen} onOpenChange={setUserOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={userOpen} className="w-[180px] h-9 justify-between font-normal">
                      <span className="truncate">
                        {selectedUserId === "all" ? "All Users" : (() => { const u = filteredUsers.find((u) => String(u.profile_id) === selectedUserId); return u ? `${u.profile.firstName} ${u.profile.lastName}` : "All Users" })()}
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
                          <CommandItem onSelect={() => { setSelectedUserId("all"); setUserOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedUserId === "all" ? "opacity-100" : "opacity-0")} />
                            All Users
                          </CommandItem>
                          {filteredUsers.map((u) => (
                            <CommandItem key={u._id} value={`${u.profile.firstName} ${u.profile.lastName}`} onSelect={() => { setSelectedUserId(String(u.profile_id)); setUserOpen(false) }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedUserId === String(u.profile_id) ? "opacity-100" : "opacity-0")} />
                              {u.profile.firstName} {u.profile.lastName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Project Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Project</label>
                <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={projectOpen} className="w-[180px] h-9 justify-between font-normal">
                      <span className="truncate">
                        {selectedProjectId === "all" ? "All Projects" : allProjects.find((p) => String(p.product_id) === selectedProjectId)?.name || "All Projects"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0">
                    <Command>
                      <CommandInput placeholder="Search project..." />
                      <CommandList>
                        <CommandEmpty>No project found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setSelectedProjectId("all"); setProjectOpen(false) }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedProjectId === "all" ? "opacity-100" : "opacity-0")} />
                            All Projects
                          </CommandItem>
                          {allProjects.map((p) => (
                            <CommandItem key={p.product_id} value={p.name} onSelect={() => { setSelectedProjectId(String(p.product_id)); setProjectOpen(false) }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedProjectId === String(p.product_id) ? "opacity-100" : "opacity-0")} />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}

              {!isAdmin && (
                <span className="text-xs text-muted-foreground italic ml-2 hidden lg:inline-block">
                  Showing your team data only
                </span>
              )}
            </CalendarDatePicker>
            <CalendarDatePagination />
          </CalendarDate>
          <CalendarHeader />
          <CalendarBody features={calendarFeatures}>
            {({ feature }) => (
              <div
                key={feature.id}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  const dateKey = getDateKey(feature.startAt.toISOString())
                  setSelectedDate(dateKey)
                  setSheetOpen(true)
                }}
              >
                <CalendarItem feature={feature} />
              </div>
            )}
          </CalendarBody>
        </CalendarProvider>
      )}

      {/* ── Legend ── */}
      {!loading && !error && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statuses.scheduled.color }} />
            Scheduled
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statuses.completed.color }} />
            Completed
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statuses.booked.color }} />
            Booked
          </div>
          <span className="ml-auto">Click on a day's item to view details</span>
        </div>
      )}

      {/* ── Day Detail Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto px-3">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              Day Details
            </SheetTitle>
            <SheetDescription >
              {selectedDate ? formatDate(selectedDate + "T00:00:00") : ""}
              {" · "}
              {selectedDayItems.visits.length + selectedDayItems.booked.length} activity{selectedDayItems.visits.length + selectedDayItems.booked.length !== 1 ? "s" : ""}
            </SheetDescription>
          </SheetHeader>

          {/* Summary badges */}
          {(selectedDayItems.visits.length > 0 || selectedDayItems.booked.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-4 px-1">
              {selectedDayItems.visits.filter((v) => !v.site_visit_completed).length > 0 && (
                <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  <CalendarClock className="h-3 w-3" />
                  {selectedDayItems.visits.filter((v) => !v.site_visit_completed).length} Scheduled
                </Badge>
              )}
              {selectedDayItems.visits.filter((v) => v.site_visit_completed).length > 0 && (
                <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <CalendarCheck className="h-3 w-3" />
                  {selectedDayItems.visits.filter((v) => v.site_visit_completed).length} Completed
                </Badge>
              )}
              {selectedDayItems.booked.length > 0 && (
                <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <Check className="h-3 w-3" />
                  {selectedDayItems.booked.length} Booked Units
                </Badge>
              )}
            </div>
          )}

          {/* Activity list */}
          <div className="space-y-3 pt-4">
            {selectedDayItems.visits.length === 0 && selectedDayItems.booked.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No activities on this day</p>
            ) : (
              <>
                {/* Render Booked Units First */}
                {selectedDayItems.booked.map((unit) => (
                  <div
                    key={`booked-${unit.id}`}
                    className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors bg-orange-50/30 dark:bg-orange-950/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: statuses.booked.color }}
                        />
                        <span className="font-medium truncate">
                          {unit.bookedBy?.leadName || "Unknown"}
                        </span>
                      </div>
                      <Badge
                        className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] shrink-0"
                      >
                        Booked
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground pl-5">
                      <div className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {unit.bookedBy?.bookedAt ? formatTime(unit.bookedBy.bookedAt) : "N/A"}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {unit.bookedBy?.userName || "Unknown user"}
                      </div>
                      <div className="col-span-2 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Building2 className="h-3 w-3" />
                        {unit.project_name} - {unit.label}
                      </div>
                    </div>

                    <div className="pl-5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 p-0"
                        onClick={() => navigate(`/lead_detail/${unit.bookedBy?.leadUuid}`)}
                      >
                        View Lead <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Render Site Visits */}
                {selectedDayItems.visits.map((visit) => (
                  <div
                    key={`visit-${visit.id}`}
                    className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    {/* Lead name + status badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: visit.site_visit_completed
                              ? statuses.completed.color
                              : statuses.scheduled.color,
                          }}
                        />
                        <span className="font-medium truncate">
                          {visit.lead_name}
                        </span>
                      </div>
                      <Badge
                        variant={visit.site_visit_completed ? "default" : "outline"}
                        className={
                          visit.site_visit_completed
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] shrink-0"
                            : "text-[10px] shrink-0"
                        }
                      >
                        {visit.site_visit_completed ? "Completed" : "Scheduled"}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground pl-5">
                      <div className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {formatTime(visit.site_visit_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {visit.user_name}
                      </div>
                      {visit.site_visit_project_name && (
                        <div className="col-span-2 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Building2 className="h-3 w-3" />
                          {visit.site_visit_project_name}
                        </div>
                      )}
                      {visit.site_visit_completed && visit.site_visit_completed_by_name && (
                        <div className="col-span-2 flex items-center gap-1 text-emerald-600">
                          <CalendarCheck className="h-3 w-3" />
                          Completed by {visit.site_visit_completed_by_name}
                        </div>
                      )}
                    </div>

                    {/* Link to lead */}
                    <div className="pl-5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 p-0"
                        onClick={() => navigate(`/lead_detail/${visit.lead_id}`)}
                      >
                        View Lead <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}