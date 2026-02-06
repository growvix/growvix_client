import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { DataTable } from "@/components/ui/data-table"
import LoaderScreen from "@/components/ui/loader-screen"
import { getCookie } from "@/utils/cookies"
import { leadClient } from "@/grpc/leadClient"
import type { Lead as GrpcLead } from "@/grpc/types"
import { useNavigate } from "react-router-dom"
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
  profile_id: number
  name: string
  campaign: string
  source: string
  sub_source: string
  received: string
}

type Filters = {
  name: string
  company: string
  status: string
  source: string
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

export const columns: ColumnDef<Lead>[] = [
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
    cell: ({ row }) => <div className="font-medium">{row.getValue("profile_id")}</div>,
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
  const { setBreadcrumbs } = useBreadcrumb()
  const organization = getCookie("organization") || ""
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    setBreadcrumbs([
      { label: "All Leads" }
    ])
  }, [setBreadcrumbs])

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
        const grpcLeads = await leadClient.getAllLeads({ organization })

        // Transform gRPC response to match existing Lead type
        const transformedLeads: Lead[] = grpcLeads.map((lead: GrpcLead) => ({
          profile_id: lead.profileId,
          name: lead.name,
          campaign: lead.campaign,
          source: lead.source,
          sub_source: lead.subSource,
          received: lead.received,
        }))

        setLeads(transformedLeads)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leads')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [organization])

  const [filters, setFilters] = useState<Filters>({
    name: "",
    company: "",
    status: "",
    source: "",
  })

  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null)

  function handleChange<K extends keyof Filters>(key: K, value: string) {
    setFilters((s) => ({ ...s, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log("Applying filters:", filters)
    setAppliedFilters(filters)
  }

  function handleReset() {
    const empty = { name: "", company: "", status: "", source: "" }
    setFilters(empty)
    setAppliedFilters(null)
  }

  const handleRowClick = (lead: Lead) => {
    navigate(`/lead_detail/${lead.profile_id}`)
  }

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
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-9 items-end">
          {/* Name */}
          <div className="lg:col-span-2">
            <Label htmlFor="filter-name" className="text-s mb-1 ms-1">
              Name
            </Label>
            <Input
              id="filter-name"
              value={filters.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Search by name..."
            />
          </div>

          {/* Source */}
          <div className="lg:col-span-2">
            <Label htmlFor="filter-source" className="text-s mb-1 ms-1">
              Source
            </Label>
            <Input
              id="filter-source"
              value={filters.source}
              onChange={(e) => handleChange("source", e.target.value)}
              placeholder="e.g. Facebook, Google"
            />
          </div>

          {/* Campaign */}
          <div className="lg:col-span-2">
            <Label htmlFor="filter-company" className="text-s mb-1 ms-1">
              Campaign
            </Label>
            <Input
              id="filter-company"
              value={filters.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Campaign name"
            />
          </div>

          {/* Status */}
          <div className="lg:col-span-2">
            <Label htmlFor="filter-status" className="text-s mb-1 ms-1">
              Status
            </Label>

            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-1 flex justify-around mt-2">
            <Button variant="destructive" size="sm" type="button" onClick={handleReset}>
              Reset
            </Button>
            <Button size="sm" className="active:bg-primary" type="submit">
              Apply
            </Button>
          </div>
        </form>
      </div>
      <div>
        <DataTable
          data={leads}
          columns={columns}
          initialPageSize={15}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  )
}
