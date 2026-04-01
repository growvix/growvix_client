import { useState, useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { DataTable } from "@/components/ui/data-table"
import { useEffect } from "react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Info, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { getCookie } from "@/utils/cookies"
import axios from "axios"
import { API_URL } from "@/config/api"
import { Badge } from "@/components/ui/badge"

// ─── Types ──────────────────────────────────────────────
interface BulkUploadData {
    _id: string
    uploadDate: string
    fileName: string
    totalLeads: number
    uploadedLeads: number
    existingLeads: number
    errorLeads: number
    source: string
    campaign: string
    initiatedBy: string
    assignedTo: string
    status: string
    allowReEngage: string
}

// ─── Helper ──────────────────────────────────────────────
const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
    } catch {
        return "-"
    }
}

// ─── Column factory ──────────────────────────────────────
const getColumns = (): ColumnDef<BulkUploadData>[] => [
    {
        accessorKey: "uploadDate",
        header: "Upload Date",
        meta: { label: "Upload Date" },
        cell: ({ row }) => (
            <div className="font-medium text-sm whitespace-nowrap">
                {formatDate(row.getValue("uploadDate"))}
            </div>
        ),
    },
    {
        accessorKey: "totalLeads",
        header: "Detailed Leads Count",
        meta: { label: "Detailed Leads Count" },
        cell: ({ row }) => {
            const data = row.original
            return (
                <div className="text-sm space-y-0.5 leading-relaxed">
                    <div>Total Leads: <span className="font-semibold">{data.totalLeads}</span></div>
                    <div>Existing Leads: <span className="font-semibold">{data.existingLeads}</span></div>
                    <div>Leads With Errors: <span className="font-semibold">{data.errorLeads}</span></div>
                    <div>Uploaded Leads: <span className="font-semibold">{data.uploadedLeads}</span></div>
                    {data.source && <div>Source: <span className="font-semibold">{data.source}</span></div>}
                    {data.campaign && <div>Campaign: <span className="font-semibold">{data.campaign}</span></div>}
                </div>
            )
        },
    },
    {
        accessorKey: "initiatedBy",
        header: "Initiated By",
        meta: { label: "Initiated By" },
        cell: ({ row }) => (
            <div className="font-medium text-sm capitalize">
                {row.getValue("initiatedBy") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "assignedTo",
        header: "Assigned To",
        meta: { label: "Assigned To" },
        cell: ({ row }) => (
            <div className="text-sm">
                {row.getValue("assignedTo") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const variant = status === "Success"
                ? "default"
                : status === "Error"
                    ? "destructive"
                    : "secondary"
            return <Badge variant={variant} className="capitalize">{status}</Badge>
        },
    },
    {
        accessorKey: "fileName",
        header: "Files",
        meta: { label: "Files" },
        cell: ({ row }) => {
            const fileName = row.getValue("fileName") as string
            return (
                <div className="text-sm space-y-1">
                    <div className="flex items-center gap-1.5">
                        <Download size={13} className="text-blue-600" />
                        <span className="truncate max-w-[160px]" title={fileName}>
                            {fileName || "Import File"}
                        </span>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "allowReEngage",
        header: "Allow to Re-engage",
        meta: { label: "Allow to Re-engage" },
        cell: ({ row }) => (
            <div className="font-medium text-sm">
                {row.getValue("allowReEngage") || "Yes"}
            </div>
        ),
    },
]

// ─── Page Component ──────────────────────────────────────
export default function ImportLeads() {
    const { setBreadcrumbs } = useBreadcrumb()
    const navigate = useNavigate()

    useEffect(() => {
        setBreadcrumbs([
            { label: "Settings", href: "/settings" },
            { label: "Import Leads" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Import leads</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])


    // ── Table data state ──
    const [uploads, setUploads] = useState<BulkUploadData[]>([])
    const [loading, setLoading] = useState(true)

    const columns = useMemo(() => getColumns(), [])

    useEffect(() => {
        async function fetchBulkUploads() {
            try {
                const organization = getCookie("organization") || ""
                const token = getCookie("token") || ""
                if (!organization || !token) return

                const response = await axios.get(
                    `${API_URL}/api/leads/bulk-uploads/${organization}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )

                if (response.data?.success && response.data.data?.uploads) {
                    setUploads(response.data.data.uploads)
                }
            } catch (err) {
                console.error("Failed to fetch bulk uploads", err)
            } finally {
                setLoading(false)
            }
        }
        fetchBulkUploads()
    }, [])

    // ── Render ──
    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                    Loading uploads...
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={uploads}
                    initialPageSize={15}
                    filterColumn="initiatedBy"
                    filterPlaceholder="Search by name..."
                    topRightContent={
                        <Button 
                            variant="default"
                            className="shadow-sm text-xs"
                            size="sm"
                            onClick={() => navigate('/setting/import_leads/new')}
                        >
                            New Upload
                        </Button>
                    }
                />
            )}
        </div>
    )
}
