import React, { useState, useEffect } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { gql } from "@apollo/client"
import { useQuery, useMutation } from "@apollo/client/react"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import LoaderScreen, { HorizontalLoader } from "@/components/ui/loader-screen"
import { Plus, ListFilter, Search } from "lucide-react"

const GET_ALL_CAMPAIGNS = gql`
    query GetAllCampaigns($organization: String!) {
        getAllCampaigns(organization: $organization) {
            _id
            uuid
            campaignName
            project {
                projectId
                projectName
            }
        }
    }
`

const GET_ALL_PROJECTS = gql`
    query GetAllProjects($organization: String!) {
        getAllProjects(organization: $organization) {
            product_id
            name
        }
    }
`

const CREATE_CAMPAIGN = gql`
    mutation CreateCampaign(
        $organization: String!, 
        $campaignName: String!, 
        $projectId: String!, 
        $projectName: String!
    ) {
        createCampaign(
            organization: $organization,
            campaignName: $campaignName,
            projectId: $projectId,
            projectName: $projectName
        ) {
            _id
            uuid
            campaignName
            project {
                projectId
                projectName
            }
        }
    }
`

type Campaign = {
    _id: string
    uuid: string
    campaignName: string
    project: {
        projectId: string
        projectName: string
    }
}

type ProjectSummary = {
    product_id: number
    name: string
}

interface GetCampaignsResponse {
    getAllCampaigns: Campaign[]
}

interface GetProjectsResponse {
    getAllProjects: ProjectSummary[]
}

export default function Campaigns() {
    const { setBreadcrumbs } = useBreadcrumb()
    const organization = getCookie("organization") || ""

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newCampaignName, setNewCampaignName] = useState("")
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Automation" },
            { label: "Campaigns" },
        ])
    }, [setBreadcrumbs])

    const {
        loading: loadingCampaigns,
        data: campaignsData,
        refetch: refetchCampaigns
    } = useQuery<GetCampaignsResponse>(GET_ALL_CAMPAIGNS, {
        variables: { organization },
        fetchPolicy: "network-only",
        skip: !organization,
    })

    const {
        loading: loadingProjects,
        data: projectsData
    } = useQuery<GetProjectsResponse>(GET_ALL_PROJECTS, {
        variables: { organization },
        skip: !organization,
    })

    const [createCampaign, { loading: creatingCampaign }] = useMutation(CREATE_CAMPAIGN, {
        onCompleted: () => {
            toast.success("Campaign created successfully")
            setIsCreateModalOpen(false)
            setNewCampaignName("")
            setSelectedProjectId("")
            refetchCampaigns()
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to create campaign")
        }
    })

    const handleCreateCampaign = (e: React.FormEvent) => {
        e.preventDefault()

        if (!newCampaignName.trim()) {
            toast.error("Please enter a campaign name")
            return
        }

        if (!selectedProjectId) {
            toast.error("Please select a project")
            return
        }

        const project = projectsData?.getAllProjects.find(
            (p: ProjectSummary) => p.product_id.toString() === selectedProjectId
        )

        if (!project) {
            toast.error("Invalid project selected")
            return
        }

        createCampaign({
            variables: {
                organization,
                campaignName: newCampaignName.trim(),
                projectId: project.product_id.toString(),
                projectName: project.name
            }
        })
    }

    const campaigns: Campaign[] = campaignsData?.getAllCampaigns || []
    const projects: ProjectSummary[] = projectsData?.getAllProjects || []

    const filteredCampaigns = campaigns.filter(c => 
        c.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.project.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loadingCampaigns && !campaignsData) {
        return <LoaderScreen />
    }

    return (
        <div className="flex flex-col h-full space-y-4 p-6 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage lead generation campaigns and their associated projects.
                    </p>
                </div>

                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Campaign</DialogTitle>
                            <DialogDescription>
                                Add a new campaign and associate it with an existing project.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateCampaign} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="campaignName">Campaign Name</Label>
                                <Input
                                    id="campaignName"
                                    placeholder="Enter campaign name (e.g., Summer Sale 2024)"
                                    value={newCampaignName}
                                    onChange={(e) => setNewCampaignName(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="project">Project</Label>
                                <Select
                                    value={selectedProjectId}
                                    onValueChange={setSelectedProjectId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select a project"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((project) => (
                                            <SelectItem key={project.product_id} value={project.product_id.toString()}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                        {projects.length === 0 && !loadingProjects && (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                No projects available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={creatingCampaign}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={creatingCampaign || loadingProjects}>
                                    {creatingCampaign ? "Creating..." : "Create Campaign"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                <CardHeader className="py-4 border-b flex flex-row items-center justify-between space-y-0 bg-muted/20">
                    <CardTitle className="text-lg font-medium">All Campaigns</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search campaigns..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-auto flex-1 h-[calc(100vh-280px)]">
                    {loadingCampaigns && <HorizontalLoader />}
                    
                    {!loadingCampaigns && filteredCampaigns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <div className="bg-muted p-4 rounded-full mb-4">
                                <ListFilter className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No campaigns found</h3>
                            <p className="text-muted-foreground max-w-sm mt-2">
                                {searchQuery 
                                    ? "We couldn't find any campaigns matching your search. Try different keywords." 
                                    : "You haven't created any campaigns yet. Click the button above to create one."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y relative">
                            {filteredCampaigns.map((campaign) => (
                                <div key={campaign._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-base">{campaign.campaignName}</span>
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground border">
                                                ID: {campaign.uuid.substring(0, 8)}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground mt-0.5">
                                            <span className="font-medium mr-1.5">Project:</span>
                                            {campaign.project.projectName}
                                        </div>
                                    </div>
                                    <div>
                                        {/* Future actions could go here */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
