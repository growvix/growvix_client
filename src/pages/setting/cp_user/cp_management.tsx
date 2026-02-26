import { useState, useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, X, Pencil, Trash2 } from "lucide-react"
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
import { useEffect } from "react"

// ─── Types ──────────────────────────────────────────────
interface CPData {
    _id: string
    cpName: string
    email: string
    phone: string
    address: string
}

// Mock initial data if no API available yet or leave empty
const MOCK_DATA: CPData[] = []

// ─── Page Component ──────────────────────────────────────
export default function CPManagement() {
    const { setBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Channel Partner Management" },
        ])
    }, [setBreadcrumbs])

    // ── Table data state ──
    const [cpUsers, setCpUsers] = useState<CPData[]>(MOCK_DATA)

    // ── Add-CP form state ──
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        cpName: "",
        email: "",
        phone: "",
        address: "",
    })

    // ── Columns ──
    const columns: ColumnDef<CPData>[] = useMemo(() => [
        {
            accessorKey: "cpName",
            header: "Cp name",
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
            cell: ({ row }) => <div>{row.getValue("phone") || "-"}</div>,
        },
        {
            accessorKey: "address",
            header: "Address",
            cell: ({ row }) => <div>{row.getValue("address") || "-"}</div>,
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
                            <DropdownMenuItem onClick={() => toast.info("Edit CP logic to be implemented")}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit CP
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => toast.info("Delete CP logic to be implemented")}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete CP
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [])

    // ── Filter state ──
    const [filterName, setFilterName] = useState("")

    // Filtered CPs
    const filteredCPs = useMemo(() => {
        return cpUsers.filter((cp) => {
            if (filterName) {
                const nameMatch = cp.cpName.toLowerCase().includes(filterName.toLowerCase())
                if (!nameMatch) return false
            }
            return true
        })
    }, [cpUsers, filterName])

    const clearFilters = () => {
        setFilterName("")
    }

    const hasActiveFilters = filterName !== ""

    // ── Add-CP form handlers ──
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        const key = id === "cp-name" ? "cpName" : id
        setFormData((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // Mock adding the CP user
            const newCP: CPData = {
                _id: Math.random().toString(36).substr(2, 9),
                cpName: formData.cpName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
            }

            setCpUsers((prev) => [...prev, newCP])
            toast.success("Channel Partner created successfully")
            setOpen(false)
            setFormData({ cpName: "", email: "", phone: "", address: "" })
        } catch (error) {
            console.error("Error creating CP:", error)
            toast.error("Failed to create Channel Partner")
        }
    }

    // ── Render ──
    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Channel Partners</h2>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button className="mt-3" size="lg">Add CP</Button>
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
                                <Input id="phone" placeholder="+1 234 567 890" value={formData.phone} onChange={handleInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" id="address" placeholder="123 Business Rd..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                            </div>
                            <Button type="submit" className="mt-4">Create CP</Button>
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

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={filteredCPs}
                initialPageSize={15}
            />
        </div>
    )
}
