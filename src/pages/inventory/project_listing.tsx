import { useEffect } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import * as React from "react"
import axios from "axios"
import { API } from "@/config/api"
import {
    type ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { useNavigate } from "react-router-dom"
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
import type { projects } from "@/types"
import { DEFAULT_PAGE_SIZE } from "@/constants"
import { DataTable } from "@/components/ui/data-table"

// Helper function to get cookie value
const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || ''
    return ''
}

export const columns: ColumnDef<projects>[] = [
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
                    Units
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => <div className="text-center font-medium">{row.getValue("totalUnits") ?? 0}</div>,
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
                        <DropdownMenuSeparator />

                        <DropdownMenuItem>View Project</DropdownMenuItem>
                        <DropdownMenuItem>Download Brochure</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

export default function ProjectListing() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [data, setData] = React.useState<projects[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')

    const navigate = useNavigate()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Project Listing" },
        ]);
    }, [setBreadcrumbs]);

    // Fetch projects from API on mount
    React.useEffect(() => {
        const fetchProjects = async () => {
            try {
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
        }
        fetchProjects()
    }, [])

    const handleRowClick = async (project: projects) => {
        const encodedId = encodeProjectId(project.product_id)
        navigate(`/project_showcase?id=${encodedId}`)
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
        </div>
    );
}