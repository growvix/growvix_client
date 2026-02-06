import { useParams } from "react-router-dom"
import { useEffect, useState, useMemo } from "react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import LoaderScreen from "@/components/ui/loader-screen"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import axios from 'axios'
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
import type { Lead, GetLeadByIdQueryResponse, GetLeadByIdQueryVariables, Stage } from "@/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { decryptId } from "@/lib/crypto"

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
    const [availableNextStages, setAvailableNextStages] = useState<Stage[]>([])
    const organization = getCookie("organization") || "";
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
                            variables: { organization, id: "3" },
                            fetchPolicy: 'network-only'
                        })
                        console.log('Lead Details Response:', id)
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
    const { data: leadData, loading: _leadLoading, error: _leadError } = useQuery<GetLeadByIdQueryResponse, GetLeadByIdQueryVariables>(
        GET_LEAD_BY_ID,
        {
            variables: { organization, id: id || "" },
            skip: !organization || !id
        }

    );

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

    // Memoize current stage object to avoid repeated find operations
    const currentStageObject = useMemo(() => {
        if (!selectedStage || stages.length === 0) return null;
        return stages.find(s => s.name.toLowerCase() === selectedStage.toLowerCase()) || null;
    }, [selectedStage, stages]);
    console.log(currentStageObject?.color);
    const handleStageChange = async (stageName: string) => {
        setSelectedStage(stageName);

        // TODO: Add API call to update the lead stage
        // try {
        //     await axios.put(`${API_URL}/api/leads/update-stage`, {
        //         leadId: leadId,
        //         stageName: stageName,
        //         organization
        //     });
        // } catch (error) {
        //     console.error("Failed to update stage:", error);
        // }
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
                                        Lead Id <span className=""> #{leadId ?? ""}</span>
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
                                    <Sheet>
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
                                        <SheetContent >
                                            <SheetHeader>
                                                <SheetTitle>Notes</SheetTitle>
                                                <SheetDescription className="">
                                                    Add and review notes related to this lead.
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
                                    <Sheet>
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
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Schedule Site Visit</SheetTitle>
                                                <SheetDescription>
                                                    Plan and confirm the site visit.
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
                                                    <Button variant="outline" size="icon" className="my-2 bg-cyan-50 text-white hover:bg-cyan-100 hover:text-white size-9 sm:size-10 md:size-10 rounded-md transform transition duration-150 ease-out active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400">
                                                        <CalendarSync className="size-4 sm:size-5 text-cyan-500 dark:text-cyan-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" />
                                                    </Button>
                                                </SheetTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Follow ups</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Follow Ups</SheetTitle>
                                                <SheetDescription>
                                                    View, add, and manage follow-up entries.
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
                                    <Select>


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
                    <Card className="border-2 shadow-none dark:bg-input/50">
                        <CardHeader className="mt-0">
                            <Tabs defaultValue="all" className="">
                                <TabsList className="w-full mb-4 py-1">
                                    <TabsTrigger value="all">all</TabsTrigger>
                                    <TabsTrigger value="Whatsapp">Whatsapp</TabsTrigger>
                                    <TabsTrigger value="Phonecall">Phonecall</TabsTrigger>
                                    <TabsTrigger value="Site visit">Site visit</TabsTrigger>
                                    <TabsTrigger value="Mail">Mail</TabsTrigger>
                                    <TabsTrigger value="password">Password</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <ol className="relative border-l-2 border-default ml-5 pl-5">
                                <li className="mb-10 ms-6">
                                    <span className="absolute bg-blue-100 dark:bg-blue-900 flex items-center justify-center w-12 h-12 rounded-full -start-6">
                                        <Mail className="size-6 text-blue-600 dark:text-blue-300" />
                                    </span>
                                    <div className="items-center justify-between p-4 bg-neutral-primary-soft border border-default rounded-base shadow-xs sm:flex">
                                        <time className="bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded sm:order-last mb-1 sm:mb-0">12-11-2025 | 12:45 am</time>
                                        <div className="text-body flex items-center"><span className="font-medium text-lg">Mail</span>  <span className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm font-medium px-1.5 py-0.5 rounded ml-2 ">Jane Hopper</span></div>
                                    </div>
                                </li>
                                <li className="mb-10 ms-6">
                                    <span className="absolute bg-purple-100 dark:bg-purple-900 flex items-center justify-center w-12 h-12 rounded-full -start-6">
                                        <Calendar className="size-6 text-purple-600 dark:text-purple-300" />
                                    </span>
                                    <div className="p-4 bg-neutral-primary-soft border border-default rounded-base shadow-xs">
                                        <div className="items-center justify-between mb-3 sm:flex ">
                                            <time className="bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded sm:order-last mb-1 sm:mb-0">2 hours ago</time>
                                            <div className="text-body">Thomas Lean commented on <a href="#" className="font-medium text-heading hover:underline">Flowbite Pro</a></div>
                                        </div>
                                        <div className="p-3 text-xs italic font-normal text-body border border-default-medium rounded-base bg-neutral-secondary-medium">Hi ya'll! I wanted to share a webinar zeroheight is having regarding how to best measure your design system! This is the second session of our new webinar series on #DesignSystems discussions where we'll be speaking about Measurement.</div>
                                        <div className="flex items-center space-x-3 mt-4">
                                            <button type="button" className="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none">View comment</button>
                                            <button type="button" className="inline-flex items-center  text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none">
                                                <svg className="w-4 h-4 me-1.5 -ms-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 8.046H11V6.119c0-.921-.9-1.446-1.524-.894l-5.108 4.49a1.2 1.2 0 0 0 0 1.739l5.108 4.49c.624.556 1.524.027 1.524-.893v-1.928h2a3.023 3.023 0 0 1 3 3.046V19a5.593 5.593 0 0 0-1.5-10.954Z" /></svg>
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                </li>
                                <li className="ms-6">
                                    <span className="absolute bg-green-100 dark:bg-green-900 flex items-center justify-center w-12 h-12 rounded-full -start-6">
                                        <FontAwesomeIcon icon={faWhatsapp} style={{ fontSize: "1.5rem" }} className="size-6 text-green-600 dark:text-green-400" />
                                    </span>
                                    <div className="items-center justify-between p-4 bg-neutral-primary-soft border border-default rounded-base shadow-xs sm:flex">
                                        <time className="bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded sm:order-last mb-1 sm:mb-0">3 hours ago</time>
                                        <div className="text-body"><a href="#" className="font-medium text-heading hover:underline">Bonnie Green</a> moved <a href="#" className="font-medium text-heading hover:underline">Jese Leos</a> to <span className="bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded">Funny Group</span></div>
                                    </div>
                                </li>
                            </ol>
                        </CardHeader>

                    </Card>
                </div>



            </div>



        </div >

    )
}
