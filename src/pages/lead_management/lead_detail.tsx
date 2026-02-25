import { useParams } from "react-router-dom"
import { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import LoaderScreen from "@/components/ui/loader-screen"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'
import axios from 'axios'
import { toast } from 'sonner'
import { apolloClient } from '@/lib/apolloClient'
import { getCookie } from '@/utils/cookies'
import { API_URL } from '@/config/api'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip"
import Autoplay from "embla-carousel-autoplay"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, } from "@/components/ui/carousel"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, } from "@/components/ui/select"
import {
    MapPinCheck,
    CalendarSync,
    PhoneCall,
    CalendarCheck,
    Shuffle,
    Smartphone,
    SquarePen,
    Calendar,
    CalendarClock,
    NotebookPen,
    Mail,
    MessagesSquare,
    History,
} from "lucide-react";
import type { Lead, GetLeadByIdQueryResponse, GetLeadByIdQueryVariables, UpdateLeadMutationResponse, UpdateLeadMutationVariables, Stage } from "@/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs"
import { decryptId } from "@/lib/crypto"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { format } from "date-fns"

// GraphQL query to get lead details by ID
const GET_LEAD_BY_ID = gql` 
    query GetLeadById($organization: String!, $id: String!) {
        getLeadById(organization: $organization, id: $id) {
            _id
            profile_id
            organization
            profile {
                name
                email
                phone
                location
            }
            stage
            status
            prefered {
                location
                budget
            }
            pretype {
                type
            }
            bathroom
            parking
            project
            floor
            facing
            merge_id
            acquired {
                campaign
                source
                sub_source
                received
                created_at
                medium
                _id
            }
            createdAt
            updatedAt
            activities {
                id
                user_id
                user_name
                stage
                updates
                reason
                site_visit_date
                status
                notes
                follow_up_date
                createdAt
                updatedAt
            }
        }
    }
`;

// GraphQL mutation to create lead activity
const CREATE_LEAD_ACTIVITY = gql`
    mutation CreateLeadActivity($organization: String!, $input: CreateLeadActivityInput!) {
        createLeadActivity(organization: $organization, input: $input) {
            id
            profile_id
            updates
            reason
            lead_id
            user_id
            site_visit_date
            stage
            status
            notes
            follow_up_date
            createdAt
        }
    }
`;

const UPDATE_LEAD = gql`
    mutation UpdateLead($organization: String!, $id: String!, $input: UpdateLeadInput!) {
        updateLead(organization: $organization, id: $id, input: $input) {
            _id
            stage
            status
        }
    }
`;

interface StageStatCardProps {
    value: string | number;
    label: string;
    currentStageColor: string | undefined;
}

const StageStatCard = ({ value, label, currentStageColor }: StageStatCardProps) => (
    <div className="group rounded-xl border bg-background p-4 text-center">
        <div
            className="text-2xl font-bold tracking-tight bg-[var(--stage-color)]/20 dark:bg-[var(--stage-color)]/20 rounded-lg py-1 transition-colors duration-500 ease-in-out"
            style={{ "--stage-color": currentStageColor ?? "transparent" } as React.CSSProperties}
        >
            {value}
        </div>
        <div className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
            {label}
        </div>
    </div>
);

export default function LeadDetail() {
    const [loading, setLoading] = useState(true)
    const [leadDetail, setLeadDetail] = useState<Lead | null>(null)
    const { id } = useParams()
    const [leadId, setLeadId] = useState<string | undefined>(undefined);
    const [stages, setStages] = useState<Stage[]>([])
    const [selectedStage, setSelectedStage] = useState<string | undefined>(undefined)
    const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined)
    const [availableNextStages, setAvailableNextStages] = useState<Stage[]>([])
    const organization = getCookie("organization") || "";
    const userId = getCookie("profile_id") || "";

    // Follow-up form state
    const [followUpReason, setFollowUpReason] = useState('')
    const [followUpDate, setFollowUpDate] = useState('')
    const [followUpLoading, setFollowUpLoading] = useState(false)

    // Notes form state
    const [noteContent, setNoteContent] = useState('')
    const [noteLoading, setNoteLoading] = useState(false)

    // Sheet open state
    const [notesSheetOpen, setNotesSheetOpen] = useState(false)
    const [followUpSheetOpen, setFollowUpSheetOpen] = useState(false)

    // Site Visit state
    const [siteVisitDate, setSiteVisitDate] = useState<Date | undefined>(undefined)
    const [siteVisitTime, setSiteVisitTime] = useState('')
    const [siteVisitLoading, setSiteVisitLoading] = useState(false)
    const [siteVisitSheetOpen, setSiteVisitSheetOpen] = useState(false)

    // GraphQL mutation hooks
    const [createLeadActivity] = useMutation(CREATE_LEAD_ACTIVITY);
    const [updateLead] = useMutation<UpdateLeadMutationResponse, UpdateLeadMutationVariables>(UPDATE_LEAD);
    const { setBreadcrumbs } = useBreadcrumb()
    const leadName = leadDetail?.profile?.name;
    const initials = getUserAvatar(leadName);
    function getUserAvatar(name: string | null | undefined): string {
        if (!name) return "";

        const parts = name.trim().split(" ").filter(Boolean);

        if (parts.length === 0) return "";
        if (parts.length === 1) return parts[0][0].toUpperCase();

        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    useEffect(() => {
        let cancelled = false
        async function run() {
            try {
                if (cancelled) return
                setLeadId(id)
                // Set breadcrumbs after getting the lead ID
                setBreadcrumbs([
                    { label: "All Leads", href: "/all_leads" },
                    { label: id ? `Lead #${id}` : "Lead" }
                ])
                // Fetch lead details via GraphQL
                if (id) {
                    const organization = getCookie('organization') || ''
                    if (organization) {
                        const { data } = await apolloClient.query<GetLeadByIdQueryResponse, GetLeadByIdQueryVariables>({
                            query: GET_LEAD_BY_ID,
                            variables: { organization, id },
                            fetchPolicy: 'network-only'
                        })
                        console.log('Lead Details Response:', data)
                        setLeadDetail(data?.getLeadById || null)
                        setLoading(false)
                    }
                }
            } catch (error) {
                console.error('Error fetching lead details:', error)
                setLeadId(id)
                setBreadcrumbs([
                    { label: "All Leads", href: "/all_leads" },
                    { label: id ? `Lead #${id}` : "Lead" }
                ])
            }
        }
        run()
        return () => { cancelled = true }
    }, [id, setBreadcrumbs])
    // Fetch lead details by ID with apollo
    const { data: leadData, loading: _leadLoading, error: _leadError, refetch: refetchLead } = useQuery<GetLeadByIdQueryResponse, GetLeadByIdQueryVariables>(
        GET_LEAD_BY_ID,
        {
            variables: { organization, id: id || "" },
            skip: !organization || !id
        }
    );
    // Log activities when lead data is fetched
    useEffect(() => {
        if (leadData?.getLeadById?.activities) {
            console.log('Lead Activities:', leadData.getLeadById.activities);
        }
    }, [leadData]);
    // Fetch stages
    useEffect(() => {
        const fetchStages = async () => {
            if (!organization) return;
            try {
                const response = await axios.get(`${API_URL}/api/leads/stages/${organization}`);
                if (response.data.success && response.data.data.stages) {
                    setStages(response.data.data.stages);
                    console.log("Fetched stages:", response.data);
                }
            } catch (error) {
                console.error("Failed to fetch stages:", error);
            }
        };
        fetchStages();
    }, [organization]);
    useEffect(() => {
        if (leadData?.getLeadById) {
            setLeadDetail(leadData.getLeadById);
            if (leadData.getLeadById.stage) {
                setSelectedStage(leadData.getLeadById.stage);
            }
            if (leadData.getLeadById.status) {
                setSelectedStatus(leadData.getLeadById.status);
            }
        }
    }, [leadData]);
    useEffect(() => {
        if (selectedStage !== undefined && stages.length > 0) {
            const currentStage = stages.find(s => s.name.toLowerCase() === selectedStage.toLowerCase());
            if (currentStage?.nextStages) {
                const nextStages = stages.filter(s => currentStage.nextStages.includes(s.id));
                setAvailableNextStages(nextStages);
            } else {
                setAvailableNextStages([]);
            }
        } else {
            setAvailableNextStages(stages);
        }
    }, [selectedStage, stages]);
    const handleFollowUps = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!leadDetail?.profile_id || !organization || !userId || !leadDetail?._id) {
            toast.error('Missing required data for follow-up')
            return
        }
        if (!followUpReason.trim()) {
            toast.error('Please enter a reason for the follow-up')
            return
        }
        if (!followUpDate) {
            toast.error('Please select a follow-up date')
            return
        }
        setFollowUpLoading(true)
        try {
            await createLeadActivity({
                variables: {
                    organization,
                    input: {
                        profile_id: leadDetail.profile_id,
                        updates: "follow_up",
                        lead_id: leadDetail._id,
                        reason: followUpReason,
                        user_id: userId,
                        stage: selectedStage || '',
                        status: selectedStatus || '',
                        notes: 'followups',
                        follow_up_date: new Date(followUpDate).toISOString()
                    }
                }
            })
            toast.success('Follow-up scheduled successfully')
            setFollowUpReason('')
            setFollowUpDate('')
            setFollowUpSheetOpen(false)
            refetchLead()
        } catch (error) {
            console.error('Failed to create follow-up:', error)
            toast.error('Failed to schedule follow-up')
        } finally {
            setFollowUpLoading(false)
        }
    };
    const handleNotes = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!leadDetail?.profile_id || !organization || !userId || !leadDetail?._id) {
            toast.error('Missing required data for note')
            return
        }
        if (!noteContent.trim()) {
            toast.error('Please enter a note')
            return
        }
        setNoteLoading(true)
        try {
            await createLeadActivity({
                variables: {
                    organization,
                    input: {
                        profile_id: leadDetail.profile_id,
                        updates: "notes",
                        lead_id: leadDetail._id,
                        user_id: userId,
                        stage: selectedStage || '',
                        status: selectedStatus || '',
                        notes: noteContent
                    }
                }
            })
            toast.success('Note added successfully')
            setNoteContent('')
            setNotesSheetOpen(false)
            refetchLead()
        } catch (error) {
            console.error('Failed to add note:', error)
            toast.error('Failed to add note')
        } finally {
            setNoteLoading(false)
        }
    };

    const handleSiteVisit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!leadDetail?.profile_id || !organization || !userId || !leadDetail?._id) {
            toast.error('Missing required data for site visit')
            return
        }
        if (!siteVisitDate || !siteVisitTime) {
            toast.error('Please select both date and time for the site visit')
            return
        }
        setSiteVisitLoading(true)
        try {
            // Combine date and time
            const dateStr = format(siteVisitDate, "yyyy-MM-dd");
            const combinedDateTimeString = `${dateStr}T${siteVisitTime}:00`;
            const dateObj = new Date(combinedDateTimeString);

            if (isNaN(dateObj.getTime())) {
                toast.error("Invalid date or time");
                return;
            }

            await createLeadActivity({
                variables: {
                    organization,
                    input: {
                        profile_id: leadDetail.profile_id,
                        updates: "site_visit",
                        lead_id: leadDetail._id,
                        user_id: userId,
                        stage: selectedStage || '',
                        status: selectedStatus || '',
                        site_visit_date: dateObj.toISOString()
                    }
                }
            })
            toast.success('Site visit scheduled successfully')
            setSiteVisitDate(undefined)
            setSiteVisitTime('')
            setSiteVisitSheetOpen(false)
            refetchLead()
        } catch (error) {
            console.error('Failed to schedule site visit:', error)
            toast.error('Failed to schedule site visit')
        } finally {
            setSiteVisitLoading(false)
        }
    };
    // Memoize current stage object to avoid repeated find operations
    const currentStageObject = useMemo(() => {
        if (!selectedStage || stages.length === 0) return null;
        return stages.find(s => s.name.toLowerCase() === selectedStage.toLowerCase()) || null;
    }, [selectedStage, stages]);
    const handleStageChange = async (stageName: string) => {
        if (leadDetail?.profile_id == null || !organization || !userId || !leadDetail?._id) {
            toast.error('Missing required data for stage update');
            return;
        }
        // Optimistic update — UI changes instantly
        const previousStage = selectedStage;
        setSelectedStage(stageName);
        try {
            // Fire both mutations in parallel (silent — no loading state)
            await Promise.all([
                updateLead({
                    variables: {
                        organization,
                        id: leadDetail._id,
                        input: { stage: stageName }
                    }
                }),
                createLeadActivity({
                    variables: {
                        organization,
                        input: {
                            profile_id: leadDetail.profile_id,
                            updates: "stage",
                            lead_id: leadDetail._id,
                            user_id: userId,
                            stage: stageName,
                            status: selectedStatus,
                            notes: `Stage changed to ${stageName}`
                        }
                    }
                })
            ]);
            toast.success(`Stage updated to ${stageName}`);
            refetchLead();
        } catch (error) {
            console.error('Failed to update stage:', error);
            // Rollback on failure
            setSelectedStage(previousStage);
            toast.error('Failed to update stage');
        }
    };
    const handleStatusChange = async (status: string) => {
        if (leadDetail?.profile_id == null || !organization || !userId || !leadDetail?._id) {
            toast.error('Missing required data for status update');
            return;
        }
        // Optimistic update — UI changes instantly
        const previousStatus = selectedStatus;
        setSelectedStatus(status);

        try {
            // Fire both mutations in parallel (silent — no loading state)
            await Promise.all([
                updateLead({
                    variables: {
                        organization,
                        id: leadDetail._id,
                        input: { status }
                    }
                }),
                createLeadActivity({
                    variables: {
                        organization,
                        input: {
                            profile_id: leadDetail.profile_id,
                            updates: "status",
                            lead_id: leadDetail._id,
                            user_id: userId,
                            stage: selectedStage || '',
                            status: status || '',
                            notes: `Status changed to ${status}`
                        }
                    }
                })
            ]);
            toast.success(`Status updated to ${status}`);
            refetchLead();
        } catch (error) {
            console.error('Failed to update status:', error);
            setSelectedStatus(previousStatus);
            toast.error('Failed to update status');
        }
    };
    if (loading) {
        return <LoaderScreen />
    }
    return (
        <div className="px-3 pt-0 mt-1 mb-20">

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <div className="xl:col-span-1 lg:col-span-2 md:col-span-2y">
                    <Card className="overflow-hidden border-2 shadow-none rounded-x pt-0 h-full min-h-[160px] flex flex-col dark:bg-primary/10">
                        {/* Header */}
                        <CardHeader
                            className="bg-gradient-to-r from-[var(--stage-color)] to-gray-10 dark:from-[var(--stage-color)] dark:to-gray-200 py-3 sm:py-5 px-3 sm:px-4 transition-colors duration-500 ease-in-out"
                            style={{ "--stage-color": currentStageObject?.color ?? "transparent" } as React.CSSProperties}
                        >
                            <div className="flex items-center gap-2 sm:gap-4">

                                {/* Avatar */}
                                <Avatar className="size-12 sm:size-14 ring-2 ring-primary/20 shadow">
                                    <AvatarFallback className="text-xl sm:text-2xl font-semibold uppercase">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <CardDescription className="text-xs sm:text-sm opacity-70 tracking-wide text-black dark:text-dark">
                                        Lead Id <span className=""> #{leadDetail?.profile_id ?? ""}</span>
                                    </CardDescription>
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-black dark:text-dark">
                                        {leadName}
                                    </CardTitle>
                                </div>
                                <SquarePen className="ml-auto size-5 sm:size-6 text-black-300 cursor-pointer hover:scale-110 transition-transform text-black" />
                            </div>
                        </CardHeader>

                        <CardContent className="">
                            <div className="grid grid-cols-5 sm:gap-2 ">
                                {/* Notes */}
                                <div className="flex justify-center">
                                    <Sheet open={notesSheetOpen} onOpenChange={setNotesSheetOpen}>
                                        <Tooltip >
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="my-2 bg-amber-50 text-white hover:bg-primary-900 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
                                                    >
                                                        <NotebookPen className="size-5 size-5 text-amber-500 dark:text-amber-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Notes</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent className="w-lg">
                                            <SheetHeader>
                                                <SheetTitle>Notes</SheetTitle>
                                                <SheetDescription className="">
                                                    Add and review notes related to this lead.
                                                </SheetDescription>
                                            </SheetHeader>
                                            <div className="px-4 py-4">
                                                <form onSubmit={handleNotes} className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="noteContent">Note</Label>
                                                        <Textarea
                                                            id="noteContent"
                                                            placeholder="Write your note here..."
                                                            value={noteContent}
                                                            onChange={(e) => setNoteContent(e.target.value)}
                                                            rows={4}
                                                            required
                                                        />
                                                    </div>
                                                    <Button type="submit" className="w-full" disabled={noteLoading}>
                                                        {noteLoading ? 'Adding...' : 'Add Note'}
                                                    </Button>
                                                </form>
                                                <Separator className="my-5" />
                                                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Previous Notes</h4>
                                                <ScrollArea className="h-[400px]">
                                                    {leadDetail?.activities?.filter(a => a.updates === 'notes').length ? (
                                                        leadDetail.activities
                                                            .filter(a => a.updates === 'notes')
                                                            .map((activity) => (
                                                                <div key={activity.id} className="mb-3 p-3 rounded-lg border bg-muted/30">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm mt-1">{activity.notes || 'No content'}</p>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
                                                    )}
                                                </ScrollArea>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <div className="flex justify-center">
                                    <Sheet>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" className="my-2 bg-blue-50 text-white hover:bg-blue-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400">
                                                        <Mail className="size-4 sm:size-5 text-blue-500 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Mail</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Send Email</SheetTitle>
                                                <SheetDescription>
                                                    Compose and send an email to the lead.
                                                </SheetDescription>
                                            </SheetHeader>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                                <div className="flex justify-center">
                                    <Sheet>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" className="my-2 bg-green-50 text-white hover:bg-green-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400">
                                                        {/* <MessageCircleMore className="size-5 text-black dark:text-white" /> */}
                                                        <FontAwesomeIcon icon={faWhatsapp} className="text-green-500 dark:text-green-300 hover:text-green-600 dark:hover:text-green-400 transition-colors" style={{ fontSize: "1.2rem" }} />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>What's app</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>WhatsApp Message</SheetTitle>
                                                <SheetDescription>
                                                    Send a WhatsApp message to the lead.
                                                </SheetDescription>
                                            </SheetHeader>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                                <div className="flex justify-center">
                                    <AlertDialog>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="my-2 bg-emerald-50 text-white hover:bg-emerald-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                    >
                                                        <PhoneCall className="size-4 sm:size-5 text-emerald-500 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Phone call</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        window.open(
                                                            "/ivr-call",
                                                            "IVRCallWindow",
                                                            "width=400,height=600,menubar=no,toolbar=no,location=no,status=no,resizable=no,scrollbars=no,left=100,top=100"
                                                        )
                                                    }>
                                                    call
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <div className="flex justify-center">
                                    <Sheet>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" className="my-2 bg-purple-50 text-white hover:bg-purple-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400">
                                                        <MessagesSquare className="size-4 sm:size-5 text-purple-500 dark:text-purple-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>SMS</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Send SMS</SheetTitle>
                                                <SheetDescription>
                                                    Compose and send an SMS to the lead.
                                                </SheetDescription>
                                            </SheetHeader>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <div className="flex justify-center">
                                    <Sheet open={siteVisitSheetOpen} onOpenChange={setSiteVisitSheetOpen}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" className="my-2 bg-orange-50 text-white hover:bg-orange-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400">
                                                        <CalendarClock className="size-4 sm:size-5 text-orange-500 dark:text-orange-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Schedule Site Visit</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent className="w-lg">
                                            <SheetHeader>
                                                <SheetTitle>Schedule Site Visit</SheetTitle>
                                                <SheetDescription>
                                                    Plan and confirm the site visit.
                                                </SheetDescription>
                                            </SheetHeader>
                                            <div className="px-4 py-4">
                                                <form onSubmit={handleSiteVisit} className="space-y-4">
                                                    <div className="space-y-4">
                                                        <div className="flex flex-col space-y-2">
                                                            <Label htmlFor="siteVisitDate">Date</Label>
                                                            <DatePicker date={siteVisitDate} setDate={setSiteVisitDate} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4 mt-2">
                                                        <div className="flex flex-col space-y-2">
                                                            <Label htmlFor="siteVisitTime">Time</Label>
                                                            <TimePicker time={siteVisitTime} setTime={setSiteVisitTime} />
                                                        </div>
                                                    </div>
                                                    <Button type="submit" className="w-full mt-4" disabled={siteVisitLoading}>
                                                        {siteVisitLoading ? 'Scheduling...' : 'Schedule Visit'}
                                                    </Button>
                                                </form>
                                                <Separator className="my-5" />
                                                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Previous Site Visits</h4>
                                                <ScrollArea className="h-[400px]">
                                                    {leadDetail?.activities?.filter(a => a.updates === 'site_visit').length ? (
                                                        leadDetail.activities
                                                            .filter(a => a.updates === 'site_visit')
                                                            .map((activity) => (
                                                                <div key={activity.id} className="mb-3 p-3 rounded-lg border bg-muted/30">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                                                                        </span>
                                                                        {activity.site_visit_date && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                Visit: {new Date(activity.site_visit_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground text-center py-4">No visits scheduled yet</p>
                                                    )}
                                                </ScrollArea>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <div className="flex justify-center">
                                    <Sheet open={followUpSheetOpen} onOpenChange={setFollowUpSheetOpen}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" className="my-2 bg-cyan-50 text-white hover:bg-cyan-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400">
                                                        <CalendarSync className="size-4 sm:size-5 text-cyan-500 dark:text-cyan-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Follow ups</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent className="w-lg">
                                            <SheetHeader>
                                                <SheetTitle>Follow Ups</SheetTitle>
                                                <SheetDescription>
                                                    View, add, and manage follow-up entries.
                                                </SheetDescription>
                                            </SheetHeader>
                                            <div className="px-4 py-4">
                                                <form onSubmit={handleFollowUps} className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="followUpReason">Reason</Label>
                                                        <Textarea
                                                            id="followUpReason"
                                                            placeholder="Enter the reason for follow-up..."
                                                            value={followUpReason}
                                                            onChange={(e) => setFollowUpReason(e.target.value)}
                                                            rows={3}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="followUpDate">Next Follow-up Date</Label>
                                                        <Input
                                                            id="followUpDate"
                                                            type="date"
                                                            value={followUpDate}
                                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                                            min={new Date().toISOString().split('T')[0]}
                                                            required
                                                        />
                                                    </div>
                                                    <Button type="submit" className="w-full" disabled={followUpLoading}>
                                                        {followUpLoading ? 'Scheduling...' : 'Schedule Follow-up'}
                                                    </Button>
                                                </form>
                                                <Separator className="my-5" />
                                                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Previous Follow-ups</h4>
                                                <ScrollArea className="h-[400px]">
                                                    {leadDetail?.activities?.filter(a => a.updates === 'follow_up').length ? (
                                                        leadDetail.activities
                                                            .filter(a => a.updates === 'follow_up')
                                                            .map((activity) => (
                                                                <div key={activity.id} className="mb-3 p-3 rounded-lg border bg-muted/30">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                                                                        </span>
                                                                        {activity.follow_up_date && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                Follow-up: {new Date(activity.follow_up_date).toLocaleDateString()}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm mt-1">{activity.notes || 'No reason provided'}</p>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground text-center py-4">No follow-ups yet</p>
                                                    )}
                                                </ScrollArea>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <div className="flex justify-center">
                                    <Sheet>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" className="my-2 bg-slate-50 text-white hover:bg-slate-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-400">
                                                        <Smartphone className="size-4 sm:size-5 text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Offline call</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Log Offline Call</SheetTitle>
                                                <SheetDescription>
                                                    Record details from an external call.
                                                </SheetDescription>
                                            </SheetHeader>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <div className="flex justify-center">
                                    <Sheet>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" className="my-2 bg-indigo-50 text-white hover:bg-indigo-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                                        <Shuffle className="size-4 sm:size-5 text-indigo-500 dark:text-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Reassign lead</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Reassign Lead</SheetTitle>
                                                <SheetDescription>
                                                    Assign this lead to another owner.
                                                </SheetDescription>
                                            </SheetHeader>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <div className="flex justify-center">
                                    <Sheet>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" className="my-2 bg-teal-50 text-white hover:bg-teal-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-400">
                                                        <MapPinCheck className="size-4 sm:size-5 text-teal-500 dark:text-teal-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Site visit conducted</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Confirm Site Visit</SheetTitle>
                                                <SheetDescription>
                                                    Mark a site visit as completed and add notes.
                                                </SheetDescription>
                                            </SheetHeader>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                            </div>
                            <div className="flex flex-col sm:flex-row justify-around gap-2 mt-4 sm:mt-7">
                                <div className="flex-1">
                                    <Label htmlFor="stage" className="mb-2 ml-3 text-xs sm:text-sm font-bold text-primary">Stage</Label>
                                    <Select
                                        value={selectedStage}
                                        onValueChange={handleStageChange}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="select stage">
                                                {currentStageObject && (
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: currentStageObject.color }}
                                                        />
                                                        <span>{currentStageObject.name}</span>
                                                    </div>
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Available Stages</SelectLabel>
                                                {availableNextStages.map((stage) => (
                                                    <SelectItem
                                                        key={stage.id}
                                                        value={stage.name}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: stage.color }}
                                                            />
                                                            <span>{stage.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="Status" className="mb-2 ml-3 text-xs sm:text-sm font-bold text-primary">Status</Label>
                                    <Select
                                        value={selectedStatus}
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>status</SelectLabel>
                                                <SelectItem value="Hot">Hot</SelectItem>
                                                <SelectItem value="Warm">Warm</SelectItem>
                                                <SelectItem value="Cold">Cold</SelectItem>

                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="xl:col-span-2 lg:col-span-3 flex flex-col gap-3 shadow-0">
                    <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-none shadow-none">
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-3 sm:p-4">
                                <CardTitle className="text-xs sm:text-sm font-light text-muted-foreground">Recived on</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                                        {leadDetail?.createdAt ? new Date(leadDetail.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/50">
                                        <CalendarCheck className="size-6 text-blue-600 dark:text-blue-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-3 sm:p-4">
                                <CardTitle className="text-xs sm:text-sm font-light text-muted-foreground">Tags</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">Today 3:30 PM</span>
                                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 dark:bg-amber-900/50">
                                        <History className="size-6 text-amber-600 dark:text-amber-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-4">
                                <CardTitle className="text-sm font-light text-muted-foreground">Total Engagements</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">{leadDetail?.acquired?.length.toString()}</span>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50">
                                        <History className="size-6 text-cyan-600 dark:text-cyan-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-4">
                                <CardTitle className="text-sm font-light text-muted-foreground">Lead Country</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">3 Days ago</span>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                                        <History className="size-6 text-emerald-600 dark:text-emerald-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-4">
                                <CardTitle className="text-sm font-light text-muted-foreground">Total Incoming</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">3 Days ago</span>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50">
                                        <History className="size-6 text-rose-600 dark:text-rose-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-4">
                                <CardTitle className="text-sm font-light text-muted-foreground">Project Enquired</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">10</span>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                                        <History className="size-6 text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                    </div>
                    <Card className="border-2 shadow-none py-1 gap-0 dark:bg-input/50">
                        <CardHeader className="pt-2 pb-0">
                            <CardTitle className="text-center text-muted-foreground">Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center mb-3">
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                plugins={[
                                    Autoplay({
                                        delay: 2000,
                                        stopOnInteraction: false,
                                    }),
                                ]}

                                className="w-full max-w-[94%] h-xs" >
                                <CarouselContent  >
                                    <CarouselItem className="md:basis-1/2 lg:basis-1/4 border-r-3">
                                        <div className="m-2 p-4 h-full">
                                            <h3 className="text-lg font-semibold mb-2">Requirement</h3>
                                            <p className="text-sm text-muted-foreground">Details about requirement</p>
                                        </div>
                                    </CarouselItem>
                                    <CarouselItem className="md:basis-1/2 lg:basis-1/4 border-r-3">
                                        <div className="m-2 p-4 h-full">
                                            <h3 className="text-lg font-semibold mb-2">Requirement</h3>
                                            <p className="text-sm text-muted-foreground">Details about requirement</p>
                                        </div>
                                    </CarouselItem>
                                    <CarouselItem className="md:basis-1/2 lg:basis-1/4 border-r-3">
                                        <div className="m-2 p-4 h-full">
                                            <h3 className="text-lg font-semibold mb-2">Requirement</h3>
                                            <p className="text-sm text-muted-foreground">Details about requirement</p>
                                        </div>
                                    </CarouselItem>
                                    <CarouselItem className="md:basis-1/2 lg:basis-1/4 border-r-3">
                                        <div className="m-2 p-4 h-full">
                                            <h3 className="text-lg font-semibold mb-2">Requirement</h3>
                                            <p className="text-sm text-muted-foreground">Details about requirement</p>
                                        </div>
                                    </CarouselItem>
                                    <CarouselItem className="md:basis-1/2 lg:basis-1/4 border-r-3">
                                        <div className="m-2 p-4 h-full">
                                            <h3 className="text-lg font-semibold mb-2">Requirement</h3>
                                            <p className="text-sm text-muted-foreground">Details about requirement</p>
                                        </div>
                                    </CarouselItem>

                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                            </Carousel>
                        </CardContent>
                    </Card>
                </div>
                <div className="xl:col-span-1 lg:col-span-2">
                    <Card className="border-2 shadow-none dark:bg-input/50 pt-3">
                        <CardContent>
                            <div className="grid grid-cols-6">
                                <div className="col-span-1">
                                    <Avatar className="size-12 ring-2 ring-primary/20 shadow">
                                        <AvatarFallback className="text-xl sm:text-2xl font-semibold uppercase">
                                            EN
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="col-span-5">

                                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-semibold">
                                        Executive name
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm opacity-70 tracking-wide">
                                        team presales
                                    </CardDescription>
                                </div>
                            </div>
                            <ScrollArea className="h-35 mt-5">
                                <div className="text-sm flex gap-10"><FontAwesomeIcon icon={faWhatsapp} className="text-green-500 dark:text-green-400" style={{ fontSize: "1.2rem" }} /> <span className="ml-10">Whatsapp Engaged</span> <Button className="ml-auto me-10" variant={"outline"}>13</Button> </div>
                                <Separator className="mt-1 mb-3" />
                                <div className="text-sm flex gap-10"><Mail className="size-4 sm:size-5 text-blue-500 dark:text-blue-400" /> <span className="ml-10">mail Engaged</span> <Button className="ml-auto me-10" variant={"outline"}>13</Button> </div>
                                <Separator className="mt-1 mb-3" />
                                <div className="text-sm flex gap-10"><PhoneCall className="size-4 sm:size-5 text-emerald-500 dark:text-emerald-400" /> <span className="ml-10">Phone call Engaged</span> <Button className="ml-auto me-10" variant={"outline"}>13</Button> </div>
                                <Separator className="mt-1 mb-3" />
                                <div className="text-sm flex gap-10"><MessagesSquare className="size-4 sm:size-5 text-purple-500 dark:text-purple-400" /> <span className="ml-10">Sms Engaged</span> <Button className="ml-auto me-10" variant={"outline"}>13</Button> </div>
                                <Separator className="mt-1 mb-3" />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                <div className="xl:col-span-2 lg:col-span-3">
                    <Card className="border-2 shadow-none dark:bg-input/50 pt-2 gap-0 pb-0">
                        <CardHeader className="mt-0 pt-0 pb-0 mb-2 ">
                            <CardTitle className="text-center text-muted-foreground text-lg font-bold border-b">
                                Considered Projects
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center mb-0">
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                plugins={[
                                    Autoplay({
                                        delay: 3000,
                                        stopOnInteraction: false,
                                    }),
                                ]}
                                orientation="vertical"
                                className="h-full w-full" >
                                <CarouselContent className="-mt-1 h-[200px]" >
                                    <CarouselItem>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-1 flex items-center justify-center">
                                                <img src="../assets/images/image.png" />
                                            </div>
                                            <div className="col-span-2">
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Meeting</Label>
                                                        <Button className="mt-2 p-2" size="sm">Schedule Visit</Button>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Brochure</Label>
                                                        <Button className="mt-2 p-2" size="sm">Send</Button>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Price Quote</Label>
                                                        <Button className="mt-2 p-2" size="sm">Send Quote</Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Lead Stage</Label>
                                                        <p className="mt-1">Prospect</p>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Expected Close Date</Label>
                                                        <time dateTime="2025-11-22">22/11/2025</time>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Revenue</Label>
                                                        <p className="mt-1">10,000</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Lead Stage</Label>
                                                        <p className="mt-1">Prospect</p>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Expected Close Date</Label>
                                                        <time dateTime="2025-11-22">22/11/2025</time>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Revenue</Label>
                                                        <p className="mt-1">10,000</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                    <CarouselItem>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-1 flex items-center justify-center">
                                                <img src="../assets/images/image.png" />
                                            </div>
                                            <div className="col-span-2">
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Meeting</Label>
                                                        <Button className="mt-2 p-2" size="sm">Schedule Visit</Button>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Brochure</Label>
                                                        <Button className="mt-2 p-2" size="sm">Send</Button>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Price Quote</Label>
                                                        <Button className="mt-2 p-2" size="sm">Send Quote</Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Lead Stage</Label>
                                                        <p className="mt-1">Prospect</p>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Expected Close Date</Label>
                                                        <time dateTime="2025-11-22">22/11/2025</time>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Revenue</Label>
                                                        <p className="mt-1">10,000</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Lead Stage</Label>
                                                        <p className="mt-1">Prospect</p>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Expected Close Date</Label>
                                                        <time dateTime="2025-11-22">22/11/2025</time>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <Label className="text-muted-foreground">Revenue</Label>
                                                        <p className="mt-1">10,000</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                </CarouselContent>
                            </Carousel>
                        </CardContent>
                    </Card>
                </div>
                <div className="xl:col-span-3 lg:col-span-3">
                    <Card className="border-2 pt-0 gap-2 shadow-none dark:bg-primary-foreground/50">
                        <CardHeader className="p-0 m-0 bg-transparent">
                            <CardTitle className="text-center text-lg font-bold mt-2">

                            </CardTitle>
                        </CardHeader>
                        <CardContent className="bg-transparent">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">

                                {/* Site Visits */}
                                <StageStatCard
                                    value={8}
                                    label="Site Visits Completed"
                                    currentStageColor={currentStageObject?.color}
                                />

                                {/* Ongoing Missed */}
                                <StageStatCard
                                    value={888}
                                    label="Ongoing Missed Calls"
                                    currentStageColor={currentStageObject?.color}
                                />

                                {/* Ongoing Answered */}
                                <StageStatCard
                                    value={88}
                                    label="Ongoing Answered Calls"
                                    currentStageColor={currentStageObject?.color}
                                />

                                {/* Incoming Missed */}
                                <StageStatCard
                                    value={8888}
                                    label="Incoming Missed Calls"
                                    currentStageColor={currentStageObject?.color}
                                />

                                {/* Incoming Answered */}
                                <StageStatCard
                                    value={8888}
                                    label="Incoming Answered Calls"
                                    currentStageColor={currentStageObject?.color}
                                />

                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="xl:col-span-1 lg:col-span-2 flex flex-col gap-2 shadow-0 tracking-tighter ">
                    <Card className="shadow-none border-2">
                        <CardHeader className="mt-0 py-0">
                            <CardTitle className="text-center pb-4 border-b text-muted-foreground">Campaign Response</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-6 gap-y-10">
                                {leadDetail?.acquired?.length ? (
                                    leadDetail.acquired.map((item, index: number) => (
                                        <div key={index} className="contents">
                                            <div className="col-span-2 flex-col justify-center">
                                                <Label className="text-muted-foreground/70">
                                                    {item.received
                                                        ? new Date(item.received).toLocaleDateString()
                                                        : 'N/A'}
                                                    <span className="text-neutral-900"> at </span>
                                                    {item.received
                                                        ? new Date(item.received).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })
                                                        : ''}
                                                </Label>
                                                <div className="font-bold mt-2">{item.campaign || 'N/A'}</div>
                                            </div>

                                            <div className="col-span-2 flex flex-col justify-center"></div>

                                            <div className="col-span-2 flex flex-col justify-center">
                                                <Label className="text-muted-foreground/70 text-center">
                                                    Project Name
                                                </Label>
                                                <div className="font-bold mt-2">
                                                    {leadDetail?.project || 'N/A'}
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex-col justify-center">
                                                <Label className="text-muted-foreground/70">Source</Label>
                                                <div className="text-sm font-bold mt-2">
                                                    {item.source || 'N/A'}
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex-col justify-center">
                                                <Label className="text-muted-foreground/70">Sub Source</Label>
                                                <div className="text-sm font-bold mt-2">
                                                    {item.sub_source || 'N/A'}
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex-col justify-center">
                                                <Label className="text-muted-foreground/70">Medium</Label>
                                                <div className="text-sm font-bold mt-2">
                                                    {item.medium || 'N/A'}
                                                </div>
                                            </div>

                                            <div className="col-span-6 flex-col justify-start">
                                                <Separator className="py-0 my-0" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-6 text-center text-muted-foreground">
                                        No acquisition data available
                                    </div>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </div>
                <div className="xl:col-span-2 lg:col-span-3 flex flex-col gap-2 shadow-0 tracking-tighter ">
                    <Card className="border-2 shadow-none dark:bg-input/10 bg-background">
                        <CardHeader className="mt-0">
                            <Tabs defaultValue="all" className="">
                                <TabsList className="w-full mb-4 py-2 h-11 dark:bg-input/50">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="Whatsapp">Whatsapp</TabsTrigger>
                                    <TabsTrigger value="Phonecall">Phonecall</TabsTrigger>
                                    <TabsTrigger value="Site visit">Site visit</TabsTrigger>
                                    <TabsTrigger value="Mail">Mail</TabsTrigger>
                                    <TabsTrigger value="password">Password</TabsTrigger>
                                </TabsList>

                                <ScrollArea className="h-[75vh] pr-4">
                                    <ol className="relative border-l-2 border-gray-200 dark:border-zinc-800 ml-5 pl-5">
                                        {leadDetail?.activities && leadDetail.activities.length > 0 ? (
                                            leadDetail.activities.map((activity) => {
                                                const isFollowUp = activity.updates === "follow_up";
                                                const isSiteVisit = activity.updates === "site_visit";
                                                const isStageUpdate = activity.updates === "stage";
                                                const isStatusUpdate = activity.updates === "status";
                                                const activityDate = activity.createdAt
                                                    ? new Date(activity.createdAt)
                                                    : null;
                                                const formattedDate = activityDate
                                                    ? `${activityDate.toLocaleDateString()} | ${activityDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                    : 'N/A';

                                                const isNotes = activity.updates === "notes";

                                                // Pick icon & color based on update type
                                                const iconEl = isStageUpdate
                                                    ? <Shuffle className="size-5 text-dark dark:text-white" />
                                                    : isStatusUpdate
                                                        ? <History className="size-5 text-dark dark:text-white" />
                                                        : isFollowUp ? <Calendar className="size-5 text-dark dark:text-white" />
                                                            : isSiteVisit ? <CalendarClock className="size-5 text-dark dark:text-white" />
                                                                : isNotes ? <NotebookPen className="size-5 text-dark dark:text-white" />
                                                                    : <Mail className="size-5 text-dark dark:text-white" />;

                                                return (
                                                    <TabsContent value="all" key={activity.id}>
                                                        <li className="mb-6 ms-6">
                                                            <span className="absolute flex items-center justify-center w-10 h-10 rounded-full -start-5 ring-4 ring-background bg-zinc-100 dark:bg-zinc-800">
                                                                {iconEl}
                                                            </span>
                                                            <div className="relative overflow-hidden rounded-xl border bg-gray-100/20 dark:bg-neutral-950 shadow-sm transition-all duration-200 border-l-[3px] border-l-zinc-400 dark:border-l-zinc-600">
                                                                {/* Header row */}
                                                                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                                        {isStageUpdate && 'Stage Update'}
                                                                        {isStatusUpdate && 'Status Update'}
                                                                        {isFollowUp && 'Follow Up'}
                                                                        {isSiteVisit && 'Site Visit'}
                                                                        {isNotes && 'Note'}
                                                                        {(!isStageUpdate && !isStatusUpdate && !isFollowUp && !isSiteVisit && !isNotes) && 'Update'}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                        <span className="hidden sm:inline">{activity.user_name || 'Unknown'}</span>
                                                                        <span className="hidden sm:inline">·</span>
                                                                        <time className="font-medium">{formattedDate}</time>
                                                                    </div>
                                                                </div>

                                                                {/* Content area */}
                                                                <div className="px-4 pb-3">
                                                                    {isStageUpdate && (
                                                                        <p className="text-md">
                                                                            Stage changed to
                                                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 ml-1">{activity.stage}</span>
                                                                        </p>
                                                                    )}
                                                                    {isStatusUpdate && (
                                                                        <p className="text-md">
                                                                            Status changed to
                                                                            <span className="text-zinc-900 dark:text-zinc-100 ml-1">{activity.status}</span>
                                                                        </p>
                                                                    )}
                                                                    {isFollowUp && (
                                                                        <div className="space-y-2">
                                                                            <p className="text-md">
                                                                                Scheduled for
                                                                                <span className="text-zinc-900 dark:text-zinc-100 ml-1">{new Date(activity.follow_up_date).toLocaleDateString()}</span>
                                                                            </p>
                                                                            <Separator />
                                                                            <p className="text-md text-muted-foreground leading-relaxed">{activity.reason || 'N/A'}</p>
                                                                        </div>
                                                                    )}
                                                                    {isNotes && (
                                                                        <div className="space-y-2">
                                                                            <Separator />
                                                                            <p className="text-md text-muted-foreground leading-relaxed">{activity.notes || 'No content'}</p>
                                                                        </div>
                                                                    )}
                                                                    {isSiteVisit && (
                                                                        <div className="space-y-2">
                                                                            <p className="text-md">
                                                                                Scheduled for
                                                                                <span className="text-zinc-900 dark:text-zinc-100 ml-1">{activity.site_visit_date ? new Date(activity.site_visit_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="sm:hidden px-4 pb-2">
                                                                    <p className="text-xs text-muted-foreground">{activity.user_name || 'Unknown'}</p>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    </TabsContent>
                                                );
                                            })
                                        ) : (
                                            <li className="ms-6 text-muted-foreground text-sm py-8 flex justify-center items-center h-[73vh]">
                                                <h4 className="px-3 py-1 dark:bg-red-950/50 bg-red-50 rounded-full border border-red-500 text-red-600">No activities recorded yet</h4>
                                            </li>
                                        )}

                                    </ol>
                                </ScrollArea>
                            </Tabs>
                        </CardHeader>
                    </Card>
                </div>



            </div>



        </div >

    )
}
