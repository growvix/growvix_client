import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { getCookie } from "@/utils/cookies"
import { API } from "@/config/api"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react"

interface MemberDetail {
    _id: string
    profile_id: number
    profile: {
        firstName: string
        lastName: string
        email: string
        phone?: string
    }
    role: string
    teams?: { teamId: string; teamName: string }[]
}

interface TeamDetail {
    _id: string
    name: string
    description: string
    organization: string
    members: string[]
    memberDetails: MemberDetail[]
    createdAt: string
}

interface AvailableUser {
    _id: string
    profile: {
        firstName: string
        lastName: string
        email: string
    }
    teams?: { teamId: string; teamName: string }[]
}

export default function TeamDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()

    const [team, setTeam] = useState<TeamDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Add members dialog
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [usersLoading, setUsersLoading] = useState(false)

    // Warning dialog for multi-team assignment
    const [warningDialogOpen, setWarningDialogOpen] = useState(false)
    const [warnings, setWarnings] = useState<{ userId: string; userName: string; existingTeams: string[] }[]>([])
    const [pendingAddition, setPendingAddition] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Teams", href: "/setting/teams" },
            { label: team?.name || "Team Detail" },
        ])
    }, [setBreadcrumbs, team?.name])

    const fetchTeam = useCallback(async () => {
        try {
            const token = getCookie("token")
            const org = getCookie("organization")
            const response = await axios.get(
                `${API.getTeam(id!)}?organization=${org}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setTeam(response.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch team")
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchTeam()
    }, [fetchTeam])

    const fetchAvailableUsers = async () => {
        setUsersLoading(true)
        try {
            const token = getCookie("token")
            const org = getCookie("organization")
            const response = await axios.get(
                `${API.USERS}?organization=${org}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const allUsers = response.data.data?.users || []
            // Filter out users already in this team
            const memberIds = new Set(team?.members?.map(m => String(m)) || [])
            const available = allUsers.filter((u: AvailableUser) => !memberIds.has(String(u._id)))
            setAvailableUsers(available)
        } catch (err: any) {
            console.error("Failed to fetch users:", err)
        } finally {
            setUsersLoading(false)
        }
    }

    const handleOpenAddDialog = () => {
        setSelectedUserIds([])
        fetchAvailableUsers()
        setAddDialogOpen(true)
    }

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleAddMembers = async (force = false) => {
        try {
            const token = getCookie("token")

            // Check if any selected users already belong to other teams
            if (!force) {
                const usersWithTeams = availableUsers.filter(
                    u => selectedUserIds.includes(String(u._id)) && u.teams && u.teams.length > 0
                )
                if (usersWithTeams.length > 0) {
                    setWarnings(
                        usersWithTeams.map(u => ({
                            userId: String(u._id),
                            userName: `${u.profile.firstName} ${u.profile.lastName}`,
                            existingTeams: (u.teams || []).map(t => t.teamName),
                        }))
                    )
                    setWarningDialogOpen(true)
                    return
                }
            }

            setPendingAddition(true)
            await axios.post(
                API.getTeamMembers(id!),
                { userIds: selectedUserIds },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            setAddDialogOpen(false)
            setWarningDialogOpen(false)
            setSelectedUserIds([])
            fetchTeam()
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to add members")
        } finally {
            setPendingAddition(false)
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return
        try {
            const token = getCookie("token")
            await axios.delete(API.removeTeamMember(id!, userId), {
                headers: { Authorization: `Bearer ${token}` },
            })
            fetchTeam()
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to remove member")
        }
    }

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error || !team) {
        return <div className="w-full text-center py-20 text-red-500">{error || "Team not found"}</div>
    }

    return (
        <div className="flex flex-1 flex-col gap-6 px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mt-2">
                <Button variant="ghost" onClick={() => navigate("/setting/teams")}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{team.name}</h2>

                </div>
            </div>

            {/* Members Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        Members ({team.memberDetails?.length || 0})
                    </h3>
                    <Button onClick={handleOpenAddDialog} size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Members
                    </Button>
                </div>

                {(!team.memberDetails || team.memberDetails.length === 0) ? (
                    <div className="text-center py-10 text-muted-foreground border rounded-lg">
                        No members in this team yet. Click "Add Members" to get started.
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Other Teams</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.memberDetails.map((member) => {
                                    const otherTeams = (member.teams || []).filter(
                                        t => String(t.teamId) !== String(team._id)
                                    )
                                    return (
                                        <tr key={String(member._id)} className="border-t hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium capitalize">
                                                {member.profile.firstName} {member.profile.lastName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {member.profile.email}
                                            </td>
                                            <td className="px-4 py-3 text-sm capitalize">{member.role}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {otherTeams.length > 0 ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {otherTeams.map((t) => (
                                                            <Badge key={String(t.teamId)} variant="secondary" className="text-xs">
                                                                {t.teamName}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemoveMember(String(member._id))}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Members Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Add Members to {team.name}</DialogTitle>
                        <DialogDescription>
                            Select users to add to this team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto space-y-2 py-2">
                        {usersLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        ) : availableUsers.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">
                                All users are already in this team.
                            </p>
                        ) : (
                            availableUsers.map((user) => {
                                const hasOtherTeams = user.teams && user.teams.length > 0
                                return (
                                    <div
                                        key={String(user._id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedUserIds.includes(String(user._id))
                                            ? "border-primary bg-primary/5"
                                            : "hover:bg-muted/50"
                                            }`}
                                        onClick={() => toggleUserSelection(String(user._id))}
                                    >
                                        <Checkbox
                                            checked={selectedUserIds.includes(String(user._id))}
                                            onCheckedChange={() => toggleUserSelection(String(user._id))}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium capitalize">
                                                {user.profile.firstName} {user.profile.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{user.profile.email}</p>
                                        </div>
                                        {hasOtherTeams && (
                                            <div className="flex items-center gap-1">
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                <span className="text-xs text-amber-600">
                                                    In {user.teams!.length} team{user.teams!.length > 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleAddMembers(false)}
                            disabled={selectedUserIds.length === 0 || pendingAddition}
                        >
                            Add {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ""}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Multi-team Warning Dialog */}
            <AlertDialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Multiple Team Assignment Warning
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                <p className="mb-3">The following users already belong to other teams:</p>
                                <div className="space-y-2">
                                    {warnings.map((w) => (
                                        <div key={w.userId} className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-2">
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{w.userName}</p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                                Already in: {w.existingTeams.join(", ")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-3 text-sm">Do you still want to add them to <strong>{team.name}</strong>?</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleAddMembers(true)}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            Add Anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
