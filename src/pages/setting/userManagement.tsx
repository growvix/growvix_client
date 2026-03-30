import { useState, useEffect, useMemo, useCallback } from "react"
import axios from "axios"
import { API, API_URL } from "@/config/api"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, X, ChevronsUpDown, Check, Pencil, Trash2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCookie, getPermissions } from "@/utils/cookies"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { DataTable } from "@/components/ui/data-table"
import { Checkbox } from "@/components/ui/checkbox"
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
import { toast } from "sonner"

const PERMISSION_OPTIONS = [
    { key: "create_project", label: "Create Project" },
    { key: "add_users", label: "Add Users" },
    { key: "create_team", label: "Create Team" },
    { key: "assign_team_members", label: "Assign Team Members" },
    { key: "view_lead_phone", label: "View Lead Phone (Unmasked)" },
    { key: "add_lead", label: "Add New Lead" },
    { key: "view_inventory", label: "View Project Inventory" },
    { key: "edit_inventory", label: "Edit Project Inventory" },
    { key: "view_users", label: "View Users" },
    { key: "edit_users", label: "Edit All Users" },
    { key: "delete_users", label: "Delete Users" },
] as const;

// ─── Types ──────────────────────────────────────────────
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
    department?: string
    isActive: boolean
    createdAt?: string
    teams?: { teamId: string; teamName: string }[]
    permissions?: string[]
}

// ─── Page Component ──────────────────────────────────────
export default function UserManagement() {
    const org = getCookie("organization")
    const { setBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "User Management" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">User Management</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    const userPermissions = getPermissions()
    const canViewUsers = userPermissions.includes("view_users")
    const canAddUsers = userPermissions.includes("add_users")

    // ── Add-user form state ──
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "",
        department: "",
        permissions: [] as string[],
    })

    // ── Table data state ──
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // ── Edit-user state ──
    const [editOpen, setEditOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<UserData | null>(null)
    const [editFormData, setEditFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        permissions: [] as string[],
    })
    const [editLoading, setEditLoading] = useState(false)

    // ── Delete-user state ──
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletingUser, setDeletingUser] = useState<UserData | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // ── Refresh helper ──
    const refreshUsers = useCallback(async () => {
        try {
            const token = getCookie("token")
            const response = await axios.get(
                `${API.USERS}?organization=${org}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setUsers(response.data.data?.users || [])
        } catch (err: any) {
            console.error("Failed to refresh users:", err)
        }
    }, [org])

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            if (!canViewUsers) {
                setLoading(false)
                return
            }
            try {
                const token = getCookie("token")
                if (!org) {
                    setError("Organization not found in cookies")
                    setLoading(false)
                    return
                }
                const response = await axios.get(
                    `${API.USERS}?organization=${org}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                setUsers(response.data.data?.users || [])
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to fetch users")
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [org, canViewUsers])

    // ── Edit handlers ──
    const handleEditUser = useCallback((user: UserData) => {
        const permissions = getPermissions()
        if (!permissions.includes("edit_users")) {
            toast.warning("You do not have permission to edit users.")
            return
        }

        setEditingUser(user)
        setEditFormData({
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            email: user.profile.email,
            phone: user.profile.phone || "",
            role: user.role,
            department: user.department || "",
            permissions: user.permissions || [],
        })
        setEditOpen(true)
    }, [])

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        const key = id === "edit-first-name" ? "firstName"
            : id === "edit-last-name" ? "lastName"
                : id === "edit-email" ? "email"
                    : id === "edit-phone" ? "phone"
                        : id
        setEditFormData((prev) => ({ ...prev, [key]: value }))
    }

    const handleEditRoleChange = (value: string) => {
        setEditFormData((prev) => ({ ...prev, role: value }))
    }

    const toggleEditPermission = (key: string) => {
        setEditFormData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(key)
                ? prev.permissions.filter((p) => p !== key)
                : [...prev.permissions, key],
        }))
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return
        setEditLoading(true)

        try {
            const token = getCookie("token")
            const payload = {
                profile: {
                    firstName: editFormData.firstName,
                    lastName: editFormData.lastName,
                    email: editFormData.email,
                    phone: editFormData.phone,
                },
                role: editFormData.role,
                department: editFormData.department,
                permissions: editFormData.permissions,
            }

            await axios.put(
                API.updateUser(editingUser._id),
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            )

            toast.success("User updated successfully")
            setEditOpen(false)
            setEditingUser(null)
            await refreshUsers()
        } catch (err: any) {
            console.error("Error updating user:", err)
            toast.error(err.response?.data?.message || "Failed to update user")
        } finally {
            setEditLoading(false)
        }
    }

    // ── Delete handlers ──
    const handleDeleteUser = useCallback((user: UserData) => {
        const permissions = getPermissions()
        if (!permissions.includes("delete_users")) {
            toast.warning("You do not have permission to delete users.")
            return
        }

        setDeletingUser(user)
        setDeleteDialogOpen(true)
    }, [])

    const confirmDeleteUser = async () => {
        if (!deletingUser) return
        setDeleteLoading(true)

        try {
            const token = getCookie("token")
            await axios.delete(
                API.deleteUser(deletingUser._id),
                { headers: { Authorization: `Bearer ${token}` } }
            )

            toast.success(`User "${deletingUser.profile.firstName} ${deletingUser.profile.lastName}" has been deleted`)
            setDeleteDialogOpen(false)
            setDeletingUser(null)
            await refreshUsers()
        } catch (err: any) {
            console.error("Error deleting user:", err)
            toast.error(err.response?.data?.message || "Failed to delete user")
        } finally {
            setDeleteLoading(false)
        }
    }

    // ── Columns (inside component to access handlers) ──
    const columns: ColumnDef<UserData>[] = useMemo(() => [
        {
            accessorKey: "profile_id",
            header: "ID",
            meta: {
                label: "ID",
            },
            cell: ({ row }) => <div className="font-medium">{row.getValue("profile_id")}</div>,
        },
        {
            id: "name",
            header: "Name",
            meta: {
                label: "Name",
            },
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
                    <ArrowUpDown />
                </Button>
            ),
            accessorFn: (row) => row.profile.email,
            meta: {
                label: "Email",
            },
            cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
        },
        {
            id: "phone",
            header: "Phone",
            meta: {
                label: "Phone",
            },
            accessorFn: (row) => row.profile.phone || "-",
            cell: ({ row }) => <div>{row.getValue("phone")}</div>,
        },
        {
            accessorKey: "role",
            header: "Role",
            meta: {
                label: "Role",
            },
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("role")}</div>
            ),
        },
        {
            accessorKey: "department",
            header: "Department",
            meta: {
                label: "Department",
            },
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("department") || <span className="text-muted-foreground">—</span>}</div>
            ),
        },
        {
            accessorKey: "isActive",
            header: "Status",
            meta: {
                label: "Status",
            },
            cell: ({ row }) => (
                <div className={row.getValue("isActive") ? "text-green-600" : "text-red-600"}>
                    {row.getValue("isActive") ? "Active" : "Inactive"}
                </div>
            ),
        },
        {
            id: "teams",
            header: "Teams",
            meta: {
                label: "Teams",
            },
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
            meta: {
                label: "Actions",
            },
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
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteUser(user)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [handleEditUser, handleDeleteUser])

    // ── Filter state ──
    const [filters, setFilters] = useState({
        name: "",
        email: "",
        team: "all",
        role: "all",
        status: "all",
        department: "all"
    })
    const [appliedFilters, setAppliedFilters] = useState(filters)
    const [emailOpen, setEmailOpen] = useState(false)
    const [teamOpen, setTeamOpen] = useState(false)
    const [roleOpen, setRoleOpen] = useState(false)
    const [statusOpen, setStatusOpen] = useState(false)
    const [deptOpen, setDeptOpen] = useState(false)
    const [teams, setTeams] = useState<{ _id: string; name: string }[]>([])

    // Fetch teams for filter dropdown
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const token = getCookie("token")
                const response = await axios.get(
                    `${API.TEAMS}?organization=${org}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                setTeams(response.data.data || [])
            } catch {
                // silently fail — filter just won't have team options
            }
        }
        if (org) fetchTeams()
    }, [org])

    // Unique roles from user data
    const uniqueRoles = useMemo(() => {
        const roles = new Set(users.map((u) => u.role))
        return Array.from(roles).sort()
    }, [users])

    // Unique emails from user data
    const uniqueEmails = useMemo(() => {
        return users.map((u) => u.profile.email).sort()
    }, [users])

    // Filtered users
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            if (appliedFilters.name) {
                const fullName = `${user.profile.firstName} ${user.profile.lastName}`.toLowerCase()
                if (!fullName.includes(appliedFilters.name.toLowerCase())) return false
            }
            if (appliedFilters.email && user.profile.email !== appliedFilters.email) return false
            if (appliedFilters.role !== "all" && user.role !== appliedFilters.role) return false
            if (appliedFilters.team !== "all") {
                const inTeam = (user.teams || []).some((t) => t.teamId === appliedFilters.team)
                if (!inTeam) return false
            }
            if (appliedFilters.status !== "all") {
                const isActive = appliedFilters.status === "active"
                if (user.isActive !== isActive) return false
            }
            if (appliedFilters.department !== "all" && user.department !== appliedFilters.department) return false
            return true
        })
    }, [users, appliedFilters])

    const handleFilterReset = () => {
        const resetData = {
            name: "",
            email: "",
            team: "all",
            role: "all",
            status: "all",
            department: "all"
        }
        setFilters(resetData)
        setAppliedFilters(resetData)
    }

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setAppliedFilters(filters)
    }

    // ── Add-user form handlers ──
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        const key = id === "first-name" ? "firstName" : id === "last-name" ? "lastName" : id === "phone-number" ? "phoneNumber" : id
        setFormData((prev) => ({ ...prev, [key]: value }))
    }

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, role: value }))
    }

    const togglePermission = (key: string) => {
        setFormData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(key)
                ? prev.permissions.filter((p) => p !== key)
                : [...prev.permissions, key],
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                phoneNumber: formData.phoneNumber || "0000000000",
                organization: org,
                profile: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phoneNumber || "0000000000",
                },
                password: formData.password,
                role: formData.role || "user",
                department: formData.department || undefined,
                permissions: formData.permissions,
            }

            await axios.post(`${API_URL}/api/auth/register`, payload)
            toast.success("User created successfully")

            setOpen(false)
            setFormData({ firstName: "", lastName: "", email: "", phoneNumber: "", password: "", role: "", department: "", permissions: [] })
            await refreshUsers()
        } catch (error) {
            console.error("Error creating user:", error)
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.message || "Failed to create user")
            }
        }
    }

    if (!canViewUsers) {
        return (
            <div className="flex flex-1 flex-col gap-4 px-3 items-center justify-center py-20">
                <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view users.</p>
            </div>
        )
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

    // ── Render ──
    return (
        
        <div className="flex flex-1 flex-col gap-4 px-3">
            {/* Filters */}
            <div className="rounded-xl bg-muted/50 dark:bg-muted/50 py-4 px-3">
                <form onSubmit={handleFilterSubmit} className="grid gap-3 grid-cols-4">
                    {/* Name */}
                    <div className="col-span-1">
                        <Label htmlFor="filter-name" className="text-s mb-1 ms-1">
                            Name
                        </Label>
                        <Input
                            id="filter-name"
                            className="bg-background dark:bg-background"
                            value={filters.name}
                            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Search by name..."
                        />
                    </div>

                    {/* Email */}
                    <div className="col-span-1">
                        <Label htmlFor="filter-email" className="text-s mb-1 ms-1">
                            Email
                        </Label>
                        <Popover open={emailOpen} onOpenChange={setEmailOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={emailOpen}
                                    className="w-full justify-between font-normal bg-background dark:bg-background hover:dark:bg-background"
                                >
                                    <span className="truncate">
                                        {filters.email || "All Emails"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[220px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search email..." />
                                    <CommandList>
                                        <CommandEmpty>No email found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    setFilters(prev => ({ ...prev, email: "" }))
                                                    setEmailOpen(false)
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", !filters.email ? "opacity-100" : "opacity-0")} />
                                                All Emails
                                            </CommandItem>
                                            {uniqueEmails.map((email) => (
                                                <CommandItem
                                                    key={email}
                                                    value={email}
                                                    onSelect={() => {
                                                        setFilters(prev => ({ ...prev, email: email === filters.email ? "" : email }))
                                                        setEmailOpen(false)
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", filters.email === email ? "opacity-100" : "opacity-0")} />
                                                    {email}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Team */}
                    <div className="col-span-1">
                        <Label htmlFor="filter-team" className="text-s mb-1 ms-1">
                            Team
                        </Label>
                        <Popover open={teamOpen} onOpenChange={setTeamOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={teamOpen}
                                    className="w-full justify-between font-normal bg-background dark:bg-background hover:dark:bg-background"
                                >
                                    <span className="truncate">
                                        {filters.team === "all" ? "All Teams" : teams.find(t => t._id === filters.team)?.name || "All Teams"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[220px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search team..." />
                                    <CommandList>
                                        <CommandEmpty>No team found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    setFilters(prev => ({ ...prev, team: "all" }))
                                                    setTeamOpen(false)
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", filters.team === "all" ? "opacity-100" : "opacity-0")} />
                                                All Teams
                                            </CommandItem>
                                            {teams.map((t) => (
                                                <CommandItem
                                                    key={t._id}
                                                    value={t.name}
                                                    onSelect={() => {
                                                        setFilters(prev => ({ ...prev, team: t._id }))
                                                        setTeamOpen(false)
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", filters.team === t._id ? "opacity-100" : "opacity-0")} />
                                                    {t.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Role */}
                    <div className="col-span-1">
                        <Label htmlFor="filter-role" className="text-s mb-1 ms-1">
                            Role
                        </Label>
                        <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={roleOpen}
                                    className="w-full justify-between font-normal bg-background dark:bg-background hover:dark:bg-background"
                                >
                                    <span className="truncate">
                                        {filters.role === "all" ? "All Roles" : filters.role}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search role..." />
                                    <CommandList>
                                        <CommandEmpty>No role found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    setFilters(prev => ({ ...prev, role: "all" }))
                                                    setRoleOpen(false)
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", filters.role === "all" ? "opacity-100" : "opacity-0")} />
                                                All Roles
                                            </CommandItem>
                                            {uniqueRoles.map((role) => (
                                                <CommandItem
                                                    key={role}
                                                    value={role}
                                                    onSelect={() => {
                                                        setFilters(prev => ({ ...prev, role: role }))
                                                        setRoleOpen(false)
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", filters.role === role ? "opacity-100" : "opacity-0")} />
                                                    <span className="capitalize">{role}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                        <Label htmlFor="filter-status" className="text-s mb-1 ms-1">
                            Status
                        </Label>
                        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={statusOpen}
                                    className="w-full justify-between font-normal bg-background dark:bg-background hover:dark:bg-background"
                                >
                                    <span className="truncate capitalize">
                                        {filters.status === "all" ? "All Status" : filters.status}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[180px] p-0">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    setFilters(prev => ({ ...prev, status: "all" }))
                                                    setStatusOpen(false)
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", filters.status === "all" ? "opacity-100" : "opacity-0")} />
                                                All
                                            </CommandItem>
                                            <CommandItem
                                                onSelect={() => {
                                                    setFilters(prev => ({ ...prev, status: "active" }))
                                                    setStatusOpen(false)
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", filters.status === "active" ? "opacity-100" : "opacity-0")} />
                                                Active
                                            </CommandItem>
                                            <CommandItem
                                                onSelect={() => {
                                                    setFilters(prev => ({ ...prev, status: "inactive" }))
                                                    setStatusOpen(false)
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", filters.status === "inactive" ? "opacity-100" : "opacity-0")} />
                                                Inactive
                                            </CommandItem>
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Department */}
                    <div className="col-span-1">
                        <Label htmlFor="filter-dept" className="text-s mb-1 ms-1">
                            Department
                        </Label>
                        <Popover open={deptOpen} onOpenChange={setDeptOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={deptOpen}
                                    className="w-full justify-between font-normal bg-background dark:bg-background hover:dark:bg-background"
                                >
                                    <span className="truncate capitalize">
                                        {filters.department === "all" ? "All Departments" : filters.department}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search department..." />
                                    <CommandList>
                                        <CommandEmpty>No department found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    setFilters(prev => ({ ...prev, department: "all" }))
                                                    setDeptOpen(false)
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", filters.department === "all" ? "opacity-100" : "opacity-0")} />
                                                All
                                            </CommandItem>
                                            {["pre-sales", "sales", "post-sales"].map((dept) => (
                                                <CommandItem
                                                    key={dept}
                                                    value={dept}
                                                    onSelect={() => {
                                                        setFilters(prev => ({ ...prev, department: dept }))
                                                        setDeptOpen(false)
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", filters.department === dept ? "opacity-100" : "opacity-0")} />
                                                    <span className="capitalize">{dept}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="col-span-1"></div>

                    {/* Buttons */}
                    <div className="col-span-1 flex justify-center items-center gap-2 w-full mt-2">
                        <Button variant="destructive" className="mt-2 w-[45%]" size="sm" type="button" onClick={handleFilterReset}>
                            Reset
                        </Button>
                        <Button size="sm" className="mt-2 w-[45%] active:bg-primary" type="submit">
                            Apply
                        </Button>
                    </div>
                </form>
            </div>
            <DataTable
                columns={columns}
                data={filteredUsers}
                initialPageSize={15}
                topRightContent={
                    canAddUsers && (
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button className="text-xs" size="sm">Add User</Button>
                            </SheetTrigger>
                            <SheetContent className="w-xl px-5 overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Add New User</SheetTitle>
                                    <SheetDescription>
                                        Enter the details below to create a new user account.
                                    </SheetDescription>
                                </SheetHeader>
                                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="first-name">First Name</Label>
                                            <Input id="first-name" placeholder="John" value={formData.firstName} onChange={handleInputChange} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="last-name">Last Name <span className="text-muted-foreground">(Optional)</span></Label>
                                            <Input id="last-name" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" placeholder="john.doe@example.com" value={formData.email} onChange={handleInputChange} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone-number">Phone Number</Label>
                                        <Input id="phone-number" placeholder="+1 234 567 890" value={formData.phoneNumber} onChange={handleInputChange} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select onValueChange={handleSelectChange} value={formData.role}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="user">User</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="department">Department</Label>
                                        <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))} value={formData.department}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pre-sales">Pre-Sales</SelectItem>
                                                <SelectItem value="sales">Sales</SelectItem>
                                                <SelectItem value="post-sales">Post-Sales</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Permissions</Label>
                                        <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                                            {PERMISSION_OPTIONS.map((perm) => (
                                                <label key={perm.key} className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <Checkbox
                                                        checked={formData.permissions.includes(perm.key)}
                                                        onCheckedChange={() => togglePermission(perm.key)}
                                                    />
                                                    {perm.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <Button type="submit" className="mt-4">Create User</Button>
                                </form>
                            </SheetContent>
                        </Sheet>
                    )
                }
            />

            {/* ────────── Edit User Sheet ────────── */}
            <Sheet open={editOpen} onOpenChange={(isOpen) => {
                setEditOpen(isOpen)
                if (!isOpen) setEditingUser(null)
            }}>
                <SheetContent className="w-xl px-5 overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Edit User</SheetTitle>
                        <SheetDescription>
                            Update the details for{" "}
                            <span className="font-medium text-foreground">
                                {editingUser?.profile.firstName} {editingUser?.profile.lastName}
                            </span>
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-first-name">First Name</Label>
                                <Input
                                    id="edit-first-name"
                                    placeholder="John"
                                    value={editFormData.firstName}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-last-name">Last Name</Label>
                                <Input
                                    id="edit-last-name"
                                    placeholder="Doe"
                                    value={editFormData.lastName}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="john.doe@example.com"
                                value={editFormData.email}
                                onChange={handleEditInputChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-phone">Phone Number</Label>
                            <Input
                                id="edit-phone"
                                placeholder="+1 234 567 890"
                                value={editFormData.phone}
                                onChange={handleEditInputChange}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Select onValueChange={handleEditRoleChange} value={editFormData.role}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Department</Label>
                            <Select onValueChange={(value) => setEditFormData((prev) => ({ ...prev, department: value }))} value={editFormData.department}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pre-sales">Pre-Sales</SelectItem>
                                    <SelectItem value="sales">Sales</SelectItem>
                                    <SelectItem value="post-sales">Post-Sales</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Permissions</Label>
                            <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                                {PERMISSION_OPTIONS.map((perm) => (
                                    <label key={perm.key} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={editFormData.permissions.includes(perm.key)}
                                            onCheckedChange={() => toggleEditPermission(perm.key)}
                                        />
                                        {perm.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <Button type="submit" className="mt-4" disabled={editLoading}>
                            {editLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Updating...
                                </span>
                            ) : (
                                "Update User"
                            )}
                        </Button>
                    </form>
                </SheetContent>
            </Sheet>

            {/* ────────── Delete Confirmation Dialog ────────── */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={(isOpen) => {
                setDeleteDialogOpen(isOpen)
                if (!isOpen) setDeletingUser(null)
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {deletingUser?.profile.firstName} {deletingUser?.profile.lastName}
                            </span>
                            ? This action cannot be undone. The user will be permanently removed from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteUser}
                            disabled={deleteLoading}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {deleteLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Deleting...
                                </span>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}