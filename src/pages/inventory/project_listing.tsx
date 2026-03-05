import { useEffect } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import * as React from "react"
import axios from "axios"
import { API } from "@/config/api"
import {
    type ColumnDef,
} from "@tanstack/react-table"

import { ArrowUpDown, Ban, Info, MoreHorizontal, Pencil } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { getCookie, getPermissions } from "@/utils/cookies"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { encodeProjectId } from "@/utils/idEncoder"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { projects } from "@/types"
import { DataTable } from "@/components/ui/data-table"

export default function ProjectListing() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [data, setData] = React.useState<projects[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')

    // Edit Project State
    const [editOpen, setEditOpen] = React.useState(false)
    const [editingProject, setEditingProject] = React.useState<projects | null>(null)
    const [editFormData, setEditFormData] = React.useState({
        name: "",
        location: "",
        property: "",
    })
    const [editLoading, setEditLoading] = React.useState(false)

    // Booked Units State
    const [bookedUnitsOpen, setBookedUnitsOpen] = React.useState(false)
    const [bookedUnitsData, setBookedUnitsData] = React.useState<any[]>([])
    const [bookedUnitsLoading, setBookedUnitsLoading] = React.useState(false)
    const [bookedProjectName, setBookedProjectName] = React.useState('')

    const navigate = useNavigate()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Project Listing" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Project Inventory</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ]);
    }, [setBreadcrumbs]);

    const fetchProjects = React.useCallback(async () => {
        const permissions = getPermissions()
        if (!permissions.includes("view_inventory")) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const org = getCookie('organization')
            if (!org) {
                setError('Organization not found in cookies')
                setLoading(false)
                return
            }
            const response = await axios.get(`${API.PROJECTS}?organization=${org}`)
            setData(response.data.data || [])
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch projects')
        } finally {
            setLoading(false)
        }
    }, [])

    const permissions = getPermissions()
    const canViewInventory = permissions.includes("view_inventory")

    // Fetch projects from API on mount
    React.useEffect(() => {
        if (canViewInventory) fetchProjects()
        else setLoading(false)
    }, [fetchProjects, canViewInventory])

    const handleEditProject = React.useCallback((e: React.MouseEvent, project: projects) => {
        e.stopPropagation() // Prevent row click
        const permissions = getPermissions()
        if (!permissions.includes("edit_inventory")) {
            toast.warning("You do not have permission to edit projects.")
            return
        }
        setEditingProject(project)
        setEditFormData({
            name: project.name,
            location: project.location,
            property: project.property || "",
        })
        setEditOpen(true)
    }, [])

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setEditFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingProject) return
        setEditLoading(true)

        try {
            const org = getCookie('organization')
            const token = getCookie("token")
            await axios.put(
                API.updateProject(editingProject.product_id),
                Object.assign({}, editFormData, { organization: org }),
                { headers: { Authorization: `Bearer ${token}` } }
            )
            toast.success("Project updated successfully")
            setEditOpen(false)
            setEditingProject(null)
            await fetchProjects()
        } catch (err: any) {
            console.error("Error updating project:", err)
            toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Failed to update project")
        } finally {
            setEditLoading(false)
        }
    }

    const handleBookedUnitsClick = async (e: React.MouseEvent, project: projects) => {
        e.stopPropagation()
        setBookedProjectName(project.name)
        setBookedUnitsOpen(true)
        setBookedUnitsLoading(true)

        try {
            const org = getCookie('organization')
            const response = await axios.get(API.getProjectBookedUnits(project.product_id) + `?organization=${org}`)
            setBookedUnitsData(response.data.data || [])
        } catch (err: any) {
            console.error("Error fetching booked units:", err)
            toast.error(err.response?.data?.message || "Failed to fetch booked units")
            setBookedUnitsData([])
        } finally {
            setBookedUnitsLoading(false)
        }
    }

    const columns: ColumnDef<projects>[] = React.useMemo(() => [
        {
            accessorKey: "product_id",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >ID
                        <ArrowUpDown />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="capitalize">{row.getValue("product_id")}</div>,
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "location",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Location
                        <ArrowUpDown />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="capitalize">{row.getValue("location")}</div>,
        },
        {
            accessorKey: "property",
            header: "Property",
            cell: ({ row }) => <div className="capitalize">{row.getValue("property")}</div>,
        },
        {
            accessorKey: "blockCount",
            header: "Blocks",
            cell: ({ row }) => <div className="text-center">{row.getValue("blockCount") ?? 0}</div>,
        },
        {
            accessorKey: "totalUnits",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Total Units
                        <ArrowUpDown />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-center font-medium">{row.getValue("totalUnits") ?? 0}</div>,
        },
        {
            accessorKey: "bookedCount",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Booked Units
                        <ArrowUpDown />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const count = row.getValue("bookedCount") as number ?? 0
                const project = row.original
                return (
                    <div className="text-center">
                        {count > 0 ? (
                            <Badge
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80 bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
                                onClick={(e) => handleBookedUnitsClick(e, project)}
                            >
                                {count} Booked
                            </Badge>
                        ) : (
                            <span className="text-muted-foreground">-</span>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) => {
                const date = row.getValue("createdAt") as string
                return <div>{date ? new Date(date).toLocaleDateString() : '-'}</div>
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const project = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(project); }}>
                                View Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleEditProject(e, project)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem>Download Brochure</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [handleEditProject])

    const handleRowClick = async (project: projects) => {
        const encodedId = encodeProjectId(project.product_id)
        navigate(`/project_showcase?id=${encodedId}`)
    }

    if (!canViewInventory) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center py-20 px-4 mt-20">
                <div className="flex flex-col items-center justify-center max-w-3xl w-full p-20 border border-dashed rounded-2xl bg-card min-h-[400px]">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 border mb-8">
                        <Ban className="h-10 w-10 text-muted-foreground/70" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">Access Denied</h2>
                    <p className="text-base text-muted-foreground text-center leading-relaxed max-w-md gap-4">
                        This page is restricted. You don't have permission to view the project inventory.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="px-3 mt-5">
            <Card className="dark:bg-input/50">
                <CardHeader>
                    <CardTitle>Project Listing</CardTitle>
                    <CardDescription className="border-b pb-2">View the list of projects available.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {loading ? (
                        <div className="w-full flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="w-full text-center py-10 text-red-500">
                            {error}
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={data}
                            initialPageSize={15} // Using default from previous usage
                            filterColumn="name"
                            filterPlaceholder="Filter by name..."
                            onRowClick={handleRowClick}
                        />
                    )}
                </CardContent>
            </Card>

            <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetContent className="w-xl px-5">
                    <SheetHeader>
                        <SheetTitle>Edit Project</SheetTitle>
                        <SheetDescription>
                            Update basic details for this project.
                        </SheetDescription>
                    </SheetHeader>
                    {editingProject && (
                        <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Project Name</Label>
                                <Input id="name" value={editFormData.name} onChange={handleEditInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" value={editFormData.location} onChange={handleEditInputChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="property">Property Type (e.g. apartments, plots)</Label>
                                <Input id="property" value={editFormData.property} onChange={handleEditInputChange} required />
                            </div>
                            <Button type="submit" className="mt-4" disabled={editLoading}>
                                {editLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            <Sheet open={bookedUnitsOpen} onOpenChange={setBookedUnitsOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] px-0 flex flex-col">
                    <SheetHeader className="px-6 pb-4 border-b">
                        <SheetTitle>Booked Units - {bookedProjectName}</SheetTitle>
                        <SheetDescription>
                            List of all units and plots currently booked for this project.
                        </SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-6">
                        <div className="py-6 space-y-4">
                            {bookedUnitsLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <p className="text-sm text-muted-foreground">Loading booked units...</p>
                                </div>
                            ) : bookedUnitsData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                                        <Ban className="h-8 w-8 text-muted-foreground/60" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No booked units found</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {bookedUnitsData.map((unit, index) => (
                                        <Card key={index} className="overflow-hidden">
                                            <CardContent className="p-4 flex flex-col gap-2 relative">
                                                <Badge className="absolute top-4 right-4 bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 pointer-events-none hover:bg-orange-100 border-none shadow-none">
                                                    Booked
                                                </Badge>

                                                <div className="font-semibold">{unit.label}</div>

                                                <div className="grid gap-1.5 text-sm mt-1">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span className="font-medium text-foreground w-16">Lead:</span>
                                                        <span>{unit.bookedBy?.leadName || 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span className="font-medium text-foreground w-16">Phone:</span>
                                                        <span>{unit.bookedBy?.phone || 'Unknown'}</span>
                                                    </div>
                                                    {unit.bookedBy?.userName && (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <span className="font-medium text-foreground w-16">Booked By:</span>
                                                            <span>{unit.bookedBy.userName}</span>
                                                        </div>
                                                    )}
                                                    {unit.bookedBy?.bookedAt && (
                                                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                                            <span className="text-xs">{new Date(unit.bookedBy.bookedAt).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div >
    );
}