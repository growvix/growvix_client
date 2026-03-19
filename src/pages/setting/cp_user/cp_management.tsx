import { useState, useMemo, useEffect, useCallback } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Info, FolderOpen, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataTable } from "@/components/ui/data-table"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import axios from "axios"
import { API } from "@/config/api"
import { getCookie } from "@/utils/cookies"

// ─── Types ──────────────────────────────────────────────
interface AllowedProject {
    project_id: number
    project_name: string
}

interface CPData {
    _id: string
    profile: {
        firstName: string
        lastName: string
        email: string
        phone: string
        address: string
    }
    company: string
    team: string
    allowed_projects?: AllowedProject[]
}

interface ProjectSummary {
    product_id: number
    name: string
    location: string
    property: string
}

// Helper to build "First Last" display name
const getFullName = (cp: CPData) =>
    `${cp.profile?.firstName ?? ""} ${cp.profile?.lastName ?? ""}`.trim()

const emptyForm = {
    firstName: "", lastName: "",
    email: "", phone: "", address: "",
    password: "", company: "", team: "",
}

// ─── Column factory ──────────────────────────────────────
const getColumns = (
    onEdit: (cp: CPData) => void,
    onDelete: (cp: CPData) => void,
    onManageProjects: (cp: CPData) => void
): ColumnDef<CPData>[] => [
        {
            id: "cpName",
            header: "CP Name",
            meta: {
                label: "CP Name",
            },
            accessorFn: (row) => getFullName(row),
            cell: ({ row }) => (
                <div className="font-medium capitalize">{getFullName(row.original) || "—"}</div>
            ),
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
            accessorFn: (row) => row.profile?.email ?? "",
            cell: ({ row }) => <div className="lowercase">{row.original.profile?.email ?? "—"}</div>,
        },
        {
            id: "phone",
            header: "Phone",
            meta: {
                label: "Phone",
            },
            accessorFn: (row) => row.profile?.phone ?? "",
            cell: ({ row }) => <div>{row.original.profile?.phone || "—"}</div>,
        },
        {
            id: "address",
            header: "Address",
            meta: {
                label: "Address",
            },
            accessorFn: (row) => row.profile?.address ?? "",
            cell: ({ row }) => <div>{row.original.profile?.address || "—"}</div>,
        },
        {
            accessorKey: "team",
            header: "Team",
            meta: {
                label: "Team",
            },
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("team") || <span className="text-muted-foreground">—</span>}</div>
            ),
        },
        {
            id: "projectCount",
            header: "Projects",
            meta: {
                label: "Projects",
            },
            cell: ({ row }) => {
                const count = row.original.allowed_projects?.length ?? 0
                return (
                    <div className="text-center">
                        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${count > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                            {count}
                        </span>
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
                const cp = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(String(cp._id))}
                            >
                                Copy CP ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onManageProjects(cp)}>
                                <FolderOpen className="mr-2 h-4 w-4" />
                                Manage Projects
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(cp)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit CP
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => onDelete(cp)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete CP
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

// ─── Page Component ──────────────────────────────────────
export default function CPManagement() {
    const { setBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Channel Partner Management" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Channel Partner Management</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    // ── State ──
    const [cpUsers, setCpUsers] = useState<CPData[]>([])
    const [loading, setLoading] = useState(true)

    // Add CP sheet
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({ ...emptyForm })
    const [submitting, setSubmitting] = useState(false)

    // Edit CP sheet
    const [editOpen, setEditOpen] = useState(false)
    const [editingCp, setEditingCp] = useState<CPData | null>(null)
    const [editFormData, setEditFormData] = useState({ ...emptyForm })
    const [editSubmitting, setEditSubmitting] = useState(false)

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [cpToDelete, setCpToDelete] = useState<CPData | null>(null)

    // Project access dialog
    const [projectDialogOpen, setProjectDialogOpen] = useState(false)
    const [selectedCp, setSelectedCp] = useState<CPData | null>(null)
    const [allProjects, setAllProjects] = useState<ProjectSummary[]>([])
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set())
    const [projectsLoading, setProjectsLoading] = useState(false)
    const [projectsSaving, setProjectsSaving] = useState(false)
    const [projectSearch, setProjectSearch] = useState("")

    const organization = getCookie("organization") || ""

    // ── Fetch all CP users ──
    const fetchCpUsers = useCallback(async () => {
        try {
            setLoading(true)
            const token = getCookie("token")
            const res = await axios.get(`${API.CP_USERS}?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setCpUsers(res.data.data?.cpUsers || [])
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load Channel Partners")
        } finally {
            setLoading(false)
        }
    }, [organization])

    useEffect(() => {
        if (organization) fetchCpUsers()
    }, [fetchCpUsers, organization])

    // ── Fetch all projects (for dialog) ──
    const fetchProjects = useCallback(async () => {
        try {
            setProjectsLoading(true)
            const token = getCookie("token")
            const res = await axios.get(`${API.PROJECTS}?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setAllProjects(res.data.data?.projects || res.data.data || [])
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load projects")
        } finally {
            setProjectsLoading(false)
        }
    }, [organization])

    // ── Form input handler (shared for add form) ──
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    // ── Edit form input handler ──
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        const key = id.startsWith("edit-") ? id.replace("edit-", "") : id
        setEditFormData((prev) => ({ ...prev, [key]: value }))
    }

    // ── Create CP ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const token = getCookie("token")
            const res = await axios.post(
                API.CP_USERS,
                { ...formData, organization },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setCpUsers((prev) => [res.data.data, ...prev])
            toast.success("Channel Partner created successfully")
            setOpen(false)
            setFormData({ ...emptyForm })
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create Channel Partner")
        } finally {
            setSubmitting(false)
        }
    }

    // ── Open Edit Sheet ──
    const handleEdit = (cp: CPData) => {
        setEditingCp(cp)
        setEditFormData({
            firstName: cp.profile?.firstName ?? "",
            lastName: cp.profile?.lastName ?? "",
            email: cp.profile?.email ?? "",
            phone: cp.profile?.phone ?? "",
            address: cp.profile?.address ?? "",
            password: "",
            company: cp.company ?? "",
            team: cp.team ?? "",
        })
        setEditOpen(true)
    }

    // ── Save Edit ──
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCp) return
        setEditSubmitting(true)
        try {
            const token = getCookie("token")
            const res = await axios.put(
                API.updateCpUser(editingCp._id),
                { ...editFormData, organization },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setCpUsers((prev) =>
                prev.map((cp) => (cp._id === editingCp._id ? res.data.data : cp))
            )
            toast.success("Channel Partner updated successfully")
            setEditOpen(false)
            setEditingCp(null)
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update Channel Partner")
        } finally {
            setEditSubmitting(false)
        }
    }

    // ── Open Delete Dialog ──
    const confirmDelete = (cp: CPData) => {
        setCpToDelete(cp)
        setDeleteDialogOpen(true)
    }

    // ── Delete CP ──
    const handleDelete = async () => {
        if (!cpToDelete) return
        setDeleteDialogOpen(false)
        try {
            const token = getCookie("token")
            await axios.delete(`${API.deleteCpUser(cpToDelete._id)}?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setCpUsers((prev) => prev.filter((c) => c._id !== cpToDelete._id))
            toast.success("Channel Partner deleted successfully")
            setCpToDelete(null)
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete Channel Partner")
            setCpToDelete(null)
        }
    }

    // ── Open Project Access Dialog ──
    const handleManageProjects = (cp: CPData) => {
        setSelectedCp(cp)
        setProjectSearch("")
        // Pre-select the CP's allowed projects
        const existingIds = new Set((cp.allowed_projects || []).map(p => p.project_id))
        setSelectedProjectIds(existingIds)
        setProjectDialogOpen(true)
        fetchProjects()
    }

    // ── Toggle project selection ──
    const toggleProjectSelection = (projectId: number) => {
        setSelectedProjectIds(prev => {
            const next = new Set(prev)
            if (next.has(projectId)) {
                next.delete(projectId)
            } else {
                next.add(projectId)
            }
            return next
        })
    }

    // ── Save Project Access ──
    const handleSaveProjects = async () => {
        if (!selectedCp) return
        setProjectsSaving(true)
        try {
            const token = getCookie("token")
            const projectsPayload = allProjects
                .filter(p => selectedProjectIds.has(p.product_id))
                .map(p => ({ project_id: p.product_id, project_name: p.name }))

            const res = await axios.patch(
                API.updateCpUserProjects(selectedCp._id),
                { organization, projects: projectsPayload },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            // Update local state
            setCpUsers(prev =>
                prev.map(cp => cp._id === selectedCp._id
                    ? { ...cp, allowed_projects: res.data.data?.allowed_projects || projectsPayload }
                    : cp
                )
            )
            toast.success("Project access updated successfully")
            setProjectDialogOpen(false)
            setSelectedCp(null)
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update project access")
        } finally {
            setProjectsSaving(false)
        }
    }

    const filteredProjects = allProjects.filter(p =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
        (p.location || "").toLowerCase().includes(projectSearch.toLowerCase())
    )

    const columns = useMemo(() => getColumns(handleEdit, confirmDelete, handleManageProjects), [])

    // ── Render ──
    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Channel Partners</h2>

                {/* ── Add CP Sheet ── */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button>Add CP</Button>
                    </SheetTrigger>
                    <SheetContent className="w-xl px-5">
                        <SheetHeader>
                            <SheetTitle>Add New CP</SheetTitle>
                            <SheetDescription>
                                Enter the details below to create a new Channel Partner account.
                            </SheetDescription>
                        </SheetHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" placeholder="John" value={formData.firstName} onChange={handleInputChange} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="partner@example.com" value={formData.email} onChange={handleInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" placeholder="+91 98765 43210" value={formData.phone} onChange={handleInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <textarea
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    id="address"
                                    placeholder="123 Business Rd..."
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="company">Company (optional)</Label>
                                <Input id="company" placeholder="Partner Ltd." value={formData.company} onChange={handleInputChange} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="team">Team (optional)</Label>
                                <Input id="team" placeholder="Assigned Team" value={formData.team} onChange={handleInputChange} />
                            </div>
                            <Button type="submit" className="mt-4" disabled={submitting}>
                                {submitting ? "Creating..." : "Create CP"}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            {/* ── Edit CP Sheet ── */}
            <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetContent className="w-xl px-5">
                    <SheetHeader>
                        <SheetTitle>Edit Channel Partner</SheetTitle>
                        <SheetDescription>Update the details for this Channel Partner.</SheetDescription>
                    </SheetHeader>
                    {editingCp && (
                        <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-firstName">First Name</Label>
                                    <Input id="edit-firstName" placeholder="John" value={editFormData.firstName} onChange={handleEditInputChange} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-lastName">Last Name</Label>
                                    <Input id="edit-lastName" placeholder="Doe" value={editFormData.lastName} onChange={handleEditInputChange} required />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" type="email" placeholder="partner@example.com" value={editFormData.email} onChange={handleEditInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-phone">Phone Number</Label>
                                <Input id="edit-phone" placeholder="+91 98765 43210" value={editFormData.phone} onChange={handleEditInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-address">Address</Label>
                                <textarea
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    id="edit-address"
                                    placeholder="123 Business Rd..."
                                    value={editFormData.address}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-company">Company (optional)</Label>
                                <Input id="edit-company" placeholder="Partner Ltd." value={editFormData.company} onChange={handleEditInputChange} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-team">Team (optional)</Label>
                                <Input id="edit-team" placeholder="Assigned Team" value={editFormData.team} onChange={handleEditInputChange} />
                            </div>
                            <Button type="submit" className="mt-4" disabled={editSubmitting}>
                                {editSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Table ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={cpUsers}
                    initialPageSize={15}
                    filterColumn="cpName"
                    filterPlaceholder="Search by name..."
                />
            )}

            {/* ── Delete CP Confirmation Dialog ── */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong className="text-foreground">{cpToDelete ? getFullName(cpToDelete) : ""}</strong>? This action cannot be undone. The user will be permanently removed from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Project Access Dialog ── */}
            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage Project Access</DialogTitle>
                        <DialogDescription>
                            Select inventory projects that <strong>{selectedCp ? getFullName(selectedCp) : ""}</strong> can access.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search */}
                    <div className="px-1">
                        <Input
                            placeholder="Search projects..."
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                            className="bg-muted/50"
                        />
                    </div>

                    {/* Project List */}
                    <ScrollArea className="h-[320px] pr-3">
                        {projectsLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <FolderOpen className="h-8 w-8 mb-2" />
                                <p className="text-sm">No projects found</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredProjects.map((project) => {
                                    const isSelected = selectedProjectIds.has(project.product_id)
                                    return (
                                        <div
                                            key={project.product_id}
                                            onClick={() => toggleProjectSelection(project.product_id)}
                                            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${isSelected
                                                ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                                                : "border-transparent hover:bg-muted/50"
                                                }`}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleProjectSelection(project.product_id)}
                                                className="pointer-events-none"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{project.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {project.location || "No location"} · {project.property || "—"}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    <DialogFooter className="flex items-center justify-between sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                            {selectedProjectIds.size} project{selectedProjectIds.size !== 1 ? "s" : ""} selected
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveProjects} disabled={projectsSaving}>
                                {projectsSaving ? "Saving..." : "Save Access"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
