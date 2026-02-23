import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { API_URL, API } from "@/config/api"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, X, ChevronsUpDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCookie } from "@/utils/cookies"
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
import { useBreadcrumb } from "@/context/breadcrumb-context"
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

// ─── Permission Keys ─────────────────────────────────────
const PERMISSION_OPTIONS = [
    { key: "create_project", label: "Create Project" },
    { key: "add_users", label: "Add Users" },
    { key: "create_team", label: "Create Team" },
    { key: "assign_team_members", label: "Assign Team Members" },
    { key: "view_lead_phone", label: "View Lead Phone (Unmasked)" },
    { key: "add_lead", label: "Add New Lead" },
    { key: "view_inventory", label: "View Project Inventory" },
    { key: "edit_users", label: "Edit All Users" },
] as const;

// ─── Types ───────────────────────────────────────────────
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

// ─── Columns ─────────────────────────────────────────────
const columns: ColumnDef<UserData>[] = [
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
                <ArrowUpDown />
            </Button>
        ),
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

// ─── Page Component ──────────────────────────────────────
export default function UserManagement() {
    const org = getCookie("organization")
    const { setBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "User Management" },
        ])
    }, [setBreadcrumbs])

    // ── Form state ──
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "",
        permissions: [] as string[],
    })

    // ── Table data state ──
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
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
    }, [org])

    // ── Filter state ──
    const [filterName, setFilterName] = useState("")
    const [filterEmail, setFilterEmail] = useState("")
    const [emailOpen, setEmailOpen] = useState(false)
    const [filterTeam, setFilterTeam] = useState("all")
    const [filterRole, setFilterRole] = useState("all")
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
            if (filterName) {
                const fullName = `${user.profile.firstName} ${user.profile.lastName}`.toLowerCase()
                if (!fullName.includes(filterName.toLowerCase())) return false
            }
            if (filterEmail && user.profile.email !== filterEmail) return false
            if (filterRole !== "all" && user.role !== filterRole) return false
            if (filterTeam !== "all") {
                const inTeam = (user.teams || []).some((t) => t.teamId === filterTeam)
                if (!inTeam) return false
            }
            return true
        })
    }, [users, filterName, filterEmail, filterRole, filterTeam])

    const clearFilters = () => {
        setFilterName("")
        setFilterEmail("")
        setFilterTeam("all")
        setFilterRole("all")
    }

    const hasActiveFilters = filterName !== "" || filterEmail !== "" || filterTeam !== "all" || filterRole !== "all"

    // ── Form handlers ──
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
                },
                password: formData.password,
                role: formData.role || "user",
                permissions: formData.permissions,
            }

            const response = await axios.post(`${API_URL}/api/auth/register`, payload)
            console.log("User created:", response.data)

            setOpen(false)
            setFormData({ firstName: "", lastName: "", email: "", phoneNumber: "", password: "", role: "", permissions: [] })

            // Refresh the user list
            const token = getCookie("token")
            const refreshResp = await axios.get(
                `${API.USERS}?organization=${org}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setUsers(refreshResp.data.data?.users || [])
        } catch (error) {
            console.error("Error creating user:", error)
            if (axios.isAxiosError(error) && error.response) {
                alert(`Error: ${error.response.data.message || "Failed to create user"}`)
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

    // ── Render ──
    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button className="mt-3" size="lg">Add User</Button>
                    </SheetTrigger>
                    <SheetContent className="w-xl px-5">
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
                                    <Label htmlFor="last-name">Last Name</Label>
                                    <Input id="last-name" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} required />
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
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <Input
                    placeholder="Search by name..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="w-[200px] bg-input/30 dark:bg-input/50"
                />

                <Popover open={emailOpen} onOpenChange={setEmailOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={emailOpen}
                            className="w-[220px] justify-between font-normal"
                        >
                            <span className="truncate">
                                {filterEmail || "All Emails"}
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
                                            setFilterEmail("")
                                            setEmailOpen(false)
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", !filterEmail ? "opacity-100" : "opacity-0")} />
                                        All Emails
                                    </CommandItem>
                                    {uniqueEmails.map((email) => (
                                        <CommandItem
                                            key={email}
                                            value={email}
                                            onSelect={() => {
                                                setFilterEmail(email === filterEmail ? "" : email)
                                                setEmailOpen(false)
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", filterEmail === email ? "opacity-100" : "opacity-0")} />
                                            {email}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger className="w-[170px]">
                        <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {teams.map((t) => (
                            <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {uniqueRoles.map((role) => (
                            <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={filteredUsers}
                initialPageSize={15}
            />
        </div>
    )
}