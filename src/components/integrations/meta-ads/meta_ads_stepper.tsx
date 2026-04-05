import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
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
    Check, 
    ChevronRight, 
    ChevronLeft, 
    Target, 
    Settings2, 
    FileText, 
    ShieldCheck, 
    Loader2,
    Facebook
} from "lucide-react"
import { googleAdsService } from "@/services/googleAds.service" // Can fetch campaigns/sources/projects here till meta service is ready
import { Separator } from "@/components/ui/separator"

interface MetaAdsStepperProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const STEPS = [
    { title: "Campaign & Source", icon: Target },
    { title: "Sub-Source", icon: Settings2 },
    { title: "Form Configuration", icon: FileText },
    { title: "Review", icon: ShieldCheck },
]

export function MetaAdsStepper({
    open,
    onOpenChange,
    onSuccess,
}: MetaAdsStepperProps) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [fetchingData, setFetchingData] = useState(false)
    
    // Data for selects
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [sources, setSources] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])

    // Generate a secret key
    const generateSecret = useCallback(() => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let key = 'meta_';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }, [])

    // Form data
    const [formData, setFormData] = useState({
        campaign_id: "",
        source: "",
        sub_source: "", // Form Name
        project_id: "",
        form_id: "", // Meta Form ID
        secret_key: "", // Auto-generated secret for webhook auth
    })

    // Fetch campaigns and projects on open
    useEffect(() => {
        if (open) {
            fetchData()
            setStep(1)
            setFormData({
                campaign_id: "",
                source: "",
                sub_source: "",
                project_id: "",
                form_id: "",
                secret_key: generateSecret(),
            })
        }
    }, [open])

    const fetchData = async () => {
        setFetchingData(true)
        try {
            const [campaignsRes, sourcesRes, projectsRes] = await Promise.all([
                googleAdsService.getCampaigns(),
                googleAdsService.getSources(),
                googleAdsService.getProjects()
            ])
            setCampaigns(campaignsRes.data || [])
            setSources(sourcesRes.data || [])
            setProjects(projectsRes.data || [])
        } catch (error) {
            toast.error("Failed to fetch campaigns, sources or projects")
        } finally {
            setFetchingData(false)
        }
    }

    const handleNext = () => {
        if (step === 1 && (!formData.campaign_id || !formData.source)) {
            toast.error("Please select a campaign and source")
            return
        }
        if (step === 2 && (!formData.sub_source || !formData.project_id)) {
            toast.error("Please fill in all fields")
            return
        }
        if (step === 3 && !formData.form_id) {
            toast.error("Please enter the Form ID")
            return
        }
        setStep(step + 1)
    }

    const handleBack = () => setStep(step - 1)

    const handleSubmit = async () => {
        setLoading(true)
        setTimeout(() => {
            toast.error("Meta Ads Integration is not ready. The API needs to be verified before usage.", {
                duration: 4000
            });
            setLoading(false)
        }, 800)
    }

    const selectedCampaign = campaigns.find(c => c._id === formData.campaign_id)
    const availableSources = selectedCampaign?.sources || []
    const selectedSourceObj = availableSources.find((s: any) => s.sourceName === formData.source)
    const availableSubSources = selectedSourceObj?.subSources || []
    const selectedSubSource = availableSubSources.find((ss: any) => ss.subSourceName === formData.sub_source)
    const selectedProject = projects.find(p => p._id === formData.project_id) || projects.find(p => p.product_id?.toString() === formData.project_id)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-8 bg-indigo-900/10 dark:bg-muted/70 border-b border-indigo-200 dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-600/20">
                                <Facebook className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Meta Ads Integration</DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                    Connect your Meta (Facebook/Instagram) Lead Form
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 py-6">
                    {/* Stepper Progress */}
                    <div className="flex items-center justify-between mb-10 relative">
                         {/* Line background */}
                         <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-800 -z-10" />
                        
                        {STEPS.map((s, i) => {
                            const Icon = s.icon
                            const isActive = step === i + 1
                            const isCompleted = step > i + 1
                            
                            return (
                                <div key={i} className="flex flex-col items-center gap-3 group">
                                    <div className={`
                                        h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                                        ${isActive ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-110" : ""}
                                        ${isCompleted ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20" : ""}
                                        ${!isActive && !isCompleted ? "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400" : ""}
                                    `}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                                        Step {i + 1}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Step Content */}
                    <div className="min-h-[280px] transition-all duration-300">
                        {fetchingData ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                                <p className="text-sm text-muted-foreground font-medium">Fetching configuration data...</p>
                            </div>
                        ) : (
                            <>
                                {step === 1 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold">Select Campaign</Label>
                                            <Select 
                                                value={formData.campaign_id} 
                                                onValueChange={(v) => setFormData({ ...formData, campaign_id: v, source: "", sub_source: "", project_id: "" })}
                                            >
                                                <SelectTrigger className="h-12 text-left">
                                                    <SelectValue placeholder="Select campaign" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {campaigns.map((c) => (
                                                        <SelectItem key={c._id} value={c._id}>
                                                            {c.campaignName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold">Select Source</Label>
                                            <Select 
                                                value={formData.source} 
                                                onValueChange={(v) => setFormData({ ...formData, source: v, sub_source: "", project_id: "" })}
                                                disabled={!formData.campaign_id}
                                            >
                                                <SelectTrigger className="h-12 text-left">
                                                    <SelectValue placeholder="Select source" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableSources.map((s: any, idx: number) => (
                                                        <SelectItem key={idx} value={s.sourceName}>
                                                            {s.sourceName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold">Meta Lead Form Name (Sub-Source)</Label>
                                            <Select 
                                                value={formData.sub_source} 
                                                onValueChange={(v) => {
                                                    const ss = availableSubSources.find((sub: any) => sub.subSourceName === v);
                                                    const pIdRaw = ss?.project?.projectId || selectedCampaign?.project?.projectId || "";
                                                    const matchedProj = projects.find(p => p.product_id?.toString() === pIdRaw || p._id === pIdRaw);
                                                    setFormData({ ...formData, sub_source: v, project_id: matchedProj?._id?.toString() || "" })
                                                }}
                                            >
                                                <SelectTrigger className="h-12 text-left">
                                                    <SelectValue placeholder="Select Meta form name" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableSubSources.map((ss: any, idx: number) => (
                                                        <SelectItem key={idx} value={ss.subSourceName}>
                                                            {ss.subSourceName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">This value will be stored as <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">sub_source</code></p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold">Inventory Project</Label>
                                            <Select 
                                                value={formData.project_id} 
                                                disabled
                                            >
                                                <SelectTrigger className="h-12 disabled:opacity-70 disabled:cursor-not-allowed">
                                                    <SelectValue placeholder="Auto-assigned project" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {projects.map((p) => (
                                                        <SelectItem key={p._id} value={p._id.toString()}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Project is automatically inherited from the selected sub-source or campaign.</p>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold">Meta Form ID / App ID</Label>
                                            <Input 
                                                placeholder="Enter Form ID (From Meta Business Suite)" 
                                                className="h-12"
                                                value={formData.form_id}
                                                onChange={(e) => setFormData({ ...formData, form_id: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">Unique identifier for the specific lead form campaign.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-semibold">Webhook Secret Key</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    className="h-12 font-mono text-xs bg-slate-50 dark:bg-slate-900/50 flex-1"
                                                    value={formData.secret_key}
                                                    readOnly
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-12 px-4 shrink-0"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(formData.secret_key)
                                                        toast.success("Secret key copied!")
                                                    }}
                                                >
                                                    Copy
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Auto-generated. Use this as your Meta Webhook verify token.</p>
                                        </div>
                                    </div>
                                )}

                                 {step === 4 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
                                            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Campaign</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedCampaign?.campaignName || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Source</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Meta Ads</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Form Name</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formData.sub_source || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Inventory Project</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedProject?.name || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1 col-span-1">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Meta Form ID</p>
                                                    <p className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 truncate">
                                                        {formData.form_id || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1 col-span-1">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Secret Key</p>
                                                    <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30 truncate">
                                                        {formData.secret_key || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-600/5 dark:bg-indigo-600/10 rounded-2xl p-4 border border-indigo-600/10 flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
                                                <Check className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Ready to Connect</p>
                                                <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed font-semibold uppercase tracking-tight">
                                                    LEADS FROM THIS FORM WILL AUTOMATICALLY FLOW INTO THE CRM ONCE VERIFIED.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <Separator />

                <DialogFooter className="p-6 bg-indigo-900/5 dark:bg-muted/70 border-b dark:border-white/10 flex items-center justify-between sm:justify-between w-full">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1 || loading}
                        className="gap-2 font-semibold"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>
                    
                    {step === 4 ? (
                        <Button 
                            onClick={handleSubmit} 
                            disabled={loading}
                            className="min-w-[140px] font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Save Integration
                                    <Check className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleNext} 
                            disabled={fetchingData}
                            className="min-w-[140px] font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            Continue
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
