import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Plus, Info, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCookie, getPermissions } from "@/utils/cookies"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { API } from "@/config/api"
import { DataTable } from "@/components/ui/data-table"
import { toast } from "sonner"

interface MailTemplate {
    _id: string
    templateName: string
    projectId?: { _id: string; name: string }
    description: string
    subject: string
    editorType: "simple" | "design"
    body: string
    attachments: { filename: string; url: string; type: string }[]
    organization: string
    createdAt?: string
    updatedAt?: string
}

const getColumns = (
    onDelete: (template: MailTemplate) => void,
    onEdit: (template: MailTemplate) => void,
): ColumnDef<MailTemplate>[] => [
        {
            accessorKey: "templateName",
            header: "Template Name",
            meta: { label: "Template Name" },
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("templateName")}</div>
            ),
        },
        {
            id: "projectName",
            accessorFn: (row) => row.projectId?.name || "—",
            header: "Project",
            meta: { label: "Project" },
            cell: ({ row }) => (
                <div className="text-muted-foreground">
                    {row.original.projectId?.name || "—"}
                </div>
            ),
        },
        {
            accessorKey: "subject",
            header: "Subject",
            meta: { label: "Subject" },
            cell: ({ row }) => (
                <div className="text-muted-foreground max-w-[200px] truncate">
                    {row.getValue("subject")}
                </div>
            ),
        },
        {
            accessorKey: "createdAt",
            header: "Created",
            meta: { label: "Created" },
            cell: ({ row }) => {
                const date = row.getValue("createdAt") as string
                return <div>{date ? new Date(date).toLocaleDateString() : "—"}</div>
            },
        },
        {
            id: "actions",
            enableHiding: false,
            meta: { label: "Actions" },
            cell: ({ row }) => {
                const template = row.original
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
                                onClick={() => navigator.clipboard.writeText(String(template._id))}
                            >
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(template)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => onDelete(template)}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

export default function MailTemplatesListing() {
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()
    const [templates, setTemplates] = useState<MailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Mail Templates" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Manage your email templates</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
            },
        ])
    }, [setBreadcrumbs])

    const fetchTemplates = useCallback(async () => {
        try {
            const org = getCookie("organization")
            const token = getCookie("token")
            if (!org) {
                setError("Organization not found")
                setLoading(false)
                return
            }
            const response = await axios.get(
                `${API.MAIL_TEMPLATES}?organization=${org}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setTemplates(response.data.data || [])
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch templates")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTemplates()
    }, [fetchTemplates])

    const handleDelete = async (template: MailTemplate) => {
        if (!confirm(`Are you sure you want to delete "${template.templateName}"?`)) return
        try {
            const token = getCookie("token")
            const org = getCookie("organization")
            await axios.delete(`${API.getMailTemplate(template._id)}?organization=${org}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            toast.success("Template deleted successfully")
            fetchTemplates()
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete template")
        }
    }

    const handleEdit = (template: MailTemplate) => {
        navigate(`/setting/mail_templates/edit/${template._id}`)
    }

    const columns = useMemo(() => getColumns(handleDelete, handleEdit), [])

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

    const userPermissions = getPermissions()
    const canCreate = userPermissions.includes("create_mail") || userPermissions.includes("admin") || userPermissions.includes("create_team")

    return (
        <div className="flex flex-1 flex-col gap-4 px-6 py-4">

            <DataTable
                columns={columns}
                data={templates}
                initialPageSize={10}
                filterColumn="templateName"
                filterPlaceholder="Filter by template name..."
                topRightContent={
                    canCreate && (
                        <Button size="sm" className="text-xs" onClick={() => navigate("/setting/mail_templates/create")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                        </Button>
                    )
                }
            />
        </div>
    )
}
