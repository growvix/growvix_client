import * as React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
    type ColumnDef,
} from "@tanstack/react-table"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import type { ProjectSummary, BookedItem, GetAllProjectsQueryResponse, GetAllProjectsQueryVariables } from "@/types"
import LoaderScreen, { HorizontalLoader } from "@/components/ui/loader-screen"
import { ArrowUpDown, Ban, Info, MoreHorizontal, Pencil, LayoutGrid, List, Building2, MapPin, Layers, X, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import axios from "axios"
import { API } from "@/config/api"
import { getCookie, getPermissions } from "@/utils/cookies"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
import { DataTable } from "@/components/ui/data-table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const GET_ALL_PROJECTS = gql`
  query GetAllProjects($organization: String!) {
    getAllProjects(organization: $organization) {
      product_id
      name
      location
      property
      img_location {
        logo
        banner
        brochure
        post
        videos
      }
      blockCount
      totalUnits
      bookedCount
      bookedUnits {
        id
        label
        type
        bookedBy {
          leadName
          leadUuid
          profileId
          phone
          userId
          userName
          bookedAt
        }
        project_name
        project_id
      }
      createdAt
    }
  }
`;


export default function ProjectListing() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [data, setData] = useState<ProjectSummary[]>([])
    const [viewMode, setViewMode] = useState<"table" | "grid">(() => {
        const saved = sessionStorage.getItem("projectListingViewMode")
        return (saved === "grid" || saved === "table") ? saved : "grid"
    })
    const [gridSearch, setGridSearch] = useState("")

    // Brochure Download Confirmation State
    const [brochureConfirmOpen, setBrochureConfirmOpen] = useState(false)
    const [selectedBrochureUrl, setSelectedBrochureUrl] = useState("")

    // Persist viewMode to sessionStorage
    useEffect(() => {
        sessionStorage.setItem("projectListingViewMode", viewMode)
    }, [viewMode])

    // Booked Units State
    const [bookedUnitsOpen, setBookedUnitsOpen] = useState(false)
    const [bookedUnitsData, setBookedUnitsData] = useState<BookedItem[]>([])
    const [bookedProjectName, setBookedProjectName] = useState('')
    const [bookedProjectId, setBookedProjectId] = useState<number>(0)
    const [searchBookedQuery, setSearchBookedQuery] = useState('')

    const filteredBookedUnitsData = useMemo(() => {
        if (!searchBookedQuery) return bookedUnitsData;
        const queryLower = searchBookedQuery.toLowerCase();
        return bookedUnitsData.filter((unit) => {
            const profileId = unit.bookedBy?.profileId?.toString() || '';
            const leadName = unit.bookedBy?.leadName?.toLowerCase() || '';
            return profileId.includes(queryLower) || leadName.includes(queryLower);
        });
    }, [bookedUnitsData, searchBookedQuery]);

    const navigate = useNavigate()
    const permissions = getPermissions()
    const role = getCookie('role')?.toLowerCase()
    const canViewInventory = permissions.includes("view_inventory") || role === 'admin' || role === 'manager'
    const canSetInactive = role === 'admin' || role === 'manager'
    const org = getCookie('organization') || ''

    const { loading: projectsLoading, error: projectsError, data: projectsData, refetch } = useQuery<GetAllProjectsQueryResponse, GetAllProjectsQueryVariables>(
        GET_ALL_PROJECTS,
        {
            variables: { organization: org },
            skip: !org || !canViewInventory,
            fetchPolicy: 'network-only'
        }
    );



    useEffect(() => {
        if (projectsData) {
            setData(projectsData.getAllProjects as ProjectSummary[]);
        }
    }, [projectsData]);

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

    const errorMsg = projectsError?.message;

    const handleEditProject = useCallback((e: React.MouseEvent, project: ProjectSummary) => {
        e.stopPropagation()
        const permissions = getPermissions()
        if (!permissions.includes("edit_inventory")) {
            toast.warning("You do not have permission to edit projects.")
            return
        }
        const encodedId = encodeProjectId(project.product_id)
        navigate(`/edit_project/${encodedId}`)
    }, [navigate])

    const handleSetInactive = async (e: React.MouseEvent, project: ProjectSummary) => {
        e.stopPropagation()
        if (!org) return;
        const token = getCookie('token')
        try {
            await axios.put(`${API.PROJECTS}/${project.product_id}?organization=${org}`, { status: 'inactive' }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Project set to inactive")
            refetch()
        } catch (error) {
            toast.error("Failed to set project inactive")
        }
    }

    const handleBookedUnitsClick = (e: React.MouseEvent, project: ProjectSummary) => {
        e.stopPropagation()
        setBookedProjectName(project.name)
        setBookedProjectId(project.product_id)
        setBookedUnitsData(project.bookedUnits || [])
        setBookedUnitsOpen(true)
    }

    const columns: ColumnDef<ProjectSummary>[] = React.useMemo(() => [
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
            meta: {
                label: "ID",
            },
            cell: ({ row }) => <div className="capitalize">{row.getValue("product_id")}</div>,
        },
        {
            accessorKey: "name",
            header: "Name",
            meta: {
                label: "Name",
            },
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
            meta: {
                label: "Location",
            },
            cell: ({ row }) => <div className="capitalize">{row.getValue("location")}</div>,
        },
        {
            accessorKey: "property",
            header: "Property",
            meta: {
                label: "Property",
            },
            cell: ({ row }) => <div className="capitalize">{row.getValue("property")}</div>,
        },
        {
            accessorKey: "blockCount",
            header: "Blocks",
            meta: {
                label: "Blocks",
            },
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
            meta: {
                label: "Total Units",
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
            meta: {
                label: "Booked Units",
            },
            cell: ({ row }) => {
                const count = row.getValue("bookedCount") as number ?? 0
                const project = row.original
                return (
                    <div className="text-center">
                        {count > 0 ? (
                            <Badge
                                variant="secondary"
                                className="cursor-pointer bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
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
            meta: {
                label: "Created At",
            },
            cell: ({ row }) => {
                const date = row.getValue("createdAt") as string
                return <div>{date ? new Date(date).toLocaleDateString() : '-'}</div>
            },
        },
        {
            id: "actions",
            enableHiding: false,
            meta: {
                label: "Actions",
            },
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
                            {canSetInactive && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-950/50" onClick={(e) => handleSetInactive(e, project)}>
                                        <Ban className="mr-2 h-4 w-4" />
                                        Set Inactive
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [handleEditProject])

    const handleRowClick = async (project: ProjectSummary) => {
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

    const filteredGridData = React.useMemo(() => {
        if (!gridSearch) return data
        const q = gridSearch.toLowerCase()
        return data.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.location && p.location.toLowerCase().includes(q))
        )
    }, [data, gridSearch])
    if (projectsLoading && data.length === 0) {
        return <LoaderScreen />
    }

    return (
        <div className="px-6 sm:px-6 mt-2 pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">Project Listing</h1>
                    <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
                        {viewMode === "grid" ? filteredGridData.length : data.length} Projects
                    </Badge>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
                        <Tabs
                            defaultValue="grid"
                            value={viewMode}
                            onValueChange={(value) => {
                                if (value) setViewMode(value as "grid" | "table")
                            }}
                        >
                            <TabsList>
                                <TabsTrigger value="grid" className="h-8 w-8 p-0">
                                    <LayoutGrid className="h-4 w-4" />
                                </TabsTrigger>


                                <TabsTrigger value="table" className="h-8 w-8 p-0">
                                    <List className="h-4 w-4" />
                                </TabsTrigger>

                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="w-full">
                {projectsLoading && <HorizontalLoader />}
            </div>

            {errorMsg ? (
                <div className="w-full text-center py-10 text-red-500">{errorMsg}</div>
            ) : viewMode === "table" ? (
                /* ── List / Table View ── no Card wrapper, clean flat look */
                <DataTable
                    columns={columns}
                    data={data}
                    initialPageSize={15}
                    filterColumn="name"
                    filterPlaceholder="Filter by name..."
                    onRowClick={handleRowClick}
                />
            ) : (
                /* ── Grid View ── */
                <div className="w-full">
                    {/* Filter bar – same position as DataTable's filter */}
                    <div className="flex justify-between gap-4 py-4 w-full">
                        <div className="relative w-full max-w-sm">
                            <Input
                                type="text"
                                placeholder="Filter by name..."
                                value={gridSearch}
                                onChange={(e) => setGridSearch(e.target.value)}
                                className="w-full pr-8 bg-input/30 dark:bg-input/50"
                            />
                            {gridSearch && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setGridSearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    {filteredGridData.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {filteredGridData.map((project) => (
                                <Card
                                    key={project.product_id}
                                    className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 relative flex flex-col"
                                    onClick={() => handleRowClick(project)}
                                >
                                    <CardHeader className="px-3.5 py-0">
                                        <div className="flex items-start justify-between">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                {project.property === 'plots' ? <Layers className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                                            </div>
                                            <Badge variant="outline" className="capitalize text-xs">
                                                {project.property || "—"}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base mt-1 group-hover:text-primary transition-colors truncate">
                                            {project.name}
                                        </CardTitle>
                                        {project.location && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{project.location}</span>
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="px-4 pt-0">
                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-3">
                                                <div className="text-xs">
                                                    <span className="font-semibold text-foreground">{project.totalUnits || 0}</span>
                                                    <span className="text-muted-foreground ml-1">units</span>
                                                </div>
                                                {(project.blockCount != null && project.blockCount > 0) && (
                                                    <div className="text-xs">
                                                        <span className="font-semibold text-foreground">{project.blockCount}</span>
                                                        <span className="text-muted-foreground ml-1">blocks</span>
                                                    </div>
                                                )}
                                                {(project.bookedCount != null && project.bookedCount > 0) && (
                                                    <Badge className="ml-auto text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200" onClick={(e) => handleBookedUnitsClick(e, project)}>
                                                        {project.bookedCount} booked
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Three dots menu */}
                                            <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-6 w-6 p-0 text-muted-foreground transition-colors hover:text-foreground">
                                                            <MoreHorizontal className="h-4 w-4" />
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
                                                        {canSetInactive && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-950/50" onClick={(e) => handleSetInactive(e, project)}>
                                                                    <Ban className="mr-2 h-4 w-4" />
                                                                    Set Inactive
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            No projects match your search "{gridSearch}".
                        </div>
                    )}
                </div>
            )}

            <div className="w-full mt-2">
                {projectsLoading && <HorizontalLoader />}
            </div>


            <Sheet open={bookedUnitsOpen} onOpenChange={setBookedUnitsOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] px-0 flex flex-col">
                    <SheetHeader className="px-6 pb-4">
                        <SheetTitle>Booked Units - {bookedProjectName}</SheetTitle>
                        <SheetDescription>
                            List of all units and plots currently booked for this project.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="px-6 pb-2 pt-0">
                        <Input
                            placeholder="Search by Profile ID or Name..."
                            value={searchBookedQuery}
                            onChange={(e) => setSearchBookedQuery(e.target.value)}
                            className="h-9"
                        />
                    </div>

                    <ScrollArea className="h-[calc(100vh-140px)] px-6 overflow-y-auto">
                        <div className="py-2 space-y-2 pr-1">
                            {filteredBookedUnitsData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                                        <Ban className="h-8 w-8 text-muted-foreground/60" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No booked units found</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {filteredBookedUnitsData.map((unit, index) => (
                                        <div key={index}>
                                            <div
                                                className="flex flex-col py-3 hover:bg-muted/50 transition-colors px-2 rounded-md justify-center"
                                            >
                                                <div className="flex items-center justify-between gap-2 cursor-pointer">
                                                    <span className="text-base font-semibold truncate">{unit.label}</span>
                                                    <Badge className="bg-zinc-200 text-black dark:bg-stone-800 dark:text-white flex items-center gap-1.5 font-medium">
                                                        <span className="text-sm">
                                                            {unit.bookedBy?.bookedAt ? new Date(unit.bookedBy.bookedAt).toLocaleDateString() : 'Booked'}
                                                        </span>
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mt-1">
                                                    {unit.bookedBy?.profileId ? (
                                                        <div className="flex flex-col gap-1">
                                                            <div
                                                                className="flex items-center gap-1.5 cursor-pointer group w-fit"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    const encodedId = encodeProjectId(unit.project_id || bookedProjectId)
                                                                    const typeQuery = unit.type === 'plot' ? `&plotId=${unit.id}` : `&unitId=${unit.id}`
                                                                    navigate(`/project_showcase?id=${encodedId}${typeQuery}`)
                                                                }}
                                                            >
                                                                <span className="font-semibold text-sm text-foreground group-hover:text-primary group-hover:underline transition-colors truncate">
                                                                    #{unit.bookedBy.profileId}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <span className="font-medium text-foreground text-xs w-10">Lead:</span>
                                                                <span className="text-xs">{unit.bookedBy?.leadName || 'Unknown'}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {index < filteredBookedUnitsData.length - 1 && <Separator />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Brochure Download Confirmation */}
            <AlertDialog open={brochureConfirmOpen} onOpenChange={setBrochureConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Download</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to download the project brochure? This will download the file to your device.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            const a = document.createElement('a');
                            a.href = selectedBrochureUrl;
                            a.download = selectedBrochureUrl.split('/').pop() || 'Brochure';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setBrochureConfirmOpen(false);
                        }}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}