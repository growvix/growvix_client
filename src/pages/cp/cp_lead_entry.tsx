import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { getCookie } from "@/utils/cookies"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    ArrowLeft, 
    Save, 
    Loader2, 
    CheckCircle2, 
    Target,
    ClipboardIcon,
    AlertCircle,
    UserPlus,
    Hash,
    MapPin,
    Mail as MailIcon,
    Phone as PhoneIcon,
} from "lucide-react"
import { 
    Field,
    FieldLabel,
} from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { API } from "@/config/api"
import axios from "axios"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function CpLeadEntry() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const formId = searchParams.get('id')
    
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState<any>({
        name: '',
        email: '',
        phone: '',
        location: '',
        bhk: '',
        budget: '',
        preferred_location: '',
        preferred_floor: '',
        interested_projects: '',
        sqft: '',
        furniture: '',
        facing: '',
        bathroom_count: '',
        parking_needed: '',
        campaign: '',
        source: '',
        sub_source: '',
        medium: '',
    })

    useEffect(() => {
        if (formId) {
            fetchConfig()
        }
    }, [formId])

    const fetchConfig = async () => {
        setLoading(true)
        try {
            const token = getCookie('token')
            const res = await axios.get(`${API.LEAD_CAPTURE_CONFIGS}/${formId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.data) {
                const config = res.data.data
                setConfig(config)
                setFormData((prev: any) => ({
                    ...prev,
                    campaign: config.contact_info.campaign || '',
                    source: config.contact_info.source || '',
                    sub_source: config.contact_info.sub_source || '',
                    medium: config.contact_info.medium || '',
                }))
            }
        } catch (error) {
            console.error("Failed to fetch configuration:", error)
            toast.error("Form configuration not found")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.phone) {
            toast.error("Name and Phone are mandatory")
            return
        }

        setSubmitting(true)
        try {
            const token = getCookie('token')
            const org = getCookie('organization')
            
            // In a real scenario, we'd have a specific endpoint that handles the assignment logic
            // for now we'll simulate it by creating a lead with the correct campaign/source
            const payload = {
                organization: org,
                profile: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    location: formData.location
                },
                acquired: [{
                    campaign: formData.campaign || config.contact_info.campaign || 'Lead Capture',
                    source: formData.source || config.contact_info.source || 'Manual Ingestion',
                    sub_source: formData.sub_source || config.contact_info.sub_source || '',
                    medium: formData.medium || config.contact_info.medium || '',
                    received: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                }],
                project_id: config.project_id._id,
                requirement: {
                    bhk: formData.bhk ? [formData.bhk] : [],
                    budget: formData.budget,
                    preferred_location: formData.preferred_location,
                    preferred_floor: formData.preferred_floor,
                    interested_projects: formData.interested_projects,
                    sqft: formData.sqft ? Number(formData.sqft) : undefined,
                    furniture: formData.furniture ? [formData.furniture] : [],
                    facing: formData.facing ? [formData.facing] : [],
                    bathroom_count: formData.bathroom_count ? Number(formData.bathroom_count) : undefined,
                    parking_needed: formData.parking_needed === 'true' || formData.parking_needed === true
                }
            }

            await axios.post(`${API.LEADS}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            })

            toast.success("Lead added successfully!")
            const role = getCookie('role')
            if (role === 'cp' || role === 'channel_partner' || role === 'cp_user') {
                navigate('/cp/dashboard')
            } else {
                navigate('/automation/leadcapture')
            }
        } catch (error: any) {
            console.error("Error submitting lead:", error)
            toast.error(error.response?.data?.message || "Failed to submit lead")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600 dark:text-purple-400" />
                    <p className="text-slate-400 dark:text-zinc-500 font-bold text-sm uppercase tracking-widest">Loading entry form...</p>
                </div>
            </div>
        )
    }
    
    if (!config) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 gap-6">
                <AlertCircle className="h-16 w-16 text-red-400" />
                <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-100">Configuration Missing</h2>
                <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl h-12 px-8 font-bold border-slate-200 dark:border-zinc-800">
                    Go Back
                </Button>
            </div>
        )
    }

    const { selected_fields = [] } = config

    return (
        <div className="min-h-screen p-6 md:p-8 flex justify-center items-start bg-slate-50/50 dark:bg-black">
            <Card className="w-full max-w-4xl shadow-none pt-0 rounded-lg overflow-hidden bg-transparent border-slate-200 dark:border-zinc-800">
                <CardHeader className="border-b dark:border-zinc-800 pb-6 dark:bg-zinc-950 bg-neutral-100/50 pt-6 rounded-t-lg">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(-1)}
                            className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 h-10 w-10 text-zinc-600 dark:text-zinc-400"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <CardTitle className="text-xl text-zinc-950 dark:text-zinc-50">{config.name}</CardTitle>
                            <CardDescription className="text-sm font-medium">New lead for <span className="text-purple-600 dark:text-purple-400 font-bold">{config.project_id.name}</span></CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <form onSubmit={handleSubmit}>
                        <div className="px-8 py-6 space-y-8">
                            {/* Contact Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></span>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">Contact Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <Field>
                                        <FieldLabel htmlFor="name">Full Name <span className="text-red-500">*</span></FieldLabel>
                                        <div className="relative">
                                            <Input 
                                                id="name"
                                                name="name"
                                                placeholder="Enter lead name" 
                                                className="h-10 pl-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                            <UserPlus className="absolute left-3 top-2.5 h-5 w-5 text-slate-300 dark:text-zinc-600" />
                                        </div>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="phone">Phone Number <span className="text-red-500">*</span></FieldLabel>
                                        <div className="relative">
                                            <Input 
                                                id="phone"
                                                name="phone"
                                                placeholder="e.g. +91 98765 43210" 
                                                className="h-10 pl-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            />
                                            <PhoneIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-300 dark:text-zinc-600" />
                                        </div>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="email">Email Address</FieldLabel>
                                        <div className="relative">
                                            <Input 
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="example@email.com" 
                                                className="h-10 pl-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                            <MailIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-300 dark:text-zinc-600" />
                                        </div>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="location">Current Location</FieldLabel>
                                        <div className="relative">
                                            <Input 
                                                id="location"
                                                name="location"
                                                placeholder="Enter city or area" 
                                                className="h-10 pl-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                                                value={formData.location}
                                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            />
                                            <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-slate-300 dark:text-zinc-600" />
                                        </div>
                                    </Field>
                                </div>
                            </section>

                            {(selected_fields.length > 0 || config.manual_requirements?.length > 0) && (
                                <>
                                    <Separator className="opacity-50" />
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm"></span>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-500 dark:text-purple-400">Project Requirements</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            {selected_fields.includes('budget') && (
                                                <Field>
                                                    <FieldLabel htmlFor="budget">Budget Range</FieldLabel>
                                                    <Input 
                                                        id="budget"
                                                        placeholder="e.g. 50L - 1Cr" 
                                                        className="h-10"
                                                        value={formData.budget}
                                                        onChange={(e) => setFormData({...formData, budget: e.target.value})}
                                                    />
                                                </Field>
                                            )}
                                            {selected_fields.includes('preferred_location') && (
                                                <Field>
                                                    <FieldLabel htmlFor="preferred_location">Preferred Location</FieldLabel>
                                                    <Input 
                                                        id="preferred_location"
                                                        placeholder="Preferred search area" 
                                                        className="h-10"
                                                        value={formData.preferred_location}
                                                        onChange={(e) => setFormData({...formData, preferred_location: e.target.value})}
                                                    />
                                                </Field>
                                            )}
                                            {selected_fields.includes('sqft') && (
                                                <Field>
                                                    <FieldLabel htmlFor="sqft">Area (Sqft)</FieldLabel>
                                                    <Input 
                                                        id="sqft"
                                                        placeholder="Required square footage" 
                                                        className="h-10"
                                                        value={formData.sqft}
                                                        onChange={(e) => setFormData({...formData, sqft: e.target.value})}
                                                    />
                                                </Field>
                                            )}
                                            {selected_fields.includes('preferred_floor') && (
                                                <Field>
                                                    <FieldLabel htmlFor="preferred_floor">Preferred Floor</FieldLabel>
                                                    <Input 
                                                        id="preferred_floor"
                                                        placeholder="e.g. Higher, 5th" 
                                                        className="h-10"
                                                        value={formData.preferred_floor}
                                                        onChange={(e) => setFormData({...formData, preferred_floor: e.target.value})}
                                                    />
                                                </Field>
                                            )}
                                            {selected_fields.includes('bhk') && (
                                                <Field className="col-span-1 md:col-span-2">
                                                    <FieldLabel>Configuration (BHK)</FieldLabel>
                                                    <div className="flex flex-wrap gap-3 mt-2">
                                                        {['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'].map(type => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => setFormData({...formData, bhk: type})}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs",
                                                                    formData.bhk === type 
                                                                        ? "bg-purple-600 border-purple-600 text-white" 
                                                                        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                )}
                                                            >
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </Field>
                                            )}
                                            {selected_fields.includes('furniture') && (
                                                <Field className="col-span-1 md:col-span-2">
                                                    <FieldLabel>Furniture Preference</FieldLabel>
                                                    <div className="flex flex-wrap gap-3 mt-2">
                                                        {['Furnished', 'Unfurnished', 'Semi-Furnished'].map(type => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => setFormData({...formData, furniture: type})}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs",
                                                                    formData.furniture === type 
                                                                        ? "bg-purple-600 border-purple-600 text-white" 
                                                                        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                )}
                                                            >
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </Field>
                                            )}
                                            {selected_fields.includes('facing') && (
                                                <Field className="col-span-1 md:col-span-2">
                                                    <FieldLabel>Facing Direction</FieldLabel>
                                                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-2">
                                                        {['North', 'South', 'East', 'West', 'N-E', 'N-W', 'S-E', 'S-W'].map(dir => (
                                                            <button
                                                                key={dir}
                                                                type="button"
                                                                onClick={() => setFormData({...formData, facing: dir})}
                                                                className={cn(
                                                                    "py-2 rounded-lg text-[11px] font-bold transition-all border shadow-xs text-center",
                                                                    formData.facing === dir 
                                                                        ? "bg-purple-600 border-purple-600 text-white" 
                                                                        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700"
                                                                )}
                                                            >
                                                                {dir}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </Field>
                                            )}
                                            {config.manual_requirements && config.manual_requirements.map((req: any) => (
                                                <Field key={req.key} className="col-span-1 md:col-span-2">
                                                    <FieldLabel htmlFor={req.key}>{req.key}</FieldLabel>
                                                    <Input 
                                                        id={req.key}
                                                        placeholder={`Specify for ${req.key}`} 
                                                        className="h-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                                                        onChange={(e) => {
                                                            const currentManual = formData.manual_requirements || {}
                                                            setFormData({...formData, manual_requirements: {...currentManual, [req.key]: e.target.value}})
                                                        }}
                                                    />
                                                </Field>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}

                            <Separator className="opacity-50" />
                            {/* Acquisition Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <h3 className="text-[13px] font-black uppercase text-emerald-500 tracking-[0.2em]">Acquisition Source</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                                    {/* Campaign Selection */}
                                    <div className="space-y-4">
                                        <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Campaign Name</Label>
                                        <Select 
                                            value={formData.campaign}
                                            onValueChange={(val) => setFormData({
                                                ...formData, 
                                                campaign: val,
                                                source: '',
                                                sub_source: ''
                                            })}
                                        >
                                            <SelectTrigger className="w-full h-16 bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-sm font-medium rounded-2xl shadow-sm focus:ring-1 focus:ring-zinc-400 transition-all outline-none">
                                                <SelectValue placeholder="Enter campaign name" />
                                            </SelectTrigger>
                                            <SelectContent side="bottom" position="item-aligned" className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                {(['CP', 'cp', 'cp_user', 'channel_partner'].includes(getCookie('category')) || ['CP', 'cp', 'cp_user', 'channel_partner'].includes(getCookie('userRole')) || ['CP', 'cp', 'cp_user', 'channel_partner'].includes(getCookie('role')) ? ['Channel Partner', 'Online', 'Offline'] : ['Online', 'Offline']).map(type => (
                                                    <SelectItem key={type} value={type} className="py-3 font-medium uppercase text-[10px] tracking-widest">{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Lead Source */}
                                    <div className="space-y-4">
                                        <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Source</Label>
                                        <Select 
                                            disabled={!formData.campaign}
                                            value={formData.source}
                                            onValueChange={(val) => setFormData({...formData, source: val, sub_source: ''})}
                                        >
                                            <SelectTrigger className="w-full h-16 bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-sm font-medium rounded-2xl shadow-sm outline-none">
                                                <SelectValue placeholder={!formData.campaign ? "Select campaign first" : "e.g. Facebook, Google"} />
                                            </SelectTrigger>
                                            <SelectContent side="bottom" position="item-aligned" className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                {(formData.campaign === 'Online' 
                                                    ? ['Google', 'Facebook', 'Instagram', 'LinkedIn', 'Housing', '99Acres', 'MagicBricks', 'Website']
                                                    : formData.campaign === 'Offline'
                                                    ? ['Reference', 'Walk-in', 'Signage', 'Events', 'Newspaper', 'Brochures']
                                                    : ['Partner Dashboard', 'Direct Link', 'CP Referral']
                                                ).map(opt => (
                                                    <SelectItem key={opt} value={opt} className="py-3 font-medium text-[10px] uppercase tracking-widest">{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Sub Source - Hidden for CP */}
                                    {!(getCookie('category') === 'CP' || getCookie('userRole') === 'CP' || getCookie('role') === 'cp') && (
                                        <div className="space-y-4">
                                            <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Sub Source</Label>
                                            <Select 
                                                disabled={!formData.source}
                                                value={formData.sub_source}
                                                onValueChange={(val) => setFormData({...formData, sub_source: val})}
                                            >
                                                <SelectTrigger className="w-full h-16 bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-sm font-medium rounded-2xl shadow-sm outline-none">
                                                    <SelectValue placeholder={!formData.source ? "Select source first" : "e.g. Ad Campaign, Event"} />
                                                </SelectTrigger>
                                                <SelectContent side="bottom" position="item-aligned" className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                    {(formData.source === 'Google' 
                                                        ? ['LSA', 'Search', 'Display', 'Discovery', 'Remarketing']
                                                        : formData.source === 'Facebook' || formData.source === 'Instagram'
                                                        ? ['Lead Form', 'Messenger', 'Direct Ad', 'Post Engagement']
                                                        : formData.source === 'Website'
                                                        ? ['Main Landing', 'Project Page', 'Contact Form', 'Chatbot']
                                                        : ['General', 'Specific Campaign', 'Partner Sync']
                                                    ).map(opt => (
                                                        <SelectItem key={opt} value={opt} className="py-3 font-medium text-[10px] uppercase tracking-widest">{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Interaction Medium - Hidden for CP */}
                                    {!(getCookie('category') === 'CP' || getCookie('userRole') === 'CP' || getCookie('role') === 'cp') && (
                                        <div className="space-y-4">
                                            <Label className="text-[13px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-400">Medium</Label>
                                            <Select 
                                                value={formData.medium}
                                                onValueChange={(val) => setFormData({...formData, medium: val})}
                                            >
                                                <SelectTrigger className="w-full h-16 bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-sm font-medium rounded-2xl shadow-sm outline-none">
                                                    <SelectValue placeholder="e.g. WhatsApp, Phone" />
                                                </SelectTrigger>
                                                <SelectContent side="bottom" position="item-aligned" className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                    {['API', 'Walkin', 'WhatsApp', 'Phone Call', 'SMS'].map(opt => (
                                                        <SelectItem key={opt} value={opt} className="py-3 font-medium text-[10px] uppercase tracking-widest">{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="p-6 mx-8 mb-8 rounded-lg dark:bg-zinc-900 bg-neutral-50 border border-slate-100 dark:border-zinc-800 flex justify-end gap-3">
                            <Button 
                                variant="destructive" 
                                type="button" 
                                onClick={() => navigate(-1)} 
                                className="min-w-[100px] h-10 rounded-lg font-bold"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={submitting} 
                                className="min-w-[140px] h-10 rounded-lg bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 font-bold flex items-center gap-2 transition-all outline-none"
                            >
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 text-emerald-400" />}
                                {submitting ? 'Submitting...' : 'Submit Lead'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
