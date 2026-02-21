import { useState, useEffect } from "react"
import axios from "axios"
import { getCookie } from "@/utils/cookies"
import { API } from "@/config/api"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    type ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown, AlertTriangle } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface TeamRef {
    teamId: string
    teamName: string
}

interface UserWithTeams {
    _id: string
    profile_id: number
    profile: {
        firstName: string
        lastName: string
        email: string
        phone?: string
    }
    role: string
    isActive: boolean
    teams?: TeamRef[]
}

interface TeamOption {
    _id: string
    name: string
}

export default function AllUsersTeams() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [users, setUsers] = useState<UserWithTeams[]>([])
    const [teams, setTeams] = useState<TeamOption[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Assign team dialog
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserWithTeams | null>(null)
    const [selectedTeamId, setSelectedTeamId] = useState("")

    // Warning dialog
    const [warningDialogOpen, setWarningDialogOpen] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Teams", href: "/teams" },
            { label: "All Users" },
        ])
    }, [setBreadcrumbs])

    const fetchData = async () => {
        try {
            const token = getCookie("token")
            const org = getCookie("organization")

            const [usersRes, teamsRes] = await Promise.all([
                axios.get(`${API.USERS}?organization=${org}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API.TEAMS}?organization=${org}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ])

            setUsers(usersRes.data.data?.users || [])
            setTeams(teamsRes.data.data || [])
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenAssign = (user: UserWithTeams) => {
        setSelectedUser(user)
        setSelectedTeamId("")
        setAssignDialogOpen(true)
    }

    const handleAssignTeam = async (force = false) => {
        if (!selectedUser || !selectedTeamId) return

        // If user already has teams and not forcing, show warning
        if (!force && selectedUser.teams && selectedUser.teams.length > 0) {
            setWarningDialogOpen(true)
            return
        }

        try {
            const token = getCookie("token")
            await axios.post(
                API.getTeamMembers(selectedTeamId),
                { userIds: [String(selectedUser._id)] },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            setAssignDialogOpen(false)
            setWarningDialogOpen(false)
            setSelectedUser(null)
            setSelectedTeamId("")
            fetchData()
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to assign team")
        }
    }

    const columns: ColumnDef<UserWithTeams>[] = [
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
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            accessorFn: (row) => row.profile.email,
            cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => <div className="capitalize">{row.getValue("role")}</div>,
        },
        {
            id: "teams",
            header: "Teams",
            accessorFn: (row) => (row.teams || []).map(t => t.teamName).join(", "),
            cell: ({ row }) => {
                const userTeams = row.original.teams || []
                if (userTeams.length === 0) {
                    return <span className="text-muted-foreground">—</span>
                }
                return (
                    <div className="flex gap-1 flex-wrap">
                        {userTeams.map((t) => (
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
            header: "",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleOpenAssign(user)
                        }}
                    >
                        Assign Team
                    </Button>
                )
            },
        },
    ]

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return <div className="w-full text-center py-20 text-red-500">{error}</div>
    }

    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            <h2 className="text-2xl font-bold tracking-tight">All Users — Team Assignments</h2>

            <DataTable
                columns={columns}
                data={users}
                initialPageSize={15}
                filterColumn="email"
                filterPlaceholder="Filter by email..."
            />

            {/* Assign Team Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Assign Team to {selectedUser ? `${selectedUser.profile.firstName} ${selectedUser.profile.lastName}` : ""}
                        </DialogTitle>
                        <DialogDescription>
                            Select a team to assign this user to.
                            {selectedUser && selectedUser.teams && selectedUser.teams.length > 0 && (
                                <span className="block mt-2 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5 inline" />
                                    This user is already in {selectedUser.teams.length} team{selectedUser.teams.length > 1 ? "s" : ""}: {selectedUser.teams.map(t => t.teamName).join(", ")}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a team" />
                            </SelectTrigger>
                            <SelectContent>
                                {teams
                                    .filter(t => {
                                        // Exclude teams user is already in
                                        const userTeamIds = (selectedUser?.teams || []).map(ut => String(ut.teamId))
                                        return !userTeamIds.includes(String(t._id))
                                    })
                                    .map(t => (
                                        <SelectItem key={String(t._id)} value={String(t._id)}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleAssignTeam(false)} disabled={!selectedTeamId}>
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Multi-team Warning */}
            <AlertDialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Multiple Team Assignment
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                <p>
                                    <strong className="capitalize">
                                        {selectedUser?.profile.firstName} {selectedUser?.profile.lastName}
                                    </strong>{" "}
                                    is already assigned to:
                                </p>
                                <div className="flex gap-1 flex-wrap mt-2 mb-3">
                                    {(selectedUser?.teams || []).map(t => (
                                        <Badge key={String(t.teamId)} variant="secondary">
                                            {t.teamName}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-sm">
                                    Adding them to another team means they will be in multiple teams. Continue?
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleAssignTeam(true)}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            Assign Anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
