import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    MoreHorizontal,
    Trash2,
    ExternalLink,
    ArrowLeft,
    Globe,
    RefreshCcw,
    CircleCheck,
    CircleX,
    Loader2,
    X,
    Calendar,
    User,
    Key,
    Activity,
    Copy,
    Check
} from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { googleAdsService } from "@/services/googleAds.service"
import { GoogleAdsStepper } from "@/components/integrations/google-ads/google_ads_stepper"
import { toast } from "sonner"
import { format } from "date-fns"
import { type ColumnDef } from "@tanstack/react-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

export default function GoogleAdsIntegrationList() {
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()
    const [integrations, setIntegrations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isStepperOpen, setIsStepperOpen] = useState(false)
    const [viewingIntegration, setViewingIntegration] = useState<any | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Third-Party Integration", href: "/tools/third_party_integration" },
            { label: "Google Ads Integration" },
            { label: <TooltipProvider><Tooltip><TooltipTrigger><Info className="h-4.5 w-4.5 mt-1.5" /></TooltipTrigger><TooltipContent><p>Google Ads Integration</p></TooltipContent></Tooltip></TooltipProvider> }

        ])
        fetchIntegrations()
    }, [setBreadcrumbs])

    const fetchIntegrations = async () => {
        setLoading(true)
        try {
            const res = await googleAdsService.getIntegrations()
            const data = res.data || []
            setIntegrations(data)
            if (data.length === 0) {
                toast.warning("No integrations found yet. Create one to get started.")
            }
        } catch (error) {
            console.error("Failed to fetch integrations:", error)
            toast.warning("Could not load integrations. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this integration?")) return
        try {
            await googleAdsService.deleteIntegration(id)
            toast.success("Integration deleted")
            fetchIntegrations()
        } catch (error) {
            toast.error("Failed to delete integration")
        }
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (!currentStatus) {
            // If it is inactive, navigating to the test page first
            navigate(`/tools/third_party_integration/google_ads/test/${id}`)
            return
        }

        try {
            await googleAdsService.updateIntegration(id, { status: false })
            toast.success("Integration deactivated")
            fetchIntegrations()
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const handleViewDetails = (item: any) => {
        setViewingIntegration(item)
        setIsDetailsOpen(true)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.info("Copied to clipboard")
    }

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            accessorKey: "campaign_id.campaignName",
            header: "CAMPAIGN",
            meta: { label: "Campaign" },
            cell: ({ row }) => (
                <div className="font-semibold">{row.original.campaign_id?.campaignName || 'N/A'}</div>
            )
        },
        {
            accessorKey: "campaignName",
            header: "SOURCE",
            meta: { label: "Source" },
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-100/50 text-blue-700 border-none px-2 rounded font-bold uppercase text-[10px]">
                        {row.original.source}
                    </Badge>
                    <span className="font-medium">{row.original.campaignName}</span>
                </div>
            )
        },
        {
            accessorKey: "sub_source",
            header: "SUB SOURCE",
            meta: { label: "Sub Source" },
            cell: ({ row }) => (
                <div className="font-mono text-xs text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded w-fit">
                    {row.original.sub_source}
                </div>
            )
        },
        {
            accessorKey: "project_id.name",
            header: "INVENTORY PROJECT",
            meta: { label: "Inventory Project" },
            cell: ({ row }) => (
                <div className="text-slate-600 dark:text-slate-400 font-medium">
                    {row.original.project_id?.name || 'N/A'}
                </div>
            )
        },

        {
            accessorKey: "createdAt",
            header: "CREATED AT",
            meta: { label: "Created At" },
            cell: ({ row }) => (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {row.original.createdAt ? format(new Date(row.original.createdAt), "MMM dd, yyyy HH:mm") : 'N/A'}
                </div>
            )
        },
        {
            accessorKey: "created_by_name",
            header: "CREATED BY",
            meta: { label: "Created By" },
            cell: ({ row }) => (
                <div className="text-xs font-medium flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {row.original.created_by_name || 'System'}
                </div>
            )
        },
        {
            accessorKey: "status",
            header: "STATUS",
            meta: { label: "Status" },
            cell: ({ row }) => (
                <button
                    onClick={() => toggleStatus(row.original._id, row.original.status)}
                    className="focus:outline-none transition-transform active:scale-95"
                >
                    {row.original.status ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full outline outline-1 outline-green-200 dark:outline-green-800 bg-green-100/50 text-green-700 dark:text-green-400 dark:bg-green-900/20">
                            <CircleCheck className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-tight">Active</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full outline outline-1 outline-red-200 dark:outline-red-800 bg-red-100/50 text-red-600 dark:text-red-400 dark:bg-red-900/20">
                            <CircleX className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-tight">Inactive</span>
                        </div>
                    )}
                </button>
            )
        },
        {
            id: "actions",
            header: "ACTIONS",
            enableHiding: false,
            cell: ({ row }) => (
                <div className="text-right pr-6">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-lg border-slate-200 dark:border-white/10 p-1">
                            <DropdownMenuItem
                                className="gap-2 cursor-pointer py-2 focus:bg-slate-100 dark:focus:bg-slate-800"
                                onClick={() => handleViewDetails(row.original)}
                            >
                                <ExternalLink className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                            <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive cursor-pointer py-2 font-semibold flex items-center focus:bg-red-50 dark:focus:bg-red-950/20"
                                onClick={() => handleDelete(row.original._id)}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ], [toggleStatus, handleDelete])

    return (
        <div className="flex flex-1 flex-col gap-6 px-8 py-6 max-w-[1400px] mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/tools/third_party_integration")}
                        className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Google Ads Integrations</h1>
                        <p className="text-muted-foreground text-sm">Manage your connected Google Ads lead forms</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchIntegrations}
                        disabled={loading}
                        className="gap-2 font-semibold h-10 border-slate-200 dark:border-white/10"
                    >
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsStepperOpen(true)}
                        className="gap-2 font-semibold h-10 shadow-md transition-all hover:scale-[1.02]"
                    >
                        <Plus className="h-4 w-4" />
                        Create Page
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-gray-900 overflow-hidden">
                <CardContent className="px-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground font-medium">Loading integrations...</p>
                        </div>
                    ) : integrations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                                <Globe className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No integrations found</h3>
                            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                                Connect your first Google Ads lead form to start automatically syncing leads into your CRM.
                            </p>
                            <Button
                                onClick={() => setIsStepperOpen(true)}
                                className="gap-2 font-bold px-8 h-12 rounded-xl"
                            >
                                <Plus className="h-5 w-5" />
                                Create your first integration
                            </Button>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={integrations}
                            filterPlaceholder="Search by campaign, source, or sub-source..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* View Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl border-none shadow-2xl bg-white dark:bg-slate-950">
                    <div className="bg-gray-900/10 dark:bg-muted/70 p-6 flex justify-between items-center border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                <Globe className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-slate-900 dark:text-white text-xl font-bold">Google Ads Integration</DialogTitle>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Integration details and credentials</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="bg-gray-50 dark:bg-muted/30 rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm overflow-hidden relative">
                            {/* Status Badge */}
                            <div className="absolute top-6 right-6">
                                {viewingIntegration?.status ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-bold text-[10px] uppercase tracking-wider">
                                        <Activity className="h-3 w-3" />
                                        Active
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold text-[10px] uppercase tracking-wider">
                                        <X className="h-3 w-3" />
                                        Inactive
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Campaign</p>
                                    <p className="text-base font-bold text-slate-900 dark:text-white">{viewingIntegration?.campaign_id?.campaignName || 'N/A'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Source</p>
                                    <p className="text-base font-bold text-slate-900 dark:text-white">Google Ads</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Form Name</p>
                                    <p className="text-base font-bold text-slate-900 dark:text-white">{viewingIntegration?.sub_source || 'N/A'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Inventory Project</p>
                                    <p className="text-base font-bold text-slate-900 dark:text-white">{viewingIntegration?.project_id?.name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1.5 group cursor-pointer" onClick={() => copyToClipboard(viewingIntegration?.form_id)}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Google Form ID</p>
                                        <Copy className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="text-sm font-mono text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-white/10">
                                        {viewingIntegration?.form_id}
                                    </p>
                                </div>
                                <div className="space-y-1.5 group cursor-pointer" onClick={() => copyToClipboard(viewingIntegration?.secret_key)}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Secret Key</p>
                                        <Key className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="text-xs font-mono text-blue-600 dark:text-blue-400 break-all bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                        {viewingIntegration?.secret_key}
                                    </p>
                                </div>
                            </div>
                        </div>


                    </div>
                </DialogContent>
            </Dialog>

            <GoogleAdsStepper
                open={isStepperOpen}
                onOpenChange={setIsStepperOpen}
                onSuccess={fetchIntegrations}
            />
        </div>
    )
}
