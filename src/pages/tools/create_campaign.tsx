import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { getCookie } from "@/utils/cookies"
import { API } from "@/config/api"
import axios from "axios"
import { toast } from "sonner"
import { ArrowLeft, Check, ChevronRight, Plus, Trash2, Settings, ListPlus, LayoutList, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import LoaderScreen from "@/components/ui/loader-screen"

// Types matching the new schema
type SubSource = {
    uuid?: string
    subSourceName: string
    project?: {
        projectId: string
        projectName: string
    }
}

type SourceConfig = {
    uuid?: string
    sourceName: string
    subSources: SubSource[]
}

type CampaignConfig = {
    campaignName: string
    project?: {
        projectId: string
        projectName: string
    }
    sources: SourceConfig[]
}

export default function CreateCampaign() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { setBreadcrumbs } = useBreadcrumb()
    const organization = getCookie("organization") || ""

    const isEditMode = !!id

    // Options for dropdowns
    const [projects, setProjects] = useState<any[]>([])
    const [dbSources, setDbSources] = useState<any[]>([])

    // Loading states
    const [loadingData, setLoadingData] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state
    const [currentStep, setCurrentStep] = useState(1)
    const [campaignConfig, setCampaignConfig] = useState<CampaignConfig>({
        campaignName: "",
        sources: []
    })

    // UI selections
    const [selectedProjectId, setSelectedProjectId] = useState<string>("none")

    const steps = [
        { id: 1, title: "Campaign Details", icon: Settings },
        { id: 2, title: "Configure Sources", icon: ListPlus },
        { id: 3, title: "Configure Sub-Sources", icon: Layers },
        { id: 4, title: "Review & Save", icon: LayoutList },
    ]

    useEffect(() => {
        setBreadcrumbs([
            { label: "Automation", href: "tools/automation" },
            { label: "Campaigns", href: "automation/campaigns" },
            { label: isEditMode ? "Edit Campaign" : "Create Campaign" },
        ])
    }, [setBreadcrumbs, isEditMode])

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!organization) return
            setLoadingData(true)
            try {
                const token = getCookie("token")
                const headers = { Authorization: `Bearer ${token}` }

                // Fetch options
                const [projRes, srcRes] = await Promise.all([
                    axios.get(`${API.PROJECTS}?organization=${organization}`, { headers }),
                    axios.get(`${API.SOURCES}?organization=${organization}`, { headers })
                ])

                setProjects(projRes.data.data || [])
                setDbSources(srcRes.data.data || [])

                // Fetch campaign if editing
                if (isEditMode) {
                    const campRes = await axios.get(`${API.getCampaign(id)}?organization=${organization}`, { headers })
                    const camp = campRes.data.data

                    if (camp.project && camp.project.projectId) {
                        setSelectedProjectId(camp.project.projectId)
                    }

                    setCampaignConfig({
                        campaignName: camp.campaignName || "",
                        project: camp.project,
                        sources: camp.sources || []
                    })
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to load configuration data")
                navigate("/automation/campaigns")
            } finally {
                setLoadingData(false)
            }
        }

        fetchInitialData()
    }, [organization, id, isEditMode, navigate])

    // Update campaign level project
    useEffect(() => {
        if (selectedProjectId === "none") {
            setCampaignConfig(prev => ({ ...prev, project: undefined }))
        } else {
            const p = projects.find(x => x.product_id.toString() === selectedProjectId)
            if (p) {
                setCampaignConfig(prev => ({
                    ...prev,
                    project: { projectId: p.product_id.toString(), projectName: p.name }
                }))
            }
        }
    }, [selectedProjectId, projects])

    // --- Validation ---
    const validateStep = (step: number) => {
        if (step === 1) {
            if (!campaignConfig.campaignName.trim()) {
                toast.error("Campaign Name is required")
                return false
            }
        }
        if (step === 2) {
            if (campaignConfig.sources.length === 0) {
                toast.error("Please add at least one source")
                return false
            }
            for (const s of campaignConfig.sources) {
                if (!s.sourceName) {
                    toast.error("All sources must have a name")
                    return false
                }
            }
        }
        if (step === 3) {
            for (const s of campaignConfig.sources) {
                if (s.subSources.length === 0) {
                    toast.error(`Source "${s.sourceName}" needs at least one sub-source`)
                    return false
                }
                for (const sub of s.subSources) {
                    if (!sub.subSourceName) {
                        toast.error("All sub-sources must have a name")
                        return false
                    }
                    if (!campaignConfig.project && (!sub.project || !sub.project.projectId)) {
                        toast.error(`Please assign a project to sub-source "${sub.subSourceName}" since there is no campaign-level project`)
                        return false
                    }
                }
            }
        }
        return true
    }

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(s => Math.min(steps.length, s + 1))
            window.scrollTo(0, 0)
        }
    }

    const prevStep = () => {
        setCurrentStep(s => Math.max(1, s - 1))
        window.scrollTo(0, 0)
    }

    // --- Handlers ---
    const addSource = () => {
        setCampaignConfig(prev => ({
            ...prev,
            sources: [...prev.sources, { sourceName: "", subSources: [] }]
        }))
    }

    const updateSource = (index: number, key: keyof SourceConfig, val: any) => {
        setCampaignConfig(prev => {
            const upd = [...prev.sources]
            upd[index] = { ...upd[index], [key]: val }
            return { ...prev, sources: upd }
        })
    }

    const removeSource = (index: number) => {
        setCampaignConfig(prev => {
            const upd = [...prev.sources]
            upd.splice(index, 1)
            return { ...prev, sources: upd }
        })
    }

    const addSubSource = (sourceIndex: number) => {
        setCampaignConfig(prev => {
            const upd = [...prev.sources]
            upd[sourceIndex].subSources.push({
                subSourceName: "",
            })
            return { ...prev, sources: upd }
        })
    }

    const updateSubSource = (sourceIdx: number, subIdx: number, key: keyof SubSource, val: any) => {
        setCampaignConfig(prev => {
            const upd = [...prev.sources]
            upd[sourceIdx].subSources[subIdx] = { ...upd[sourceIdx].subSources[subIdx], [key]: val }
            return { ...prev, sources: upd }
        })
    }

    const updateSubSourceProject = (sourceIdx: number, subIdx: number, val: string) => {
        const p = projects.find(x => x.product_id.toString() === val)
        updateSubSource(sourceIdx, subIdx, 'project', p ? { projectId: p.product_id.toString(), projectName: p.name } : undefined)
    }

    const removeSubSource = (sourceIdx: number, subIdx: number) => {
        setCampaignConfig(prev => {
            const upd = [...prev.sources]
            upd[sourceIdx].subSources.splice(subIdx, 1)
            return { ...prev, sources: upd }
        })
    }

    const handleSave = async () => {
        if (!validateStep(3)) return

        setSaving(true)
        try {
            const token = getCookie("token")
            const headers = { Authorization: `Bearer ${token}` }

            if (isEditMode) {
                await axios.put(`${API.CAMPAIGNS}/${id}?organization=${organization}`, campaignConfig, { headers })
                toast.success("Campaign updated successfully")
            } else {
                await axios.post(`${API.CAMPAIGNS}?organization=${organization}`, campaignConfig, { headers })
                toast.success("Campaign created successfully")
            }
            navigate("/automation/campaigns")
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save campaign")
        } finally {
            setSaving(false)
        }
    }

    if (loadingData) return <LoaderScreen />

    return (
        <div className="flex flex-col h-full space-y-4 p-8 max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="outline" size="icon" onClick={() => navigate("/automation/campaigns")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{isEditMode ? "Edit Campaign" : "New Campaign Generator"}</h1>
                    <p className="text-muted-foreground text-sm mt-1">Follow the steps to configure your campaign hierarchy.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 mt-6">

                {/* Vertical Stepper */}
                <div className="hidden md:flex flex-col gap-6">
                    {steps.map((step, idx) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isPast = currentStep > step.id
                        return (
                            <div key={step.id} className="relative flex items-center gap-4 group">
                                {idx !== steps.length - 1 && (
                                    <div className={`absolute top-10 left-[19px] w-[2px] h-[calc(100%+16px)] transition-colors duration-300 ${isPast ? 'bg-primary' : 'bg-muted'}`} />
                                )}
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 z-10 shrink-0 ${isActive ? 'border-primary bg-gray-200 dark:bg-gray-800 text-primary scale-110 shadow-sm' : isPast ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 bg-muted/50 text-muted-foreground'}`}>
                                    {isPast ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {step.id}</span>
                                    <span className={`font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Content Panel */}
                <Card className="min-h-[500px] flex flex-col border-muted/60 shadow-sm overflow-hidden py-0">

                    {/* Header line for mobile */}
                    <div className="md:hidden bg-muted/30 p-4 border-b flex items-center gap-3">
                        <Badge variant="outline" className="bg-background">Step {currentStep} of {steps.length}</Badge>
                        <span className="font-semibold">{steps[currentStep - 1].title}</span>
                    </div>

                    <CardContent className="p-8 flex-1">

                        {/* STEP 1: CAMPAIGN */}
                        {currentStep === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-base">Campaign Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            placeholder="e.g. Q3 Summer Mega Sale"
                                            value={campaignConfig.campaignName}
                                            onChange={e => setCampaignConfig(p => ({ ...p, campaignName: e.target.value }))}
                                            className="h-12 text-lg"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                                    <div className="flex items-start gap-3 ">
                                        <Layers className="w-5 h-5 text-primary mt-0.5" />
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-primary">Campaign Project Inheritance</h3>
                                            <p className="text-sm text-primary/80 leading-relaxed">
                                                If you select a project here, <strong>ALL</strong> sub-sources in this campaign will automatically inherit it.
                                                If you want different sub-sources to target different projects, leave this as "No Universal Project".
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Label>Campaign Universal Project</Label>
                                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                            <SelectTrigger className="h-11 bg-background">
                                                <SelectValue placeholder="Select a project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" className="italic text-muted-foreground">No Universal Project — Set per sub-source later</SelectItem>
                                                {projects.map(p => (
                                                    <SelectItem key={p.product_id} value={p.product_id.toString()}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: SOURCES */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                                {campaignConfig.sources.length === 0 ? (
                                    <div className="text-center py-10 px-4 border-2 border-dashed rounded-xl border-muted bg-muted/20 z-5">
                                        <ListPlus className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
                                        <h3 className="text-lg font-medium">No Sources Added</h3>
                                        <p className="text-muted-foreground text-sm mt-1 mb-6 max-w-sm mx-auto">
                                            Add top-level sources like Google Ads, Meta, or Offline Referral.
                                        </p>
                                        <Button onClick={addSource} className="shadow-sm">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add First Source
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {campaignConfig.sources.map((source, idx) => (
                                            <div key={idx} className="relative group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeSource(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="grid md:grid-cols-1 gap-6 pr-10">
                                                    <div className="space-y-3">
                                                        <Label className="text-sm font-semibold">Source Name</Label>
                                                        <Select
                                                            value={source.sourceName}
                                                            onValueChange={(val) => updateSource(idx, 'sourceName', val)}
                                                        >
                                                            <SelectTrigger className="h-10">
                                                                <SelectValue placeholder="Select or type..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {dbSources.map(s => (
                                                                    <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-2">
                                            <Button variant="outline" onClick={addSource} className="w-full border-dashed">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Another Source
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 3: SUB-SOURCES */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <p className="text-muted-foreground mb-4">
                                    Configure specific endpoints (sub-sources) for each of your selected sources.
                                </p>

                                <Accordion type="multiple" defaultValue={campaignConfig.sources.map((_, i) => `item-${i}`)} className="space-y-4">
                                    {campaignConfig.sources.map((source, sourceIdx) => (
                                        <AccordionItem key={sourceIdx} value={`item-${sourceIdx}`} className="border rounded-xl bg-card overflow-hidden shadow-sm">
                                            <AccordionTrigger className="px-5 py-4 hover:bg-muted/30 hover:no-underline">
                                                <div className="flex items-center justify-between w-full pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold text-base">{source.sourceName || `Source ${sourceIdx + 1}`}</span>
                                                    </div>
                                                    <Badge variant="secondary" className="rounded-full px-3">{source.subSources.length} Sub-sources</Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-5 pb-5 pt-2 bg-muted/10 border-t">

                                                <div className="space-y-4 pt-2">
                                                    {source.subSources.map((sub, subIdx) => (
                                                        <div key={subIdx} className="relative rounded-lg border bg-background p-4 shadow-sm group">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute top-2 right-2 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => removeSubSource(sourceIdx, subIdx)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>

                                                            <div className="grid md:grid-cols-2 gap-4 pr-6 pb-2">
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs font-semibold">Sub-Source Name *</Label>
                                                                    <Input
                                                                        placeholder="e.g. landing-page-2"
                                                                        value={sub.subSourceName}
                                                                        onChange={e => updateSubSource(sourceIdx, subIdx, 'subSourceName', e.target.value)}
                                                                        className="h-9"
                                                                    />
                                                                </div>

                                                                {!campaignConfig.project && (
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-semibold text-primary">Assign Project *</Label>
                                                                        <Select
                                                                            value={sub.project?.projectId || "none"}
                                                                            onValueChange={v => updateSubSourceProject(sourceIdx, subIdx, v)}
                                                                        >
                                                                            <SelectTrigger className="h-9 border-primary/30">
                                                                                <SelectValue placeholder="Select project" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="none" disabled>Select a project</SelectItem>
                                                                                {projects.map(p => (
                                                                                    <SelectItem key={p.product_id} value={p.product_id.toString()}>
                                                                                        {p.name}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <Button variant="outline" size="sm" onClick={() => addSubSource(sourceIdx)} className="w-full h-9 border-dashed mt-2">
                                                        <Plus className="w-3.5 h-3.5 mr-2" />
                                                        Add Sub-Source to {source.sourceName}
                                                    </Button>
                                                </div>

                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>

                            </div>
                        )}

                        {/* STEP 4: REVIEW */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                                <div className="rounded-xl border bg-gradient-to-br from-background to-muted/20 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-sm">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">{campaignConfig.campaignName}</h2>
                                        <div className="flex items-center gap-3 mt-2">
                                            <Badge variant="outline" className="bg-background">
                                                {campaignConfig.sources.length} Sources
                                            </Badge>
                                            <Badge variant="outline" className="bg-background">
                                                {campaignConfig.sources.reduce((acc, s) => acc + s.subSources.length, 0)} Total Sub-Sources
                                            </Badge>
                                        </div>
                                    </div>

                                    {campaignConfig.project && (
                                        <div className="text-right">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Universal Project Mode</div>
                                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-sm px-3 py-1">
                                                {campaignConfig.project.projectName}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg ml-1">Hierarchy Map</h3>

                                    <div className="grid gap-4">
                                        {campaignConfig.sources.map((source, sIdx) => (
                                            <div key={sIdx} className="rounded-lg border bg-card overflow-hidden shadow-sm">
                                                <div className="bg-muted/30 px-5 py-3 border-b flex items-center justify-between">
                                                    <div className="font-semibold flex items-center gap-2">
                                                        {source.sourceName}
                                                    </div>
                                                </div>
                                                <div className="divide-y divide-border/50 bg-background">
                                                    {source.subSources.map((sub, ssIdx) => (
                                                        <div key={ssIdx} className="px-5 py-3 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                                                <span className="font-medium text-sm">{sub.subSourceName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                {!campaignConfig.project && sub.project && (
                                                                    <span className="hidden sm:inline-block bg-primary/5 text-primary border border-primary/20 rounded px-2 py-0.5 text-xs font-medium">
                                                                        {sub.project.projectName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}

                    </CardContent>

                    <div className="p-6 border-t bg-muted/10 flex items-center justify-between shrink-0">
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1 || saving}
                            className="bg-background shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>

                        {currentStep < steps.length ? (
                            <Button onClick={nextStep} className="shadow-sm">
                                Continue <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleSave} disabled={saving} className="shadow-sm min-w-[140px]">
                                {saving ? "Saving..." : isEditMode ? "Update Campaign" : "Save Campaign"}
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
