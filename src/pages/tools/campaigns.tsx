import { useState, useEffect } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { getCookie } from "@/utils/cookies"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
import { Popover,
  PopoverContent,
  PopoverTrigger,} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import LoaderScreen, { HorizontalLoader } from "@/components/ui/loader-screen"
import { Plus, Search, Trash2, MoreHorizontal } from "lucide-react"
import axios from "axios"
import { API } from "@/config/api"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"


type InputChannel = {
    id: string
    publisher: string
    source: string
    subSource: string
    medium: string
    campaignType: string
    integrationType: string
    redirectionUrl: string
}

type Campaign = {
    _id: string
    uuid: string
    campaignName: string
    project?: {
        projectId: string
        projectName: string
    }
    inputChannels: InputChannel[]
    createdAt: string
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
    onDeactivate: (campaign: Campaign) => void
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
        accessorKey: "inputChannels",
        header: "Channels",
        meta: {
            label: "Channels"  
        },
        cell: ({ row }) => {
            const channels = row.original.inputChannels
            return <Badge variant="secondary">{channels?.length || 0} Channels</Badge>
        },
    },
    {
        id: "status",
        header: "Status",
        meta: {
            label: "Status"  
        },
        cell: () => (
            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
        ),
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
                                onClick={() => onEdit(campaign)}
                            >
                                Edit
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-full justify-start font-normal h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => onDeactivate(campaign)}
                            >
                                Deactivate
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
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("details")

    const columns = getColumns(
        (campaign) => {
            toast.info(`Edit campaign: ${campaign.campaignName}`)
        },
        (campaign) => {
            toast.warning(`Deactivate campaign: ${campaign.campaignName}`)
        }
    )
    
    const [newCampaignName, setNewCampaignName] = useState("")
    const [selectedProjectId, setSelectedProjectId] = useState<string>("none")
    const [inputChannels, setInputChannels] = useState<InputChannel[]>([])

    // New Channel form state
    const [newChannel, setNewChannel] = useState<Omit<InputChannel, "id">>({
        publisher: "",
        source: "",
        subSource: "",
        medium: "",
        campaignType: "",
        integrationType: "website",
        redirectionUrl: ""
    })

    const [searchQuery, setSearchQuery] = useState("")
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [projects, setProjects] = useState<ProjectSummary[]>([])
    const [sources, setSources] = useState<Source[]>([])
    
    const [loadingCampaigns, setLoadingCampaigns] = useState(true)
    const [loadingProjects, setLoadingProjects] = useState(true)
    const [creatingCampaign, setCreatingCampaign] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "Automation", href: "tools/automation" },
            {label: "Campaigns"},
            { label: (
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
            ) },
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

    const fetchProjects = async () => {
        if (!organization) return
        setLoadingProjects(true)
        try {
            const token = getCookie("token")
            const response = await axios.get(`${API.PROJECTS}?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProjects(response.data.data || [])
        } catch (err: unknown) {
            const error = err as any
            console.error("Failed to fetch projects:", error)
        } finally {
            setLoadingProjects(false)
        }
    }

    const fetchSources = async () => {
        if (!organization) return
        try {
            const token = getCookie("token")
            const response = await axios.get(`${API.SOURCES}?organization=${organization}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setSources(response.data.data || [])
        } catch (err: unknown) {
            const error = err as any
            console.error("Failed to fetch sources:", error)
        }
    }

    useEffect(() => {
        fetchCampaigns()
        fetchProjects()
        fetchSources()
    }, [organization])

    const handleAddChannelToLocal = () => {
        if (!newChannel.publisher || !newChannel.medium) {
            toast.error("Please fill required channel fields (Publisher, Medium)")
            return
        }
        
        const channel: InputChannel = {
            ...newChannel,
            id: Math.random().toString(36).substr(2, 9)
        }
        
        setInputChannels([...inputChannels, channel])
        setNewChannel({
            publisher: "",
            source: "",
            subSource: "",
            medium: "",
            campaignType: "",
            integrationType: "website",
            redirectionUrl: ""
        })
    }

    const handleSaveCampaign = async () => {
        if (!newCampaignName.trim()) {
            toast.error("Campaign name is required")
            setActiveTab("details")
            return
        }

        const project = projects.find(p => p.product_id.toString() === selectedProjectId)

        setCreatingCampaign(true)
        try {
            const token = getCookie("token")
            const response = await axios.post(`${API.CAMPAIGNS}?organization=${organization}`, {
                campaignName: newCampaignName.trim(),
                projectId: project ? project.product_id.toString() : undefined,
                projectName: project ? project.name : undefined,
                inputChannels: inputChannels.map(({ id, ...rest }) => rest) // eslint-disable-line @typescript-eslint/no-unused-vars
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.data.success) {
                toast.success("Campaign created successfully")
                setIsSheetOpen(false)
                resetForm()
                fetchCampaigns()
            }
        } catch (err: unknown) {
            const error = err as any
            toast.error(error.response?.data?.message || "Failed to create campaign")
        } finally {
            setCreatingCampaign(false)
        }
    }

    const resetForm = () => {
        setNewCampaignName("")
        setSelectedProjectId("none")
        setInputChannels([])
        setActiveTab("details")
    }

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

                <Sheet open={isSheetOpen} onOpenChange={(open) => {
                    if (!open) resetForm()
                    setIsSheetOpen(open)
                }}>
                    <SheetTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Campaign
                        </Button>
                    </SheetTrigger>
                    
                    <SheetContent side="right" className="sm:max-w-xl md:max-w-2xl w-full flex flex-col p-6">
                        <SheetHeader className="mb-4">
                            <SheetTitle>New Campaign</SheetTitle>
                            <SheetDescription>Configure a new campaign and specify its integration sources.</SheetDescription>
                        </SheetHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">Campaign Details</TabsTrigger>
                                <TabsTrigger value="channels" disabled={!newCampaignName}>Input Channels</TabsTrigger>
                            </TabsList>
                            
                            <div className="flex-1 overflow-y-auto py-1">
                                <TabsContent value="details" className="space-y-6 m-0 border-0 p-0">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="campaignName">Campaign Name <span className="text-destructive">*</span></Label>
                                            <Input 
                                                id="campaignName"
                                                placeholder="e.g. Summer Sale 2024" 
                                                value={newCampaignName}
                                                onChange={e => setNewCampaignName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="projectSelect">Project (Optional)</Label>
                                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                                <SelectTrigger id="projectSelect">
                                                    <SelectValue placeholder="Select a project" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Project</SelectItem>
                                                    {projects.map(p => (
                                                        <SelectItem key={p.product_id} value={p.product_id.toString()}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Select a project if this campaign is tied to specific inventory.</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="channels" className="space-y-6 m-0 border-0 p-0">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Add Source Channel</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Publisher <span className="text-destructive">*</span></Label>
                                                    <Input placeholder="e.g. Google Maps" value={newChannel.publisher} onChange={e => setNewChannel({...newChannel, publisher: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Medium <span className="text-destructive">*</span></Label>
                                                    <Input placeholder="e.g. organic" value={newChannel.medium} onChange={e => setNewChannel({...newChannel, medium: e.target.value})} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Source</Label>
                                                    <Select value={newChannel.source} onValueChange={(v) => setNewChannel({...newChannel, source: v})}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select source..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {sources.map(s => (
                                                                <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                                                            ))}
                                                            {sources.length === 0 && (
                                                                <div className="text-xs p-2 text-muted-foreground">No sources available. Create one in Source Management.</div>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Sub Source</Label>
                                                    <Input placeholder="e.g. landing-page-2" value={newChannel.subSource} onChange={e => setNewChannel({...newChannel, subSource: e.target.value})} />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Integration Type</Label>
                                                <Select value={newChannel.integrationType} onValueChange={v => setNewChannel({...newChannel, integrationType: v})}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="website">Website</SelectItem>
                                                        <SelectItem value="api">API / Webhook</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <Button type="button" variant="secondary" onClick={handleAddChannelToLocal} className="w-full">
                                                Add Channel
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {inputChannels.length > 0 && (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Publisher</TableHead>
                                                    <TableHead>Source</TableHead>
                                                    <TableHead>Medium</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {inputChannels.map(ch => (
                                                    <TableRow key={ch.id}>
                                                        <TableCell className="font-medium">{ch.publisher}</TableCell>
                                                        <TableCell>
                                                            {ch.source}
                                                            {ch.subSource && <span className="text-muted-foreground text-xs ml-1">({ch.subSource})</span>}
                                                        </TableCell>
                                                        <TableCell>{ch.medium}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => setInputChannels(inputChannels.filter(x => x.id !== ch.id))}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
                            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                            <Button disabled={creatingCampaign} onClick={handleSaveCampaign}>
                                {creatingCampaign ? "Saving..." : "Save Campaign"}
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 mt-0">
                <CardContent className="p-0 overflow-auto flex-1 relative ">
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
