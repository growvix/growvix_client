import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { getCookie } from "@/utils/cookies"
import { API } from "@/config/api"
import { encodeProjectId } from "@/utils/idEncoder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Layers, Package, List, LayoutGrid, ArrowUpDown, Search } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AllowedProject {
    project_id: number
    project_name: string
}

interface ProjectDetail {
    product_id: number
    name: string
    location: string
    property: string
    totalUnits: number
    bookedCount: number
    blockCount: number
    createdAt: string
}

export default function CpDashboard() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState<ProjectDetail[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
    const [unitDetailsOpen, setUnitDetailsOpen] = useState(false)
    const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true'

    const filteredProjects = projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.location && project.location.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const fetchProjectDetails = useCallback(async () => {
        try {
            setLoading(true)
            const raw = getCookie("allowed_projects")
            const organization = getCookie("organization")
            const token = getCookie("token")

            if (!organization || !token) {
                setProjects([])
                setLoading(false)
                return
            }

            let allowedProjects: AllowedProject[] = []
            try {
                allowedProjects = raw ? JSON.parse(decodeURIComponent(raw)) : []
            } catch (err) {
                console.warn("CP Dashboard: Failed to parse allowed_projects cookie. Falling back to all projects.", err)
                allowedProjects = []
            }
    // Removed the early return to allow all projects to be fetched if no specific restrictions exist
            // Fetch full project list and filter by allowed IDs
            const res = await axios.get(`${API.PROJECTS}?organization=${encodeURIComponent(organization)}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const allProjects: ProjectDetail[] = res.data.data || []
            console.log("CP Dashboard Debug:", {
                organization,
                allowedProjectsFromCookie: allowedProjects,
                allProjectsFromBackendCount: allProjects.length,
                allProjectsFromBackend: allProjects.map(p => ({ id: p.product_id, name: p.name }))
            })
            
            // If the user has assigned projects, filter by them.
            // Otherwise, show NO projects for the CP user.
            if (allowedProjects.length > 0) {
                const allowedIds = new Set(allowedProjects.map(p => p.project_id))
                const filtered = allProjects.filter(p => {
                    // Using loose equality check (==) in case of string vs number mismatch
                    return Array.from(allowedIds).some(id => id == p.product_id)
                })
                
                setProjects(filtered)
                
                if (filtered.length === 0 && allProjects.length > 0) {
                    console.warn("CP Dashboard: Assigned projects (ids) don't match any projects in organization.", {
                        allowedIds: Array.from(allowedIds),
                        backendIds: allProjects.map(p => p.product_id)
                    })
                }
            } else {
                setProjects([])
            }
        } catch (err) {
            console.error("Failed to fetch projects:", err)
            setProjects([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProjectDetails()
    }, [fetchProjectDetails])

    const handleProjectClick = (project: ProjectDetail) => {
        const encodedId = encodeProjectId(project.product_id)
        navigate(`/cp/project?id=${encodedId}`)
    }

    const getPropertyIcon = (property: string) => {
        switch (property) {
            case "plots":
                return <Layers className="h-5 w-5" />
            default:
                return <Building2 className="h-5 w-5" />
        }
    }

    const columns: ColumnDef<ProjectDetail>[] = [
        {
            accessorKey: "product_id",
            header: ({ column }) => (
                <Button 
                    variant="ghost" 
                    className="p-0 hover:bg-transparent font-semibold text-xs uppercase tracking-wider"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    ID <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            meta:{
                label:"ID"
            },
            cell: ({ row }) => <div className="text-xs font-medium text-muted-foreground">{row.getValue("product_id")}</div>,
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button 
                    variant="ghost" 
                    className="p-0 hover:bg-transparent font-semibold text-xs uppercase tracking-wider"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Project Name <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            meta:{
                label:"Project Name"
            },
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-primary/10 text-primary">
                        {getPropertyIcon(row.original.property)}
                    </div>
                    <div className="font-semibold text-sm">{row.getValue("name")}</div>
                </div>
            ),
        },
        {
            accessorKey: "location",
            header: () => <div className="font-semibold text-xs uppercase tracking-wider">Location</div>,
            meta:{
                label:"Location"
            },
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {row.getValue("location")}
                </div>
            ),
        },
        {
            accessorKey: "property",
            header: () => <div className="font-semibold text-xs uppercase tracking-wider">Property</div>,
            meta:{
                label:"Property"
            },
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize text-[10px] px-2 py-0 font-medium bg-muted/30">
                    {row.getValue("property")}
                </Badge>
            ),
        },
        {
            accessorKey: "totalUnits",
            header: () => <div className="text-center font-semibold text-xs uppercase tracking-wider">Total Units</div>,
            meta:{
                label:"Total Units"
            },
            cell: ({ row }) => (
                <div className="text-center font-medium">
                    {row.getValue("totalUnits") || 0}
                </div>
            ),
        },
        {
            accessorKey: "bookedCount",
            header: () => <div className="text-center font-semibold text-xs uppercase tracking-wider">Status</div>,
            meta:{
                label:"Status"
            },
            cell: ({ row }) => {
                const booked = Number(row.getValue("bookedCount")) || 0
                const total = Number(row.original.totalUnits) || 0
                const percentage = total > 0 ? Math.round((booked / total) * 100) : 0
                
                return (
                    <div className="flex flex-col items-center gap-1">
                        <Badge 
                            variant="secondary" 
                            className={`px-2 py-0.5 text-[10px] font-bold ${
                                booked > 0 
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" 
                                : "bg-muted text-muted-foreground"
                            }`}
                        >
                            {booked} Booked
                        </Badge>
                        {total > 0 && (
                            <div className="text-[9px] text-muted-foreground font-medium">
                                {percentage}% Occupied
                            </div>
                        )}
                    </div>
                )
            },
        },
    ]

    return (
        <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
            {/* Debug Panel */}
            {isDebug && (
                <Card className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
                    <CardHeader className="py-2">
                        <CardTitle className="text-sm">Debug Info</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                        <p><strong>Org:</strong> {getCookie("organization")}</p>
                        <p><strong>Allowed (Cookie):</strong> {getCookie("allowed_projects")}</p>
                        <p><strong>All Projects (API):</strong> {projects.length} / {projects.length > 0 ? "Found" : "Empty"}</p>
                    </CardContent>
                </Card>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Your accessible inventory projects
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewMode("table")}>
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{projects.length}</p>
                            <p className="text-xs text-muted-foreground">Total Projects</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setUnitDetailsOpen(true)}>
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {projects.reduce((sum, p) => sum + (p.totalUnits || 0), 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Units</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="p-2.5 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {projects.reduce((sum, p) => sum + (p.bookedCount || 0), 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Booked Units</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Project List</h2>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewMode("grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "table" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewMode("table")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Project Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-muted p-6 rounded-2xl shadow-sm mb-4">
                        <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No Projects Available</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        You don't have access to any inventory projects yet. Contact your administrator to get project access.
                    </p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {projects.map((project) => (
                        <Card
                            key={project.product_id}
                            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30"
                            onClick={() => handleProjectClick(project)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        {getPropertyIcon(project.property)}
                                    </div>
                                    <Badge variant="outline" className="capitalize text-xs">
                                        {project.property || "—"}
                                    </Badge>
                                </div>
                                <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors">
                                    {project.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {project.location && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{project.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 pt-2 border-t">
                                    {project.totalUnits != null && (
                                        <div className="text-xs">
                                            <span className="font-semibold text-foreground">{project.totalUnits}</span>
                                            <span className="text-muted-foreground ml-1">units</span>
                                        </div>
                                    )}
                                    {project.blockCount != null && (
                                        <div className="text-xs">
                                            <span className="font-semibold text-foreground">{project.blockCount}</span>
                                            <span className="text-muted-foreground ml-1">blocks</span>
                                        </div>
                                    )}
                                    {project.bookedCount != null && project.bookedCount > 0 && (
                                        <Badge className="ml-auto text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200">
                                            {project.bookedCount} booked
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-muted-foreground/10 overflow-hidden">
                    <CardContent className="px-3 py-0">
                        <DataTable
                            columns={columns}
                            data={projects}
                            onRowClick={(project) => handleProjectClick(project)}
                            filterColumn="name"
                            filterPlaceholder="Filter by project name..."
                        />
                    </CardContent>
                </Card>
            )}

            {/* Total Units Detail Sheet */}
            <Sheet open={unitDetailsOpen} onOpenChange={setUnitDetailsOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] px-0 flex flex-col h-full max-h-screen">
                    <SheetHeader className="px-6 pb-2 flex-shrink-0">
                        <SheetTitle>Unit Summary Across All Projects</SheetTitle>
                        <SheetDescription>
                            Detailed breakdown of units for your accessible projects.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Search inside Sheet */}
                    <div className="px-6 py-4 flex-shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects by name or location..."
                                className="pl-9 bg-muted/30 focus-visible:ring-primary shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1 min-h-0 px-6">
                        <div className="space-y-4 py-4">
                            {filteredProjects.map((project) => (
                                <div key={project.product_id} className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-base">{project.name}</h4>
                                        <Badge variant="outline" className="capitalize">{project.property}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Total Units</p>
                                            <p className="text-lg font-bold">{project.totalUnits}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Booked Units</p>
                                            <p className="text-lg font-bold text-orange-600">{project.bookedCount}</p>
                                        </div>
                                    </div>
                                    <Separator className="my-3" />
                                    <Button 
                                        variant="link" 
                                        className="h-auto p-0 text-xs" 
                                        onClick={() => {
                                            setUnitDetailsOpen(false);
                                            handleProjectClick(project);
                                        }}
                                    >
                                        View Inventory Details →
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    )
}
