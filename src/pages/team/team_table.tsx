import * as React from "react"
import axios from "axios"
import { API } from "@/config/api"
import {
    type ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Users } from "lucide-react"
import { getCookie } from "@/utils/cookies"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
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

interface TeamData {
    _id: string
    name: string
    description: string
    members: string[]
    organization: string
    isActive: boolean
    createdAt?: string
}

interface TeamTableProps {
    initialPageSize?: number
    onRefresh?: () => void
}

export const getTeamColumns = (
    onDelete: (team: TeamData) => void
): ColumnDef<TeamData>[] => [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Team Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="text-muted-foreground max-w-[300px] truncate">
                    {row.getValue("description") || "—"}
                </div>
            ),
        },
        {
            id: "memberCount",
            header: "Members",
            accessorFn: (row) => row.members?.length || 0,
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{row.getValue("memberCount")}</span>
                </div>
            ),
        },
        {
            accessorKey: "createdAt",
            header: "Created",
            cell: ({ row }) => {
                const date = row.getValue("createdAt") as string
                return <div>{date ? new Date(date).toLocaleDateString() : "—"}</div>
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const team = row.original

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
                                onClick={() => navigator.clipboard.writeText(String(team._id))}
                            >
                                Copy Team ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => onDelete(team)}
                            >
                                Delete Team
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

export default function TeamTable({ initialPageSize = DEFAULT_PAGE_SIZE, onRefresh }: TeamTableProps) {
    const [data, setData] = React.useState<TeamData[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')
    const navigate = useNavigate()

    const fetchTeams = React.useCallback(async () => {
        try {
            const org = getCookie('organization')
            const token = getCookie('token')

            if (!org) {
                setError('Organization not found')
                setLoading(false)
                return
            }

            const response = await axios.get(
                `${API.TEAMS}?organization=${org}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )

            setData(response.data.data || [])
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch teams')
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchTeams()
    }, [fetchTeams])

    const handleDelete = async (team: TeamData) => {
        if (!confirm(`Are you sure you want to delete team "${team.name}"?`)) return
        try {
            const token = getCookie('token')
            await axios.delete(API.getTeam(team._id), {
                headers: { Authorization: `Bearer ${token}` },
            })
            fetchTeams()
            onRefresh?.()
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete team')
        }
    }

    const columns = React.useMemo(() => getTeamColumns(handleDelete), [])

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return <div className="w-full text-center py-10 text-red-500">{error}</div>
    }

    return (
        <DataTable
            columns={columns}
            data={data}
            initialPageSize={initialPageSize}
            filterColumn="name"
            filterPlaceholder="Filter by team name..."
            onRowClick={(row: TeamData) => navigate(`/setting/teams/${row._id}`)}
        />
    )
}
