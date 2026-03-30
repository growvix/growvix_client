import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { DataTable } from "@/components/ui/data-table"
import LoaderScreen from "@/components/ui/loader-screen"
import { getCookie } from "@/utils/cookies"
import axios from "axios"
import { API, API_URL } from "@/config/api"
import { leadClient } from "@/grpc/leadClient"
import type { Lead as GrpcLead } from "@/grpc/types"
import type { Stage } from "@/types"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowUpDown, MoreHorizontal, Info, ChevronsUpDown, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export type Lead = {
  lead_id: string
  profile_id: number
  name: string
  phone: string
  stage: string
  status: string
  campaign: string
  source: string
  sub_source: string
  received: string
  exe_user_name: string
}

type Filters = {
  name: string
  company: string
  status: string
  stage: string
  source: string
  assignedTo: string
  receivedOn: string
}


// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "-"
  }
}

export const getColumns = (navigate: ReturnType<typeof useNavigate>): ColumnDef<Lead>[] => [
  {
    accessorKey: "profile_id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >Profile ID
          <ArrowUpDown />
        </Button>
      )
    },
    meta: {
      label: "Profile ID",
    },
    cell: ({ row }) => <div className="font-medium pl-10 cursor-pointer hover:underline" onClick={() => navigate(`/lead_detail/${row.original.lead_id.toString()}`)}>#{row.getValue("profile_id")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      )
    },
    meta: {
      label: "Name",
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("name") || "-"}</div>,
  },
  {
    accessorKey: "phone",
    header: "Phone Number",
    meta: {
      label: "Phone Number",
    },
    cell: ({ row }) => <div>{row.getValue("phone") || "-"}</div>,
  },
  {
    accessorKey: "stage",
    header: "Stage",
    meta: {
      label: "Stage",
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("stage") || "-"}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      label: "Status",
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("status") || "-"}</div>,
  },
  {
    accessorKey: "campaign",
    header: "Campaign",
    meta: {
      label: "Campaign",
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("campaign") || "-"}</div>,
  },
  {
    accessorKey: "source",
    header: "Source",
    meta: {
      label: "Source",
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("source") || "-"}</div>,
  },
  {
    accessorKey: "sub_source",
    header: "Sub Source",
    meta: {
      label: "Sub Source",
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("sub_source") || "-"}</div>,
  },
  {
    accessorKey: "received",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Received On
          <ArrowUpDown />
        </Button>
      )
    },
    meta: {
      label: "Received On",
    },
    cell: ({ row }) => <div>{formatDate(row.getValue("received"))}</div>,
  },
  {
    accessorKey: "exe_user_name",
    header: "Assigned To",
    meta: {
      label: "Assigned To",
    },
    cell: ({ row }) => {
      const name = row.getValue("exe_user_name") as string
      return name ? (
        <div className="capitalize font-medium text-primary">{name}</div>
      ) : (
        <div className="text-muted-foreground">—</div>
      )
    },
  },
]

export default function AllLeads() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setBreadcrumbs } = useBreadcrumb()
  const organization = getCookie("organization") || ""
  const columns = getColumns(navigate)

  const presetFilters = location.state?.presetFilters;


  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [stages, setStages] = useState<Stage[]>([])

  // Pagination state
  const PAGE_SIZE = 50
  const [page, setPage] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)

  useEffect(() => {
    setBreadcrumbs([
      { label: "All Leads" },
      {
        label: (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4.5 w-4.5" />
              </TooltipTrigger>
              <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                <p className="font-medium">Lead Management</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    ])
  }, [setBreadcrumbs])

  // Fetch stages for the filter dropdown
  useEffect(() => {
    async function fetchStages() {
      if (!organization) return
      try {
        const response = await axios.get(`${API_URL}/api/leads/stages/${organization}`)
        if (response.data.success && response.data.data.stages) {
          setStages(response.data.data.stages)
        }
      } catch (err) {
        console.error("Failed to fetch stages:", err)
      }
    }
    fetchStages()
  }, [organization])

  const [filters, setFilters] = useState<Filters>(presetFilters || {
    name: "",
    company: "",
    status: "all",
    source: "",
    stage: "",
    assignedTo: "all",
    receivedOn: "",
  })

  // To support applying the default filters on mount, initialize appliedFilters natively
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(presetFilters || {
    name: "",
    company: "",
    status: "all",
    source: "",
    stage: "",
    assignedTo: "all",
    receivedOn: "",
  })

  const [users, setUsers] = useState<{ _id: string, name: string, role?: string }[]>([])

  // Combobox open states
  const [assignedOpen, setAssignedOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)

  // Fetch users for 'Assigned To' filter
  useEffect(() => {
    async function fetchUsers() {
      if (!organization) return
      try {
        const token = getCookie("token")
        const response = await axios.get(`${API.USERS}?organization=${organization}&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = response.data.data
        if (data && data.users) {
          // Dynamic update based on role logic: e.g., only active users
          const activeUsers = data.users.filter((u: any) => u.isActive !== false)

          const mappedUsers = activeUsers.map((u: any) => ({
            _id: u._id || u.globalUserId,
            name: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim(),
            role: u.role || 'User'
          }))

          setUsers(mappedUsers)

          // Fallback mechanism: if the dashboard passed 'userName' instead of a UUID due to missing cookies or specific frontend requests:
          if (presetFilters?.assignedTo && !presetFilters.assignedTo.match(/^[0-9a-fA-F-]{36}$/)) {
            const matchedUser = mappedUsers.find((u: { name: string, _id: string }) => u.name.toLowerCase() === presetFilters.assignedTo.toLowerCase())
            if (matchedUser) {
              setFilters(prev => ({ ...prev, assignedTo: matchedUser._id }))
              setAppliedFilters(prev => prev ? { ...prev, assignedTo: matchedUser._id } : null)
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch users", err)
      }
    }
    fetchUsers()
  }, [organization])

  // Fetch leads using gRPC client
  useEffect(() => {
    async function fetchLeads() {
      if (!organization) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Build filters payload from appliedFilters
        const filterPayload: Record<string, string> = {}
        if (appliedFilters?.name) filterPayload.name = appliedFilters.name
        if (appliedFilters?.source) filterPayload.source = appliedFilters.source
        if (appliedFilters?.company) filterPayload.campaign = appliedFilters.company
        if (appliedFilters?.status && appliedFilters.status !== "all") filterPayload.status = appliedFilters.status
        if (appliedFilters?.stage) filterPayload.stage = appliedFilters.stage
        if (appliedFilters?.assignedTo && appliedFilters.assignedTo !== "all") {
          if (/^[0-9a-fA-F-]{36}$/.test(appliedFilters.assignedTo)) {
            filterPayload.assignedTo = appliedFilters.assignedTo
          } else {
            // Wait until User Mapping logic resolves the Name to a UUID
            return;
          }
        }
        if (appliedFilters?.receivedOn) filterPayload.receivedOn = appliedFilters.receivedOn

        const offset = (page - 1) * PAGE_SIZE

        const { leads: grpcLeads, total } = await leadClient.getAllLeads({
          organization,
          offset,
          limit: PAGE_SIZE,
          filters: Object.keys(filterPayload).length > 0 ? filterPayload : undefined,
        })

        // Transform gRPC response to match existing Lead type
        const transformedLeads: Lead[] = grpcLeads.map((lead: GrpcLead) => ({
          lead_id: lead.lead_id,
          stage: lead.stage,
          status: lead.status,
          profile_id: lead.profile_id,
          name: lead.name,
          phone: lead.phone,
          campaign: lead.campaign,
          source: lead.source,
          sub_source: lead.sub_source,
          received: lead.received,
          exe_user_name: lead.exe_user_name || '',
        }))
        setLeads(transformedLeads)
        setTotalLeads(total)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leads')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [organization, appliedFilters, page])

  function handleChange<K extends keyof Filters>(key: K, value: string) {
    setFilters((s) => ({ ...s, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setAppliedFilters(filters)
  }

  function handleReset() {
    const empty: Filters = { name: "", company: "", status: "all", source: "", stage: "", assignedTo: "all", receivedOn: "" }
    setFilters(empty)
    setPage(1)
    setAppliedFilters(empty)
  }

  const totalPages = Math.max(1, Math.ceil(totalLeads / PAGE_SIZE))


  if (loading) {
    return <LoaderScreen />
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-3 pt-2">
        <div className="text-red-500">Error loading leads: {error}</div>
      </div>
    )
  }
  return (
    <div className="flex flex-1 flex-col gap-4 p-3 pt-2">
      <div className="rounded-xl bg-muted/50 dark:bg-muted/50 py-4 px-3">
        <form onSubmit={handleSubmit} className="grid gap-3 grid-cols-4">
          {/* Name */}
          <div className="col-span-1">
            <Label htmlFor="filter-name" className="text-s mb-1 ms-1">
              Name
            </Label>
            <Input
              id="filter-name"
              className="bg-background dark:bg-background"
              value={filters.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Search by name..."
            />
          </div>

          {/* Source */}
          <div className="col-span-1">
            <Label htmlFor="filter-source" className="text-s mb-1 ms-1">
              Source
            </Label>
            <Input
              id="filter-source"
              className="bg-background dark:bg-background"
              value={filters.source}
              onChange={(e) => handleChange("source", e.target.value)}
              placeholder="e.g. Facebook, Google"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor="filter-company" className="text-s mb-1 ms-1">
              Campaign
            </Label>
            <Input
              id="filter-company"
              className="bg-background dark:bg-background"
              value={filters.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Campaign name"
            />
          </div>

          {/* Assigned To */}
          <div className="col-span-1">
            <Label htmlFor="filter-assigned" className="text-s mb-1 ms-1" title="Select a user to filter leads assigned to them">
              Assigned To
            </Label>
            <Popover open={assignedOpen} onOpenChange={setAssignedOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={assignedOpen} className="w-full justify-between font-normal dark:bg-background hover:dark:bg-background">
                  <span className="truncate">
                    {filters.assignedTo === "all" ? "All Users" : users.find(u => u._id === filters.assignedTo)?.name || "All Users"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandInput placeholder="Search user..." />
                  <CommandList>
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => { handleChange("assignedTo", "all"); setAssignedOpen(false) }}>
                        <Check className={cn("mr-2 h-4 w-4", filters.assignedTo === "all" ? "opacity-100" : "opacity-0")} />
                        All Users
                      </CommandItem>
                      {users.map(u => (
                        <CommandItem key={u._id} value={u.name} onSelect={() => { handleChange("assignedTo", u._id); setAssignedOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", filters.assignedTo === u._id ? "opacity-100" : "opacity-0")} />
                          {u.name || "Unknown"} ({u.role})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Received On */}
          <div className="col-span-1">
            <Label htmlFor="filter-received" className="text-s mb-1 ms-1" title="Filter leads received on this date">
              Received On
            </Label>
            <DatePicker
              date={filters.receivedOn ? new Date(filters.receivedOn) : undefined}
              setDate={(date) => handleChange("receivedOn", date ? format(date, "yyyy-MM-dd") : "")}
              className="w-full bg-background dark:bg-background hover:dark:bg-background text-black dark:text-white"
            />
          </div>

          {/* Status */}
          <div className="col-span-1">
            <Label htmlFor="filter-status" className="text-s mb-1 ms-1">
              Status
            </Label>
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={statusOpen} className="w-full justify-between font-normal dark:bg-background hover:dark:bg-background">
                  <span className="truncate">
                    {filters.status === "all" ? "All" : filters.status}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search status..." />
                  <CommandList>
                    <CommandEmpty>No status found.</CommandEmpty>
                    <CommandGroup>
                      {["all", "No Activity", "Hot", "Warm", "Cold"].map((s) => (
                        <CommandItem key={s} value={s} onSelect={() => { handleChange("status", s); setStatusOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", filters.status === s ? "opacity-100" : "opacity-0")} />
                          {s === "all" ? "All" : s}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Stage */}
          <div className="col-span-1">
            <Label htmlFor="filter-stage" className="text-s mb-1 ms-1">
              Stage
            </Label>
            <Popover open={stageOpen} onOpenChange={setStageOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={stageOpen} className="w-full justify-between font-normal dark:bg-background hover:dark:bg-background">
                  <span className="truncate">
                    {!filters.stage ? "Select stage" : filters.stage}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0">
                <Command>
                  <CommandInput placeholder="Search stage..." />
                  <CommandList>
                    <CommandEmpty>No stage found.</CommandEmpty>
                    <CommandGroup>
                      {stages.map((stage) => (
                        <CommandItem key={stage.id} value={stage.name} onSelect={() => { handleChange("stage", stage.name === filters.stage ? "" : stage.name); setStageOpen(false) }}>
                          <Check className={cn("mr-2 h-4", filters.stage === stage.name ? "opacity-100" : "opacity-0")} />
                          <div className="flex items-center gap-2 w-full">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                            <span>{stage.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="col-span-1 flex justify-center items-center gap-2 w-full mt-2 ">
            <Button variant="destructive" className="mt-2 w-[45%]" size="sm" type="button" onClick={handleReset} aria-label="Reset Filters">
              Reset
            </Button>
            <Button size="sm" className="mt-2 w-[45%] active:bg-primary" type="submit" aria-label="Apply Filters">
              Apply
            </Button>
          </div>

        </form>
      </div>
      <div>
        <DataTable
          data={leads}
          columns={columns}
          initialPageSize={PAGE_SIZE}
          hidePagination
        />

        {/* Server-side Pagination Controls */}
        <div className="flex items-center justify-between px-2 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {leads.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalLeads)} of {totalLeads} leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
