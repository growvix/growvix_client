import { useState, useMemo } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { DataTable } from "@/components/ui/data-table"
import { toast } from "sonner"
import { useEffect } from "react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

// ─── Types ──────────────────────────────────────────────
interface LeadData {
    _id: string
    leadName: string
    uploadBy: string
    allow: string
}

const MOCK_DATA: LeadData[] = []

// ─── Column factory ──────────────────────────────────────
const getColumns = (
    onEdit: (ld: LeadData) => void,
    onDelete: (ld: LeadData) => void
): ColumnDef<LeadData>[] => [
        {
            accessorKey: "_id",
            header: "ID",
            meta: {
                label: "ID",
            },
            cell: ({ row }) => <div className="font-medium capitalize">{row.getValue("_id")}</div>,
        },
        {
            accessorKey: "leadName",
            header: "Lead name",
            meta: {
                label: "Lead name",
            },
            cell: ({ row }) => <div className="font-medium capitalize">{row.getValue("leadName")}</div>,
        },
        {
            id: "uploadBy",
            header: "Upload by",
            meta: {
                label: "Upload by",
            },
            cell: ({ row }) => <div className="font-medium capitalize">{row.getValue("uploadBy")}</div>,
        },
        {
            accessorKey: "allow",
            header: "Re-engaging",
            meta: {
                label: "Re-engaging",
            },
            cell: ({ row }) => <div>{row.getValue("allow") || "-"}</div>,
        },
    ]

// ─── Page Component ──────────────────────────────────────
export default function ImportLeads() {
    const { setBreadcrumbs } = useBreadcrumb()

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
    const [ldUsers] = useState<LeadData[]>(MOCK_DATA)

    // ── Handlers ──
    const handleEdit = (ld: LeadData) => {
        toast.info(`Edit Lead logic to be implemented for ${ld.leadName}`)
    }

    const handleDelete = async (ld: LeadData) => {
        if (!confirm(`Are you sure you want to delete Lead "${ld.leadName}"?`)) return
        toast.info("Delete Lead logic to be implemented")
    }

    const columns = useMemo(() => getColumns(handleEdit, handleDelete), [])

    // ── Render ──
    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Import Leads</h2>
            </div>

            <DataTable
                columns={columns}
                data={ldUsers}
                initialPageSize={15}
                filterColumn="leadName"
                filterPlaceholder="Search by name..."
            />
        </div>
    )
}
