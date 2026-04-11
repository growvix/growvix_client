import { useState, useEffect } from 'react'
import axios from 'axios'
import { API } from '@/config/api'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Target, ArrowRight, Info } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Field,
    FieldLabel,
} from '@/components/ui/field'
import { useBreadcrumb } from '@/context/breadcrumb-context'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

// Helper function to get cookie value
const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || ''
    return ''
}

interface Lead {
    organization: string
    profile: {
        name: string
        email: string
        phone: string
        location: string
    }
    requirement: {
        location: string
        budget: string
        floor: string
    }
    project: string[]
    interested_projects?: {
        project_id?: number
        project_name: string
    }[]
    acquired: {
        campaign: string
        source: string
        sub_source: string
        medium: string
    }
}

const initialLead: Lead = {
    organization: '',
    profile: {
        name: '',
        email: '',
        phone: '',
        location: '',
    },
    requirement: {
        location: '',
        budget: '',
        floor: '',
    },
    project: [],
    interested_projects: [],
    acquired: {
        campaign: '',
        source: '',
        sub_source: '',
        medium: '',
    },
}

export default function AddLeadPage() {
    const [lead, setLead] = useState<Lead>(initialLead)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const [configs, setConfigs] = useState<any[]>([])
    const [fetchingConfigs, setFetchingConfigs] = useState(true)
    const { setBreadcrumbs } = useBreadcrumb()
    const currentUserId = getCookie('user_id')

    useEffect(() => {
        const org = getCookie('organization')
        setBreadcrumbs([
            { label: "New Lead", href: "/NewLead" },
            {
                label: (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Add New Lead</p>
                        </TooltipContent>
                    </Tooltip>
                )
            }
        ])
        if (org) {
            setLead(prev => ({ ...prev, organization: org }))
            fetchConfigs(org)
        }
    }, [])

    const fetchConfigs = async (org: string) => {
        try {
            const token = getCookie('token')
            const userRole = getCookie('role')
            const isAdmin = userRole === 'admin'

            const res = await axios.get(`${API.LEAD_CAPTURE_CONFIGS}?organization=${org}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const allConfigs = res.data.data || []
            
            // Admins see everything, others only see what they are assigned to
            const myConfigs = isAdmin ? allConfigs : allConfigs.filter((c: any) =>
                c.assigned_people?.some((p: any) => p.id === currentUserId)
            )
            setConfigs(myConfigs)
        } catch (err) {
            console.error('Failed to load configs:', err)
        } finally {
            setFetchingConfigs(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name.startsWith('profile.')) {
            setLead({ ...lead, profile: { ...lead.profile, [name.split('.')[1]]: value } })
        } else if (name.startsWith('requirement.')) {
            const field = name.split('.')[1]
            setLead({ ...lead, requirement: { ...lead.requirement, [field]: value } })
        } else if (name.startsWith('acquired.')) {
            setLead({ ...lead, acquired: { ...lead.acquired, [name.split('.')[1]]: value } })
        } else {
            setLead({ ...lead, [name]: value })
        }
    }
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const organization = getCookie('organization')
        if (!organization) {
            toast.error('Organization not found. Please login again.')
            setLoading(false)
            return
        }

        try {
            const currentUserId = getCookie('user_id')
            // Format acquired as array with received timestamp
            const payload = {
                ...lead,
                organization,
                exe_user: currentUserId,
                interested_projects: lead.project.map(p => ({
                    project_name: p
                })),
                acquired: [{
                    campaign: lead.acquired.campaign,
                    source: lead.acquired.source,
                    sub_source: lead.acquired.sub_source,
                    medium: lead.acquired.medium,
                    received: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                }]
            }
            const token = getCookie('token')
            const response = await axios.post(API.LEADS, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            toast.success(response.data.message || 'Lead added successfully!')
            setLead({ ...initialLead, organization })
            navigate('/all_leads')
        } catch (error: any) {
            toast.error(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to add lead')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen p-6 md:p-4 flex flex-col items-center gap-8 bg-zinc-50/50 dark:bg-zinc-950/50">
            {/* Quick Project Config Cards */}
            <div className="w-full max-w-6xl">
                <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <Target className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Quick Project Forms</h2>
                        <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest leading-none mt-1">Direct Entry for your assigned projects</p>
                    </div>
                </div>

                {fetchingConfigs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                        ))}
                    </div>
                ) : configs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {configs.map((config) => (
                            <Card
                                key={config._id}
                                className="group relative overflow-hidden rounded-2xl border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30 hover:bg-white dark:hover:bg-zinc-900 bg-white/80 dark:bg-zinc-900/80 cursor-pointer transition-all duration-300"
                                onClick={() => navigate(`/automation/leadcapture/leadcaptureform?id=${config._id}&mode=fill`)}
                            >
                                <CardHeader className="p-4">
                                    <Badge className="w-fit mb-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px] tracking-widest uppercase px-2 py-0.5">
                                        {config.project_id?.type || 'Project'}
                                    </Badge>
                                    <CardTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {config.project_id?.name || 'Lead Form'}
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                                        {config.name}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="rounded-3xl border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 shadow-none">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="h-16 w-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                <Info className="h-8 w-8 text-zinc-400" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No Forms Assigned</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md font-medium">
                                You don't have any project-specific lead capture forms assigned.
                                Please contact your administrator for project assignments, or use the manual entry form below.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>


        </div>
    )
}
