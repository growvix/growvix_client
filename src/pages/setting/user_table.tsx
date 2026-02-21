import * as React from "react"
import axios from "axios"
import { API } from "@/config/api"
import {
  type ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { getCookie } from "@/utils/cookies"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DEFAULT_PAGE_SIZE } from "@/constants"
import { DataTable } from "@/components/ui/data-table"

interface UserData {
  _id: string
  profile_id: number
  globalUserId: string
  profile: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  role: string
  isActive: boolean
  createdAt?: string
  teams?: { teamId: string; teamName: string }[]
}

interface TableDataProps {
  initialPageSize?: number
}

export const columns: ColumnDef<UserData>[] = [
  {
    accessorKey: "profile_id",
    header: "ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("profile_id")}</div>,
  },
  {
    id: "name",
    header: "Name",
    accessorFn: (row) => `${row.profile.firstName} ${row.profile.lastName}`,
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },
  {
    id: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown />
        </Button>
      )
    },
    accessorFn: (row) => row.profile.email,
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    id: "phone",
    header: "Phone",
    accessorFn: (row) => row.profile.phone || "-",
    cell: ({ row }) => <div>{row.getValue("phone")}</div>,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("role")}</div>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <div className={row.getValue("isActive") ? "text-green-600" : "text-red-600"}>
        {row.getValue("isActive") ? "Active" : "Inactive"}
      </div>
    ),
  },
  {
    id: "teams",
    header: "Teams",
    accessorFn: (row) => (row.teams || []).map(t => t.teamName).join(", "),
    cell: ({ row }) => {
      const teams = row.original.teams || []
      if (teams.length === 0) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex gap-1 flex-wrap">
          {teams.map((t) => (
            <Badge key={String(t.teamId)} variant="secondary" className="text-xs">
              {t.teamName}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original

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
              onClick={() => navigator.clipboard.writeText(String(user._id))}
            >
              Copy User ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit User</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function UserTable({ initialPageSize = DEFAULT_PAGE_SIZE }: TableDataProps) {
  const [data, setData] = React.useState<UserData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  // Fetch users from API on mount
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const org = getCookie('organization')
        const token = getCookie('token')

        if (!org) {
          setError('Organization not found in cookies')
          setLoading(false)
          return
        }

        const response = await axios.get(
          `${API.USERS}?organization=${org}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        console.log(response.data);

        setData(response.data.data?.users || [])
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full text-center py-10 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      initialPageSize={initialPageSize}
      filterColumn="email"
      filterPlaceholder="Filter by email..."
    />
  )
}
