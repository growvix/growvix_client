import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { DataTable } from "@/components/ui/data-table"
import LoaderScreen from "@/components/ui/loader-screen"
import { getCookie } from "@/utils/cookies"
import axios from "axios"
import { API } from "@/config/api"
import { leadClient } from "@/grpc/leadClient"
import type { Lead as GrpcLead } from "@/grpc/types"
<<<<<<< HEAD
import { useNavigate, useLocation } from "react-router-dom"
=======
import type { Stage } from "@/types"
import axios from "axios"
import { API_URL } from "@/config/api"
import { useNavigate } from "react-router-dom"
>>>>>>> 150dd39 (grpc)
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type Lead = {
  lead_id: string
  profile_id: number
  name: string
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
    cell: ({ row }) => <div className="capitalize">{row.getValue("name") || "-"}</div>,
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => <div className="capitalize">{row.getValue("stage") || "-"}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <div className="capitalize">{row.getValue("status") || "-"}</div>,
  },
  {
    accessorKey: "campaign",
    header: "Campaign",
    cell: ({ row }) => <div className="capitalize">{row.getValue("campaign") || "-"}</div>,
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => <div className="capitalize">{row.getValue("source") || "-"}</div>,
  },
  {
    accessorKey: "sub_source",
    header: "Sub Source",
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
    cell: ({ row }) => <div>{formatDate(row.getValue("received"))}</div>,
  },
  {
    accessorKey: "exe_user_name",
    header: "Assigned To",
    cell: ({ row }) => {
      const name = row.getValue("exe_user_name") as string
      return name ? (
        <div className="capitalize font-medium text-primary">{name}</div>
      ) : (
        <div className="text-muted-foreground">—</div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const lead = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(String(lead.profile_id))
              }}
            >
              Copy Lead ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Lead Details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

  useEffect(() => {
    setBreadcrumbs([
      { label: "All Leads" }
    ])
  }, [setBreadcrumbs])

<<<<<<< HEAD
  const [filters, setFilters] = useState<Filters>(presetFilters || {
=======
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

  const [filters, setFilters] = useState<Filters>({
>>>>>>> 150dd39 (grpc)
    name: "",
    company: "",
    status: "all",
    source: "",
<<<<<<< HEAD
    assignedTo: "all",
    receivedOn: "",
=======
    stage: "",
>>>>>>> 150dd39 (grpc)
  })

  // To support applying the default filters on mount, initialize appliedFilters natively
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(presetFilters || {
    name: "",
    company: "",
    status: "all",
    source: "",
    assignedTo: "all",
    receivedOn: "",
  })

  const [users, setUsers] = useState<{ _id: string, name: string, role?: string }[]>([])

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
<<<<<<< HEAD
        if (appliedFilters?.status && appliedFilters.status !== "all") filterPayload.status = appliedFilters.status
        if (appliedFilters?.assignedTo && appliedFilters.assignedTo !== "all") {
          if (/^[0-9a-fA-F-]{36}$/.test(appliedFilters.assignedTo)) {
            filterPayload.assignedTo = appliedFilters.assignedTo
          } else {
            // Wait until User Mapping logic resolves the Name to a UUID
            return;
          }
        }
        if (appliedFilters?.receivedOn) filterPayload.receivedOn = appliedFilters.receivedOn
=======
        if (appliedFilters?.status) filterPayload.status = appliedFilters.status
        if (appliedFilters?.stage) filterPayload.stage = appliedFilters.stage
>>>>>>> 150dd39 (grpc)

        const grpcLeads = await leadClient.getAllLeads({
          organization,
          filters: Object.keys(filterPayload).length > 0 ? filterPayload : undefined,
        })

        // Transform gRPC response to match existing Lead type
        const transformedLeads: Lead[] = grpcLeads.map((lead: GrpcLead) => ({
          lead_id: lead.lead_id,
          stage: lead.stage,
          status: lead.status,
          profile_id: lead.profile_id,
          name: lead.name,
          campaign: lead.campaign,
          source: lead.source,
          sub_source: lead.sub_source,
          received: lead.received,
          exe_user_name: lead.exe_user_name || '',
        }))
        console.log(transformedLeads);

        setLeads(transformedLeads)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leads')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [organization, appliedFilters])

  function handleChange<K extends keyof Filters>(key: K, value: string) {
    setFilters((s) => ({ ...s, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log("Applying filters:", filters)
    setAppliedFilters(filters)
  }

  function handleReset() {
<<<<<<< HEAD
    const empty = { name: "", company: "", status: "all", source: "", assignedTo: "all", receivedOn: "" }
=======
    const empty: Filters = { name: "", company: "", status: "", source: "", stage: "" }
>>>>>>> 150dd39 (grpc)
    setFilters(empty)
    setAppliedFilters(empty)
  }


  if (loading) {
    return <LoaderScreen />
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-3 pt-2">
        <div className="text-red-500">Error loa
          ding leads: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 pt-2">
      <div className="rounded-xl bg-muted/50 dark:bg-muted/50 py-4 px-3">
<<<<<<< HEAD
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-5 items-end">
=======
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-11 items-end">
>>>>>>> 150dd39 (grpc)
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
            <Select value={filters.assignedTo} onValueChange={(value) => handleChange("assignedTo", value)} aria-label="Assigned To">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
<<<<<<< HEAD
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u._id} value={u._id}>{u.name || "Unknown"} ({u.role})</SelectItem>
                  ))}
=======
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
>>>>>>> 150dd39 (grpc)
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

<<<<<<< HEAD
          {/* Received On */}
          <div className="col-span-1">
            <Label htmlFor="filter-received" className="text-s mb-1 ms-1" title="Filter leads received on this date">
              Received On
            </Label>
            <Input
              id="filter-received"
              type="date"
              className="bg-background dark:bg-background"
              value={filters.receivedOn}
              onChange={(e) => handleChange("receivedOn", e.target.value)}
              aria-label="Received On Date"
            />
          </div>

          <div className="col-span-1 md:col-span-5 flex justify-end gap-2 w-full mt-2">
            <Button variant="destructive" className="w-24" size="sm" type="button" onClick={handleReset} aria-label="Reset Filters">
=======
          {/* Stage */}
          <div className="lg:col-span-2">
            <Label htmlFor="filter-stage" className="text-s mb-1 ms-1">
              Stage
            </Label>

            <Select value={filters.stage} onValueChange={(value) => handleChange("stage", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Stage</SelectLabel>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span>{stage.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-1 flex justify-around mt-2">
            <Button variant="destructive" size="sm" type="button" onClick={handleReset}>
>>>>>>> 150dd39 (grpc)
              Reset
            </Button>
            <Button size="sm" className="w-24 active:bg-primary" type="submit" aria-label="Apply Filters">
              Apply
            </Button>
          </div>
          <div className="col-span-1 md:col-span-5 flex justify-end items-center text-xs text-muted-foreground mt-3 px-1 border-t pt-2 dark:border-slate-700">
            <a href="mailto:support@crm.com" className="hover:underline text-primary" aria-label="Report issue with filters">Feedback / Report Issue</a>
          </div>
        </form>
      </div>
      <div>
        <DataTable
          data={leads}
          columns={columns}
          initialPageSize={15}

        />
      </div>
    </div>
  )
}
