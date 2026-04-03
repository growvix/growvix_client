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
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Field,
    FieldLabel,
} from '@/components/ui/field'


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

    useEffect(() => {
        const org = getCookie('organization')
        if (org) {
            setLead(prev => ({ ...prev, organization: org }))
        }
    }, [])

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
        <div className="min-h-screen p-6 md:p-8 flex justify-center items-start">
            <Card className="w-full max-w-4xl shadow-sm border-primary-200 pt-0">
                <CardHeader className="border-b pb-6 dark:bg-neutral-800 bg-neutral-100 pt-6 rounded-t-lg">
                    <CardTitle className="text-xl text-primary-900">New Lead</CardTitle>
                    <CardDescription>Enter the details for the new prospective Lead.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-4 space-y-5">
                            {/* Contact Section */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></span>
                                    <h3 className="text-md font-bold uppercase text-blue-500">Contact Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field>
                                        <FieldLabel htmlFor="profile.name">Full Name <span className="text-red-500">*</span></FieldLabel>
                                        <Input
                                            id="profile.name"
                                            name="profile.name"
                                            placeholder="Enter full name"
                                            value={lead.profile.name}
                                            onChange={handleChange}
                                            required
                                            className="h-10"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="profile.email">Email Address</FieldLabel>
                                        <Input
                                            id="profile.email"
                                            name="profile.email"
                                            type="email"
                                            placeholder="Enter email address"
                                            value={lead.profile.email}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="profile.phone">Phone Number <span className="text-red-500">*</span></FieldLabel>
                                        <Input
                                            id="profile.phone"
                                            name="profile.phone"
                                            placeholder="Enter phone number"
                                            value={lead.profile.phone}
                                            required
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="profile.location">Current Location</FieldLabel>
                                        <Input
                                            id="profile.location"
                                            name="profile.location"
                                            placeholder="Enter current location"
                                            value={lead.profile.location}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </Field>
                                </div>
                            </section>

                            <Separator />
                            {/* Preferences Section */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm"></span>
                                    <h3 className="text-md font-bold uppercase text-purple-500">Requirements</h3>

                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field>
                                        <FieldLabel htmlFor="requirement.budget">Budget Range</FieldLabel>
                                        <Input
                                            id="requirement.budget"
                                            name="requirement.budget"
                                            placeholder="e.g. 50L - 1Cr"
                                            value={lead.requirement.budget}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="requirement.location">Preferred Location</FieldLabel>
                                        <Input
                                            id="requirement.location"
                                            name="requirement.location"
                                            placeholder="Enter preferred location"
                                            value={lead.requirement.location}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="requirement.floor">Preferred Floor</FieldLabel>
                                        <Input
                                            id="requirement.floor"
                                            name="requirement.floor"
                                            placeholder="e.g. Higher floor, 5th floor"
                                            value={lead.requirement.floor}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="project">Interested Projects / Types</FieldLabel>
                                        <Input
                                            id="project"
                                            name="project"
                                            placeholder="e.g. 2BHK, 3BHK, Villa"
                                            value={lead.project.join(', ')}
                                            onChange={e => setLead({ ...lead, project: e.target.value.split(',').map(v => v.trim()).filter(v => v) })}
                                            className="h-10"
                                        />
                                    </Field>
                                </div>
                            </section>
                            <Separator />
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
                                    <h3 className="text-md font-bold uppercase text-emerald-500">Acquisition Source</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field>
                                        <FieldLabel htmlFor="acquired.campaign">Campaign Name <span className="text-red-500">*</span></FieldLabel>
                                        <Input
                                            id="acquired.campaign"
                                            name="acquired.campaign"
                                            placeholder="Enter campaign name"
                                            value={lead.acquired.campaign}
                                            onChange={handleChange}
                                            required
                                            className="h-10"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="acquired.source">Source <span className="text-red-500">*</span></FieldLabel>
                                        <Input
                                            id="acquired.source"
                                            name="acquired.source"
                                            placeholder="e.g. Facebook, Google"
                                            value={lead.acquired.source}
                                            onChange={handleChange}
                                            required
                                            className="h-10"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="acquired.sub_source">Sub Source <span className="text-red-500">*</span></FieldLabel>
                                        <Input
                                            id="acquired.sub_source"
                                            name="acquired.sub_source"
                                            placeholder="e.g. Lead Form, Messenger"
                                            value={lead.acquired.sub_source}
                                            onChange={handleChange}
                                            required
                                            className="h-10"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="acquired.medium">Medium <span className="text-red-500">*</span></FieldLabel>
                                        <Input
                                            id="acquired.medium"
                                            name="acquired.medium"
                                            placeholder="e.g. CPC, Organic"
                                            value={lead.acquired.medium}
                                            onChange={handleChange}
                                            required
                                            className="h-10"
                                        />
                                    </Field>
                                </div>
                            </section>
                        </div>

                        <div className="p-6 mx-6 rounded-lg dark:bg-neutral-800 bg-neutral-100 flex justify-end gap-3">
                            <Button variant="destructive" type="button" onClick={() => window.history.back()} className="min-w-[100px]">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="min-w-[140px]">
                                {loading ? 'Saving...' : 'Create Lead'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
