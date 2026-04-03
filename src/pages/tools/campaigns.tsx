import { useState, useEffect } from "react"
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
import { Popover,
  PopoverContent,
  PopoverTrigger,} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import LoaderScreen, { HorizontalLoader } from "@/components/ui/loader-screen"
import { Plus, Search, Trash2, MoreHorizontal, CircleCheck, CircleX } from "lucide-react"
import axios from "axios"
import { API } from "@/config/api"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"


type InputChannel = {
    id: string
    publisher?: string
    source: string
    subSource: string
    medium?: string
    campaignType: string
    integrationType: string
    redirectionUrl: string
    projectName?: string
    projectId?: string
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
                                onClick={() => onEdit(campaign)}
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
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("details")

    const handleEditCampaign = (campaign: Campaign) => {
        setEditingCampaign(campaign)
        setNewCampaignName(campaign.campaignName)
        setInputChannels(campaign.inputChannels)
        setSelectedProjectId(campaign.project?.projectId || "none") // Optional top-level project
        setIsSheetOpen(true)
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
    
    const [newCampaignName, setNewCampaignName] = useState("")
    const [selectedProjectId, setSelectedProjectId] = useState<string>("none")
    const [inputChannels, setInputChannels] = useState<InputChannel[]>([])
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
    const [editingChannelId, setEditingChannelId] = useState<string | null>(null)

    // New Channel form state
    const [newChannel, setNewChannel] = useState<Omit<InputChannel, "id">>({
        publisher: "",
        source: "",
        subSource: "",
        medium: "",
        campaignType: "",
        integrationType: "website",
        redirectionUrl: "",
        projectId: "none",
        projectName: ""
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
        if (!newChannel.source || !newChannel.subSource || newChannel.projectId === "none") {
            toast.error("Please fill required channel fields (Project, Source, Sub Source)")
            return
        }
        
        if (editingChannelId) {
            setInputChannels(prev => prev.map(ch => 
                ch.id === editingChannelId ? { ...newChannel, id: ch.id } : ch
            ))
            setEditingChannelId(null)
            toast.success("Channel updated")
        } else {
            const channel: InputChannel = {
                ...newChannel,
                id: Math.random().toString(36).substr(2, 9)
            }
            setInputChannels([...inputChannels, channel])
            toast.success("Channel added")
        }
        
        setNewChannel({
            publisher: "",
            source: "",
            subSource: "",
            medium: "",
            campaignType: "",
            integrationType: "website",
            redirectionUrl: "",
            projectId: "none",
            projectName: ""
        })
    }

    const editLocalChannel = (channel: InputChannel) => {
        setEditingChannelId(channel.id)
        setNewChannel({
            publisher: channel.publisher || "",
            source: channel.source,
            subSource: channel.subSource,
            medium: channel.medium || "",
            campaignType: channel.campaignType,
            integrationType: channel.integrationType,
            redirectionUrl: channel.redirectionUrl,
            projectId: channel.projectId || "none",
            projectName: channel.projectName || ""
        })
        // Scroll to top of form
         const sheetContent = document.querySelector('[data-radix-scroll-area-viewport]');
         if (sheetContent) sheetContent.scrollTop = 0;
    }

    const handleSaveCampaign = async () => {
        if (!newCampaignName.trim()) {
            toast.error("Campaign name is required")
            setActiveTab("details")
            return
        }

        const topProject = projects.find(p => p.product_id.toString() === selectedProjectId)

        setCreatingCampaign(true)
        try {
            const token = getCookie("token")
            const payload = {
                campaignName: newCampaignName.trim(),
                projectId: topProject ? topProject.product_id.toString() : undefined,
                projectName: topProject ? topProject.name : undefined,
                inputChannels: inputChannels.map(({ id, ...rest }) => rest)
            }

            let response;
            if (editingCampaign) {
                response = await axios.put(`${API.CAMPAIGNS}/${editingCampaign._id}?organization=${organization}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            } else {
                response = await axios.post(`${API.CAMPAIGNS}?organization=${organization}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            }

            if (response.data.success) {
                toast.success(editingCampaign ? "Campaign updated successfully" : "Campaign created successfully")
                setIsSheetOpen(false)
                resetForm()
                fetchCampaigns()
            }
        } catch (err: unknown) {
            const error = err as any
            toast.error(error.response?.data?.message || "Failed to save campaign")
        } finally {
            setCreatingCampaign(false)
        }
    }

    const resetForm = () => {
        setNewCampaignName("")
        setSelectedProjectId("none")
        setInputChannels([])
        setEditingCampaign(null)
        setEditingChannelId(null)
        setActiveTab("details")
        setNewChannel({
            publisher: "",
            source: "",
            subSource: "",
            medium: "",
            campaignType: "",
            integrationType: "website",
            redirectionUrl: "",
            projectId: "none",
            projectName: ""
        })
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
                            <SheetTitle>{editingCampaign ? "Edit Campaign" : "New Campaign"}</SheetTitle>
                            <SheetDescription>
                                {editingCampaign ? "Modify your campaign settings and sources." : "Configure a new campaign and specify its integration sources."}
                            </SheetDescription>
                        </SheetHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">Campaign Details</TabsTrigger>
                                <TabsTrigger value="channels" disabled={!newCampaignName}>Input Channels</TabsTrigger>
                            </TabsList>
                            
                            <div className="flex-1 overflow-y-auto py-1">
                                <TabsContent value="details" className="space-y-6 m-0 border-0 p-0">
                                    <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="campaignName">Campaign Name <span className="text-destructive">*</span></Label>
                                            <Input 
                                                id="campaignName"
                                                placeholder="e.g. Online or Offline" 
                                                value={newCampaignName}
                                                onChange={e => setNewCampaignName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="projectSelect">Project (Optional)</Label>
                                            <Select value={selectedProjectId} onValueChange={(v) => {
                                                setSelectedProjectId(v)
                                                // Pre-fill the channel project if it's currently empty/none
                                                if (newChannel.projectId === "none" && v !== "none") {
                                                     const p = projects.find(x => x.product_id.toString() === v)
                                                     setNewChannel(prev => ({...prev, projectId: v, projectName: p?.name || ""}))
                                                }
                                            }}>
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
                                    <div className="grid gap-4 py-4">
                                        <div className="font-semibold text-lg border-b pb-2">
                                            {editingChannelId ? "Edit Source Channel" : "Add Source Channel"}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Project <span className="text-destructive">*</span></Label>
                                                <Select 
                                                    value={newChannel.projectId} 
                                                    onValueChange={(v) => {
                                                        const p = projects.find(x => x.product_id.toString() === v)
                                                        setNewChannel({...newChannel, projectId: v, projectName: p?.name || ""})
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a project" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {projects.map(p => (
                                                            <SelectItem key={p.product_id} value={p.product_id.toString()}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Source <span className="text-destructive">*</span></Label>
                                                <Select value={newChannel.source} onValueChange={(v) => setNewChannel({...newChannel, source: v})}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select source..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {sources.map(s => (
                                                            <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Sub Source <span className="text-destructive">*</span></Label>
                                                <Input placeholder="e.g. landing-page-2" value={newChannel.subSource} onChange={e => setNewChannel({...newChannel, subSource: e.target.value})} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Publisher <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                                <Input placeholder="e.g. Google Maps" value={newChannel.publisher} onChange={e => setNewChannel({...newChannel, publisher: e.target.value})} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Medium <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                                <Input placeholder="e.g. organic" value={newChannel.medium} onChange={e => setNewChannel({...newChannel, medium: e.target.value})} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Integration Type</Label>
                                                <Select value={newChannel.integrationType} onValueChange={v => setNewChannel({...newChannel, integrationType: v})}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select integration type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="website">Website</SelectItem>
                                                        <SelectItem value="api">API / Webhook</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 mt-2">
                                            {editingChannelId && (
                                                <Button type="button" variant="outline" onClick={() => {
                                                    setEditingChannelId(null)
                                                    setNewChannel({
                                                        publisher: "",
                                                        source: "",
                                                        subSource: "",
                                                        medium: "",
                                                        campaignType: "",
                                                        integrationType: "website",
                                                        redirectionUrl: "",
                                                        projectId: "none",
                                                        projectName: ""
                                                    })
                                                }} className="flex-1 w-full">
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button type="button" onClick={handleAddChannelToLocal} className="flex-1 w-full font-semibold">
                                                {editingChannelId ? "Update Channel" : "Add Channel"}
                                            </Button>
                                        </div>
                                    </div>

                                    {inputChannels.length > 0 && (
                                        <div className="rounded-xl border bg-card/50 overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-muted/50">
                                                    <TableRow>
                                                        <TableHead className="font-semibold">Source/Sub</TableHead>
                                                        <TableHead className="font-semibold">Project</TableHead>
                                                        <TableHead className="font-semibold">Medium</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {inputChannels.map(ch => (
                                                        <TableRow key={ch.id} className="hover:bg-muted/30">
                                                            <TableCell>
                                                                <div className="font-medium">{ch.source}</div>
                                                                <div className="text-xs text-muted-foreground">{ch.subSource}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="font-normal border-primary/20 text-primary">
                                                                    {ch.projectName || "No Project"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-sm font-medium">{ch.medium || "—"}</TableCell>
                                                            <TableCell>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent align="end" className="w-32 p-1">
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            className="w-full justify-start text-xs h-8"
                                                                            onClick={() => editLocalChannel(ch)}
                                                                        >
                                                                            <Plus className="h-3 w-3 mr-2" /> Edit
                                                                        </Button>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            className="w-full justify-start text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            onClick={() => setInputChannels(inputChannels.filter(x => x.id !== ch.id))}
                                                                        >
                                                                            <Trash2 className="h-3 w-3 mr-2" /> Delete
                                                                        </Button>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
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
