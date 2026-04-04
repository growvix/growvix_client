import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { getCookie } from "@/utils/cookies"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DataTable } from "@/components/ui/data-table"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import LoaderScreen, { HorizontalLoader } from "@/components/ui/loader-screen"
import { Plus, Search, Trash2, MoreHorizontal, CircleCheck, CircleX } from "lucide-react"
import axios from "axios"
import { API } from "@/config/api"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"


type SubSource = {
    uuid: string
    subSourceName: string
    project?: {
        projectName: string
        projectId: string
    }
    medium?: string
    publisher?: string
    integrationType: string
}

type SourceConfig = {
    uuid: string
    sourceName: string
    stageName?: string
    stageColor?: string
    subSources: SubSource[]
}

type Campaign = {
    _id: string
    uuid: string
    campaignName: string
    project?: {
        projectId: string
        projectName: string
    }
    sources: SourceConfig[]
    createdAt: string
    status?: boolean
}

type ProjectSummary = {
    product_id: number
    name: string
}

type Source = {
    _id: string
    name: string
}
export const getColumns = (
    onEdit: (campaign: Campaign) => void,
    onToggleStatus: (campaign: Campaign) => void
): ColumnDef<Campaign>[] => [
        {
            accessorKey: "campaignName",
            header: "Campaign Name",
            cell: ({ row }) => <div className="font-semibold">{row.getValue("campaignName")}</div>,
            meta: {
                label: "Campaign Name"
            }
        },
        {
            accessorKey: "project.projectName",
            header: "Project",
            meta: {
                label: "Project"
            },
            cell: ({ row }) => {
                const project = row.original.project
                return project ? (
                    <span>{project.projectName}</span>
                ) : (
                    <span className="text-muted-foreground italic text-sm">No Project</span>
                )
            },
        },
        {
            accessorKey: "sources",
            header: "Sources",
            meta: {
                label: "Sources"
            },
            cell: ({ row }) => {
                const sources = row.original.sources || []
                const subCount = sources.reduce((acc, s) => acc + (s.subSources?.length || 0), 0)
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                            {sources.slice(0, 2).map(s => (
                                <Badge key={s.uuid} variant="outline" className="text-xs bg-muted/30">
                                    {s.sourceName}
                                </Badge>
                            ))}
                            {sources.length > 2 && <Badge variant="outline" className="text-xs text-muted-foreground">+{sources.length - 2}</Badge>}
                            {sources.length === 0 && <span className="text-muted-foreground text-xs italic">None</span>}
                        </div>
                        <span className="text-xs text-muted-foreground pl-1">{subCount} Sub-sources</span>
                    </div>
                )
            },
        },
        {
            id: "status",
            header: "Status",
            meta: {
                label: "Status"
            },
            cell: ({ row }) => {
                const isActive = row.original.status !== false; // Default to active if undefined
                return isActive ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full outline outline-1 outline-green-200 dark:outline-green-800 bg-green-100/50 text-green-700 dark:text-green-400 dark:bg-green-900/20 w-fit">
                        <CircleCheck className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">Active</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full outline outline-1 outline-red-200 dark:outline-red-800 bg-red-100/50 text-red-600 dark:text-red-400 dark:bg-red-900/20 w-fit">
                        <CircleX className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">Inactive</span>
                    </div>
                )
            },
        },
        {
            id: "actions",
            meta: {
                label: "Actions"
            },
            cell: ({ row }) => {
                const campaign = row.original
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-40 p-2">
                            <div className="flex flex-col gap-1">
                                <div className="px-2 py-1.5 text-sm font-semibold">Actions</div>
                                <div className="h-px bg-muted -mx-1 my-1" />
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start font-normal h-8 px-2"
                                    onClick={() => navigator.clipboard.writeText(campaign.uuid || "")}
                                >
                                    Copy UUID
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start font-normal h-8 px-2"
                                    onClick={() => window.open(`/automation/campaigns/edit/${campaign._id}`, "_self")}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start font-normal h-8 px-2 ${campaign.status !== false ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-950/50' : 'text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-950/50'}`}
                                    onClick={() => onToggleStatus(campaign)}
                                >
                                    {campaign.status !== false ? "Set Inactive" : "Set Active"}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                )
            },
        },
    ]

export default function Campaigns() {
    const { setBreadcrumbs } = useBreadcrumb()
    const organization = getCookie("organization") || ""

    // UI States
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loadingCampaigns, setLoadingCampaigns] = useState(true)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Automation", href: "tools/automation" },
            { label: "Campaigns" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p>Campaigns</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    const fetchCampaigns = async () => {
        if (!organization) return
        setLoadingCampaigns(true)
        try {
            const token = getCookie("token")
            const response = await axios.get(`${API.CAMPAIGNS}?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setCampaigns(response.data.data || [])
        } catch (err: unknown) {
            const error = err as any
            console.error("Failed to fetch campaigns:", error)
            toast.error(error.response?.data?.message || "Failed to fetch campaigns")
        } finally {
            setLoadingCampaigns(false)
        }
    }

    useEffect(() => {
        fetchCampaigns()
    }, [organization])

    const handleEditCampaign = (campaign: Campaign) => {
        navigate(`/automation/campaigns/edit/${campaign._id}`)
    }

    const handleToggleStatus = async (campaign: Campaign) => {
        const newStatus = campaign.status === false ? true : false;
        try {
            const token = getCookie("token")
            await axios.put(`${API.CAMPAIGNS}/${campaign._id}?organization=${organization}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            toast.success(`Campaign marked as ${newStatus ? 'Active' : 'Inactive'}`)
            fetchCampaigns()
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update campaign status")
        }
    }

    const columns = getColumns(handleEditCampaign, handleToggleStatus)

    const filteredCampaigns = campaigns.filter(c =>
        c.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.project && c.project.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (loadingCampaigns && campaigns.length === 0) {
        return <LoaderScreen />
    }

    return (
        <div className="flex flex-col h-full space-y-4 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage marketing campaigns and lead source tracking.
                    </p>
                </div>

                <Button className="gap-2" onClick={() => navigate("/automation/campaigns/create")}>
                    <Plus className="h-4 w-4" />
                    Create Campaign
                </Button>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 mt-0">
                <CardContent className="px-5 overflow-auto flex-1 relative ">
                    {loadingCampaigns && <div className="absolute inset-x-0 top-0"><HorizontalLoader /></div>}
                    <DataTable
                        topLeftContent={
                            <div className="relative w-72 pl-4">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground ml-5" />
                                <Input
                                    placeholder="Search campaigns..."
                                    className="pl-9 bg-input/30 dark:bg-input/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        }
                        data={filteredCampaigns}
                        columns={columns}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
