import { useState, useMemo, useEffect, useCallback } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Info } from "lucide-react"
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
import { DataTable } from "@/components/ui/data-table"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import axios from "axios"
import { API } from "@/config/api"
import { getCookie } from "@/utils/cookies"

// ─── Types ──────────────────────────────────────────────
interface CPData {
    _id: string
    cpName: string
    email: string
    phone: string
    address: string
    team: string
}

const emptyForm = { cpName: "", email: "", phone: "", address: "", team: "" }

// ─── Column factory ──────────────────────────────────────
const getColumns = (
    onEdit: (cp: CPData) => void,
    onDelete: (cp: CPData) => void
): ColumnDef<CPData>[] => [
        {
            accessorKey: "cpName",
            header: "CP Name",
            cell: ({ row }) => <div className="font-medium capitalize">{row.getValue("cpName")}</div>,
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
            accessorFn: (row) => row.email,
            cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
        },
        {
            accessorKey: "phone",
            header: "Phone",
            cell: ({ row }) => <div>{row.getValue("phone") || "—"}</div>,
        },
        {
            accessorKey: "address",
            header: "Address",
            cell: ({ row }) => <div>{row.getValue("address") || "—"}</div>,
        },
        {
            accessorKey: "team",
            header: "Team",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("team") || <span className="text-muted-foreground">—</span>}</div>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
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

    // ── Handlers ──
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        const key = id === "cp-name" ? "cpName" : id
        setFormData((prev) => ({ ...prev, [key]: value }))
    }

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        const key = id === "edit-cp-name" ? "cpName" : id.replace("edit-", "")
        setEditFormData((prev) => ({ ...prev, [key]: value }))
    }

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

    const handleEdit = (cp: CPData) => {
        setEditingCp(cp)
        setEditFormData({
            cpName: cp.cpName,
            email: cp.email,
            phone: cp.phone,
            address: cp.address,
            team: cp.team || "",
        })
        setEditOpen(true)
    }

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

    const handleDelete = async (cp: CPData) => {
        if (!confirm(`Are you sure you want to delete "${cp.cpName}"?`)) return
        try {
            const token = getCookie("token")
            await axios.delete(`${API.deleteCpUser(cp._id)}?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setCpUsers((prev) => prev.filter((c) => c._id !== cp._id))
            toast.success("Channel Partner deleted successfully")
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete Channel Partner")
        }
    }

    const columns = useMemo(() => getColumns(handleEdit, handleDelete), [])

    // ── Render ──
    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Channel Partners</h2>

                {/* Add CP Sheet */}
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
                            <div className="grid gap-2">
                                <Label htmlFor="cp-name">CP Name</Label>
                                <Input id="cp-name" placeholder="Partner Name" value={formData.cpName} onChange={handleInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="partner@example.com" value={formData.email} onChange={handleInputChange} required />
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

            {/* Edit CP Sheet */}
            <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetContent className="w-xl px-5">
                    <SheetHeader>
                        <SheetTitle>Edit Channel Partner</SheetTitle>
                        <SheetDescription>Update the details for this Channel Partner.</SheetDescription>
                    </SheetHeader>
                    {editingCp && (
                        <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-cp-name">CP Name</Label>
                                <Input id="edit-cp-name" placeholder="Partner Name" value={editFormData.cpName} onChange={handleEditInputChange} required />
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

            {/* Table */}
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
        </div>
    )
}
