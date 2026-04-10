import { useState, useEffect } from 'react'
import axios from 'axios'
import { API } from '@/config/api'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from '@/lib/utils'
import {
    Check,
    Users,
    Plus,
    Trash2,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Search,
    Handshake,
    Target,
    SlidersHorizontal,
    FileEdit,
    FileText,
    ShieldCheck,
    X,
    ChevronsUpDown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useBreadcrumb } from '@/context/breadcrumb-context'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

// Helper function to get cookie value
const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || ''
    return ''
}

interface RequirementProfile {
    sqft?: number
    bhk?: string[]
    floor?: string[]
    balcony: boolean
    bathroom_count?: number
    parking_needed: boolean
    parking_count?: number
    price_min?: number
    price_max?: number
    furniture?: string[]
    facing?: string[]
    plot_type?: string
}

interface AssignedPerson {
    id: string
    name: string
    email?: string
    phone?: string
    role?: string
    category: 'Sales' | 'Pre-Sales' | 'Post-Sales' | 'CP'
    type: 'user' | 'cp'
}

const CONTACT_FIELD_GROUPS = [
    {
        title: 'Contact Fields',
        fields: [
            { id: 'email', label: 'Email Address' },
            { id: 'location', label: 'Current Location' },
            { id: 'street_address', label: 'Street address' },
            { id: 'city', label: 'City' },
            { id: 'state', label: 'State' },
            { id: 'province', label: 'Province' },
            { id: 'country', label: 'Country' },
            { id: 'post_code', label: 'Post code' },
            { id: 'zip_code', label: 'Zip code' },
        ]
    },
    {
        title: 'Demographic Questions',
        fields: [
            { id: 'dob', label: 'Date of birth' },
            { id: 'gender', label: 'Gender' },
            { id: 'marital_status', label: 'Marital status' },
            { id: 'relationship_status', label: 'Relationship status' },
            { id: 'military_status', label: 'Military status' },
            { id: 'education_level', label: 'Education level' },
        ]
    },
    {
        title: 'Work Information',
        fields: [
            { id: 'job_title', label: 'Job title' },
            { id: 'work_phone', label: 'Work phone number' },
            { id: 'work_email', label: 'Work email' },
            { id: 'company_name', label: 'Company name' },
            { id: 'website', label: 'Website' },
        ]
    }
]

const STEPS = [
    { id: 1, title: 'STEP 1', icon: <Target className="w-6 h-6" />, label: 'Form Builder' },
    { id: 2, title: 'STEP 2', icon: <SlidersHorizontal className="w-6 h-6" />, label: 'Routing Options' },
    { id: 3, title: 'STEP 3', icon: <FileText className="w-6 h-6" />, label: 'Preview & Save' },
]

const FieldSelector = ({ fieldId, isSelected, onClick, children }: any) => (
    <div
        className={cn(
            "p-5 border-2 rounded-lg cursor-pointer transition-all relative overflow-hidden group",
            isSelected ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50" : "border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-300 dark:hover:border-zinc-700"
        )}
        onClick={() => onClick(fieldId)}
    >
        <div className="pointer-events-none opacity-80">
            {children}
        </div>
        {isSelected && (
            <div className="absolute inset-0 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-[1px] flex items-center justify-center">
                <Badge className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold px-4 py-2 text-sm shadow-xl items-center gap-2">Added <Check className="w-4 h-4" /></Badge>
            </div>
        )}
    </div>
)

export default function LeadCaptureForm() {
    const { setBreadcrumbs } = useBreadcrumb()
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [organization, setOrganization] = useState('')

    // Step 1: Lead Info
    const [contactInfo, setContactInfo] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        campaign: '',
        source: '',
        sub_source: '',
        medium: '',
        campaign_type: 'Online', // Online, Offline, CP
        budget: '',
        preferred_location: '',
        preferred_floor: '',
        interested_projects: '',
        bhk: '',
        furniture: '',
        facing: '',
        sqft: '',
        bathroom_count: '',
        parking_needed: '',
    })

    const [selectedContactFields, setSelectedContactFields] = useState<string[]>(['email', 'location'])
    const [isFillMode, setIsFillMode] = useState(false)
    const [leadData, setLeadData] = useState<any>({})
    const [submittingLead, setSubmittingLead] = useState(false)

    // Step 2: Requirements
    const [selectedFields, setSelectedFields] = useState<string[]>([
        'budget', 'preferred_location', 'preferred_floor', 'interested_projects'
    ])
    const [reqTab, setReqTab] = useState<'contact' | 'requirements' | 'manual'>('contact')
    const [manualRequirements, setManualRequirements] = useState<{ key: string, value: string }[]>([])
    const [newManualKey, setNewManualKey] = useState('')
    const [newManualValue, setNewManualValue] = useState('')
    const [floorInput, setFloorInput] = useState('')
    const [isRequirementSheetOpen, setIsRequirementSheetOpen] = useState(false)
    const [isContactSheetOpen, setIsContactSheetOpen] = useState(false)
    const [contactTab, setContactTab] = useState<'prebuilt' | 'manual'>('prebuilt')
    const [manualContactFields, setManualContactFields] = useState<{ key: string }[]>([])
    const [newManualContactKey, setNewManualContactKey] = useState('')

    const toggleField = (fieldId: string) => {
        if (selectedFields.includes(fieldId)) {
            setSelectedFields(selectedFields.filter(f => f !== fieldId))
        } else {
            setSelectedFields([...selectedFields, fieldId])
        }
    }

    // Step 3: Assignment Flow
    const [selectedProject, setSelectedProject] = useState<any>(null)
    const [assignmentMode, setAssignmentMode] = useState<'user' | 'cp'>('user')
    const [userCategory, setUserCategory] = useState<'Pre-Sales' | 'Sales' | 'Post-Sales'>('Sales')

    // Combobox states
    const [projectOpen, setProjectOpen] = useState(false)
    const [userOpen, setUserOpen] = useState(false)
    const [cpOpen, setCpOpen] = useState(false)
    const [userDepartment, setUserDepartment] = useState("all")

    // Step 3 & 4
    const [allProjects, setAllProjects] = useState<any[]>([])
    const [orgUsers, setOrgUsers] = useState<any[]>([])
    const [cpUsers, setCpUsers] = useState<any[]>([])
    const [allCampaigns, setAllCampaigns] = useState<any[]>([])
    const [assignedPeople, setAssignedPeople] = useState<AssignedPerson[]>([])
    const [fetchingData, setFetchingData] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const mode = urlParams.get('mode')
        const id = urlParams.get('id')
        const org = getCookie('organization')

        setBreadcrumbs(mode === 'fill' ? [
            { label: "New Lead", href: "NewLead" },
            { label: "Project Entry", href: "" }
        ] : [
            { label: "Automation", href: "tools/automation" },
            { label: "Lead Capture", href: "automation/leadcapture" },
            { label: "Configure Form", href: "tools/automation/leadcapture/leadcaptureform" },
        ])

        if (mode === 'fill') {
            setIsFillMode(true)
            setCurrentStep(3)
        }

        if (org) {
            setOrganization(org)
            fetchData(org, id, mode)
        }
    }, [])

    const fetchData = async (org: string, id: string | null, mode: string | null) => {
        setFetchingData(true)
        try {
            const token = getCookie('token')
            const [usersRes, cpsRes, projectsRes, campaignsRes] = await Promise.all([
                axios.get(`${API.USERS}?organization=${org}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API.CP_USERS}?organization=${org}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API.PROJECTS}?organization=${org}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API.CAMPAIGNS}?organization=${org}`, { headers: { Authorization: `Bearer ${token}` } })
            ])
            setOrgUsers(usersRes.data.data?.users || [])
            setCpUsers(cpsRes.data.data?.cpUsers || [])
            setAllProjects(projectsRes.data.data || [])
            setAllCampaigns(campaignsRes.data.data || [])

            if (id) {
                const configRes = await axios.get(`${API.LEAD_CAPTURE_CONFIGS}/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const config = configRes.data.data
                if (config) {
                    const loadedContactInfo = config.contact_info || {}
                    if (mode === 'fill') {
                        setContactInfo({
                            ...loadedContactInfo,
                            name: '',
                            email: '',
                            phone: '',
                            location: '',
                            bhk: '',
                            furniture: '',
                            facing: '',
                            sqft: '',
                            bathroom_count: '',
                            parking_needed: '',
                            preferred_floor: '',
                            interested_projects: '',
                            preferred_location: ''
                        })
                    } else {
                        setContactInfo(loadedContactInfo)
                    }
                    setSelectedFields(config.selected_fields || [])
                    setManualRequirements(config.manual_requirements?.map((m: any) => ({ ...m, value: '' })) || [])
                    setSelectedContactFields(config.selected_contact_fields || ['email', 'location'])
                    setManualContactFields(config.manual_contact_fields || [])
                    setAssignedPeople(config.assigned_people || [])

                    // Resolve selected project from ID
                    if (config.project_id) {
                        const project = (projectsRes.data.data || []).find((p: any) => p._id === config.project_id || p.id === config.project_id)
                        if (project) {
                            setSelectedProject(project)
                        } else {
                            setSelectedProject(config.project_id)
                        }
                    }
                    console.log('Loaded Configuration:', {
                        contactFields: config.selected_contact_fields,
                        manualFields: config.manual_contact_fields,
                        requirements: config.selected_fields
                    })
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
            toast.error('Failed to load configuration data')
        } finally {
            setFetchingData(false)
        }
    }

    const toggleAssignment = (person: any, type: 'user' | 'cp', category?: string) => {
        const personId = person._id

        setAssignedPeople(prev => {
            const isAssigned = prev.some(p => p.id === personId)
            if (isAssigned) {
                return prev.filter(p => p.id !== personId)
            } else {
                const newPerson: AssignedPerson = {
                    id: personId,
                    name: `${person.profile.firstName} ${person.profile.lastName}`,
                    email: person.profile.email,
                    phone: person.profile.phone,
                    role: type === 'user' ? person.role : 'Channel Partner',
                    category: (type === 'user' ? category : 'CP') as any,
                    type: type
                }
                return [...prev, newPerson]
            }
        })
    }

    const handleConfirm = async () => {
        if (!selectedProject) {
            toast.error("Please select a target project first")
            return
        }

        setLoading(true)
        try {
            const token = getCookie('token')
            const urlParams = new URLSearchParams(window.location.search)
            const id = urlParams.get('id')

            // Sanitize organization
            let finalOrg = organization
            if (!finalOrg || finalOrg === 'undefined' || finalOrg === 'null') {
                finalOrg = getCookie('organization')
            }

            const payload = {
                organization: finalOrg,
                name: `${contactInfo.source || 'Website'} Lead Form - ${selectedProject.name}`,
                project_id: selectedProject._id,
                contact_info: contactInfo,
                selected_fields: selectedFields,
                manual_requirements: manualRequirements,
                selected_contact_fields: selectedContactFields,
                manual_contact_fields: manualContactFields,
                assigned_people: assignedPeople,
                source: contactInfo.source || 'Manual Configuration',
                status: 'Active'
            }

            if (isFillMode) {
                // Submit as a Lead
                const leadPayload = {
                    organization: finalOrg,
                    profile: {
                        ...contactInfo,
                        name: contactInfo.name,
                        email: contactInfo.email,
                        phone: contactInfo.phone,
                        location: contactInfo.location,
                    },
                    requirement: {
                        budget: contactInfo.budget,
                        location: contactInfo.preferred_location,
                        floor: contactInfo.preferred_floor,
                        bhk: contactInfo.bhk,
                        sqft: contactInfo.sqft,
                        facing: contactInfo.facing,
                        furniture: contactInfo.furniture,
                    },
                    project: [selectedProject.name],
                    acquired: [{
                        campaign: contactInfo.campaign,
                        source: contactInfo.source,
                        sub_source: contactInfo.sub_source || 'Lead Capture Form',
                        medium: contactInfo.medium || 'Web Form',
                        received: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                    }],
                    exe_user: getCookie('user_id'),
                    interested_projects: [{
                        project_id: selectedProject?.product_id,
                        project_name: selectedProject?.name
                    }],
                    notes: manualRequirements.map(m => `${m.key}: ${m.value}`).join(' | ')
                }

                const response = await axios.post(API.LEADS, leadPayload, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                toast.success(response.data.message || 'Lead captured successfully!')
                navigate('/all_leads')
            } else {
                // Submit as a Configuration
                const configPayload = {
                    ...payload,
                    is_active: true
                }

                let response
                if (id) {
                    response = await axios.put(`${API.LEAD_CAPTURE_CONFIGS}/${id}`, configPayload, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                } else {
                    response = await axios.post(API.LEAD_CAPTURE_CONFIGS, configPayload, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                }
                toast.success(response.data.message || 'Form configuration saved!')
                navigate('/automation/leadcapture')
            }
        } catch (error: any) {
            console.error('Save failed:', error)
            toast.error(error.response?.data?.message || 'Failed to save data')
        } finally {
            setSubmittingLead(false)
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col bg-background p-4 md:p-6 overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
                {/* Horizontal Stepper (Screenshot 2 Style) - Hidden in Fill Mode */}
                {!isFillMode && (
                    <div className="max-w-4xl mx-auto w-full mb-12 relative flex items-center justify-between px-6 md:px-10">
                        {/* Horizontal Line Background (Continuous) */}
                        <div className="absolute top-[32px] left-[56px] md:left-[72px] right-[56px] md:right-[72px] h-1 bg-slate-100 dark:bg-zinc-800 z-0" />

                        {/* Progress Fill Line */}
                        <div
                            className="absolute top-[32px] left-[72px] h-1 bg-emerald-500 z-0 transition-all duration-500"
                            style={{
                                width: currentStep === 1 ? '0%' : currentStep === 2 ? 'calc(50% - (window.innerWidth < 768 ? 56px : 72px))' : 'calc(100% - (window.innerWidth < 768 ? 112px : 144px))'
                            }}
                        />

                        {STEPS.map((step) => {
                            const isActive = currentStep === step.id
                            const isCompleted = currentStep > step.id
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
                                    <div
                                        className={cn(
                                            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 border-[3px] shadow-sm cursor-pointer",
                                            isCompleted
                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 dark:shadow-none"
                                                : isActive
                                                    ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900 shadow-xl scale-110"
                                                    : "bg-white dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-300 dark:text-zinc-700"
                                        )}
                                        onClick={() => (isCompleted || isActive) && setCurrentStep(step.id)}
                                    >
                                        {isActive ? step.icon : isCompleted ? <Check className="w-8 h-8" /> : <span className="text-xl font-black">{step.id}</span>}
                                    </div>
                                    <div className="text-center group">
                                        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-0.5", isActive ? "text-zinc-900 dark:text-zinc-100" : "text-slate-300 dark:text-zinc-600")}>{step.title}</p>
                                        <p className={cn("text-xs font-black uppercase tracking-widest", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500")}>{step.label}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <main className="flex-1">
                    <div className="max-w-5xl mx-auto">
                        {currentStep === 1 && (
                            <div className="animate-in fade-in slide-in-duration-500 max-w-5xl mx-auto py-8">
                                <div className="max-w-4xl mx-auto space-y-12 border border-slate-100 dark:border-zinc-800 p-6 rounded-lg bg-transparent transition-all hover:border-slate-200 dark:hover:border-zinc-700 shadow-sm">
                                    {/* Dynamic Contact Section */}
                                    <section className="space-y-6 ">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Contact Information</h3>
                                            </div>
                                            {!isFillMode && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 rounded-lg px-4 transition-all"
                                                    onClick={() => setIsContactSheetOpen(true)}
                                                >
                                                    <Plus className="w-4 h-4 mr-1.5" /> Add
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-2.5">
                                                <Label className="text-[13px] font-bold text-zinc-900 dark:text-zinc-400 flex items-center gap-1">Full Name <span className="text-red-500">*</span></Label>
                                                <Input
                                                    disabled={!isFillMode}
                                                    placeholder="Enter full name"
                                                    className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm rounded-lg shadow-sm"
                                                    value={contactInfo.name}
                                                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400 flex items-center gap-1">Phone Number <span className="text-red-500">*</span></Label>
                                                <Input
                                                    disabled={!isFillMode}
                                                    placeholder="Enter phone number"
                                                    className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm rounded-xl shadow-sm"
                                                    value={contactInfo.phone}
                                                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            {/* Dynamic Contact Fields */}
                                            {selectedContactFields.map(fieldId => {
                                                const field = CONTACT_FIELD_GROUPS.flatMap((g: any) => g.fields).find((f: any) => f.id === fieldId);
                                                if (!field) return null;
                                                return (
                                                    <div key={fieldId} className="space-y-2.5 relative group">
                                                        <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">{field.label}</Label>
                                                        <div className="relative">
                                                            <Input
                                                                disabled={!isFillMode}
                                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                                                className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm rounded-xl shadow-sm pr-12"
                                                                value={(contactInfo as any)[fieldId] || ''}
                                                                onChange={(e) => setContactInfo({ ...contactInfo, [fieldId]: e.target.value })}
                                                            />
                                                            {!isFillMode && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute right-1 top-1 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                                    onClick={() => setSelectedContactFields(prev => prev.filter(f => f !== fieldId))}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}

                                            {/* Manual Contact Fields */}
                                            {manualContactFields.map((field, idx) => (
                                                <div key={`manual-contact-${idx}`} className="space-y-2.5 relative group">
                                                    <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">{field.key}</Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={!isFillMode}
                                                            placeholder={`Enter ${field.key.toLowerCase()}`}
                                                            className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm rounded-xl shadow-sm pr-12"
                                                            value={(contactInfo as any)[field.key] || ''}
                                                            onChange={(e) => setContactInfo({ ...contactInfo, [field.key]: e.target.value })}
                                                        />
                                                        {!isFillMode && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute right-1 top-1 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                                onClick={() => setManualContactFields(prev => prev.filter((_, i) => i !== idx))}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <Separator className="bg-slate-100 dark:bg-zinc-800" />

                                    {/* Requirements Section */}
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Requirements</h3>
                                            </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-purple-600 font-bold bg-purple-50 hover:bg-purple-100 rounded-lg px-4 transition-colors"
                                                    onClick={() => {
                                                        setReqTab('requirements')
                                                        setIsRequirementSheetOpen(true)
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1.5" /> Add
                                                </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            {/* Dynamic Requirements */}
                                            {selectedFields.includes('budget') && (
                                                <div className="space-y-2.5 relative group">
                                                    <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">Budget Range</Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={!isFillMode}
                                                            placeholder="e.g. 50L - 1Cr"
                                                            className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm rounded-xl shadow-sm pr-12"
                                                            value={contactInfo.budget}
                                                            onChange={(e) => setContactInfo({ ...contactInfo, budget: e.target.value })}
                                                        />
                                                        <Button variant="ghost" size="icon" className="absolute right-1 top-1 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('budget')}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedFields.includes('preferred_location') && (
                                                <div className="space-y-2.5 relative group">
                                                    <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">Preferred Location</Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={!isFillMode}
                                                            placeholder="Enter preferred location"
                                                            className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm rounded-xl shadow-sm pr-12"
                                                            value={contactInfo.preferred_location}
                                                            onChange={(e) => setContactInfo({ ...contactInfo, preferred_location: e.target.value })}
                                                        />
                                                        <Button variant="ghost" size="icon" className="absolute right-1 top-1 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('preferred_location')}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedFields.includes('preferred_floor') && (
                                                <div className="space-y-2.5 relative group">
                                                    <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">Preferred Floor</Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={!isFillMode}
                                                            placeholder="e.g. Higher floor, 5th floor"
                                                            className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm rounded-xl shadow-sm pr-12"
                                                            value={contactInfo.preferred_floor}
                                                            onChange={(e) => setContactInfo({ ...contactInfo, preferred_floor: e.target.value })}
                                                        />
                                                        <Button variant="ghost" size="icon" className="absolute right-1 top-1 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('preferred_floor')}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedFields.includes('interested_projects') && (
                                                <div className="space-y-2.5 relative group">
                                                    <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">Interested Projects / Types</Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={!isFillMode}
                                                            placeholder="e.g. 2BHK, 3BHK, Villa"
                                                            className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm rounded-xl shadow-sm pr-12"
                                                            value={contactInfo.interested_projects}
                                                            onChange={(e) => setContactInfo({ ...contactInfo, interested_projects: e.target.value })}
                                                        />
                                                        <Button variant="ghost" size="icon" className="absolute right-1 top-1 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('interested_projects')}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedFields.includes('sqft') && (
                                                <div className="space-y-2.5 relative group">
                                                    <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">Square Footage (sqft)</Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={!isFillMode}
                                                            placeholder="Enter square footage"
                                                            className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm rounded-xl shadow-sm pr-12"
                                                            value={contactInfo.sqft}
                                                            onChange={(e) => setContactInfo({ ...contactInfo, sqft: e.target.value })}
                                                        />
                                                        <Button variant="ghost" size="icon" className="absolute right-1 top-1 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('sqft')}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedFields.includes('bhk') && (
                                                <div className="space-y-3 relative group col-span-2 md:col-span-1">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400 flex items-center justify-between">
                                                        Type (BHK)
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('bhk')}><Trash2 className="w-3 h-3" /></Button>
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'].map(type => (
                                                            <div
                                                                key={type}
                                                                className={cn(
                                                                    "px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border",
                                                                    contactInfo.bhk === type
                                                                        ? "bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105"
                                                                        : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                )}
                                                                onClick={() => setContactInfo({ ...contactInfo, bhk: type })}
                                                            >
                                                                {type}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedFields.includes('bathroom_count') && (
                                                <div className="space-y-2.5 relative group">
                                                    <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">Bathrooms</Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={!isFillMode}
                                                            placeholder="Enter number of bathrooms"
                                                            className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm rounded-xl shadow-sm pr-12"
                                                            value={contactInfo.bathroom_count}
                                                            onChange={(e) => setContactInfo({ ...contactInfo, bathroom_count: e.target.value })}
                                                        />
                                                        <Button variant="ghost" size="icon" className="absolute right-1 top-1 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('bathroom_count')}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedFields.includes('parking_needed') && (
                                                <div className="space-y-3 relative group col-span-2 md:col-span-1">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400 flex items-center justify-between">
                                                        Parking
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('parking_needed')}><Trash2 className="w-3 h-3" /></Button>
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Required', 'Not Required'].map(opt => (
                                                            <div
                                                                key={opt}
                                                                className={cn(
                                                                    "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border",
                                                                    contactInfo.parking_needed === opt
                                                                        ? "bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105"
                                                                        : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                )}
                                                                onClick={() => setContactInfo({ ...contactInfo, parking_needed: opt })}
                                                            >
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedFields.includes('furniture') && (
                                                <div className="space-y-3 relative group col-span-2 md:col-span-1">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400 flex items-center justify-between">
                                                        Furnishing
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('furniture')}><Trash2 className="w-3 h-3" /></Button>
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Furnished', 'Unfurnished', 'Semi-Furnished'].map(type => (
                                                            <div
                                                                key={type}
                                                                className={cn(
                                                                    "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border",
                                                                    contactInfo.furniture === type
                                                                        ? "bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105"
                                                                        : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                )}
                                                                onClick={() => setContactInfo({ ...contactInfo, furniture: type })}
                                                            >
                                                                {type}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedFields.includes('facing') && (
                                                <div className="space-y-3 relative group col-span-2 md:col-span-1">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400 flex items-center justify-between">
                                                        Facing
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => toggleField('facing')}><Trash2 className="w-3 h-3" /></Button>
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['East', 'West', 'North', 'South', 'North-East'].map(dir => (
                                                            <div
                                                                key={dir}
                                                                className={cn(
                                                                    "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border",
                                                                    contactInfo.facing === dir
                                                                        ? "bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105"
                                                                        : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                )}
                                                                onClick={() => setContactInfo({ ...contactInfo, facing: dir })}
                                                            >
                                                                {dir}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {manualRequirements.map((req, idx) => (
                                                <div key={idx} className="space-y-2.5 relative group">
                                                    <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">{req.key}</Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={!isFillMode}
                                                            placeholder={`Enter ${req.key.toLowerCase()}`}
                                                            className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm rounded-xl shadow-sm pr-12"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-1 top-1 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                            onClick={() => setManualRequirements(manualRequirements.filter((_, i) => i !== idx))}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <Separator className="bg-slate-100 dark:bg-zinc-800" />

                                    {/* Acquisition Section */}
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Acquisition Source</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-2.5">
                                                <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">Campaign Name <span className="text-red-500">*</span></Label>
                                                <Input
                                                    disabled={!isFillMode}
                                                    placeholder="Enter campaign name"
                                                    className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm shadow-sm"
                                                    value={contactInfo.campaign}
                                                    onChange={(e) => setContactInfo({ ...contactInfo, campaign: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">Source <span className="text-red-500">*</span></Label>
                                                <Input
                                                    disabled={!isFillMode}
                                                    placeholder="e.g. Facebook, Google"
                                                    className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm rounded-xl shadow-sm"
                                                    value={contactInfo.source}
                                                    onChange={(e) => setContactInfo({ ...contactInfo, source: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-2.5">
                                                <Label className="text-[13px] font-bold text-slate-700 dark:text-zinc-400">Sub Source <span className="text-red-500">*</span></Label>
                                                <Input
                                                    disabled={!isFillMode}
                                                    placeholder="e.g. Facebook, Google"
                                                    className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm rounded-xl shadow-sm"
                                                    value={contactInfo.sub_source}
                                                    onChange={(e) => setContactInfo({ ...contactInfo, sub_source: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="mt-12 flex justify-end gap-4 pt-8 max-w-4xl mx-auto">
                                    <Button variant="outline" className="h-12 px-8 font-bold border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl" onClick={() => navigate(-1)}>Cancel</Button>
                                    <Button className="h-12 px-10 font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl shadow-lg shadow-zinc-200 dark:shadow-none" onClick={() => setCurrentStep(2)}>
                                        Next Step <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-12 max-w-4xl mx-auto bg-white dark:bg-zinc-950 p-12 rounded-4xl shadow-sm border border-slate-100 dark:border-zinc-800">
                                <section className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Destination & Assignment</h3>
                                        <Separator className="flex-1 opacity-10" />
                                    </div>
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold text-slate-700">Target Project <span className="text-red-500">*</span></Label>
                                            <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={projectOpen}
                                                        className="w-full h-14 justify-between bg-white dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-800 rounded-xl font-bold text-base hover:bg-slate-50 dark:hover:bg-zinc-900 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                                    >
                                                        {selectedProject ? selectedProject.name : "Select a project..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent side="bottom" sideOffset={10} avoidCollisions={false} className="w-[--radix-popover-trigger-width] p-0 rounded-xl overflow-hidden shadow-2xl border-slate-200 dark:border-zinc-800">
                                                    <Command className="bg-white dark:bg-zinc-950">
                                                        <CommandInput placeholder="Search projects..." />
                                                        <CommandList className="max-h-[250px] overflow-y-auto">
                                                            <CommandEmpty>No project found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {allProjects.map(p => (
                                                                    <CommandItem
                                                                        key={p._id}
                                                                        value={p.name}
                                                                        onSelect={() => {
                                                                            setSelectedProject(p)
                                                                            setProjectOpen(false)
                                                                        }}
                                                                        className="font-medium cursor-pointer py-3"
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", selectedProject?._id === p._id ? "opacity-100 text-purple-600" : "opacity-0")} />
                                                                        {p.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold text-slate-700 dark:text-zinc-400">Assign Executives</Label>
                                            <Popover open={userOpen} onOpenChange={setUserOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={userOpen}
                                                        className="w-full h-14 justify-between bg-white dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-800 rounded-xl font-bold text-base hover:bg-slate-50 dark:hover:bg-zinc-900 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-muted-foreground"
                                                    >
                                                        Search and select team members...
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent side="bottom" sideOffset={10} avoidCollisions={false} className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-2xl overflow-hidden border-slate-200 dark:border-zinc-800">
                                                    <Tabs defaultValue="all" onValueChange={setUserDepartment} className="w-full">
                                                        <TabsList className="w-full h-auto p-2 bg-slate-50 dark:bg-zinc-900 grid grid-cols-4 rounded-t-xl rounded-b-none border-b border-slate-100 dark:border-zinc-800">
                                                            <TabsTrigger value="pre-sales" className="text-xs py-2 rounded-lg text-black dark:text-white data-[state=active]:bg-black dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">Pre Sales</TabsTrigger>
                                                            <TabsTrigger value="sales" className="text-xs py-2 rounded-lg text-black dark:text-white data-[state=active]:bg-black dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">Sales</TabsTrigger>
                                                            <TabsTrigger value="post-sales" className="text-xs py-2 rounded-lg text-black dark:text-white data-[state=active]:bg-black dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">Post Sales</TabsTrigger>
                                                        </TabsList>

                                                        <Command className="bg-white dark:bg-zinc-950">
                                                            <CommandInput placeholder="Search by name or email..." />
                                                            <CommandList className="max-h-[250px] overflow-y-auto">
                                                                <CommandEmpty>No team members found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {orgUsers.filter(u => userDepartment === 'all' || u.department === userDepartment).map(u => (
                                                                        <CommandItem
                                                                            key={u._id}
                                                                            value={`${u.profile.firstName} ${u.profile.lastName} ${u.profile.email}`}
                                                                            onSelect={() => {
                                                                                if (!assignedPeople.some(ap => ap.id === u._id)) {
                                                                                    toggleAssignment(u, 'user', u.department || 'Sales')
                                                                                }
                                                                                setUserOpen(false)
                                                                            }}
                                                                            className="font-medium cursor-pointer py-3"
                                                                        >
                                                                            <div className="flex items-center w-full">
                                                                                <Check className={cn("mr-3 h-4 w-4 shrink-0 transition-opacity", assignedPeople.some(ap => ap.id === u._id) ? "opacity-100 text-emerald-500" : "opacity-0")} />
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                                                        {u.profile.firstName} {u.profile.lastName}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase leading-none mt-1">
                                                                                        {u.profile.email} {u.department ? `• ${u.department}` : ''}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </Tabs>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                    </div>
                                </section>

                                {assignedPeople.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-4">
                                        {assignedPeople.map(p => (
                                            <Badge key={p.id} className="px-4 py-2 bg-white dark:bg-zinc-100 border border-slate-200 dark:border-zinc-300 text-zinc-900 dark:text-zinc-900 rounded-full text-sm font-bold flex items-center gap-2.5 shadow-sm transition-all hover:scale-[1.02]">
                                                {p.name}
                                                <button
                                                    type="button"
                                                    className="group/remove p-0.5 -mr-1 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center outline-none"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setAssignedPeople(prev => prev.filter(x => x.id !== p.id));
                                                    }}
                                                >
                                                    <X className="w-3.5 h-3.5 text-slate-400 group-hover/remove:text-red-500 transition-colors" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between items-center bg-transparent pt-10 border-t border-slate-100 dark:border-zinc-800 mt-10">
                                    <Button variant="outline" className="h-12 px-8 font-bold border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl group" onClick={() => setCurrentStep(1)}>
                                        <ArrowLeft className="mr-3 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                                    </Button>
                                    <Button
                                        className="h-12 px-10 font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-700"
                                        onClick={() => {
                                            if (!selectedProject) {
                                                toast.error('Please select a project')
                                                return
                                            }
                                            setCurrentStep(3)
                                        }}
                                    >
                                        Proceed to Review <ArrowRight className="ml-3 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="max-w-[1100px] mx-auto py-8">
                                <Card className="rounded-2xl overflow-hidden bg-transparent border border-zinc-250 dark:border-zinc-800 p-0 shadow-none">
                                    <CardHeader className="bg-slate-50 dark:bg-black px-6 pt-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                                                    {isFillMode ? `Website Lead Form - ${selectedProject?.name || 'Project'}` : 'Review Configured Form'}
                                                </CardTitle>
                                                <CardDescription className="font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 uppercase tracking-widest text-[11px]">
                                                    {isFillMode ? `New lead for ${selectedProject?.name}` : 'Review the structure and team assignments before finalizing the capture config.'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="flex flex-col dark:divide-zinc-800">
                                            <div className="p-10 space-y-12">
                                                {/* Compact Summary Header */}
                                                {/* Compact Summary Header - Hidden in Fill Mode */}
                                                {!isFillMode && (
                                                    <div className="flex flex-wrap items-center gap-x-12 gap-y-6 p-6 bg-slate-50/50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-800/50 mb-8">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <Target className="w-3.5 h-3.5 text-zinc-400" />
                                                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Project</p>
                                                            </div>
                                                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 pl-5">{selectedProject?.name || 'No project selected'}</p>
                                                        </div>

                                                        <div className="space-y-2.5 flex-1 min-w-[300px]">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-3.5 h-3.5 text-zinc-400" />
                                                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Team</p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 pl-5">
                                                                {assignedPeople.map(p => (
                                                                    <div key={p.id} className="relative">
                                                                        <Badge
                                                                            key={p.id}
                                                                            className="px-4 py-2 bg-white dark:bg-zinc-100 border border-slate-200 dark:border-zinc-300 text-zinc-900 dark:text-zinc-900 rounded-full text-sm font-bold flex items-center gap-2.5 shadow-sm transition-all hover:scale-[1.02]"
                                                                        >
                                                                            {p.name}
                                                                            <button
                                                                                type="button"
                                                                                className="group/remove p-0.5 -mr-1 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center outline-none"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    setAssignedPeople(prev => prev.filter(x => x.id !== p.id));
                                                                                }}
                                                                            >
                                                                                <X className="w-3.5 h-3.5 text-slate-400 group-hover/remove:text-red-500 transition-colors" />
                                                                            </button>
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                                {assignedPeople.length === 0 && <span className="text-xs text-slate-400 italic">No team members assigned</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}


                                                {/* Preview: Contact Section */}
                                                <section className="space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-400 shadow-sm" />
                                                        <h3 className="text-xs font-black uppercase text-blue-500 tracking-wider">Contact Information</h3>
                                                    </div>
                                                    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 px-4", !isFillMode && "opacity-70 pointer-events-none")}>
                                                        <div className="space-y-3.5">
                                                            <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400 flex items-center gap-1.5">Full Name <span className="text-red-500">*</span></Label>
                                                            <Input
                                                                disabled={!isFillMode}
                                                                placeholder="Enter lead full name"
                                                                className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900"
                                                                value={contactInfo.name}
                                                                onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-3.5">
                                                            <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400 flex items-center gap-1.5">Phone Number <span className="text-red-500">*</span></Label>
                                                            <Input
                                                                disabled={!isFillMode}
                                                                placeholder="Enter lead phone number"
                                                                className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900"
                                                                value={contactInfo.phone}
                                                                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                                            />
                                                        </div>

                                                        {/* Preview Dynamic Contact Fields */}
                                                        {selectedContactFields.map(fieldId => {
                                                            const field = CONTACT_FIELD_GROUPS.flatMap((g: any) => g.fields).find((f: any) => f.id === fieldId);
                                                            if (!field) return null;
                                                            return (
                                                                <div key={fieldId} className="space-y-3.5">
                                                                    <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">{field.label}</Label>
                                                                    <Input
                                                                        disabled={!isFillMode}
                                                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                                                        className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900"
                                                                        value={(contactInfo as any)[fieldId] || ''}
                                                                        onChange={(e) => setContactInfo({ ...contactInfo, [fieldId]: e.target.value })}
                                                                    />
                                                                </div>
                                                            )
                                                        })}

                                                        {/* Preview Manual Contact Fields */}
                                                        {manualContactFields.map((field, idx) => (
                                                            <div key={`preview-manual-contact-${idx}`} className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">{field.key}</Label>
                                                                <Input
                                                                    disabled={!isFillMode}
                                                                    placeholder={`Enter ${field.key.toLowerCase()}`}
                                                                    className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900"
                                                                    value={(contactInfo as any)[field.key] || ''}
                                                                    onChange={(e) => setContactInfo({ ...contactInfo, [field.key]: e.target.value })}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>

                                                <Separator className="bg-slate-100 dark:bg-zinc-800" />

                                                {/* Preview: Requirements Section */}
                                                <section className="space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-400 shadow-sm" />
                                                        <h3 className="text-xs font-black uppercase text-purple-500 tracking-wider">Project Requirements</h3>
                                                    </div>

                                                    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 px-4", !isFillMode && "opacity-70 pointer-events-none")}>
                                                        {selectedFields.includes('budget') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Budget Range</Label>
                                                                <Input
                                                                    disabled={!isFillMode}
                                                                    placeholder="e.g. 50L - 1Cr"
                                                                    className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900"
                                                                    value={contactInfo.budget}
                                                                    onChange={(e) => setContactInfo({ ...contactInfo, budget: e.target.value })}
                                                                />
                                                            </div>
                                                        )}
                                                        {selectedFields.includes('preferred_location') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Preferred Location</Label>
                                                                <Input
                                                                    disabled={!isFillMode}
                                                                    placeholder="Enter preferred area"
                                                                    className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm"
                                                                    value={contactInfo.preferred_location}
                                                                    onChange={(e) => setContactInfo({ ...contactInfo, preferred_location: e.target.value })}
                                                                />
                                                            </div>
                                                        )}
                                                        {selectedFields.includes('preferred_floor') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Preferred Floor</Label>
                                                                <Input
                                                                    disabled={!isFillMode}
                                                                    placeholder="e.g. 5th floor, Penthouse"
                                                                    className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm"
                                                                    value={contactInfo.preferred_floor}
                                                                    onChange={(e) => setContactInfo({ ...contactInfo, preferred_floor: e.target.value })}
                                                                />
                                                            </div>
                                                        )}
                                                        {selectedFields.includes('interested_projects') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Interested Variants</Label>
                                                                <Input
                                                                    disabled={!isFillMode}
                                                                    placeholder="e.g. 2BHK Corner, 3BHK Loft"
                                                                    className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm"
                                                                    value={contactInfo.interested_projects}
                                                                    onChange={(e) => setContactInfo({ ...contactInfo, interested_projects: e.target.value })}
                                                                />
                                                            </div>
                                                        )}
                                                        {selectedFields.includes('sqft') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Area (sqft)</Label>
                                                                <Input
                                                                    disabled={!isFillMode}
                                                                    placeholder="Enter square footage"
                                                                    className="h-16 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-sm rounded-2xl shadow-sm focus:ring-1 focus:ring-zinc-400"
                                                                    value={contactInfo.sqft}
                                                                    onChange={(e) => setContactInfo({ ...contactInfo, sqft: e.target.value })}
                                                                />
                                                            </div>
                                                        )}
                                                        {selectedFields.includes('bhk') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Type (BHK)</Label>
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'].map(type => (
                                                                        <div
                                                                            key={type}
                                                                            className={cn(
                                                                                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border",
                                                                                contactInfo.bhk === type ? "bg-zinc-900 text-white border-zinc-900 shadow-xl scale-105" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                            )}
                                                                            onClick={() => isFillMode && setContactInfo({ ...contactInfo, bhk: type })}
                                                                        >
                                                                            {type}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedFields.includes('bathroom_count') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Bathrooms</Label>
                                                                <Input
                                                                    disabled={!isFillMode}
                                                                    placeholder="Enter number of bathrooms"
                                                                    className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm"
                                                                    value={contactInfo.bathroom_count}
                                                                    onChange={(e) => setContactInfo({ ...contactInfo, bathroom_count: e.target.value })}
                                                                />
                                                            </div>
                                                        )}
                                                        {selectedFields.includes('parking_needed') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Parking</Label>
                                                                <div className="flex gap-2 mt-2">
                                                                    {['Required', 'Not Required'].map(opt => (
                                                                        <div
                                                                            key={opt}
                                                                            className={cn(
                                                                                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border",
                                                                                contactInfo.parking_needed === opt ? "bg-zinc-900 text-white border-zinc-900 shadow-xl scale-105" : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                            )}
                                                                            onClick={() => isFillMode && setContactInfo({ ...contactInfo, parking_needed: opt })}
                                                                        >
                                                                            {opt}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedFields.includes('furniture') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Furnishing</Label>
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {['Furnished', 'Unfurnished', 'Semi-Furnished'].map(type => (
                                                                        <div
                                                                            key={type}
                                                                            className={cn(
                                                                                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border",
                                                                                contactInfo.furniture === type ? "bg-zinc-900 text-white border-zinc-900 shadow-xl scale-105" : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                            )}
                                                                            onClick={() => isFillMode && setContactInfo({ ...contactInfo, furniture: type })}
                                                                        >
                                                                            {type}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {selectedFields.includes('facing') && (
                                                            <div className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Facing</Label>
                                                                <div className="grid grid-cols-4 gap-2 mt-2">
                                                                    {['North', 'South', 'East', 'West'].map(dir => (
                                                                        <div
                                                                            key={dir}
                                                                            className={cn(
                                                                                "px-3 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all text-center border",
                                                                                contactInfo.facing === dir ? "bg-zinc-900 text-white border-zinc-900 shadow-xl scale-105" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                            )}
                                                                            onClick={() => isFillMode && setContactInfo({ ...contactInfo, facing: dir })}
                                                                        >
                                                                            {dir}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {manualRequirements.map((req, idx) => (
                                                            <div key={idx} className="space-y-3.5">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">{req.key}</Label>
                                                                <Input
                                                                    disabled={!isFillMode}
                                                                    placeholder={`Enter ${req.key.toLowerCase()}`}
                                                                    className="h-14 bg-white dark:bg-zinc-950 border-zinc-400 dark:border-zinc-800 text-sm rounded-2xl shadow-sm"
                                                                    value={req.value}
                                                                    onChange={(e) => {
                                                                        const updated = [...manualRequirements]
                                                                        updated[idx].value = e.target.value
                                                                        setManualRequirements(updated)
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>

                                                <Separator className="bg-slate-100 dark:bg-zinc-800" />

                                                {/* Preview: Acquisition Source */}
                                                <section className="space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        <h3 className="text-[13px] font-black uppercase text-emerald-500 tracking-[0.2em]">Acquisition Source</h3>
                                                    </div>

                                                    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 px-4", !isFillMode && "opacity-70 pointer-events-none")}>
                                                        {/* Campaign Selection */}
                                                        <div className="space-y-4">
                                                            <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Campaign Name</Label>
                                                            <Select
                                                                disabled={!isFillMode}
                                                                value={contactInfo.campaign}
                                                                onValueChange={(val) => isFillMode && setContactInfo({
                                                                    ...contactInfo,
                                                                    campaign: val,
                                                                    source: '',
                                                                    sub_source: ''
                                                                })}
                                                            >
                                                                <SelectTrigger className="w-full h-16 bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-sm font-medium rounded-xl shadow-sm focus:ring-1 focus:ring-zinc-400 transition-all outline-none">
                                                                    <SelectValue placeholder="Select campaign" />
                                                                </SelectTrigger>
                                                                <SelectContent side="bottom" position="item-aligned" className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                                    {allCampaigns.map(camp => (
                                                                        <SelectItem key={camp.uuid} value={camp.campaignName} className="py-3 font-medium uppercase text-[10px] tracking-widest">{camp.campaignName}</SelectItem>
                                                                    ))}
                                                                    {allCampaigns.length === 0 && <div className="p-4 text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">No campaigns defined</div>}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Lead Source */}
                                                        <div className="space-y-4">
                                                            <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Source</Label>
                                                            <Select
                                                                disabled={!contactInfo.campaign || !isFillMode}
                                                                value={contactInfo.source}
                                                                onValueChange={(val) => setContactInfo({ ...contactInfo, source: val, sub_source: '' })}
                                                            >
                                                                <SelectTrigger className="w-full h-16 bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-sm font-medium rounded-xl shadow-sm outline-none">
                                                                    <SelectValue placeholder={!contactInfo.campaign ? "Select campaign first" : "Select source"} />
                                                                </SelectTrigger>
                                                                <SelectContent side="bottom" position="item-aligned" className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                                    {(allCampaigns.find(c => c.campaignName === contactInfo.campaign)?.sources || []).map((s: any) => (
                                                                        <SelectItem key={s.uuid} value={s.sourceName} className="py-3 font-medium text-[10px] uppercase tracking-widest">{s.sourceName}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Sub Source - Hidden for CP */}
                                                        {!(getCookie('category') === 'CP' || getCookie('userRole') === 'CP' || getCookie('role') === 'cp') && (
                                                            <div className="space-y-4">
                                                                <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Sub Source</Label>
                                                                <Select
                                                                    disabled={!contactInfo.source || !isFillMode}
                                                                    value={contactInfo.sub_source}
                                                                    onValueChange={(val) => setContactInfo({ ...contactInfo, sub_source: val })}
                                                                >
                                                                    <SelectTrigger className="w-full h-16 bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-sm font-medium rounded-xl shadow-sm outline-none">
                                                                        <SelectValue placeholder={!contactInfo.source ? "Select source first" : "Select sub source"} />
                                                                    </SelectTrigger>
                                                                    <SelectContent side="bottom" position="item-aligned" className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                                        {(allCampaigns.find(c => c.campaignName === contactInfo.campaign)?.sources?.find((s: any) => s.sourceName === contactInfo.source)?.subSources || []).map((ss: any) => (
                                                                            <SelectItem key={ss.uuid} value={ss.subSourceName} className="py-3 font-medium text-[10px] uppercase tracking-widest">{ss.subSourceName}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between p-8 bg-slate-50 dark:bg-black border-t border-slate-100 dark:border-zinc-800">
                                        <Button
                                            variant="outline"
                                            className="h-14 px-10 font-black text-rose-500 border-rose-100 dark:border-rose-900/30 bg-white dark:bg-rose-950/10 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all uppercase text-[11px] tracking-widest group"
                                            onClick={() => isFillMode ? navigate('/NewLead') : setCurrentStep(2)}
                                        >
                                            <ArrowLeft className="mr-4 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {isFillMode ? 'Discard Entry' : 'Back to Routing'}
                                        </Button>
                                        <Button
                                            className="h-14 px-14 font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl border border-zinc-900 dark:border-zinc-200 hover:scale-105 active:scale-95 transition-all outline-none uppercase text-[11px] tracking-widest"
                                            onClick={handleConfirm}
                                            disabled={submittingLead}
                                        >
                                            {submittingLead ? 'Capturing...' : isFillMode ? 'Create New Lead' : 'Finalize Configuration'} <Check className="ml-4 w-5 h-5 font-black" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        )}
                    </div>
                </main>

                {/* Contact Information Selection Sheet */}
                <Sheet open={isContactSheetOpen} onOpenChange={setIsContactSheetOpen}>
                    <SheetContent className="overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Contact Fields</SheetTitle>
                            <SheetDescription>
                                Add additional contact and demographic fields to your form.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6 px-4 pb-8">
                            <div className="flex gap-2 border-b pb-4 overflow-x-auto">
                                <Button
                                    size="sm"
                                    variant={contactTab === 'prebuilt' ? 'default' : 'outline'}
                                    onClick={() => setContactTab('prebuilt')}
                                    className="whitespace-nowrap"
                                >
                                    Pre-built
                                </Button>
                                <Button
                                    size="sm"
                                    variant={contactTab === 'manual' ? 'default' : 'outline'}
                                    onClick={() => setContactTab('manual')}
                                    className="whitespace-nowrap"
                                >
                                    Manual Input
                                </Button>
                            </div>

                            {contactTab === 'prebuilt' ? (
                                <div className="space-y-8">
                                    {CONTACT_FIELD_GROUPS.map((group: any) => (
                                        <div key={group.title} className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">{group.title}</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                {group.fields.map((field: any) => (
                                                    <div
                                                        key={field.id}
                                                        className={cn(
                                                            "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                                            selectedContactFields.includes(field.id) ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-zinc-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50"
                                                        )}
                                                        onClick={() => {
                                                            if (selectedContactFields.includes(field.id)) {
                                                                setSelectedContactFields(prev => prev.filter(f => f !== field.id))
                                                            } else {
                                                                setSelectedContactFields(prev => [...prev, field.id])
                                                            }
                                                        }}
                                                    >
                                                        <Label className="font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer">{field.label}</Label>
                                                        <Checkbox checked={selectedContactFields.includes(field.id)} onCheckedChange={() => { }} className="w-5 h-5 rounded-md" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        className="w-full h-11 font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl mt-6"
                                        onClick={() => setIsContactSheetOpen(false)}
                                    >
                                        Apply Requirements
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[13px] font-bold">Field Name</Label>
                                            <Input
                                                placeholder="e.g. Alternate Phone, LinkedIn, etc."
                                                className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl"
                                                value={newManualContactKey}
                                                onChange={(e) => setNewManualContactKey(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newManualContactKey) {
                                                        setManualContactFields([...manualContactFields, { key: newManualContactKey }])
                                                        setNewManualContactKey('')
                                                    }
                                                }}
                                            />
                                        </div>
                                        <Button
                                            className="w-full h-11 font-bold bg-slate-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl hover:bg-slate-200"
                                            onClick={() => {
                                                if (newManualContactKey) {
                                                    setManualContactFields([...manualContactFields, { key: newManualContactKey }])
                                                    setNewManualContactKey('')
                                                }
                                            }}
                                        >
                                            Add Custom Contact Field
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Current Manual Fields</Label>
                                        {manualContactFields.length === 0 ? (
                                            <div className="py-12 flex flex-col items-center gap-4 border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-2xl">
                                                <p className="text-sm text-slate-400">No custom contact fields added</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {manualContactFields.map((field, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 border border-slate-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 shadow-sm transition-all hover:border-slate-200">
                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{field.key}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            onClick={() => setManualContactFields(manualContactFields.filter((_, idx) => idx !== i))}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full h-11 font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl mt-6"
                                        onClick={() => setIsContactSheetOpen(false)}
                                    >
                                        Apply Requirements
                                    </Button>
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Property Requirements Selection Sheet */}
                <Sheet open={isRequirementSheetOpen} onOpenChange={setIsRequirementSheetOpen}>
                    <SheetContent className="overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Property Requirements</SheetTitle>
                            <SheetDescription>
                                Define structured or custom requirements for this lead.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6 px-4 pb-8">
                            <div className="flex gap-2 border-b pb-4 overflow-x-auto">
                                <Button
                                    size="sm"
                                    variant={reqTab === 'requirements' ? 'default' : 'outline'}
                                    onClick={() => setReqTab('requirements')}
                                    className="whitespace-nowrap"
                                >
                                    Pre-built
                                </Button>
                                <Button
                                    size="sm"
                                    variant={reqTab === 'manual' ? 'default' : 'outline'}
                                    onClick={() => setReqTab('manual')}
                                    className="whitespace-nowrap"
                                >
                                    Manual Input
                                </Button>
                            </div>

                            {reqTab === 'requirements' ? (
                                <div className="space-y-4">
                                    {[
                                        { id: 'sqft', label: 'Square Footage (sqft)' },
                                        { id: 'bhk', label: 'Type (BHK)' },
                                        { id: 'preferred_floor', label: 'Floor Preference' },
                                        { id: 'bathroom_count', label: 'Bathrooms' },
                                        { id: 'parking_needed', label: 'Parking Needed' },
                                        { id: 'budget', label: 'Price Range (₹)' },
                                        { id: 'furniture', label: 'Furniture' },
                                        { id: 'facing', label: 'Facing' },
                                    ].map((field) => (
                                        <div
                                            key={field.id}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                                selectedFields.includes(field.id) ? "border-primary bg-primary/5 shadow-sm" : "border-zinc-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50"
                                            )}
                                            onClick={() => toggleField(field.id)}
                                        >
                                            <Label className="font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer">{field.label}</Label>
                                            <Checkbox checked={selectedFields.includes(field.id)} onCheckedChange={() => toggleField(field.id)} className="w-5 h-5 rounded-md" />
                                        </div>
                                    ))}

                                    <Button
                                        className="w-full h-11 font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl mt-6"
                                        onClick={() => setIsRequirementSheetOpen(false)}
                                    >
                                        Apply Requirements
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[13px] font-bold">Requirement Title</Label>
                                            <Input
                                                placeholder="e.g. Garden, Facing, etc."
                                                className="h-12 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl"
                                                value={newManualKey}
                                                onChange={(e) => setNewManualKey(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newManualKey) {
                                                        setManualRequirements([...manualRequirements, { key: newManualKey, value: '' }])
                                                        setNewManualKey('')
                                                    }
                                                }}
                                            />
                                        </div>
                                        <Button
                                            className="w-full h-11 font-bold bg-slate-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl hover:bg-slate-200"
                                            onClick={() => {
                                                if (newManualKey) {
                                                    setManualRequirements([...manualRequirements, { key: newManualKey, value: '' }])
                                                    setNewManualKey('')
                                                }
                                            }}
                                        >
                                            Add Requirement
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Current Manual Requirements</Label>
                                        {manualRequirements.length === 0 ? (
                                            <div className="py-12 flex flex-col items-center gap-4 border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-lg">
                                                <p className="text-sm text-slate-400">No custom requirements added</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {manualRequirements.map((req, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 border border-slate-100 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm transition-all hover:border-slate-200">
                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{req.key}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            onClick={() => setManualRequirements(manualRequirements.filter((_, idx) => idx !== i))}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full h-11 font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg mt-6"
                                        onClick={() => setIsRequirementSheetOpen(false)}
                                    >
                                        Apply Requirements
                                    </Button>
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}