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
import { API_URL, getSanitizedAvatarUrl } from '@/config/api'
import { leadClient } from "@/grpc/leadClient"
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import Autoplay from "embla-carousel-autoplay"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, } from "@/components/ui/carousel"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"
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
    HousePlus,
    Activity,
    Globe,
    Reply,
    LayoutGrid,
    CheckCircle,
    Clock,
    Star,
    Share2,
    Loader2,
    Edit3,
    Paperclip,
    X,
    ArrowLeft,
    PhoneIncoming,
    PhoneOutgoing,
    Image as ImageIcon,
    Search,
    RefreshCw
} from "lucide-react";
import type { Lead, GetLeadByIdQueryResponse, GetLeadByIdQueryVariables, UpdateLeadMutationResponse, UpdateLeadMutationVariables, Stage, PropertyRequirement, GetAllProjectsQueryResponse, GetAllProjectsQueryVariables, GetLeadStagesQueryResponse, GetLeadStagesQueryVariables, GetOrganizationUsersQueryResponse, GetOrganizationUsersQueryVariables, DeleteLeadMutationResponse, DeleteLeadMutationVariables } from "@/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    GripVertical,
    RectangleHorizontal,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Minus,
} from "lucide-react";

// dnd-kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// ─── Visual Editor Types ──────────────────────────────
type DesignBlockType = "text" | "image" | "divider" | "button" | "spacer"
interface DesignBlock {
    id: string
    type: DesignBlockType
    content: string
    styles: Record<string, string>
}
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
import { cn } from "@/lib/utils"

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
            merge_id {
                UUID
                id
                name
            }
            is_secondary
            merged_into {
                UUID
                id
                name
            }
            acquired {
                campaign
                source
                sub_source
                received
                created_at
                medium
                _id
            }
            number_of_re_engagement
            createdAt   
            updatedAt
            exe_user
            exe_user_name
            exe_user_image
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
                user_image
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
            important_activities {
                activity_id
                marked_at
                marked_by
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
            exe_user
            exe_user_name
            exe_user_image
            profile {
                phone
                email
                name
            }
            merge_id {
                UUID
                id
                name
            }
            is_secondary
            merged_into {
                UUID
                id
                name
            }
        }
    }
`;

const TOGGLE_IMPORTANT_ACTIVITY = gql`
    mutation ToggleImportantActivity($organization: String!, $leadId: String!, $activityId: String!, $userId: String!) {
        toggleImportantActivity(organization: $organization, leadId: $leadId, activityId: $activityId, userId: $userId) {
            _id
            important_activities {
                activity_id
                marked_at
                marked_by
            }
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
    mutation AddInterestedProject($organization: String!, $leadId: String!, $projectId: Int!) {
        addInterestedProject(organization: $organization, leadId: $leadId, projectId: $projectId) {
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

// ─── Button Controls (Label + Link + Alignment) ───────────
function ButtonControls({
    block,
    onUpdate,
}: {
    block: DesignBlock
    onUpdate: (block: DesignBlock) => void
}) {
    const currentAlign = block.styles.align || "center"

    return (
        <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md border flex-wrap">
                <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Label</Label>
                    <Input
                        value={block.content || ""}
                        onChange={(e) => onUpdate({ ...block, content: e.target.value })}
                        placeholder="Click me"
                        className="h-7 w-24 text-[10px]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Link</Label>
                    <Input
                        value={block.styles.href || ""}
                        onChange={(e) => onUpdate({ ...block, styles: { ...block.styles, href: e.target.value } })}
                        placeholder="https://..."
                        className="h-7 w-32 text-[10px]"
                    />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Align</Label>
                    <div className="flex gap-1">
                        {[
                            { value: "left", icon: AlignLeft, label: "Left" },
                            { value: "center", icon: AlignCenter, label: "Center" },
                            { value: "right", icon: AlignRight, label: "Right" },
                        ].map(({ value, icon: Icon, label }) => (
                            <Button
                                key={value}
                                type="button"
                                variant={currentAlign === value ? "default" : "outline"}
                                size="sm"
                                className="h-6 w-7 p-0"
                                title={label}
                                onClick={() =>
                                    onUpdate({
                                        ...block,
                                        styles: { ...block.styles, align: value },
                                    })
                                }
                            >
                                <Icon className="h-3 w-3" />
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Size</Label>
                    <Select
                        value={block.styles.size || "md"}
                        onValueChange={(val) => onUpdate({ ...block, styles: { ...block.styles, size: val } })}
                    >
                        <SelectTrigger className="h-7 w-16 text-[10px]">
                            <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sm">S</SelectItem>
                            <SelectItem value="md">M</SelectItem>
                            <SelectItem value="lg">L</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-md border flex-wrap">
                <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Text</Label>
                    <div className="flex items-center gap-1">
                        <input
                            type="color"
                            value={block.styles.color || "#ffffff"}
                            onChange={(e) => onUpdate({ ...block, styles: { ...block.styles, color: e.target.value } })}
                            className="h-6 w-8 p-0.5 cursor-pointer bg-background border rounded"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground whitespace-nowrap">BG</Label>
                    <div className="flex items-center gap-1">
                        <input
                            type="color"
                            value={block.styles.backgroundColor || "#0f172a"}
                            onChange={(e) => onUpdate({ ...block, styles: { ...block.styles, backgroundColor: e.target.value } })}
                            className="h-6 w-8 p-0.5 cursor-pointer bg-background border rounded"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Image Controls (Resize + Alignment) ────────────────
function ImageControls({
    block,
    onUpdate,
}: {
    block: DesignBlock
    onUpdate: (block: DesignBlock) => void
}) {
    const currentWidth = block.styles.width || "100"
    const currentAlign = block.styles.align || "center"

    return (
        <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-md border">
                <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Align</Label>
                <div className="flex gap-1">
                    {[
                        { value: "left", icon: AlignLeft, label: "Left" },
                        { value: "center", icon: AlignCenter, label: "Center" },
                        { value: "right", icon: AlignRight, label: "Right" },
                    ].map(({ value, icon: Icon, label }) => (
                        <Button
                            key={value}
                            type="button"
                            variant={currentAlign === value ? "default" : "outline"}
                            size="sm"
                            className="h-6 w-7"
                            title={label}
                            onClick={() =>
                                onUpdate({
                                    ...block,
                                    styles: { ...block.styles, align: value },
                                })
                            }
                        >
                            <Icon className="h-3 w-3" />
                        </Button>
                    ))}
                </div>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Width</Label>
                <Input
                    type="number"
                    min="10"
                    max="100"
                    value={currentWidth}
                    onChange={(e) => {
                        const val = Math.min(100, Math.max(10, parseInt(e.target.value) || 100))
                        onUpdate({
                            ...block,
                            styles: { ...block.styles, width: String(val) },
                        })
                    }}
                    className="h-7 w-12 text-[10px]"
                />
                <div className="flex gap-1">
                    {[50, 75, 100].map((w) => (
                        <Button
                            key={w}
                            type="button"
                            variant={currentWidth === String(w) ? "default" : "outline"}
                            size="sm"
                            className="h-6 px-1.5 text-[10px]"
                            onClick={() =>
                                onUpdate({
                                    ...block,
                                    styles: { ...block.styles, width: String(w) },
                                })
                            }
                        >
                            {w}%
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Sortable Design Block Component ──────────────────── 
function SortableDesignBlockItem({
    block,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
}: {
    block: DesignBlock
    isSelected: boolean
    onSelect: () => void
    onUpdate: (block: DesignBlock) => void
    onDelete: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto" as const,
    }

    const imgWidth = block.styles.width || "100"
    const imgAlign = block.styles.align || "center"
    const alignClass = imgAlign === "left" ? "mr-auto" : imgAlign === "right" ? "ml-auto" : "mx-auto"

    const renderBlock = () => {
        switch (block.type) {
            case "text":
                return (
                    <div className="w-full relative z-10">
                        <RichTextEditor
                            value={block.content}
                            onChange={(val) => onUpdate({ ...block, content: val })}
                            minHeight="80px"
                        />
                    </div>
                )
            case "image":
                return block.content ? (
                    <div style={{ width: `${imgWidth}%` }} className={alignClass}>
                        <img
                            src={block.content}
                            alt="Template image"
                            className="w-full h-auto rounded"
                        />
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground text-center">
                            Click to upload image
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    const reader = new FileReader()
                                    reader.onload = (ev) => {
                                        onUpdate({
                                            ...block,
                                            content: ev.target?.result as string,
                                        })
                                    }
                                    reader.readAsDataURL(file)
                                }
                            }}
                        />
                    </label>
                )
            case "divider":
                return <hr className="border-t border-gray-300 my-1" />
            case "button": {
                const align = block.styles.align || "center"
                const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center"
                const href = block.styles.href || "#"
                const btnColor = block.styles.color || "#ffffff"
                const btnBg = block.styles.backgroundColor || "#0f172a"
                const btnSize = block.styles.size || "md"
                const sizeStyles = {
                    sm: "px-2 py-1 text-[10px]",
                    md: "px-3 py-1.5 text-xs",
                    lg: "px-4 py-2 text-sm"
                }[btnSize] || "px-3 py-1.5 text-xs"

                return (
                    <div className={alignClass}>
                        <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className={cn("inline-block rounded-md font-medium transition-colors opacity-90 hover:opacity-100", sizeStyles)}
                            style={{ backgroundColor: btnBg, color: btnColor }}
                        >
                            {block.content || "Click me"}
                        </a>
                    </div>
                )
            }
            case "spacer":
                return <div className="h-4" />
            default:
                return null
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-block-id={block.id}
            onClick={onSelect}
            className={cn(
                "group relative p-2 rounded-lg border transition-all mb-2",
                isDragging && "shadow-lg bg-background",
                isSelected
                    ? "border-primary ring-1 ring-primary/20 bg-primary/5"
                    : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/30"
            )}
        >
            <div className="flex items-start gap-1">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pt-1 cursor-grab active:cursor-grabbing"
                >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    {renderBlock()}
                    {/* Show button controls when button is selected */}
                    {isSelected && block.type === "button" && (
                        <ButtonControls block={block} onUpdate={onUpdate} />
                    )}
                    {/* Show image controls when image is selected */}
                    {isSelected && block.type === "image" && block.content && (
                        <ImageControls block={block} onUpdate={onUpdate} />
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    )
}

export default function LeadDetail() {
    const [loading, setLoading] = useState(true)
    const [togglingImportantId, setTogglingImportantId] = useState<string | null>(null)
    const [leadDetail, setLeadDetail] = useState<Lead | null>(null)
    const [activeExeIndex, setActiveExeIndex] = useState(0)
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
    const currentUserName = getCookie("userName") || "";

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
    // Offline Call state
    const [offlineCallDate, setOfflineCallDate] = useState<Date | undefined>(new Date())
    const [offlineCallTime, setOfflineCallTime] = useState('')
    const [offlineCallSheetOpen, setOfflineCallSheetOpen] = useState(false)



    // Lead Merging & Swapping State
    const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
    const [mergeSearchQuery, setMergeSearchQuery] = useState("");
    const [mergeSearchResults, setMergeSearchResults] = useState<any[]>([]);
    const [isSearchingLeads, setIsSearchingLeads] = useState(false);
    const [isMergingLead, setIsMergingLead] = useState(false);
    const [originalLead, setOriginalLead] = useState<Lead | null>(null);
    const [isShowingSecondary, setIsShowingSecondary] = useState(false);

    const handleSearchLeads = async (query: string) => {
        setMergeSearchQuery(query);
        if (query.length < 2) {
            setMergeSearchResults([]);
            return;
        }
        setIsSearchingLeads(true);
        try {
            const organization = getCookie("organization") || "";
            const { leads } = await leadClient.getAllLeads({
                organization,
                limit: 10,
                filters: { name: query }
            });
            // Filter out current lead if it appears in search
            setMergeSearchResults(leads.filter((l: any) => l.lead_id.toString() !== id));
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearchingLeads(false);
        }
    };

    const handleMergeLead = async (secondaryLead: any) => {
        if (!leadDetail?._id || !organization) return;

        if (secondaryLead.is_secondary) {
            toast.error("This lead is already merged into another lead");
            return;
        }

        if (secondaryLead.merge_id && Array.isArray(secondaryLead.merge_id) && secondaryLead.merge_id.length > 0) {
            toast.error("This is a primary lead and cannot be merged as a secondary lead");
            return;
        }

        setIsMergingLead(true);
        try {
            const currentMerges = leadDetail.merge_id || [];
            // Use lead_id if it's an object with toString, or just lead_id if it's a string
            const secondaryUuid = secondaryLead.lead_id?.toString() || secondaryLead.lead_id;

            const newMerge = {
                UUID: secondaryUuid,
                id: secondaryLead.profile_id.toString(),
                name: secondaryLead.name
            };

            await Promise.all([
                updateLead({
                    variables: {
                        organization,
                        id: leadDetail._id,
                        input: {
                            merge_id: [...currentMerges, newMerge]
                        }
                    }
                }),
                updateLead({
                    variables: {
                        organization,
                        id: secondaryUuid,
                        input: {
                            is_secondary: true,
                            merged_into: {
                                UUID: leadDetail._id,
                                id: leadDetail.profile_id.toString(),
                                name: leadDetail.profile.name
                            }
                        }
                    }
                })
            ]);

            toast.success(`Lead merged successfully`);
            setIsMergeDialogOpen(false);
            setMergeSearchQuery("");
            setMergeSearchResults([]);
            refetchLead();
        } catch (error) {
            console.error("Merge error:", error);
            toast.error("Failed to merge leads");
        } finally {
            setIsMergingLead(false);
        }
    };

    const handleToggleSwap = async () => {
        if (!leadDetail?._id || !organization) return;

        if (isShowingSecondary || leadDetail.is_secondary) {
            // Revert to original or go back to primary lead
            if (originalLead) {
                setLeadDetail(originalLead);
                setIsShowingSecondary(false);
            } else if (leadDetail.merged_into) {
                setLoading(true);
                try {
                    const { data } = await apolloClient.query<GetLeadByIdQueryResponse, GetLeadByIdQueryVariables>({
                        query: GET_LEAD_BY_ID,
                        variables: { organization, id: leadDetail.merged_into.UUID },
                        fetchPolicy: 'network-only'
                    });
                    if (data?.getLeadById) {
                        setLeadDetail(data.getLeadById);
                        setIsShowingSecondary(false);
                    }
                } catch (err) {
                    console.error("Failed to load primary lead:", err);
                } finally {
                    setLoading(false);
                }
            }
        } else {
            // Swap to first secondary lead if exists
            const mergeInfo = leadDetail.merge_id?.[0];
            if (mergeInfo) {
                setOriginalLead(leadDetail);
                setLoading(true);
                try {
                    const { data } = await apolloClient.query<GetLeadByIdQueryResponse, GetLeadByIdQueryVariables>({
                        query: GET_LEAD_BY_ID,
                        variables: { organization, id: mergeInfo.UUID },
                        fetchPolicy: 'network-only'
                    });
                    if (data?.getLeadById) {
                        setLeadDetail(data.getLeadById);
                        setIsShowingSecondary(true);
                    }
                } catch (err) {
                    console.error("Failed to load secondary lead:", err);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    // Site Visit Conducted state
    const [conductedSheetOpen, setConductedSheetOpen] = useState(false)
    const [markingVisitId, setMarkingVisitId] = useState<string | null>(null)

    // Mail state
    const [mailSheetOpen, setMailSheetOpen] = useState(false)
    const [mailSubject, setMailSubject] = useState('')
    const [mailBody, setMailBody] = useState('')
    type MailAttachment = { type: 'file', file: File } | { type: 'template', filename: string, url: string };
    const [mailAttachments, setMailAttachments] = useState<MailAttachment[]>([])
    const [mailLoading, setMailLoading] = useState(false)

    // Mail template state
    interface MailTemplate {
        _id: string;
        templateName: string;
        subject: string;
        body: string;
        attachments: { filename: string; url: string; type: string }[];
        projectId?: { _id: string; name: string } | string;
        description?: string;
    }
    const [mailTemplates, setMailTemplates] = useState<MailTemplate[]>([])
    const [mailTemplatesLoading, setMailTemplatesLoading] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
    const [selectedTemplate, setSelectedTemplate] = useState<MailTemplate | null>(null)
    const [templateEditModalOpen, setTemplateEditModalOpen] = useState(false)

    // Visual Editor State
    const [designBlocks, setDesignBlocks] = useState<DesignBlock[]>([])
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setDesignBlocks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const addBlock = (type: DesignBlockType) => {
        const newBlock: DesignBlock = {
            id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type,
            content: type === "text" ? "Type your text here..." : type === "button" ? "Click me" : "",
            styles: {},
        }
        setDesignBlocks((prev) => [...prev, newBlock])
        setSelectedBlockId(newBlock.id)
    }

    const deleteBlock = (id: string) => {
        setDesignBlocks(prev => prev.filter(b => b.id !== id))
        if (selectedBlockId === id) setSelectedBlockId(null)
    }

    const updateBlock = (updated: DesignBlock) => {
        setDesignBlocks(prev => prev.map(b => b.id === updated.id ? updated : b))
    }

    const generateHtmlFromBlocks = (blocks: DesignBlock[]) => {
        let html = '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff; text-align: left;">'

        blocks.forEach((block) => {
            const align = block.styles?.align || 'left'
            const textAlign = `text-align: ${align};`

            if (block.type === 'text') {
                html += `<div style="margin-bottom: 20px; ${textAlign} line-height: 1.6; font-size: 14px; color: #374151;">${block.content || ''}</div>`
            } else if (block.type === 'image' && block.content) {
                const width = block.styles?.width || '100'
                let imgSrc = block.content
                if (imgSrc.startsWith('/uploads')) {
                    imgSrc = `${API_URL}${imgSrc}`
                } else if (!imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
                    imgSrc = `${API_URL}/${imgSrc.startsWith('/') ? imgSrc.slice(1) : imgSrc}`
                }

                const marginStyle = align === 'center' ? 'margin: 0 auto;' : align === 'right' ? 'margin-left: auto;' : 'margin-right: auto;'
                html += `<div style="margin-bottom: 20px; ${textAlign}">
                    <img src="${imgSrc}" style="max-width: ${width}%; height: auto; display: block; border-radius: 8px; ${marginStyle}" alt="Image" />
                </div>`
            } else if (block.type === 'divider') {
                html += '<div style="margin: 24px 0; border-top: 1px solid #e5e7eb;"></div>'
            } else if (block.type === 'button') {
                const href = block.styles?.href || '#'
                const btnColor = block.styles?.color || '#ffffff'
                const btnBg = block.styles?.backgroundColor || '#0f172a'
                const btnSize = block.styles?.size || 'md'
                const padding = btnSize === 'sm' ? '8px 16px' : btnSize === 'lg' ? '14px 28px' : '11px 22px'
                const fontSize = btnSize === 'sm' ? '12px' : btnSize === 'lg' ? '16px' : '14px'

                html += `<div style="margin-bottom: 20px; ${textAlign}">
                    <a href="${href}" target="_blank" rel="noopener noreferrer" 
                       style="display: inline-block; padding: ${padding}; background-color: ${btnBg}; color: ${btnColor}; 
                              text-decoration: none; border-radius: 6px; font-weight: 600; font-size: ${fontSize}; font-family: inherit;">
                        ${block.content || 'Click Now'}
                    </a>
                </div>`
            } else if (block.type === 'spacer') {
                html += '<div style="height: 30px;"></div>'
            }
        })

        html += '</div>'
        return html
    }

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
    const [projectSearch, setProjectSearch] = useState('')

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
    const [toggleImportantActivityMutation] = useMutation(TOGGLE_IMPORTANT_ACTIVITY);
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
        setIsShowingSecondary(false);
        setOriginalLead(null);
    }, [id]);

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
                setLoading(false)
                toast.error(error instanceof Error ? error.message : 'Failed to fetch lead details')
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
        if (leadDetail.exe_user === currentUserId) return true;

        // Fallback for name match (resolves UUID mismatch issues for same user)
        if (leadDetail.exe_user_name && currentUserName &&
            leadDetail.exe_user_name.toLowerCase().trim() === currentUserName.toLowerCase().trim()) {
            return true;
        }

        return false;
    }, [leadDetail?.exe_user, leadDetail?.exe_user_name, currentUserId, currentUserName]);

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

            mailAttachments.forEach((att) => {
                if (att.type === 'file') {
                    formData.append('attachments', att.file)
                } else if (att.type === 'template') {
                    // Send template attachment info (backend must be updated to handle this if needed)
                    formData.append('templateAttachments', JSON.stringify({ filename: att.filename, url: att.url }))
                }
            })

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
        if (!siteVisitDate) {
            toast.error('Please select a date for the site visit')
            return
        }
        setSiteVisitLoading(true)
        try {
            // Combine date and time
            const dateStr = format(siteVisitDate, "yyyy-MM-dd");
            const combinedDateTimeString = siteVisitTime ? `${dateStr}T${siteVisitTime}:00` : `${dateStr}T00:00:00`;
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
                    <Card className="overflow-hidden border-2 gap-2 shadow-none rounded-x pt-0 h-93 min-h-[160px] flex flex-col dark:bg-primary/10">
                        {/* Header */}
                        <CardHeader
                            className="bg-gradient-to-r from-[var(--stage-color)] to-gray-10 dark:from-[var(--stage-color)] dark:to-gray-200 py-3 sm:py-5 px-3 sm:px-4 transition-colors duration-500 ease-in-out"
                            style={{ "--stage-color": currentStageObject?.color ?? "transparent" } as React.CSSProperties}
                        >
                            <div className="flex items-center gap-2 sm:gap-4">

                                {/* Avatar */}
                                <Avatar className="size-12 sm:size-14 ring-2 ring-primary/20 shadow">
                                    {leadDetail?.profile?.profileImagePath && (
                                        <AvatarImage src={getSanitizedAvatarUrl(leadDetail.profile.profileImagePath)} alt={leadName} />
                                    )}
                                    <AvatarFallback className="text-xl sm:text-2xl font-semibold uppercase">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                                            {leadName}
                                        </CardTitle>
                                        <Badge variant="secondary" className="text-[10px] h-5 opacity-70">
                                            #{leadDetail?.profile_id ?? ""}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {(leadDetail?.merge_id && leadDetail.merge_id.length > 0) || leadDetail?.is_secondary || leadDetail?.merged_into || isShowingSecondary ? (
                                            <div className="flex items-center gap-1.5">
                                                <Badge
                                                    variant="default"
                                                    className="bg-black text-white dark:bg-zinc-800 dark:text-zinc-200 text-[10px] h-5 px-2 font-medium"
                                                >
                                                    Merged
                                                </Badge>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={handleToggleSwap}
                                                                className="h-5 w-5 p-0 hover:bg-transparent"
                                                            >
                                                                <Badge variant="secondary" className="text-[10px] h-5 opacity-70 ml-2 bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200">
                                                                    <RefreshCw className={cn("h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400 transition-transform duration-300", (isShowingSecondary || leadDetail?.is_secondary) && "rotate-180")} />
                                                                </Badge>
                                                            </Button>

                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{(isShowingSecondary || leadDetail?.is_secondary) ? "Show Primary Lead" : "Show Secondary Lead"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        ) : (
                                            <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <DialogTrigger asChild>
                                                                <Badge
                                                                    variant="default"
                                                                    className={cn(
                                                                        "bg-black text-white dark:bg-zinc-800 text-[10px] h-5 px-2 font-medium",
                                                                        canEdit ? "cursor-pointer hover:bg-zinc-900" : "opacity-50 cursor-not-allowed"
                                                                    )}
                                                                    onClick={(e) => {
                                                                        if (!canEdit) {
                                                                            e.preventDefault();
                                                                            toast.error("Only the assigned executive can merge this lead");
                                                                        }
                                                                    }}
                                                                >
                                                                    Merge
                                                                </Badge>
                                                            </DialogTrigger>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Merge with another lead</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none bg-white text-slate-950 dark:bg-zinc-950 dark:text-zinc-100 shadow-2xl">
                                                    <DialogHeader className="p-6 pb-2">
                                                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                                            Merge Leads
                                                        </DialogTitle>
                                                        <p className="text-sm text-slate-500 dark:text-zinc-400">Search for a lead to merge with <span className="text-slate-900 dark:text-zinc-200 font-medium">{leadName}</span>.</p>
                                                    </DialogHeader>
                                                    <div className="p-6 pt-2 space-y-4">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                                                            <Input
                                                                placeholder="Search by ID, name, email or number..."
                                                                value={mergeSearchQuery}
                                                                onChange={(e) => handleSearchLeads(e.target.value)}
                                                                className="pl-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/20 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-700 h-10"
                                                            />
                                                        </div>

                                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                                            {isSearchingLeads ? (
                                                                <div className="flex items-center justify-center py-8">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                                                                </div>
                                                            ) : mergeSearchResults.length > 0 ? (
                                                                mergeSearchResults.map((lead) => (
                                                                    <div
                                                                        key={lead.lead_id.toString()}
                                                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 dark:bg-zinc-900/50 dark:border-zinc-800/50 dark:hover:bg-zinc-900 dark:hover:border-zinc-700 transition-all group"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar className="h-10 w-10 border border-slate-200 dark:border-zinc-800">
                                                                                <AvatarFallback className="bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-400 text-xs">
                                                                                    {getUserAvatar(lead.name)}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{lead.name}</span>
                                                                                <div className="flex flex-col mt-0.5">
                                                                                    <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium tracking-wide">#{lead.profile_id}</span>
                                                                                    {lead.is_secondary && (
                                                                                        <span className="text-[9px] text-red-500 font-bold uppercase mt-0.5">Already Merged</span>
                                                                                    )}
                                                                                    {lead.merge_id && lead.merge_id.length > 0 && (
                                                                                        <span className="text-[9px] text-blue-500 font-bold uppercase mt-0.5">Primary Lead</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            disabled={isMergingLead}
                                                                            onClick={() => handleMergeLead(lead)}
                                                                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-4 text-xs font-bold rounded-full dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                                                                        >
                                                                            Select
                                                                        </Button>
                                                                    </div>
                                                                ))
                                                            ) : mergeSearchQuery.length >= 2 ? (
                                                                <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm">
                                                                    No leads found matching your search.
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
                                                                    Enter at least 2 characters to search.
                                                                </div>
                                                            )}
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 h-10 font-medium"
                                                            onClick={() => setIsMergeDialogOpen(false)}
                                                        >
                                                            Close
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
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
                                <div className="mb-1.5">
                                    <div className="flex items-center justify-center gap-2 mb-1.5">
                                        <ShieldAlert className="text-xs text-yellow-500 dark:text-amber-400 " />
                                        <span className="text-xs font-medium text-yellow-500 dark:text-amber-400 ">View Only — This lead is assigned to {leadDetail?.exe_user_name || 'another user'}</span>
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
                                    <Sheet open={mailSheetOpen} onOpenChange={(open) => {
                                        setMailSheetOpen(open)
                                        if (open && mailTemplates.length === 0) {
                                            // Fetch templates when opening
                                            setMailTemplatesLoading(true)
                                            const org = getCookie('organization')
                                            if (org) {
                                                axios.get(`${API_URL}/api/mail/templates?organization=${org}`)
                                                    .then(res => setMailTemplates(res.data?.data || []))
                                                    .catch(() => { /* silently fail – user can still compose manually */ })
                                                    .finally(() => setMailTemplatesLoading(false))
                                            } else {
                                                setMailTemplatesLoading(false)
                                            }
                                        }
                                        if (!open) {
                                            setSelectedTemplateId('')
                                        }
                                    }}>
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
                                                    {/* Template selector */}
                                                    <div className="space-y-1.5">
                                                        <Label>Template</Label>
                                                        <Select
                                                            value={selectedTemplateId}
                                                            onValueChange={(value) => {
                                                                setSelectedTemplateId(value)
                                                                if (value === '__none__') {
                                                                    setSelectedTemplate(null)
                                                                    setMailSubject('')
                                                                    setMailBody('')
                                                                    return
                                                                }
                                                                const tpl = mailTemplates.find(t => t._id === value)
                                                                if (tpl) {
                                                                    setSelectedTemplate(tpl)
                                                                    setMailSubject(tpl.subject || '')
                                                                    // Convert design blocks JSON to HTML
                                                                    let bodyHtml = ''
                                                                    let blocks: DesignBlock[] = []
                                                                    try {
                                                                        const parsed = JSON.parse(tpl.body)
                                                                        if (Array.isArray(parsed)) {
                                                                            blocks = parsed
                                                                            bodyHtml = generateHtmlFromBlocks(blocks)
                                                                        } else {
                                                                            // Simple text body
                                                                            bodyHtml = tpl.body || ''
                                                                            blocks = [{ id: `block-${Date.now()}`, type: 'text', content: bodyHtml, styles: {} }]
                                                                        }
                                                                    } catch {
                                                                        bodyHtml = tpl.body || ''
                                                                        blocks = [{ id: `block-${Date.now()}`, type: 'text', content: bodyHtml, styles: {} }]
                                                                    }
                                                                    setMailBody(bodyHtml)
                                                                    setDesignBlocks(blocks)
                                                                    // Load template attachments
                                                                    if (tpl.attachments && Array.isArray(tpl.attachments)) {
                                                                        const tplAtts = tpl.attachments.map((att: any): MailAttachment => ({
                                                                            type: 'template',
                                                                            filename: att.filename,
                                                                            url: att.url
                                                                        }));
                                                                        setMailAttachments(tplAtts);
                                                                    } else {
                                                                        setMailAttachments([]);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={mailTemplatesLoading ? 'Loading templates…' : 'Choose a template (optional)'} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    <SelectLabel>Templates</SelectLabel>
                                                                    <SelectItem value="__none__">— No template —</SelectItem>
                                                                    {mailTemplates.map(t => (
                                                                        <SelectItem key={t._id} value={t._id}>{t.templateName}</SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Template Preview Section */}
                                                    {selectedTemplate && (
                                                        <Card className="border shadow-none bg-muted/20">
                                                            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                                                <div>
                                                                    <CardTitle className="text-sm font-semibold">Template Preview</CardTitle>
                                                                    <CardDescription className="text-[10px]">Read-only preview of {selectedTemplate.templateName}</CardDescription>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 text-xs gap-1.5"
                                                                    onClick={() => setTemplateEditModalOpen(true)}
                                                                >
                                                                    <Edit3 className="h-3.5 w-3.5" />
                                                                    Edit Content
                                                                </Button>
                                                            </CardHeader>
                                                            <CardContent className="py-2 px-4 space-y-3">
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">Subject</span>
                                                                    <p className="text-sm border rounded-md p-2 bg-background">{mailSubject || "(No subject)"}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">Body Preview</span>
                                                                    <div
                                                                        className="text-sm border rounded-md p-3 bg-background max-h-[150px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                                                                        dangerouslySetInnerHTML={{ __html: mailBody }}
                                                                    />
                                                                </div>
                                                                {mailAttachments.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        <span className="text-[10px] font-medium text-muted-foreground uppercase">Attachments</span>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {mailAttachments.map((att, idx) => (
                                                                                <div key={idx} className={cn(
                                                                                    "flex items-center gap-2 border rounded p-1.5 bg-background text-[10px]",
                                                                                    att.type === 'template' ? "border-blue-200" : "border-emerald-200"
                                                                                )}>
                                                                                    <Paperclip className={cn("h-3 w-3", att.type === 'template' ? "text-blue-500" : "text-emerald-500")} />
                                                                                    <span className="truncate max-w-[120px]">
                                                                                        {att.type === 'template' ? att.filename : att.file.name}
                                                                                    </span>
                                                                                    {att.type === 'template' && <Badge variant="outline" className="text-[7px] h-3 py-0 px-1 border-blue-100 text-blue-500 bg-white">TPL</Badge>}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                    {!selectedTemplate && (
                                                        <div className="space-y-4 pt-2">
                                                            <Separator />
                                                            {/* Manual Email Fields */}
                                                            <div className="space-y-1.5 mt-2">
                                                                <Label htmlFor="mailSubject">Subject</Label>
                                                                <Input
                                                                    id="mailSubject"
                                                                    placeholder="Enter email subject"
                                                                    value={mailSubject}
                                                                    onChange={(e) => setMailSubject(e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <Label htmlFor="mailBody">Message</Label>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 text-[10px] gap-1"
                                                                        onClick={() => {
                                                                            // If body has content but blocks are empty, maybe wrap it in a text block
                                                                            if (mailBody && designBlocks.length === 0) {
                                                                                setDesignBlocks([{ id: `block-${Date.now()}`, type: 'text', content: mailBody, styles: {} }]);
                                                                            }
                                                                            setTemplateEditModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <LayoutGrid className="h-3 w-3" />
                                                                        Use Visual Designer
                                                                    </Button>
                                                                </div>
                                                                <RichTextEditor
                                                                    value={mailBody}
                                                                    onChange={setMailBody}
                                                                    minHeight="200px"
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label>Attachments</Label>
                                                                <Input
                                                                    type="file"
                                                                    multiple
                                                                    className="text-xs"
                                                                    onChange={(e) => {
                                                                        const files = e.target.files
                                                                        if (files) {
                                                                            const newAtts = Array.from(files).map((f): MailAttachment => ({ type: 'file', file: f }))
                                                                            setMailAttachments(prev => [...prev, ...newAtts])
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {mailAttachments.map((att, i) => (
                                                                        <div key={i} className="flex items-center gap-2 border rounded-md p-1.5 bg-muted/30 max-w-[200px] overflow-hidden group">
                                                                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                                                                            <span className="text-[10px] truncate font-medium">
                                                                                {att.type === 'file' ? att.file.name : att.filename}
                                                                            </span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100"
                                                                                onClick={() => setMailAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                                            >
                                                                                <X className="h-2 w-2" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </form>
                                            </div>

                                            {/* Sheet Footer */}
                                            <div className="p-4 border-t bg-muted/30 flex justify-end gap-3 mt-auto">
                                                <Button
                                                    type="submit"
                                                    form="mail-compose-form"
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

                                            {/* Unified Visual Editor Modal */}
                                            <Dialog open={templateEditModalOpen} onOpenChange={setTemplateEditModalOpen}>
                                                <DialogContent className="min-w-[85vw] max-w-[95vw] h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
                                                    <DialogHeader className="p-4 border-b">
                                                        <DialogTitle>Edit Email Content</DialogTitle>
                                                        <DialogDescription>Modify the content using visual design blocks.</DialogDescription>
                                                    </DialogHeader>

                                                    <div className="flex-1 overflow-y-auto">
                                                        <div className="p-4 space-y-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-medium">Subject</Label>
                                                                <Input
                                                                    placeholder="Email subject..."
                                                                    value={mailSubject}
                                                                    onChange={(e) => setMailSubject(e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                                                                <div className="md:col-span-3 space-y-4">
                                                                    <div className="p-3 border rounded-lg bg-muted/30">
                                                                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Add Blocks</h4>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <Button variant="outline" className="flex flex-col h-14 text-[10px] gap-1" onClick={() => addBlock("text")}>
                                                                                <Type className="h-4 w-4" /> Rich Text
                                                                            </Button>
                                                                            <Button variant="outline" className="flex flex-col h-14 text-[10px] gap-1" onClick={() => addBlock("image")}>
                                                                                <ImageIcon className="h-4 w-4" /> Image
                                                                            </Button>
                                                                            <Button variant="outline" className="flex flex-col h-14 text-[10px] gap-1" onClick={() => addBlock("button")}>
                                                                                <RectangleHorizontal className="h-4 w-4" /> Button
                                                                            </Button>
                                                                            <Button variant="outline" className="flex flex-col h-14 text-[10px] gap-1" onClick={() => addBlock("divider")}>
                                                                                <Minus className="h-4 w-4" /> Divider
                                                                            </Button>
                                                                            <Button variant="outline" className="flex flex-col h-14 text-[10px] gap-1" onClick={() => addBlock("spacer")}>
                                                                                <Plus className="h-4 w-4" /> Spacer
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="md:col-span-9">
                                                                    <div className="border rounded-lg bg-card p-4 min-h-[400px]">
                                                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                                                            <SortableContext items={designBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                                                                {designBlocks.length === 0 ? (
                                                                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20 border-2 border-dashed rounded-lg">
                                                                                        <Plus className="h-8 w-8 mb-2 opacity-20" />
                                                                                        <p className="text-sm">Start building your email</p>
                                                                                    </div>
                                                                                ) : (
                                                                                    designBlocks.map((block) => (
                                                                                        <SortableDesignBlockItem
                                                                                            key={block.id}
                                                                                            block={block}
                                                                                            isSelected={selectedBlockId === block.id}
                                                                                            onSelect={() => setSelectedBlockId(block.id)}
                                                                                            onUpdate={updateBlock}
                                                                                            onDelete={() => deleteBlock(block.id)}
                                                                                        />
                                                                                    ))
                                                                                )}
                                                                            </SortableContext>
                                                                        </DndContext>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 pt-4 border-t">
                                                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Attachments</Label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {mailAttachments.map((att, i) => (
                                                                        <div key={i} className="flex items-center gap-2 border rounded-md p-1.5 bg-muted/30 max-w-[200px] overflow-hidden group">
                                                                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                                                                            <span className="text-[10px] truncate font-medium">{att.type === 'file' ? att.file.name : att.filename}</span>
                                                                            <Button
                                                                                variant="ghost" size="icon" className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100"
                                                                                onClick={() => setMailAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                                            >
                                                                                <X className="h-2 w-2" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    <Input type="file" multiple className="text-xs h-8 w-auto inline-flex" onChange={(e) => {
                                                                        const files = e.target.files
                                                                        if (files) {
                                                                            const newAtts = Array.from(files).map((f): MailAttachment => ({ type: 'file', file: f }))
                                                                            setMailAttachments(prev => [...prev, ...newAtts])
                                                                        }
                                                                    }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
                                                        <Button variant="outline" onClick={() => setTemplateEditModalOpen(false)}>Cancel</Button>
                                                        <Button onClick={() => {
                                                            setMailBody(generateHtmlFromBlocks(designBlocks))
                                                            setTemplateEditModalOpen(false)
                                                            toast.success('Email content updated')
                                                        }}>Done Editing</Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
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
                                                            leadId: leadDetail?._id,
                                                        });
                                                        console.log('IVR Call Response:', response.data);
                                                        const vendorData = response.data?.data?.vendorResponse;
                                                        if (vendorData?.status === 'success' || response.data?.success) {
                                                            toast.success(`Call initiated successfully`);
                                                        } else {
                                                            toast.info(`Call request sent. Status: ${vendorData?.status || 'pending'}`);
                                                        }
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

                                {canEdit && (
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
                                                                <Label htmlFor="siteVisitTime">Time (Optional)</Label>
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
                                                                                        Visit: {(() => {
                                                                                            const d = new Date(activity.site_visit_date);
                                                                                            const options: Intl.DateTimeFormatOptions = { dateStyle: 'short' };
                                                                                            if (d.getHours() !== 0 || d.getMinutes() !== 0) {
                                                                                                options.timeStyle = 'short';
                                                                                            }
                                                                                            return d.toLocaleString([], options);
                                                                                        })()}
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
                                )}

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
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-white dark:text-black">
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
                                                                            {(() => {
                                                                                const d = new Date(activity.site_visit_date);
                                                                                const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };
                                                                                if (d.getHours() !== 0 || d.getMinutes() !== 0) {
                                                                                    options.timeStyle = 'short';
                                                                                }
                                                                                return d.toLocaleString([], options);
                                                                            })()}
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
                                                    <Button variant="outline" size="icon" disabled={!canEdit} className="my-2 bg-cyan-50 text-white hover:bg-cyan-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400">
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
                                                    <Button variant="outline" size="icon" disabled={!canEdit} className="my-2 bg-slate-50 text-white hover:bg-slate-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-400">
                                                        <Smartphone className="size-4 sm:size-5 text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Offline call</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent className="w-full sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                            <SheetHeader className="mb-6">
                                                <SheetTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Log Offline Call</SheetTitle>
                                                <SheetDescription className="text-sm text-muted-foreground">
                                                    Record telephony interactions manually.
                                                </SheetDescription>
                                            </SheetHeader>

                                            <div className="space-y-6">
                                                {/* Call Timing Selector */}
                                                <div className="flex flex-col space-y-4 ps-2 pe-2">
                                                    <div className="flex flex-col space-y-2">
                                                        <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Date</Label>
                                                        <DatePicker date={offlineCallDate} setDate={setOfflineCallDate} />
                                                    </div>

                                                    <div className="flex flex-col space-y-2">
                                                        <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Time</Label>
                                                        <TimePicker time={offlineCallTime} setTime={setOfflineCallTime} />
                                                    </div>
                                                </div>

                                                <Separator className="opacity-50" />

                                                {/* Incoming Calls Section */}
                                                <div className="space-y-2 ps-2 pe-2">
                                                    <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Incoming</Label>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-12 justify-between border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all font-semibold"
                                                        onClick={() => toast.info('Purchase the IVR to use this feature')}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <PhoneIncoming className="size-4 text-emerald-500" />
                                                            <span className="text-zinc-600 dark:text-zinc-400">Add incoming record</span>
                                                        </div>
                                                        <Plus className="size-4 opacity-50" />
                                                    </Button>
                                                </div>

                                                {/* Outgoing Calls Section */}
                                                <div className="space-y-2 ps-2 pe-2">
                                                    <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Outgoing</Label>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-12 justify-between border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all font-semibold"
                                                        onClick={() => toast.info('Purchase the IVR to use this feature')}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <PhoneOutgoing className="size-4 text-emerald-500" />
                                                            <span className="text-zinc-600 dark:text-zinc-400">Add outgoing record</span>
                                                        </div>
                                                        <Plus className="size-4 opacity-50" />
                                                    </Button>
                                                </div>

                                                {/* Dummy Submit Button */}
                                                <div className="ps-2 pe-2 pt-2">
                                                    <Button
                                                        className="w-full h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-all rounded-xl"
                                                        onClick={() => toast.info('Purchase the IVR to use this feature')}
                                                    >
                                                        Submit Information
                                                    </Button>
                                                </div>

                                                <Separator className="my-8" />

                                                {/* Previous Calls History */}
                                                <div className="space-y-4 ps-2 pe-2">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-400">Previous Offline Calls</h4>
                                                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 opacity-50">
                                                        <Smartphone className="size-10 text-zinc-300 mb-2" />
                                                        <p className="text-sm font-medium">No calls logged yet</p>
                                                        <p className="text-xs max-w-[200px]">Manual call logs will appear here for audit history.</p>
                                                    </div>
                                                </div>
                                            </div>
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
                                                    <Button variant="outline" size="icon" disabled={!canEdit} className="my-2 bg-indigo-50 text-white hover:bg-indigo-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-400">
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
                                                                            updates: 'reassign',
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
                                                <SelectItem value="No Activity">No Activity</SelectItem>
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
                            <div className="flex items-center justify-between p-3 sm:p-4">
                                <div className="flex flex-col">
                                    <CardTitle className="text-xs sm:text-sm font-light text-muted-foreground">Received on</CardTitle>
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                                        {leadDetail?.createdAt ? new Date(leadDetail.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <CalendarCheck className="size-5 sm:size-6 text-zinc-700 dark:text-zinc-300" />
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="flex items-center justify-between p-3 sm:p-4">
                                <div className="flex flex-col">
                                    <CardTitle className="text-xs sm:text-sm font-light text-muted-foreground">Last Updated</CardTitle>
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                                        {leadDetail?.updatedAt ? new Date(leadDetail.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <History className="size-5 sm:size-6 text-zinc-700 dark:text-zinc-300" />
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="flex items-center justify-between p-3 sm:p-4">
                                <div className="flex flex-col">
                                    <CardTitle className="text-xs sm:text-sm font-light text-muted-foreground">Total Engagements</CardTitle>
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">{(leadDetail?.activities?.length || 0).toString()}</span>
                                </div>
                                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <Activity className="size-5 sm:size-6 text-zinc-700 dark:text-zinc-300" />
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="flex items-center justify-between p-3 sm:p-4">
                                <div className="flex flex-col">
                                    <CardTitle className="text-xs sm:text-sm font-light text-muted-foreground">Lead Country</CardTitle>
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">{leadDetail?.profile?.location || 'India'}</span>
                                </div>
                                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <Globe className="size-5 sm:size-6 text-zinc-700 dark:text-zinc-300" />
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="flex items-center justify-between p-3 sm:p-4">
                                <div className="flex flex-col">
                                    <CardTitle className="text-xs sm:text-sm font-light text-muted-foreground">Total Responses</CardTitle>
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">{leadDetail?.acquired?.length.toString() || '0'}</span>
                                </div>
                                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <Reply className="size-5 sm:size-6 text-zinc-700 dark:text-zinc-300" />
                                </div>
                            </div>
                        </Card>
                        <Card className="overflow-hidden shadow-none py-0 border-2 dark:bg-input/50">
                            <div className="flex items-center justify-between p-3 sm:p-4">
                                <div className="flex flex-col">
                                    <CardTitle className="text-xs sm:text-sm font-light text-muted-foreground">Project Enquired</CardTitle>
                                    <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">{leadDetail?.interested_projects?.[0]?.project_name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <LayoutGrid className="size-5 sm:size-6 text-zinc-700 dark:text-zinc-300" />
                                </div>
                            </div>
                        </Card>

                    </div>
                    <Card className="border-2 shadow-none py-1 gap-0 dark:border-zinc-800 dark:bg-black h-full">
                        <CardHeader className="pt-2 pb-0">
                            <div className="flex items-center justify-between">
                                <Label className="text-muted-foreground">Requirements</Label>
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
                                        <Button variant="ghost" size="sm" disabled={!canEdit} className="gap-1">
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
                                                                    leadId: leadDetail?._id,
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
                            </div>
                        </CardHeader>




                        <CardContent className="flex justify-center mt-3 mb-3">
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
                                        className="w-full max-w-[96%] h-xs group relative mx-auto"
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
                                        <CarouselPrevious className="-left-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 shadow-md z-10" />
                                        <CarouselNext className="-right-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 shadow-md z-10" />
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
                <div className="xl:col-span-1 lg:col-span-1">
                    <Card className="border-2 shadow-none dark:bg-black pt-2 gap-0 pb-2 h-full">
                        <CardHeader className="mt-0 pt-0 pb-0">
                            <div className="flex items-center justify-between">
                                <Label className="text-muted-foreground  ">
                                    Interested Projects
                                </Label>
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
                                                    <search className="mt-6">
                                                        <Input placeholder="Search projects..." value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} />
                                                    </search>
                                                </SheetDescription>
                                            </SheetHeader>

                                            <div className="px-3">
                                                <ScrollArea className="h-[600px]">
                                                    {(() => {
                                                        const addedIds = new Set((leadDetail?.interested_projects || []).map((ip: any) => ip.project_id));
                                                        const searchLower = projectSearch.toLowerCase();
                                                        const available = allProjects.filter((p: any) =>
                                                            !addedIds.has(p.product_id) &&
                                                            (!searchLower ||
                                                                p.name?.toLowerCase().includes(searchLower) ||
                                                                p.location?.toLowerCase().includes(searchLower) ||
                                                                p.property?.toLowerCase().includes(searchLower) ||
                                                                (p.property === 'apartments' && 'apartments'.includes(searchLower)) ||
                                                                (p.property === 'plots' && 'plots'.includes(searchLower))
                                                            )
                                                        );
                                                        return available.length > 0 ? (
                                                            <div className="flex flex-col">
                                                                {available.map((p: any, index: number) => (
                                                                    <div key={p.product_id}>
                                                                        <div
                                                                            className="flex items-center justify-between py-3 hover:bg-muted/50 transition-colors px-2 cursor-pointer rounded-md"
                                                                            onClick={async () => {
                                                                                if (addingProject) return;
                                                                                setAddingProject(true);
                                                                                try {
                                                                                    await addInterestedProjectMutation({
                                                                                        variables: {
                                                                                            organization,
                                                                                            leadId: leadDetail?._id,
                                                                                            projectId: p.product_id,
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
                                                                            <div className="flex-1 min-w-0 pr-4 flex flex-col gap-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-base font-bold truncate">{p.name}</span>
                                                                                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{p.property || 'N/A'}</Badge>
                                                                                </div>
                                                                                <span className="text-muted-foreground text-sm flex-wrap leading-tight">{p.location || 'No location'}</span>
                                                                            </div>
                                                                            <span className="text-sm font-medium text-primary hover:underline whitespace-nowrap">Click Here</span>
                                                                        </div>
                                                                        {index < available.length - 1 && <Separator />}
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
                        <CardContent className="px-0 mb-0">
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
                                className="w-full relative group" >
                                <CarouselPrevious className="-top-2 left-1/2 -translate-x-1/2 rotate-90 size-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 shadow-md border-none z-10" />
                                <CarouselNext className="-bottom-2 left-1/2 -translate-x-1/2 rotate-90 size-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 shadow-md border-none z-10" />
                                <CarouselContent className="h-[220px]">
                                    {leadDetail?.interested_projects && (leadDetail.interested_projects as any[]).length > 0 ? (
                                        (leadDetail.interested_projects as any[]).map((ip: any) => {
                                            const projectDetail = allProjects.find((p: any) => p.product_id === ip.project_id);
                                            return (
                                                <CarouselItem key={ip.project_id}>
                                                    <div className="px-4 h-full flex flex-col justify-center">
                                                        <div className="flex gap-5 items-start">
                                                            {/* Project Image/Logo */}
                                                            <div className="w-65 h-35 rounded-2xl bg-transparent flex items-center justify-center overflow-hidden shrink-0">
                                                                {projectDetail?.img_location?.logo ? (
                                                                    <img
                                                                        src={projectDetail.img_location.logo}
                                                                        alt={ip.project_name || projectDetail?.name || `Project ${ip.project_id}`}
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                ) : (
                                                                    <MapPinCheck className="h-10 w-10 text-zinc-600" />
                                                                )}
                                                            </div>

                                                            {/* Project Information & Actions */}
                                                            <div className="flex-1 min-w-0 flex flex-col gap-4">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex items-center gap-3 overflow-hidden mt-5">
                                                                        <h4 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter truncate leading-none">
                                                                            {ip.project_name || projectDetail?.name || `Project #${ip.project_id}`}
                                                                        </h4>
                                                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-3 py-1 h-auto text-[10px] font-black uppercase tracking-widest shrink-0 shadow-sm rounded-full">
                                                                            {projectDetail?.property || 'PROJ'}
                                                                        </Badge>
                                                                    </div>

                                                                    {canEdit && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 hover:border-red-500/20 group transition-all shrink-0"
                                                                                    disabled={removingProjectId === ip.project_id}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4 text-red-500 transition-colors" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent className="rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Remove Project</AlertDialogTitle>
                                                                                    <AlertDialogDescription className="text-zinc-500 font-medium">
                                                                                        Are you sure you want to remove <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">{ip.project_name || projectDetail?.name || `Project #${ip.project_id}`}</span>?
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        className="bg-red-500 hover:bg-red-600 rounded-xl font-bold uppercase tracking-widest text-[10px]"
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
                                                                                                toast.success(`Removed ${ip.project_name || projectDetail?.name || 'project'}`);
                                                                                                refetchLead();
                                                                                            } catch (err: any) {
                                                                                                toast.error(err?.message || 'Failed to remove project');
                                                                                            } finally {
                                                                                                setRemovingProjectId(null);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        Remove
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                                                                    <MapPinCheck className="h-4 w-4 shrink-0" />
                                                                    <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                                                                        {projectDetail?.location || 'Location Not Set'}
                                                                    </span>
                                                                </div>

                                                                {/* Actions */}

                                                            </div>

                                                        </div>
                                                        {canEdit && (
                                                            <div className="flex items-center gap-4 pt-1">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-9 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex-1 shadow-lg border-2 border-transparent"
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
                                                                    Click Booking
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-9 px-4 border-2 border-zinc-200 dark:border-zinc-800 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all flex-1 shrink-0"
                                                                    onClick={() => {
                                                                        setSiteVisitProject({ id: ip.project_id, name: ip.project_name || projectDetail?.name || `Project #${ip.project_id}` });
                                                                        setSiteVisitSheetOpen(true);
                                                                    }}
                                                                >
                                                                    Schedule Site Visit
                                                                </Button>
                                                            </div>
                                                        )}
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
                <div className="xl:col-span-2 lg:col-span-2">
                    {(() => {
                        const nameMap = new Map<string, { mainId: string; name: string; image: string; altIds: string[] }>();

                        // 1. Add current assigned executive
                        if (leadDetail?.exe_user && leadDetail?.exe_user_name) {
                            const name = leadDetail.exe_user_name;
                            nameMap.set(name, {
                                mainId: leadDetail.exe_user,
                                name,
                                image: leadDetail.exe_user_image || "",
                                altIds: []
                            });
                        }

                        // 2. Add and merge with historical executives from activities
                        if (leadDetail?.activities) {
                            leadDetail.activities.forEach((activity: any) => {
                                if (!activity.user_name) return;

                                const name = activity.user_name;
                                const existing = nameMap.get(name);

                                if (existing) {
                                    // If we find an image in an activity but missed it in lead record, use it
                                    if (!existing.image && activity.user_image) {
                                        existing.image = activity.user_image;
                                    }
                                    // Collect alternative IDs for stat calculation (UUID vs profile_id)
                                    if (activity.user_id && activity.user_id !== existing.mainId) {
                                        if (!existing.altIds.includes(activity.user_id)) {
                                            existing.altIds.push(activity.user_id);
                                        }
                                    }
                                } else {
                                    nameMap.set(name, {
                                        mainId: activity.user_id || "",
                                        name: name,
                                        image: activity.user_image || "",
                                        altIds: []
                                    });
                                }
                            });
                        }

                        const executives = Array.from(nameMap.values());
                        if (executives.length === 0) {
                            executives.push({ mainId: 'unassigned', name: 'Unassigned', image: '', altIds: [] });
                        }

                        // Calculate cumulative total stats for the whole lead first
                        const totalStats = { whatsapp: 0, mail: 0, call: 0, sms: 0, notes: 0, site_visits_scheduled: 0, site_visits_conducted: 0, follow_ups_scheduled: 0, follow_ups_conducted: 0 };
                        if (leadDetail?.activities) {
                            leadDetail.activities.forEach((a: any) => {
                                const up = a.updates?.toLowerCase();
                                if (up === 'whatsapp') totalStats.whatsapp++;
                                if (up === 'mail') totalStats.mail++;
                                if (up === 'phonecall' || up === 'call') totalStats.call++;
                                if (up === 'sms') totalStats.sms++;
                                if (up === 'note' || up === 'notes') totalStats.notes++;
                                if (up === 'site_visit') {
                                    totalStats.site_visits_scheduled++;
                                    if (a.site_visit_completed) totalStats.site_visits_conducted++;
                                }
                                if (up === 'follow_up' || up === 'followup') totalStats.follow_ups_scheduled++;
                            });
                        }

                        const renderCardContent = (exe: { mainId: string; name: string; image: string; altIds: string[] }) => {
                            const initials = getUserAvatar(exe.name);
                            const exeStats = { whatsapp: 0, mail: 0, call: 0, sms: 0, notes: 0, site_visits: 0, site_visits_scheduled: 0, site_visits_conducted: 0, follow_ups_scheduled: 0, follow_ups_conducted: 0 };

                            if (leadDetail?.activities) {
                                leadDetail.activities.forEach((a: any) => {
                                    const matchesId = a.user_id === exe.mainId || exe.altIds.includes(a.user_id);
                                    if (matchesId || a.user_name === exe.name) {
                                        const up = a.updates?.toLowerCase();
                                        if (up === 'whatsapp') exeStats.whatsapp++;
                                        if (up === 'mail') exeStats.mail++;
                                        if (up === 'phonecall' || up === 'call') exeStats.call++;
                                        if (up === 'sms') exeStats.sms++;
                                        if (up === 'note' || up === 'notes') exeStats.notes++;
                                        if (up === 'site_visit') {
                                            exeStats.site_visits_scheduled++;
                                            if (a.site_visit_completed) exeStats.site_visits_conducted++;
                                        }
                                        if (up === 'follow_up' || up === 'followup') exeStats.follow_ups_scheduled++;
                                    }
                                });
                            }

                            const statsToShow = [
                                { key: 'Whatsapp', value: exeStats.whatsapp, total: totalStats.whatsapp },
                                { key: 'Mail', value: exeStats.mail, total: totalStats.mail },
                                { key: 'Call', value: exeStats.call, total: totalStats.call },
                                { key: 'SMS', value: exeStats.sms, total: totalStats.sms },
                                { key: 'Notes', value: exeStats.notes, total: totalStats.notes },
                                { key: 'Site Visits', value: exeStats.site_visits_scheduled, total: totalStats.site_visits_scheduled },
                                { key: 'SV Conducted', value: exeStats.site_visits_conducted, total: totalStats.site_visits_conducted },
                                { key: 'Follow-ups', value: exeStats.follow_ups_scheduled, total: totalStats.follow_ups_scheduled }
                            ];

                            return (
                                <Card className="border-2 shadow-none dark:bg-input/50 pt-2 h-full relative overflow-hidden bg-white dark:bg-zinc-950">
                                    <CardContent className="p-3 pt-0">
                                        <div className="flex items-center justify-between gap-2 mb-2 border-b border-muted/20 pb-1.5">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="size-10 ring-1 ring-primary/5 shadow-sm border border-primary/5">
                                                    {exe.image ? <AvatarImage src={getSanitizedAvatarUrl(exe.image)} alt={exe.name} /> : null}
                                                    <AvatarFallback className="text-xs font-bold uppercase bg-primary/5 text-primary">
                                                        {exe.name !== 'Unassigned' ? initials : 'UN'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-0">
                                                    <CardTitle className="text-xl font-bold tracking-tight truncate max-w-[120px]" title={exe.name}>
                                                        {exe.name}
                                                    </CardTitle>
                                                    <CardDescription className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">
                                                        Active Executive
                                                    </CardDescription>
                                                </div>
                                            </div>

                                            {/* Stacked Avatars Selector */}
                                            {executives.length > 1 && (
                                                <div className="flex -space-x-1.5 pr-1">
                                                    {executives.slice(0, 3).map((e, idx) => (
                                                        <TooltipProvider key={idx}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Avatar
                                                                        className={cn(
                                                                            "size-6 border border-background cursor-pointer hover:-translate-y-0.5 transition-all shadow-sm",
                                                                            activeExeIndex === idx ? "ring-1 ring-primary z-30 scale-105" : "opacity-80"
                                                                        )}
                                                                        onClick={(ev) => {
                                                                            ev.stopPropagation();
                                                                            setActiveExeIndex(idx);
                                                                        }}
                                                                    >
                                                                        {e.image ? <AvatarImage src={getSanitizedAvatarUrl(e.image)} /> : null}
                                                                        <AvatarFallback className="text-[7px] font-black bg-zinc-100 dark:bg-zinc-800">
                                                                            {getUserAvatar(e.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-[8px] font-bold uppercase">{e.name}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* 3x3 Compact Grid */}
                                        <div className="grid grid-cols-3 gap-y-2 pt-1">
                                            {statsToShow.map((stat, idx) => (
                                                <div key={idx} className={cn(
                                                    "flex flex-col items-center justify-center py-1 text-center",
                                                    (idx + 1) % 3 !== 0 && "border-r border-muted/10"
                                                )}>
                                                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-tighter mb-0.5 truncate w-full px-1">
                                                        {stat.key} :
                                                    </span>
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-black text-zinc-900 dark:text-zinc-100">
                                                            {stat.value}
                                                        </span>
                                                       
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        };

                        return (
                            <div className="h-full relative group">
                                <Carousel
                                    className="w-full h-full"
                                    opts={{ align: "start", loop: true }}
                                >
                                    <CarouselContent className="ml-0">
                                        {executives.map((exe, i) => (
                                            <CarouselItem key={i} className="pl-0">
                                                {renderCardContent(exe)}
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>

                                    {executives.length > 1 && (
                                        <>
                                            <CarouselPrevious className="-left-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 shadow-sm z-10" />
                                            <CarouselNext className="-right-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 shadow-sm z-10" />
                                        </>
                                    )}
                                </Carousel>
                            </div>
                        );
                    })()}
                </div>
                <div className="xl:col-span-3 lg:col-span-3">
                    <Card className="border-2 pt-0 gap-2 shadow-none dark:border-zinc-800 dark:bg-black">
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

                                {/* Outgoing Missed */}
                                <StageStatCard
                                    value={leadDetail?.activities?.filter(a => a.updates === 'call' && a.notes?.includes('Missed')).length || 0}
                                    label="Outgoing Missed Calls"
                                    currentStageColor={currentStageObject?.color}
                                />

                                {/* Outgoing Answered */}
                                <StageStatCard
                                    value={leadDetail?.activities?.filter(a => a.updates === 'call' && a.notes?.includes('Answered')).length || 0}
                                    label="Outgoing Answered Calls"
                                    currentStageColor={currentStageObject?.color}
                                />

                                {/* Incoming Missed */}
                                <StageStatCard
                                    value={leadDetail?.acquired?.filter(a => a.medium === 'Call' && a.source?.includes('Missed')).length || 0}
                                    label="Incoming Missed Calls"
                                    currentStageColor={currentStageObject?.color}
                                />

                                {/* Incoming Answered */}
                                <StageStatCard
                                    value={leadDetail?.acquired?.filter(a => a.medium === 'Call' && a.source?.includes('Answered')).length || 0}
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
                            <Label className="text-center justify-center items-center  pb-4 border-b text-muted-foreground">Campaign Response</Label>
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
                    <Card className="border-2 shadow-none dark:border-zinc-800 dark:bg-black bg-background">
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
                                    <TabsTrigger value="important">Important</TabsTrigger>
                                    <TabsTrigger value="campaign_response">Campaign Response</TabsTrigger>
                                </TabsList>

                                <ScrollArea className="h-[75vh] pr-4">
                                    <TabsContent value="campaign_response">
                                        <div className="space-y-4 pt-4 ml-5 mr-4">
                                            {leadDetail?.acquired && leadDetail.acquired.length > 0 ? (
                                                leadDetail.acquired.map((acq: any, index: number) => (
                                                    <div key={acq._id || index} className="p-4 rounded-xl border bg-card/50 shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900/50">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className={index === 0 ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
                                                                        {index === 0 ? "Initial Lead" : `Re-engagement #${index}`}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Clock className="size-3" />
                                                                        {acq.received ? new Date(acq.received).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-lg font-bold text-foreground mt-1">
                                                                    {acq.campaign || 'Direct Entry'}
                                                                </h3>
                                                            </div>
                                                            <Badge variant="outline" className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold border-muted-foreground/30">
                                                                {acq.medium || 'organic'}
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Source</p>
                                                                <p className="text-sm font-medium">{acq.source || 'N/A'}</p>
                                                            </div>
                                                            {acq.sub_source && (
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Sub Source</p>
                                                                    <p className="text-sm font-medium">{acq.sub_source}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/10 rounded-xl border-2 border-dashed">
                                                    <Reply className="size-10 mb-2 opacity-50" />
                                                    <p>No campaign response records found</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
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
                                                                        : <Mail className="size-5 text-zinc-700 dark:text-zinc-300" />;

                                                const isImportant = leadDetail?.important_activities?.some(ia => ia.activity_id === (activity.id || `req-${activity._id}`));

                                                const activityContent = (
                                                    <li className="mb-6 ms-6">
                                                        <span className="absolute flex items-center justify-center w-10 h-10 rounded-full -start-5 ring-4 ring-background bg-zinc-100 dark:bg-zinc-800">
                                                            {iconEl}
                                                        </span>
                                                        <div className="relative overflow-hidden rounded-xl border bg-gray-100/20 dark:bg-neutral-950 shadow-sm transition-all duration-200 border-l-[3px] border-l-zinc-400 dark:border-l-zinc-600">
                                                            {/* Header row */}
                                                            <div className="flex items-center justify-between px-4 pt-3 pb-2">
                                                                <div className="flex items-center gap-2">
                                                                    {isSiteVisit ? (
                                                                        <span
                                                                            className={cn(
                                                                                "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                                                                                activity.site_visit_completed
                                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                                                    : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                                                            )}
                                                                        >
                                                                            {activity.site_visit_completed ? (
                                                                                <>
                                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                                    Site Visit
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Clock className="w-3.5 h-3.5" />
                                                                                    Site Visit
                                                                                </>
                                                                            )}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                                            {isStageUpdate && 'Stage Update'}
                                                                            {isStatusUpdate && 'Status Update'}
                                                                            {isFollowUp && 'Follow Up'}
                                                                            {isNotes && 'Note'}
                                                                            {isRequirement && 'Requirement'}
                                                                            {isMail && 'Email Sent'}
                                                                            {(!isStageUpdate && !isStatusUpdate && !isFollowUp && !isSiteVisit && !isNotes && !isRequirement && !isMail) && 'Update'}
                                                                        </span>
                                                                    )}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={cn(
                                                                            "size-7 h-7 w-7 p-0 rounded-full transition-colors",
                                                                            isImportant ? "text-yellow-500 hover:text-yellow-600" : "text-zinc-400 hover:text-yellow-500",
                                                                            !canEdit && "opacity-50 cursor-not-allowed"
                                                                        )}
                                                                        disabled={!canEdit}
                                                                        onClick={async () => {
                                                                            if (!canEdit) return;
                                                                            const actId = activity.id || `req-${activity._id}`;
                                                                            setTogglingImportantId(actId);
                                                                            try {
                                                                                await toggleImportantActivityMutation({
                                                                                    variables: {
                                                                                        organization,
                                                                                        leadId: leadDetail?._id,
                                                                                        activityId: actId,
                                                                                        userId: currentUserId
                                                                                    }
                                                                                });
                                                                                toast.success(isImportant ? 'Removed from important' : 'Marked as important');
                                                                                refetchLead();
                                                                            } catch (error) {
                                                                                console.error('Failed to toggle important status:', error);
                                                                                toast.error('Failed to update important status');
                                                                            } finally {
                                                                                setTogglingImportantId(null);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {togglingImportantId === (activity.id || `req-${activity._id}`) ? (
                                                                            <Loader2 className="size-4 animate-spin" />
                                                                        ) : (
                                                                            <Star className={cn("size-4", isImportant && "fill-current")} />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                        <Avatar className="size-5 ring-1 ring-primary/10">
                                                                            {activity.user_image && <AvatarImage src={getSanitizedAvatarUrl(activity.user_image)} alt={activity.user_name || 'User'} />}
                                                                            <AvatarFallback className="text-[8px] font-bold">
                                                                                {(activity.user_name || '?').substring(0, 1).toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="hidden sm:inline">{activity.user_name || 'Unknown'}</span>
                                                                        <span className="hidden sm:inline">·</span>
                                                                        <time className="font-medium">{formattedDate}</time>
                                                                    </div>
                                                                    {isSiteVisit && (
                                                                        activity.site_visit_completed ? (
                                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-[10px] hover:bg-emerald-100 dark:hover:bg-emerald-500/10 rounded-full px-2 py-0 h-5 w-fit">
                                                                                ✓ Visit Completed
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 text-[10px] px-2 py-0 h-5 rounded-full">
                                                                                Pending
                                                                            </Badge>
                                                                        )
                                                                    )}
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
                                                                    <div className="flex items-center gap-6 mt-2 ml-1">
                                                                        {/* Scheduled Info */}
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="text-[13px] font-medium text-muted-foreground">Scheduled for</span>
                                                                            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                                                                {activity.site_visit_date ? (() => {
                                                                                    const d = new Date(activity.site_visit_date);
                                                                                    const options: Intl.DateTimeFormatOptions = {
                                                                                        month: 'numeric',
                                                                                        day: 'numeric',
                                                                                        year: '2-digit',
                                                                                    };
                                                                                    if (d.getHours() !== 0 || d.getMinutes() !== 0) {
                                                                                        options.hour = '2-digit';
                                                                                        options.minute = '2-digit';
                                                                                        options.hour12 = true;
                                                                                    }
                                                                                    return d.toLocaleString([], options);
                                                                                })() : 'N/A'}
                                                                            </span>
                                                                        </div>

                                                                        {activity.site_visit_completed && (
                                                                            <>
                                                                                <div className="h-12 w-px bg-gray-200 dark:bg-zinc-800 self-center" />
                                                                                {/* Completed Info */}
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-[13px] font-medium text-muted-foreground">Completed on</span>
                                                                                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                                                                        {activity.site_visit_completed_at ? new Date(activity.site_visit_completed_at).toLocaleString([], {
                                                                                            month: 'numeric',
                                                                                            day: 'numeric',
                                                                                            year: '2-digit',
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit',
                                                                                            hour12: true
                                                                                        }) : 'N/A'}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="h-12 w-px bg-gray-200 dark:bg-zinc-800 self-center" />

                                                                                {/* Marked By Info */}
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-[13px] font-medium text-muted-foreground">Marked by</span>
                                                                                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                                                                        {activity.site_visit_completed_by_name || 'N/A'}
                                                                                    </span>
                                                                                </div>
                                                                            </>
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
                                                        {isImportant && (
                                                            <TabsContent value="important">
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



        </div>
    );
};

