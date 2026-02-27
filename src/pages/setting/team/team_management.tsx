import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Users, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCookie, getPermissions } from "@/utils/cookies"
import { useNavigate } from "react-router-dom"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { API } from "@/config/api"
import { DataTable } from "@/components/ui/data-table"

// ─── Types ───────────────────────────────────────────────
interface TeamData {
    _id: string
    name: string
    description: string
    members: string[]
    organization: string
    isActive: boolean
    createdAt?: string
}

// ─── Column factory (needs onDelete callback) ────────────
const getColumns = (
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

// ─── Page Component ──────────────────────────────────────
export default function TeamManagement() {
    const { setBreadcrumbs } = useBreadcrumb()
    const navigate = useNavigate()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Teams" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Team Management</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    // ── Form state ──
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({ name: "", description: "" })

    // ── Table data state ──
    const [teams, setTeams] = useState<TeamData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Fetch teams
    const fetchTeams = useCallback(async () => {
        try {
            const org = getCookie("organization")
            const token = getCookie("token")
            if (!org) {
                setError("Organization not found")
                setLoading(false)
                return
            }
            const response = await axios.get(
                `${API.TEAMS}?organization=${org}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setTeams(response.data.data || [])
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch teams")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTeams()
    }, [fetchTeams])

    // ── Delete handler ──
    const handleDelete = async (team: TeamData) => {
        if (!confirm(`Are you sure you want to delete team "${team.name}"?`)) return
        try {
            const token = getCookie("token")
            await axios.delete(API.getTeam(team._id), {
                headers: { Authorization: `Bearer ${token}` },
            })
            fetchTeams()
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete team")
        }
    }

    const columns = useMemo(() => getColumns(handleDelete), [])

    // ── Form handlers ──
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = getCookie("token")
            await axios.post(
                API.TEAMS,
                { name: formData.name, description: formData.description },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setOpen(false)
            setFormData({ name: "", description: "" })
            fetchTeams()
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                alert(`Error: ${error.response.data.message || "Failed to create team"}`)
            }
        }
    }

    // ── Loading / Error ──
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

    const userPermissions = getPermissions()
    const canCreateTeam = userPermissions.includes("create_team")
    // ── Render ──
    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
                {canCreateTeam && (
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button>Create Team</Button>
                        </SheetTrigger>
                        <SheetContent className="w-xl px-5">
                            <SheetHeader>
                                <SheetTitle>Create New Team</SheetTitle>
                                <SheetDescription>
                                    Enter the details below to create a new team.
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Team Name</Label>
                                    <Input id="name" placeholder="e.g. Sales Team" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input id="description" placeholder="Optional team description" value={formData.description} onChange={handleInputChange} />
                                </div>
                                <Button type="submit" className="mt-4">Create Team</Button>
                            </form>
                        </SheetContent>
                    </Sheet>
                )}
            </div>

            <DataTable
                columns={columns}
                data={teams}
                initialPageSize={15}
                filterColumn="name"
                filterPlaceholder="Filter by team name..."
                onRowClick={(row: TeamData) => navigate(`/setting/teams/${row._id}`)}
            />
        </div>
    )
}
