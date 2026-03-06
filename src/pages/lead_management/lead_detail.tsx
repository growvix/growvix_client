import { useParams, useNavigate } from "react-router-dom"
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
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
    Calendar,
    CalendarClock,
    NotebookPen,
    Mail,
    MessagesSquare,
    History,
    ShieldAlert,
    UserCheck,
    ClipboardCheck,
    Plus,
    Trash2,
    Info,
    BookOpen,
} from "lucide-react";
import type { Lead, GetLeadByIdQueryResponse, GetLeadByIdQueryVariables, UpdateLeadMutationResponse, UpdateLeadMutationVariables, Stage, PropertyRequirement, GetAllProjectsQueryResponse, GetAllProjectsQueryVariables, GetLeadStagesQueryResponse, GetLeadStagesQueryVariables, GetOrganizationUsersQueryResponse, GetOrganizationUsersQueryVariables } from "@/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs"
import { encodeProjectId } from "@/utils/idEncoder"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { format } from "date-fns"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

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
            propertyRequirement {
                sqft
                bhk
                floor
                balcony
                bathroom_count
                parking_needed
                parking_count
                price_min
                price_max
                furniture
                facing
                plot_type
            }
            project
            interested_projects {
                project_id
                project_name
            }
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
            exe_user
            exe_user_name
            site_visits_completed
            requirements {
                _id
                key
                value
            }
             activities {
                id
                user_id
                user_name
                stage
                updates
                reason
                site_visit_date
                site_visit_completed
                site_visit_completed_at
                site_visit_completed_by
                site_visit_completed_by_name
                site_visit_project_id
                site_visit_project_name
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

const MARK_SITE_VISIT_COMPLETED = gql`
    mutation MarkSiteVisitCompleted($organization: String!, $activityId: String!, $userId: String!) {
        markSiteVisitCompleted(organization: $organization, activityId: $activityId, userId: $userId) {
            id
            site_visit_completed
            site_visit_date
            site_visit_completed_at
            site_visit_completed_by
            site_visit_completed_by_name
        }
    }
`;

const ADD_REQUIREMENT = gql`
    mutation AddRequirement($organization: String!, $leadId: String!, $key: String!, $value: String!) {
        addRequirement(organization: $organization, leadId: $leadId, key: $key, value: $value) {
            _id
            requirements {
                _id
                key
                value
            }
        }
    }
`;

const REMOVE_REQUIREMENT = gql`
    mutation RemoveRequirement($organization: String!, $leadId: String!, $requirementId: String!) {
        removeRequirement(organization: $organization, leadId: $leadId, requirementId: $requirementId) {
            _id
            requirements {
                _id
                key
                value
            }
        }
    }
`;

const UPDATE_PROPERTY_REQUIREMENT = gql`
    mutation UpdatePropertyRequirement($organization: String!, $leadId: String!, $input: UpdatePropertyRequirementInput!) {
        updatePropertyRequirement(organization: $organization, leadId: $leadId, input: $input) {
            _id
            propertyRequirement {
                sqft
                bhk
                floor
                balcony
                bathroom_count
                parking_needed
                parking_count
                price_min
                price_max
                furniture
                facing
                plot_type
            }
        }
    }
`;

const GET_ALL_PROJECTS = gql`
    query GetAllProjects($organization: String!) {
        getAllProjects(organization: $organization) {
            product_id
            name
            location
            property
            img_location {
                logo
            }
        }
    }
`;

const ADD_INTERESTED_PROJECT = gql`
    mutation AddInterestedProject($organization: String!, $leadId: String!, $projectId: Int!, $projectName: String!) {
        addInterestedProject(organization: $organization, leadId: $leadId, projectId: $projectId, projectName: $projectName) {
            _id
            interested_projects {
                project_id
                project_name
            }
        }
    }
`;

const REMOVE_INTERESTED_PROJECT = gql`
    mutation RemoveInterestedProject($organization: String!, $leadId: String!, $projectId: Int!) {
        removeInterestedProject(organization: $organization, leadId: $leadId, projectId: $projectId) {
            _id
            interested_projects {
                project_id
                project_name
            }
        }
    }
`;

const GET_LEAD_STAGES = gql`
    query GetLeadStages($organization: String!) {
        getLeadStages(organization: $organization) {
            stages {
                id
                name
                color
                nextStages
            }
        }
    }
`;

const GET_ORG_USERS = gql`
    query GetOrganizationUsers($organization: String!) {
        getOrganizationUsers(organization: $organization) {
            _id
            globalUserId
            profile {
                firstName
                lastName
                email
                phone
            }
            role
            isActive
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
    const navigate = useNavigate()
    const [, setLeadId] = useState<string | undefined>(undefined);
    const [stages, setStages] = useState<Stage[]>([])
    const [selectedStage, setSelectedStage] = useState<string | undefined>(undefined)
    const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined)
    const [availableNextStages, setAvailableNextStages] = useState<Stage[]>([])
    const organization = getCookie("organization") || "";
    const userId = getCookie("profile_id") || "";
    const currentUserId = getCookie("user_id") || "";

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

    // Site Visit Conducted state
    const [conductedSheetOpen, setConductedSheetOpen] = useState(false)
    const [markingVisitId, setMarkingVisitId] = useState<string | null>(null)

    // Mail state
    const [mailSheetOpen, setMailSheetOpen] = useState(false)
    const [mailSubject, setMailSubject] = useState('')
    const [mailBody, setMailBody] = useState('')
    const [mailAttachments, setMailAttachments] = useState<File[]>([])
    const [mailLoading, setMailLoading] = useState(false)

    // Reassign state
    const [reassignSheetOpen, setReassignSheetOpen] = useState(false)
    const [reassignUsers, setReassignUsers] = useState<{ _id: string; name: string; role?: string }[]>([])
    const [reassignLoading, setReassignLoading] = useState(false)
    const [reassignUsersLoading, setReassignUsersLoading] = useState(false)
    const [reassignSearch, setReassignSearch] = useState('')
    const [selectedReassignUserId, setSelectedReassignUserId] = useState<string | null>(null)

    // Interested projects state
    const [addProjectSheetOpen, setAddProjectSheetOpen] = useState(false)
    const [addingProject, setAddingProject] = useState(false)
    const [removingProjectId, setRemovingProjectId] = useState<number | null>(null)

    // Site visit project selection state
    const [siteVisitProject, setSiteVisitProject] = useState<{ id: number; name: string } | null>(null)

    // Requirement state
    const [reqSheetOpen, setReqSheetOpen] = useState(false)
    const [reqKey, setReqKey] = useState('')
    const [reqValue, setReqValue] = useState('')
    const [reqLoading, setReqLoading] = useState(false)
    const [reqTab, setReqTab] = useState<'prebuilt' | 'manual'>('prebuilt')

    // Property requirement form state
    const defaultPropReq: PropertyRequirement = {
        sqft: undefined, bhk: [], floor: [], balcony: false,
        bathroom_count: undefined, parking_needed: false, parking_count: undefined,
        price_min: undefined, price_max: undefined, furniture: [], facing: [], plot_type: '',
    }
    const [propReqForm, setPropReqForm] = useState<PropertyRequirement>(defaultPropReq)
    const [propReqLoading, setPropReqLoading] = useState(false)
    const [floorInput, setFloorInput] = useState('')

    // GraphQL mutation hooks
    const [createLeadActivity] = useMutation(CREATE_LEAD_ACTIVITY);
    const [updateLead] = useMutation<UpdateLeadMutationResponse, UpdateLeadMutationVariables>(UPDATE_LEAD);
    const [markSiteVisitCompletedMutation] = useMutation(MARK_SITE_VISIT_COMPLETED);
    const [addRequirementMutation] = useMutation(ADD_REQUIREMENT);
    const [removeRequirementMutation] = useMutation(REMOVE_REQUIREMENT);
    const [updatePropertyRequirementMutation] = useMutation(UPDATE_PROPERTY_REQUIREMENT);
    const [addInterestedProjectMutation] = useMutation(ADD_INTERESTED_PROJECT);
    const [removeInterestedProjectMutation] = useMutation(REMOVE_INTERESTED_PROJECT);
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
                    { label: id ? `Lead #${id}` : "Lead" },
                    {
                        label: (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4.5 w-4.5" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                        <p className="font-medium">Lead Details</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    },
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
                    { label: id ? `Lead #${id}` : "Lead" },
                    {
                        label: (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4.5 w-4.5" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                        <p className="font-medium">Lead Details</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    },
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

    // Fetch all org projects
    const { data: projectsData } = useQuery<GetAllProjectsQueryResponse, GetAllProjectsQueryVariables>(GET_ALL_PROJECTS, {
        variables: { organization },
        skip: !organization
    });
    const allProjects = projectsData?.getAllProjects || [];
    // Log activities when lead data is fetched
    useEffect(() => {
        if (leadData?.getLeadById?.activities) {
            console.log('Lead Activities:', leadData.getLeadById.activities);
        }
    }, [leadData]);
    // Fetch stages via GraphQL
    const { data: stagesData } = useQuery<GetLeadStagesQueryResponse, GetLeadStagesQueryVariables>(GET_LEAD_STAGES, {
        variables: { organization },
        skip: !organization,
    });
    useEffect(() => {
        if (stagesData?.getLeadStages?.stages) {
            setStages(stagesData.getLeadStages.stages);
            console.log('Fetched stages via GraphQL:', stagesData.getLeadStages.stages);
        }
    }, [stagesData]);
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

    // Permission: can the current user edit this lead?
    const canEdit = useMemo(() => {
        if (!leadDetail?.exe_user || !currentUserId) return true; // no assignment = open
        return leadDetail.exe_user === currentUserId;
    }, [leadDetail?.exe_user, currentUserId]);

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

    const handleSendMail = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const toEmail = leadDetail?.profile?.email
        if (!toEmail) {
            toast.error('This lead has no email address on file')
            return
        }
        if (!mailSubject.trim()) {
            toast.error('Please enter a subject')
            return
        }
        if (!mailBody || mailBody === '<p></p>') {
            toast.error('Please write a message body')
            return
        }
        setMailLoading(true)
        try {
            const formData = new FormData()
            formData.append('to', toEmail)
            formData.append('subject', mailSubject)
            formData.append('html', mailBody)
            mailAttachments.forEach((file) => formData.append('attachments', file))

            await axios.post(`${API_URL}/api/mail/send`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            // Log mail activity
            if (leadDetail?.profile_id && leadDetail?._id) {
                await createLeadActivity({
                    variables: {
                        organization,
                        input: {
                            profile_id: leadDetail.profile_id,
                            updates: 'mail',
                            lead_id: leadDetail._id,
                            user_id: userId,
                            stage: selectedStage || '',
                            status: selectedStatus || '',
                            notes: `Subject: ${mailSubject}`,
                        },
                    },
                })
            }

            toast.success('Email sent successfully')
            setMailSubject('')
            setMailBody('')
            setMailAttachments([])
            setMailSheetOpen(false)
            refetchLead()
        } catch (err: any) {
            console.error('Mail send error:', err)
            toast.error(err.response?.data?.message || 'Failed to send email')
        } finally {
            setMailLoading(false)
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
                        site_visit_date: dateObj.toISOString(),
                        ...(siteVisitProject ? {
                            site_visit_project_id: siteVisitProject.id,
                            site_visit_project_name: siteVisitProject.name
                        } : {})
                    }
                }
            })
            toast.success('Site visit scheduled successfully')
            setSiteVisitDate(undefined)
            setSiteVisitTime('')
            setSiteVisitProject(null)
            setSiteVisitSheetOpen(false)
            refetchLead()
        } catch (error) {
            console.error('Failed to schedule site visit:', error)
            toast.error('Failed to schedule site visit')
        } finally {
            setSiteVisitLoading(false)
        }
    };

    const handleMarkCompleted = async (activityId: string) => {
        if (!organization) return;
        setMarkingVisitId(activityId);
        try {
            await markSiteVisitCompletedMutation({
                variables: { organization, activityId, userId }
            });
            toast.success('Site visit marked as completed');
            refetchLead();
        } catch (error) {
            console.error('Failed to mark site visit as completed:', error);
            toast.error('Failed to mark as completed');
        } finally {
            setMarkingVisitId(null);
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
    const allTimelineActivities = useMemo(() => {
        if (!leadDetail) return [];
        const combined: any[] = [...(leadDetail.activities || [])];
        if (leadDetail.requirements && leadDetail.requirements.length > 0) {
            leadDetail.requirements.forEach(req => {
                combined.push({
                    id: `req-${req._id}`,
                    updates: 'requirement',
                    notes: `Added requirement: ${req.key} - ${req.value}`,
                    user_name: '', // Inherently set by user who created the lead or unknown 
                    createdAt: leadDetail.createdAt, // Fallback to lead creation date since requirement doesn't have an individual date right now
                });
            });
        }
        return combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [leadDetail]);

    if (loading) {
        return <LoaderScreen />
    }
    return (
        <div className="px-3 pt-0 mt-1 mb-20">

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <div className="xl:col-span-1 lg:col-span-2 md:col-span-2y">
                    <Card className="overflow-hidden border-2 gap-2 shadow-none rounded-x pt-0 h-full min-h-[160px] flex flex-col dark:bg-primary/10">
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
                                {leadDetail?.exe_user_name && (
                                    <div className="ml-auto flex items-center gap-1.5 bg-white/80 dark:bg-black px-2.5 py-1 rounded-full">
                                        <span className="text-sm font-medium text-emerald-700 dark:text-white">{leadDetail.exe_user_name}</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="">
                            {!canEdit && (
                                <div className="mb-2">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <ShieldAlert className="text-md text-yellow-500 dark:text-amber-400 " />
                                        <span className="text-md font-medium text-yellow-500 dark:text-amber-400 ">View Only — This lead is assigned to {leadDetail?.exe_user_name || 'another user'}</span>
                                    </div>
                                    <Separator />
                                </div>

                            )}
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
                                                        disabled={!canEdit}
                                                        className="my-2 bg-amber-50 text-white hover:bg-primary-900 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    <Sheet open={mailSheetOpen} onOpenChange={setMailSheetOpen}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" disabled={!canEdit} className="my-2 bg-blue-50 text-white hover:bg-blue-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        <Mail className="size-4 sm:size-5 text-blue-500 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Send Email</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent className="w-full sm:max-w-2xl flex flex-col">
                                            <SheetHeader>
                                                <SheetTitle>Compose Email</SheetTitle>
                                                <SheetDescription>
                                                    Send an email to <span className="font-medium text-foreground">{leadDetail?.profile?.name || 'this lead'}</span>
                                                </SheetDescription>
                                            </SheetHeader>
                                            <div className="flex-1 overflow-y-auto px-1 py-4 px-5">
                                                <form id="mail-compose-form" onSubmit={handleSendMail} className="space-y-4">
                                                    {/* To */}
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="mailTo">To</Label>
                                                        <Input
                                                            id="mailTo"
                                                            value={leadDetail?.profile?.email || ''}
                                                            readOnly
                                                            className="bg-muted/40 cursor-not-allowed"
                                                        />
                                                    </div>

                                                    {/* Subject */}
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="mailSubject">Subject</Label>
                                                        <Input
                                                            id="mailSubject"
                                                            placeholder="Email subject…"
                                                            value={mailSubject}
                                                            onChange={(e) => setMailSubject(e.target.value)}
                                                            required
                                                        />
                                                    </div>

                                                    {/* Body — Tiptap rich-text editor */}
                                                    <div className="space-y-1.5">
                                                        <Label>Message</Label>
                                                        <RichTextEditor
                                                            value={mailBody}
                                                            onChange={setMailBody}
                                                            placeholder="Write your email here…"
                                                            minHeight="220px"
                                                        />
                                                    </div>

                                                    {/* Attachments */}
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="mailAttachments">Attachments</Label>
                                                        <Input
                                                            id="mailAttachments"
                                                            type="file"
                                                            multiple
                                                            accept="image/*,.pdf"
                                                            className="cursor-pointer file:cursor-pointer"
                                                            onChange={(e) => {
                                                                const files = Array.from(e.target.files || [])
                                                                setMailAttachments(files)
                                                            }}
                                                        />
                                                        {mailAttachments.length > 0 && (
                                                            <ul className="mt-1 space-y-1">
                                                                {mailAttachments.map((f, i) => (
                                                                    <li key={i} className="flex items-center justify-between text-xs text-muted-foreground rounded border px-2 py-1">
                                                                        <span className="truncate max-w-[80%]">{f.name}</span>
                                                                        <button
                                                                            type="button"
                                                                            className="text-destructive hover:text-destructive/80"
                                                                            onClick={() => setMailAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">Images and PDF brochures (max 10 MB each)</p>
                                                    </div>
                                                </form>
                                            </div>
                                            <Separator />

                                            {/* Footer */}
                                            <div className=" flex gap-4 p-7 m-3 bg-stone-200 rounded-lg">
                                                <Button
                                                    type="submit"
                                                    form="mail-compose-form"
                                                    className="flex-1"
                                                    disabled={mailLoading}
                                                >
                                                    {mailLoading ? 'Sending…' : 'Send Email'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setMailSheetOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                                <div className="flex justify-center">
                                    <Sheet>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" disabled={!canEdit} className="my-2 bg-green-50 text-white hover:bg-green-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed">
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
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                disabled={!canEdit}
                                                className="my-2 bg-emerald-50 text-white hover:bg-emerald-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={async () => {
                                                    const assignedUser = leadDetail?.exe_user_name || 'Unassigned';
                                                    const clientPhone = leadDetail?.profile?.phone || 'N/A';

                                                    console.log('--- IVR Call Request ---');
                                                    console.log('Assigned User:', assignedUser);
                                                    console.log('Client Phone:', clientPhone);
                                                    console.log('Lead ID:', leadDetail?._id);
                                                    console.log('Lead Name:', leadName);
                                                    console.log('-----------------------');

                                                    try {
                                                        const response = await axios.post(`${API_URL}/api/ivr-call`, {
                                                            organization,
                                                            userId: currentUserId,
                                                            assignedUser,
                                                            clientPhone,
                                                            leadId: leadDetail?._id,
                                                            leadName,
                                                        });
                                                        console.log('IVR Call Response:', response.data);
                                                        toast.success('IVR call request sent');
                                                    } catch (err: any) {
                                                        console.error('IVR Call Error:', err);
                                                        toast.error(err.response?.data?.message || 'Failed to initiate IVR call');
                                                    }
                                                }}
                                            >
                                                <PhoneCall className="size-4 sm:size-5 text-emerald-500 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>IVR Call</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="flex justify-center">
                                    <Sheet>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" disabled={!canEdit} className="my-2 bg-purple-50 text-white hover:bg-purple-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed">
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
                                                    <Button variant="outline" size="icon" disabled={!canEdit} className="my-2 bg-orange-50 text-white hover:bg-orange-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed">
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
                                                            <Label htmlFor="siteVisitProject">Project</Label>
                                                            <Select
                                                                value={siteVisitProject ? String(siteVisitProject.id) : ""}
                                                                onValueChange={(val) => {
                                                                    const proj = allProjects.find((p: any) => String(p.product_id) === val)
                                                                    if (proj) setSiteVisitProject({ id: proj.product_id, name: proj.name })
                                                                }}
                                                            >
                                                                <SelectTrigger id="siteVisitProject" className="w-full">
                                                                    <SelectValue placeholder="Select a project" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectLabel>Available Projects</SelectLabel>
                                                                        {allProjects.map((p: any) => (
                                                                            <SelectItem key={p.product_id} value={String(p.product_id)}>
                                                                                {p.name} {p.location ? `— ${p.location}` : ''}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
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
                                                                        <div className="flex items-center gap-1.5">
                                                                            {activity.site_visit_project_name && (
                                                                                <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                                    {activity.site_visit_project_name}
                                                                                </Badge>
                                                                            )}
                                                                            {activity.site_visit_date && (
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    Visit: {new Date(activity.site_visit_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
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
                                    <Sheet open={conductedSheetOpen} onOpenChange={setConductedSheetOpen}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="icon" disabled={!canEdit} className="my-2 bg-emerald-50 text-white hover:bg-emerald-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 relative">
                                                        <ClipboardCheck className="size-4 sm:size-5 text-emerald-500 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" />
                                                        {(leadDetail?.site_visits_completed ?? 0) > 0 && (
                                                            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full size-4 flex items-center justify-center">
                                                                {leadDetail?.site_visits_completed}
                                                            </span>
                                                        )}
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Site Visits Conducted</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent className="w-lg">
                                            <SheetHeader>
                                                <SheetTitle>Site Visits Conducted</SheetTitle>
                                                <SheetDescription>
                                                    View and mark site visits as completed.
                                                </SheetDescription>
                                            </SheetHeader>
                                            <div className="px-4 py-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-semibold text-muted-foreground">All Site Visits</h4>
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
                                                        {leadDetail?.site_visits_completed ?? 0} Completed
                                                    </Badge>
                                                </div>
                                                <ScrollArea className="h-[500px]">
                                                    {leadDetail?.activities?.filter(a => a.updates === 'site_visit').length ? (
                                                        leadDetail.activities
                                                            .filter(a => a.updates === 'site_visit')
                                                            .map((activity) => (
                                                                <div key={activity.id} className="mb-3 p-3 rounded-lg border bg-muted/30">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-xs text-muted-foreground">
                                                                            Scheduled: {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                                                                        </span>
                                                                        {activity.site_visit_completed ? (
                                                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">
                                                                                ✓ Completed
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
                                                                                Pending
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    {activity.site_visit_date && (
                                                                        <p className="text-sm font-medium mb-2">
                                                                            {new Date(activity.site_visit_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                                        </p>
                                                                    )}
                                                                    {activity.user_name && (
                                                                        <p className="text-xs text-muted-foreground mb-2">By: {activity.user_name}</p>
                                                                    )}
                                                                    {!activity.site_visit_completed && canEdit && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="w-full text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                                                    disabled={markingVisitId === activity.id}
                                                                                >
                                                                                    {markingVisitId === activity.id ? 'Marking...' : 'Mark as Completed'}
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Confirm Site Visit Completed</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Are you sure this site visit has been conducted? This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={() => handleMarkCompleted(activity.id)}>
                                                                                        Confirm
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground text-center py-4">No site visits scheduled yet</p>
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
                                    <Sheet open={reassignSheetOpen} onOpenChange={(open) => {
                                        setReassignSheetOpen(open)
                                        if (open) {
                                            // Fetch users from org DB via GraphQL when sheet opens
                                            setReassignUsersLoading(true)
                                            setReassignSearch('')
                                            setSelectedReassignUserId(null)
                                            apolloClient.query<GetOrganizationUsersQueryResponse, GetOrganizationUsersQueryVariables>({
                                                query: GET_ORG_USERS,
                                                variables: { organization },
                                                fetchPolicy: 'network-only'
                                            }).then(({ data }) => {
                                                if (data?.getOrganizationUsers) {
                                                    const mapped = data.getOrganizationUsers
                                                        .filter((u: any) => u.isActive !== false)
                                                        .map((u: any) => ({
                                                            _id: u._id || u.globalUserId,
                                                            name: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim(),
                                                            role: u.role || 'User'
                                                        }))
                                                    setReassignUsers(mapped)
                                                }
                                            }).catch(err => {
                                                console.error('Failed to fetch users for reassign', err)
                                                toast.error('Failed to load users')
                                            }).finally(() => setReassignUsersLoading(false))
                                        }
                                    }}>
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
                                        <SheetContent className="w-lg">
                                            <SheetHeader>
                                                <SheetTitle>Reassign Lead</SheetTitle>
                                                <SheetDescription>
                                                    Select a user to reassign this lead to.
                                                </SheetDescription>
                                            </SheetHeader>
                                            <div className="px-4 py-4">
                                                {/* Current assignment */}
                                                <div className="mb-4 p-3 rounded-lg border bg-muted/30">
                                                    <p className="text-xs text-muted-foreground mb-1">Currently assigned to</p>
                                                    <p className="text-sm font-semibold">{leadDetail?.exe_user_name || 'Unassigned'}</p>
                                                </div>

                                                {/* Search */}
                                                <div className="mb-3">
                                                    <Input
                                                        placeholder="Search users..."
                                                        value={reassignSearch}
                                                        onChange={(e) => setReassignSearch(e.target.value)}
                                                    />
                                                </div>

                                                {/* User list */}
                                                <ScrollArea className="h-[400px]">
                                                    {reassignUsersLoading ? (
                                                        <div className="flex items-center justify-center py-10">
                                                            <p className="text-sm text-muted-foreground">Loading users...</p>
                                                        </div>
                                                    ) : (() => {
                                                        const filteredUsers = reassignUsers.filter(u =>
                                                            u.name.toLowerCase().includes(reassignSearch.toLowerCase())
                                                        )
                                                        return filteredUsers.length ? (
                                                            filteredUsers.map(user => {
                                                                const isCurrentUser = leadDetail?.exe_user === user._id
                                                                const isSelected = selectedReassignUserId === user._id
                                                                return (
                                                                    <div
                                                                        key={user._id}
                                                                        onClick={() => {
                                                                            if (!isCurrentUser) setSelectedReassignUserId(isSelected ? null : user._id)
                                                                        }}
                                                                        className={`mb-2 p-3 rounded-lg border cursor-pointer transition-all duration-150 ${isCurrentUser
                                                                            ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700 cursor-default'
                                                                            : isSelected
                                                                                ? 'bg-indigo-100 border-indigo-400 dark:bg-indigo-900/40 dark:border-indigo-500 ring-2 ring-indigo-400'
                                                                                : 'bg-muted/30 hover:bg-muted/60'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-bold">
                                                                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm font-medium">{user.name}</p>
                                                                                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                                                                                </div>
                                                                            </div>
                                                                            {isCurrentUser && (
                                                                                <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-300 bg-indigo-50 dark:bg-indigo-900/30">
                                                                                    Current
                                                                                </Badge>
                                                                            )}
                                                                            {isSelected && !isCurrentUser && (
                                                                                <Badge className="text-xs bg-indigo-500 text-white">
                                                                                    Selected
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                                                        )
                                                    })()}
                                                </ScrollArea>

                                                {/* Reassign button */}
                                                <Button
                                                    className="w-full mt-4"
                                                    disabled={!selectedReassignUserId || reassignLoading}
                                                    onClick={async () => {
                                                        if (!selectedReassignUserId || !leadDetail?._id) return
                                                        setReassignLoading(true)
                                                        try {
                                                            const selectedUser = reassignUsers.find(u => u._id === selectedReassignUserId)
                                                            // Update lead's exe_user
                                                            await updateLead({
                                                                variables: {
                                                                    organization,
                                                                    id: leadDetail._id,
                                                                    input: { exe_user: selectedReassignUserId }
                                                                }
                                                            })
                                                            // Create activity log for reassignment
                                                            if (leadDetail.profile_id && userId) {
                                                                await createLeadActivity({
                                                                    variables: {
                                                                        organization,
                                                                        input: {
                                                                            profile_id: leadDetail.profile_id,
                                                                            updates: 'stage',
                                                                            lead_id: leadDetail._id,
                                                                            user_id: userId,
                                                                            stage: selectedStage || '',
                                                                            status: selectedStatus || '',
                                                                            notes: `Lead reassigned to ${selectedUser?.name || 'another user'}`
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                            toast.success(`Lead reassigned to ${selectedUser?.name || 'new user'}`)
                                                            setReassignSheetOpen(false)
                                                            refetchLead()
                                                        } catch (error) {
                                                            console.error('Failed to reassign lead:', error)
                                                            toast.error('Failed to reassign lead')
                                                        } finally {
                                                            setReassignLoading(false)
                                                        }
                                                    }}
                                                >
                                                    {reassignLoading ? 'Reassigning...' : 'Reassign Lead'}
                                                </Button>
                                            </div>
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
                                        disabled={!canEdit}
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
                                        disabled={!canEdit}
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
                                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <CalendarCheck className="size-5 sm:size-6 text-zinc-700 dark:text-zinc-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-3 sm:p-4">
                                <CardTitle className="text-xs sm:text-sm font-light text-muted-foreground">Tags</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">Today 3:30 PM</span>
                                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <History className="size-5 sm:size-6 text-zinc-700 dark:text-zinc-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-4">
                                <CardTitle className="text-sm font-light text-muted-foreground">Total Engagements</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">{leadDetail?.acquired?.length.toString()}</span>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <History className="size-6 text-zinc-700 dark:text-zinc-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-4">
                                <CardTitle className="text-sm font-light text-muted-foreground">Lead Country</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">3 Days ago</span>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <History className="size-6 text-zinc-700 dark:text-zinc-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-4">
                                <CardTitle className="text-sm font-light text-muted-foreground">Total Incoming</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">3 Days ago</span>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <History className="size-6 text-zinc-700 dark:text-zinc-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="p-4">
                                <CardTitle className="text-sm font-light text-muted-foreground">Project Enquired</CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">10</span>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <History className="size-6 text-zinc-700 dark:text-zinc-300" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                    </div>
                    <Card className="border-2 shadow-none py-1 gap-0 dark:bg-input/50">
                        <CardHeader className="pt-2 pb-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-center text-muted-foreground">Requirements</CardTitle>
                            <Sheet open={reqSheetOpen} onOpenChange={(open) => {
                                setReqSheetOpen(open);
                                if (open && leadDetail?.propertyRequirement) {
                                    setPropReqForm({
                                        sqft: leadDetail.propertyRequirement.sqft || undefined,
                                        bhk: leadDetail.propertyRequirement.bhk || [],
                                        floor: leadDetail.propertyRequirement.floor || [],
                                        balcony: leadDetail.propertyRequirement.balcony || false,
                                        bathroom_count: leadDetail.propertyRequirement.bathroom_count || undefined,
                                        parking_needed: leadDetail.propertyRequirement.parking_needed || false,
                                        parking_count: leadDetail.propertyRequirement.parking_count || undefined,
                                        price_min: leadDetail.propertyRequirement.price_min || undefined,
                                        price_max: leadDetail.propertyRequirement.price_max || undefined,
                                        furniture: leadDetail.propertyRequirement.furniture || [],
                                        facing: leadDetail.propertyRequirement.facing || [],
                                        plot_type: leadDetail.propertyRequirement.plot_type || '',
                                    });
                                } else if (open) {
                                    setPropReqForm(defaultPropReq);
                                }
                            }}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={!canEdit} className="gap-1">
                                        <Plus className="size-4" />
                                        Add
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="overflow-y-auto">
                                    <SheetHeader>
                                        <SheetTitle>Property Requirements</SheetTitle>
                                        <SheetDescription>
                                            Define structured or custom requirements for this lead.
                                        </SheetDescription>
                                    </SheetHeader>

                                    {/* Tabs */}
                                    <div className="flex gap-2 px-4 pt-2">
                                        <Button size="sm" variant={reqTab === 'prebuilt' ? 'default' : 'outline'} onClick={() => setReqTab('prebuilt')}>Pre-built Fields</Button>
                                        <Button size="sm" variant={reqTab === 'manual' ? 'default' : 'outline'} onClick={() => setReqTab('manual')}>Manual Input</Button>
                                    </div>

                                    {reqTab === 'prebuilt' ? (
                                        <div className="space-y-5 p-4">
                                            {/* Square Footage */}
                                            <div>
                                                <Label>Square Footage (sqft)</Label>
                                                <Input type="number" placeholder="e.g. 1200" value={propReqForm.sqft ?? ''} onChange={(e) => setPropReqForm(p => ({ ...p, sqft: e.target.value ? Number(e.target.value) : undefined }))} />
                                            </div>

                                            {/* BHK Multi-select */}
                                            <div>
                                                <Label>Type (BHK)</Label>
                                                <div className="flex flex-wrap gap-3 mt-1">
                                                    {['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'].map(opt => (
                                                        <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                                            <Checkbox checked={propReqForm.bhk?.includes(opt)} onCheckedChange={(checked) => {
                                                                setPropReqForm(p => ({
                                                                    ...p,
                                                                    bhk: checked ? [...(p.bhk || []), opt] : (p.bhk || []).filter(v => v !== opt)
                                                                }))
                                                            }} />
                                                            {opt}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Floor Multi-input */}
                                            <div>
                                                <Label>Floor</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input placeholder="e.g. 2" value={floorInput} onChange={(e) => setFloorInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && floorInput.trim()) {
                                                                e.preventDefault();
                                                                if (!propReqForm.floor?.includes(floorInput.trim())) {
                                                                    setPropReqForm(p => ({ ...p, floor: [...(p.floor || []), floorInput.trim()] }));
                                                                }
                                                                setFloorInput('');
                                                            }
                                                        }}
                                                    />
                                                    <Button type="button" size="sm" variant="outline" onClick={() => {
                                                        if (floorInput.trim() && !propReqForm.floor?.includes(floorInput.trim())) {
                                                            setPropReqForm(p => ({ ...p, floor: [...(p.floor || []), floorInput.trim()] }));
                                                            setFloorInput('');
                                                        }
                                                    }}>Add</Button>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {propReqForm.floor?.map((f, i) => (
                                                        <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setPropReqForm(p => ({ ...p, floor: (p.floor || []).filter((_, idx) => idx !== i) }))}>
                                                            Floor {f} ×
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Balcony */}
                                            <div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox checked={propReqForm.balcony} onCheckedChange={(checked) => setPropReqForm(p => ({ ...p, balcony: !!checked }))} />
                                                    <span className="text-sm font-medium">Balcony Required</span>
                                                </label>
                                            </div>

                                            {/* Bathroom Count */}
                                            <div>
                                                <Label>Bathrooms</Label>
                                                <Input type="number" placeholder="e.g. 2" value={propReqForm.bathroom_count ?? ''} onChange={(e) => setPropReqForm(p => ({ ...p, bathroom_count: e.target.value ? Number(e.target.value) : undefined }))} />
                                            </div>

                                            {/* Parking */}
                                            <div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox checked={propReqForm.parking_needed} onCheckedChange={(checked) => setPropReqForm(p => ({ ...p, parking_needed: !!checked, parking_count: checked ? p.parking_count : undefined }))} />
                                                    <span className="text-sm font-medium">Parking Needed</span>
                                                </label>
                                                {propReqForm.parking_needed && (
                                                    <div className="mt-2">
                                                        <Label>How many?</Label>
                                                        <Input type="number" placeholder="e.g. 1" value={propReqForm.parking_count ?? ''} onChange={(e) => setPropReqForm(p => ({ ...p, parking_count: e.target.value ? Number(e.target.value) : undefined }))} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price Range */}
                                            <div>
                                                <Label>Price Range (₹)</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input type="number" placeholder="Min" value={propReqForm.price_min ?? ''} onChange={(e) => setPropReqForm(p => ({ ...p, price_min: e.target.value ? Number(e.target.value) : undefined }))} />
                                                    <span className="self-center text-muted-foreground">—</span>
                                                    <Input type="number" placeholder="Max" value={propReqForm.price_max ?? ''} onChange={(e) => setPropReqForm(p => ({ ...p, price_max: e.target.value ? Number(e.target.value) : undefined }))} />
                                                </div>
                                            </div>

                                            {/* Furniture */}
                                            <div>
                                                <Label>Furniture</Label>
                                                <div className="flex flex-wrap gap-3 mt-1">
                                                    {['Semi-furnished', 'Fully furnished', 'Both', 'No furniture'].map(opt => (
                                                        <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                                            <Checkbox checked={propReqForm.furniture?.includes(opt)} onCheckedChange={(checked) => {
                                                                setPropReqForm(p => ({
                                                                    ...p,
                                                                    furniture: checked ? [...(p.furniture || []), opt] : (p.furniture || []).filter(v => v !== opt)
                                                                }))
                                                            }} />
                                                            {opt}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Facing */}
                                            <div>
                                                <Label>Facing</Label>
                                                <div className="flex flex-wrap gap-3 mt-1">
                                                    {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map(opt => (
                                                        <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                                            <Checkbox checked={propReqForm.facing?.includes(opt)} onCheckedChange={(checked) => {
                                                                setPropReqForm(p => ({
                                                                    ...p,
                                                                    facing: checked ? [...(p.facing || []), opt] : (p.facing || []).filter(v => v !== opt)
                                                                }))
                                                            }} />
                                                            {opt}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Plot Type */}
                                            <div>
                                                <Label>Plot Type</Label>
                                                <Input placeholder="e.g. Residential, Commercial" value={propReqForm.plot_type || ''} onChange={(e) => setPropReqForm(p => ({ ...p, plot_type: e.target.value }))} />
                                            </div>

                                            {/* Save Button */}
                                            <Button
                                                className="w-full"
                                                disabled={propReqLoading}
                                                onClick={async () => {
                                                    if (!leadDetail?._id) return;
                                                    setPropReqLoading(true);
                                                    try {
                                                        await updatePropertyRequirementMutation({
                                                            variables: {
                                                                organization,
                                                                leadId: leadDetail._id,
                                                                input: {
                                                                    sqft: propReqForm.sqft || null,
                                                                    bhk: propReqForm.bhk || [],
                                                                    floor: propReqForm.floor || [],
                                                                    balcony: propReqForm.balcony || false,
                                                                    bathroom_count: propReqForm.bathroom_count || null,
                                                                    parking_needed: propReqForm.parking_needed || false,
                                                                    parking_count: propReqForm.parking_count || null,
                                                                    price_min: propReqForm.price_min || null,
                                                                    price_max: propReqForm.price_max || null,
                                                                    furniture: propReqForm.furniture || [],
                                                                    facing: propReqForm.facing || [],
                                                                    plot_type: propReqForm.plot_type || '',
                                                                },
                                                            },
                                                        });
                                                        toast.success('Property requirements saved');
                                                        setReqSheetOpen(false);
                                                        refetchLead();
                                                    } catch (err) {
                                                        console.error(err);
                                                        toast.error('Failed to save property requirements');
                                                    } finally {
                                                        setPropReqLoading(false);
                                                    }
                                                }}
                                            >
                                                {propReqLoading ? 'Saving...' : 'Save Requirements'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 p-4">
                                            <div>
                                                <Label htmlFor="req-key">Key</Label>
                                                <Input
                                                    id="req-key"
                                                    placeholder="e.g. Custom Field Name"
                                                    value={reqKey}
                                                    onChange={(e) => setReqKey(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="req-value">Value</Label>
                                                <Input
                                                    id="req-value"
                                                    placeholder="e.g. Custom Value"
                                                    value={reqValue}
                                                    onChange={(e) => setReqValue(e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                className="w-full"
                                                disabled={!reqKey.trim() || !reqValue.trim() || reqLoading}
                                                onClick={async () => {
                                                    if (!reqKey.trim() || !reqValue.trim() || !leadDetail?._id) return;
                                                    setReqLoading(true);
                                                    try {
                                                        await addRequirementMutation({
                                                            variables: {
                                                                organization,
                                                                leadId: leadDetail._id,
                                                                key: reqKey.trim(),
                                                                value: reqValue.trim(),
                                                            },
                                                        });
                                                        toast.success('Requirement added');
                                                        setReqKey('');
                                                        setReqValue('');
                                                        refetchLead();
                                                    } catch (err) {
                                                        console.error(err);
                                                        toast.error('Failed to add requirement');
                                                    } finally {
                                                        setReqLoading(false);
                                                    }
                                                }}
                                            >
                                                {reqLoading ? 'Adding...' : 'Add Requirement'}
                                            </Button>
                                        </div>
                                    )}
                                </SheetContent>
                            </Sheet>
                        </CardHeader>
                        <CardContent className="flex justify-center mb-3">
                            {(() => {
                                // Build combined carousel items from structured + manual requirements
                                const propItems: { key: string; value: string }[] = [];
                                const pr = leadDetail?.propertyRequirement;
                                if (pr) {
                                    if (pr.sqft) propItems.push({ key: 'Sqft', value: `${pr.sqft} sqft` });
                                    if (pr.bhk && pr.bhk.length > 0) propItems.push({ key: 'BHK', value: pr.bhk.join(', ') });
                                    if (pr.floor && pr.floor.length > 0) propItems.push({ key: 'Floor', value: pr.floor.map(f => `Floor ${f}`).join(', ') });
                                    if (pr.balcony) propItems.push({ key: 'Balcony', value: 'Yes' });
                                    if (pr.bathroom_count) propItems.push({ key: 'Bathrooms', value: `${pr.bathroom_count}` });
                                    if (pr.parking_needed) propItems.push({ key: 'Parking', value: pr.parking_count ? `${pr.parking_count} spots` : 'Yes' });
                                    if (pr.price_min || pr.price_max) propItems.push({ key: 'Price', value: `₹${pr.price_min || '—'} — ₹${pr.price_max || '—'}` });
                                    if (pr.furniture && pr.furniture.length > 0) propItems.push({ key: 'Furniture', value: pr.furniture.join(', ') });
                                    if (pr.facing && pr.facing.length > 0) propItems.push({ key: 'Facing', value: pr.facing.join(', ') });
                                    if (pr.plot_type) propItems.push({ key: 'Plot Type', value: pr.plot_type });
                                }
                                const manualItems = (leadDetail?.requirements || []).map(r => ({ key: r.key, value: r.value, _id: r._id }));
                                const hasItems = propItems.length > 0 || manualItems.length > 0;

                                return hasItems ? (
                                    <Carousel
                                        opts={{ align: "start", loop: true }}
                                        plugins={[Autoplay({ delay: 2000, stopOnInteraction: false })]}
                                        className="w-full max-w-[94%] h-xs"
                                    >
                                        <CarouselContent>
                                            {/* Structured property items */}
                                            {propItems.map((item, idx) => (
                                                <CarouselItem key={`prop-${idx}`} className="md:basis-1/2 lg:basis-1/4 border-r-3">
                                                    <div className="m-2 p-4 h-full">
                                                        <h3 className="text-lg text-start font-semibold mb-2 capitalize">{item.key} :</h3>
                                                        <p className="text-sm text-start text-muted-foreground">{item.value}</p>
                                                    </div>
                                                </CarouselItem>
                                            ))}
                                            {/* Manual key-value items */}
                                            {manualItems.map((req) => (
                                                <CarouselItem key={req._id} className="md:basis-1/2 lg:basis-1/4 border-r-3">
                                                    <div className="m-2 p-4 h-full relative group">
                                                        <h3 className="text-lg text-start font-semibold mb-2">{req.key} :</h3>
                                                        <h6 className="text-sm text-start">{req.value}</h6>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity size-7 text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete the requirement.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className="bg-destructive text-white shadow-sm hover:bg-destructive/90"
                                                                        onClick={async () => {
                                                                            try {
                                                                                await removeRequirementMutation({
                                                                                    variables: {
                                                                                        organization,
                                                                                        leadId: leadDetail?._id,
                                                                                        requirementId: req._id,
                                                                                    },
                                                                                });
                                                                                toast.success('Requirement removed');
                                                                                refetchLead();
                                                                            } catch (err) {
                                                                                console.error(err);
                                                                                toast.error('Failed to remove requirement');
                                                                            }
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious />
                                        <CarouselNext />
                                    </Carousel>
                                ) : (
                                    <div className="text-center text-muted-foreground py-6 text-sm">
                                        No requirements added yet. Click "Add" to define one.
                                    </div>
                                );
                            })()}
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
                                            {leadDetail?.exe_user_name ? leadDetail.exe_user_name.substring(0, 2) : 'UN'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="col-span-5">

                                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-semibold">
                                        {leadDetail?.exe_user_name || 'Unassigned'}
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm opacity-70 tracking-wide capitalize">
                                        team pre-sales
                                    </CardDescription>
                                </div>
                            </div>
                            <ScrollArea className="h-36 mt-5">
                                <div className="text-sm flex gap-10"><FontAwesomeIcon icon={faWhatsapp} className="text-zinc-700 dark:text-zinc-300 pointer-events-none" style={{ fontSize: "1.2rem" }} /> <span className="ml-10">Whatsapp Engaged</span> <Button className="ml-auto me-10" variant={"outline"}>13</Button> </div>
                                <Separator className="mt-1 mb-3" />
                                <div className="text-sm flex gap-10"><Mail className="size-4 sm:size-5 text-zinc-700 dark:text-zinc-300" /> <span className="ml-10">mail Engaged</span> <Button className="ml-auto me-10" variant={"outline"}>13</Button> </div>
                                <Separator className="mt-1 mb-3" />
                                <div className="text-sm flex gap-10"><PhoneCall className="size-4 sm:size-5 text-zinc-700 dark:text-zinc-300" /> <span className="ml-10">Phone call Engaged</span> <Button className="ml-auto me-10" variant={"outline"}>13</Button> </div>
                                <Separator className="mt-1 mb-3" />
                                <div className="text-sm flex gap-10"><MessagesSquare className="size-4 sm:size-5 text-zinc-700 dark:text-zinc-300" /> <span className="ml-10">Sms Engaged</span> <Button className="ml-auto me-10" variant={"outline"}>13</Button> </div>
                                <Separator className="mt-1 mb-3" />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                <div className="xl:col-span-2 lg:col-span-3">
                    <Card className="border-2 shadow-none dark:bg-input/50 pt-2 gap-0 pb-0">
                        <CardHeader className="mt-0 pt-0 pb-0 mb-2">
                            <div className="flex items-center justify-between border-b pb-1">
                                <CardTitle className="text-muted-foreground text-lg font-bold">
                                    Considered Projects
                                </CardTitle>
                                {canEdit && (
                                    <Sheet open={addProjectSheetOpen} onOpenChange={setAddProjectSheetOpen}>
                                        <SheetTrigger asChild>
                                            <Button variant="ghost" size="sm" className="gap-1">
                                                <Plus className="size-4" />Add
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent className="w-lg">
                                            <SheetHeader>
                                                <SheetTitle>Add Interested Project</SheetTitle>
                                                <SheetDescription>
                                                    Select a project to add to this lead's interested projects.
                                                </SheetDescription>
                                            </SheetHeader>
                                            <div className="px-4 py-4">
                                                <ScrollArea className="h-[500px]">
                                                    {(() => {
                                                        const addedIds = new Set((leadDetail?.interested_projects || []).map((ip: any) => ip.project_id));
                                                        const available = allProjects.filter((p: any) => !addedIds.has(p.product_id));
                                                        return available.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {available.map((p: any) => (
                                                                    <div key={p.product_id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                                                                        <div>
                                                                            <p className="font-medium text-sm">{p.name}</p>
                                                                            <p className="text-xs text-muted-foreground">{p.location || 'No location'} · {p.property || 'N/A'}</p>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            disabled={addingProject}
                                                                            onClick={async () => {
                                                                                setAddingProject(true);
                                                                                try {
                                                                                    await addInterestedProjectMutation({
                                                                                        variables: {
                                                                                            organization,
                                                                                            leadId: leadDetail?._id,
                                                                                            projectId: p.product_id,
                                                                                            projectName: p.name
                                                                                        }
                                                                                    });
                                                                                    toast.success(`Added ${p.name}`);
                                                                                    refetchLead();
                                                                                } catch (err: any) {
                                                                                    toast.error(err?.message || 'Failed to add project');
                                                                                } finally {
                                                                                    setAddingProject(false);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground text-center py-4">All projects have been added.</p>
                                                        );
                                                    })()}
                                                </ScrollArea>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                )}
                            </div>
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
                                <CarouselContent className="-mt-1 h-[200px]">
                                    {(leadDetail?.interested_projects && (leadDetail.interested_projects as any[]).length > 0) ? (
                                        (leadDetail.interested_projects as any[]).map((ip: any) => {
                                            const projectDetail = allProjects.find((p: any) => p.product_id === ip.project_id);
                                            return (
                                                <CarouselItem key={ip.project_id}>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="col-span-1 flex flex-col items-center justify-center gap-2">
                                                            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                                                                {projectDetail?.img_location?.logo ? (
                                                                    <img
                                                                        src={projectDetail.img_location.logo}
                                                                        alt={ip.project_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <MapPinCheck className="h-8 w-8 text-primary" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm font-semibold text-center leading-tight">{ip.project_name}</p>
                                                            <Badge variant="outline" className="text-[10px]">{projectDetail?.property || 'N/A'}</Badge>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                                <div className="flex flex-col items-center">
                                                                    <Label className="text-muted-foreground">Location</Label>
                                                                    <p className="mt-1 text-sm text-center">{projectDetail?.location || '—'}</p>
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <Label className="text-muted-foreground">Type</Label>
                                                                    <p className="mt-1 text-sm capitalize">{projectDetail?.property || '—'}</p>
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <Label className="text-muted-foreground">Lead Stage</Label>
                                                                    <p className="mt-1 text-sm">{selectedStage || '—'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-4">
                                                                <div className="flex flex-col items-center">
                                                                    <Label className="text-muted-foreground">Book</Label>
                                                                    <Button
                                                                        className="mt-2 p-2"
                                                                        size="sm"
                                                                        variant="default"
                                                                        onClick={() => {
                                                                            const encodedId = encodeProjectId(ip.project_id)
                                                                            navigate(`/project_showcase?id=${encodedId}`, {
                                                                                state: {
                                                                                    bookingLead: {
                                                                                        _id: leadDetail?._id,
                                                                                        profile_id: leadDetail?.profile_id,
                                                                                        name: leadDetail?.profile?.name || 'Unknown',
                                                                                        phone: leadDetail?.profile?.phone || '',
                                                                                    }
                                                                                }
                                                                            })
                                                                        }}
                                                                    >
                                                                        <BookOpen className="h-3.5 w-3.5 mr-1" /> Book
                                                                    </Button>
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <Label className="text-muted-foreground">Meeting</Label>
                                                                    <Button className="mt-2 p-2" size="sm">Schedule Visit</Button>
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <Label className="text-muted-foreground">Brochure</Label>
                                                                    <Button className="mt-2 p-2" size="sm">Send</Button>
                                                                </div>
                                                                {canEdit && (
                                                                    <div className="flex flex-col items-center">
                                                                        <Label className="text-muted-foreground">Remove</Label>
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            className="mt-2 p-2"
                                                                            disabled={removingProjectId === ip.project_id}
                                                                            onClick={async () => {
                                                                                setRemovingProjectId(ip.project_id);
                                                                                try {
                                                                                    await removeInterestedProjectMutation({
                                                                                        variables: {
                                                                                            organization,
                                                                                            leadId: leadDetail?._id,
                                                                                            projectId: ip.project_id
                                                                                        }
                                                                                    });
                                                                                    toast.success(`Removed ${ip.project_name}`);
                                                                                    refetchLead();
                                                                                } catch (err: any) {
                                                                                    toast.error(err?.message || 'Failed to remove project');
                                                                                } finally {
                                                                                    setRemovingProjectId(null);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CarouselItem>
                                            );
                                        })
                                    ) : (
                                        <CarouselItem>
                                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                <MapPinCheck className="h-10 w-10 mb-2 opacity-30" />
                                                <p className="text-sm">No interested projects yet</p>
                                                <p className="text-xs">Click + to add projects</p>
                                            </div>
                                        </CarouselItem>
                                    )}
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
                                    value={leadDetail?.site_visits_completed ?? 0}
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
                                    <TabsTrigger value="notes">Notes</TabsTrigger>
                                    <TabsTrigger value="Phonecall">Phonecall</TabsTrigger>
                                    <TabsTrigger value="Whatsapp">Whatsapp</TabsTrigger>
                                    <TabsTrigger value="sms">SMS</TabsTrigger>
                                    <TabsTrigger value="Mail">Mail</TabsTrigger>
                                    <TabsTrigger value="site_visit">Site visit</TabsTrigger>
                                    <TabsTrigger value="follow_up">Follow up</TabsTrigger>
                                </TabsList>

                                <ScrollArea className="h-[75vh] pr-4">
                                    <ol className="relative border-l-2 border-gray-200 dark:border-zinc-800 ml-5 pl-5">
                                        {allTimelineActivities && allTimelineActivities.length > 0 ? (
                                            allTimelineActivities.map((activity) => {
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
                                                const isRequirement = activity.updates === "requirement";
                                                const isMail = activity.updates === "mail";

                                                // Pick icon & color based on update type
                                                const iconEl = isStageUpdate
                                                    ? <Shuffle className="size-5 text-zinc-700 dark:text-zinc-300" />
                                                    : isStatusUpdate
                                                        ? <History className="size-5 text-zinc-700 dark:text-zinc-300" />
                                                        : isFollowUp ? <Calendar className="size-5 text-zinc-700 dark:text-zinc-300" />
                                                            : isSiteVisit ? <CalendarClock className="size-5 text-zinc-700 dark:text-zinc-300" />
                                                                : isNotes ? <NotebookPen className="size-5 text-zinc-700 dark:text-zinc-300" />
                                                                    : isRequirement ? <ClipboardCheck className="size-5 text-zinc-700 dark:text-zinc-300" />
                                                                        : isMail ? <Mail className="size-5 text-blue-500 dark:text-blue-400" />
                                                                            : <Mail className="size-5 text-zinc-700 dark:text-zinc-300" />;

                                                const activityContent = (
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
                                                                    {isSiteVisit && (activity.site_visit_completed ? 'Site Visit ✓' : 'Site Visit')}
                                                                    {isNotes && 'Note'}
                                                                    {isRequirement && 'Requirement'}
                                                                    {isMail && 'Email Sent'}
                                                                    {(!isStageUpdate && !isStatusUpdate && !isFollowUp && !isSiteVisit && !isNotes && !isRequirement && !isMail) && 'Update'}
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
                                                                {isRequirement && (
                                                                    <div className="space-y-2">
                                                                        <p className="text-md text-muted-foreground leading-relaxed font-semibold">{activity.notes}</p>
                                                                    </div>
                                                                )}
                                                                {isSiteVisit && (
                                                                    <div className="space-y-2">
                                                                        <p className="text-md">
                                                                            Scheduled for
                                                                            <span className="text-zinc-900 dark:text-zinc-100 ml-1">{activity.site_visit_date ? new Date(activity.site_visit_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                                                                        </p>
                                                                        {activity.site_visit_completed ? (
                                                                            <div className="space-y-1.5">
                                                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-xs hover:bg-emerald-100 dark:hover:bg-emerald-500/10">
                                                                                    ✓ Visit Completed
                                                                                </Badge>
                                                                                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-1">
                                                                                    {activity.site_visit_completed_at && (
                                                                                        <span>
                                                                                            Completed on: <span className="font-medium text-zinc-700 dark:text-zinc-300">{new Date(activity.site_visit_completed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                                                        </span>
                                                                                    )}
                                                                                    {activity.site_visit_completed_by_name && (
                                                                                        <span>
                                                                                            Marked by: <span className="font-medium text-zinc-700 dark:text-zinc-300">{activity.site_visit_completed_by_name}</span>
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 text-xs">
                                                                                Pending
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {isMail && (
                                                                    <div className="space-y-1">
                                                                        <p className="text-md">
                                                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{activity.notes || 'No subject'}</span>
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">Sent to {leadDetail?.profile?.email || 'lead'}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="sm:hidden px-4 pb-2">
                                                                <p className="text-xs text-muted-foreground">{activity.user_name || 'Unknown'}</p>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );

                                                return (
                                                    <div key={activity.id} className="contents">
                                                        <TabsContent value="all">
                                                            {activityContent}
                                                        </TabsContent>
                                                        {isSiteVisit && (
                                                            <TabsContent value="site_visit">
                                                                {activityContent}
                                                            </TabsContent>
                                                        )}
                                                        {isNotes && (
                                                            <TabsContent value="notes">
                                                                {activityContent}
                                                            </TabsContent>
                                                        )}
                                                        {isFollowUp && (
                                                            <TabsContent value="follow_up">
                                                                {activityContent}
                                                            </TabsContent>
                                                        )}
                                                        {isMail && (
                                                            <TabsContent value="Mail">
                                                                {activityContent}
                                                            </TabsContent>
                                                        )}
                                                    </div>
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
