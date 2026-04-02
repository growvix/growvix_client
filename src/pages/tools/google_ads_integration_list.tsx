import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    Loader2
} from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { googleAdsService } from "@/services/googleAds.service"
import { GoogleAdsStepper } from "@/components/integrations/google-ads/google_ads_stepper"
import { toast } from "sonner"

export default function GoogleAdsIntegrationList() {
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()
    const [integrations, setIntegrations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isStepperOpen, setIsStepperOpen] = useState(false)

    useEffect(() => {
        setBreadcrumbs([
            { label: "General Settings", href: "/settings" },
            { label: "Third-Party Integration", href: "/tools/third_party_integration" },
            { label: "Google Ads Integration" },
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
                        className="gap-2 font-semibold h-10 border-slate-200 dark:border-slate-800"
                    >
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={() => setIsStepperOpen(true)}
                        className="gap-2 font-semibold h-10 bg-primary hover:bg-primary/90 text-white shadow-md transition-all hover:scale-[1.02]"
                    >
                        <Plus className="h-4 w-4" />
                        Create Page
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Active Integrations</CardTitle>
                            <CardDescription>A list of all lead forms currently synced with your CRM campaigns.</CardDescription>
                        </div>
                        <Badge variant="outline" className="px-3 py-1 font-bold text-xs uppercase tracking-wider bg-white dark:bg-slate-950">
                            {integrations.length} {integrations.length === 1 ? 'Form' : 'Forms'} Connected
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
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
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30 dark:bg-slate-900/10 hover:bg-transparent">
                                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6">CAMPAIGN</TableHead>
                                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">FORM NAME</TableHead>
                                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">INVENTORY PROJECT</TableHead>
                                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">FORM ID</TableHead>
                                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">STATUS</TableHead>
                                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-right pr-6">ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {integrations.map((item) => (
                                    <TableRow key={item._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <TableCell className="font-semibold py-4 px-6">
                                            {item.campaign_id?.campaignName || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-blue-100/50 text-blue-700 border-none px-2 rounded font-bold uppercase text-[10px]">
                                                    {item.source}
                                                </Badge>
                                                <span className="font-medium">{item.sub_source}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                                            {item.project_id?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded w-fit">
                                            {item.form_id}
                                        </TableCell>
                                        <TableCell>
                                            <button 
                                                onClick={() => toggleStatus(item._id, item.status)}
                                                className="focus:outline-none transition-transform active:scale-95"
                                            >
                                                {item.status ? (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                        <CircleCheck className="h-3.5 w-3.5" />
                                                        <span className="text-[11px] font-bold uppercase tracking-tight">Active</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                                        <CircleX className="h-3.5 w-3.5" />
                                                        <span className="text-[11px] font-bold uppercase tracking-tight">Inactive</span>
                                                    </div>
                                                )}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem className="gap-2 cursor-pointer">
                                                        <ExternalLink className="h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="gap-2 text-destructive focus:text-destructive cursor-pointer font-semibold"
                                                        onClick={() => handleDelete(item._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-100 dark:border-blue-900/20 flex flex-col sm:flex-row items-center gap-6">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <Globe size={40} className="text-blue-600" />
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-bold">Scaling Your Ads?</h3>
                    <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                        Automatic lead syncing ensures zero delay in following up with prospects. 
                        Leads from your Google Ads campaigns will appear in the CRM in real-time.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    className="font-bold gap-2 px-6 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                >
                    Learn More <ExternalLink size={14} />
                </Button>
            </div>

            <GoogleAdsStepper 
                open={isStepperOpen} 
                onOpenChange={setIsStepperOpen} 
                onSuccess={fetchIntegrations}
            />
        </div>
    )
}
