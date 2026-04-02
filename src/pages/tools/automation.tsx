import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { UserRoundCog, Import, UsersRound,FileDown, Search, SearchX, SearchCode, MailPlus, Phone, Megaphone } from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

export default function Automation() {
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()
    const [search, setSearch] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Automation", href: "tools/automation" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Automation</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    const settingsCards = [
        {
            title: "Campaigns",
            description: "Manage campaigns for your business.",
            icon: Megaphone,
            colorClass: "text-blue-600 dark:text-blue-400",
            bgClass: "bg-blue-100 dark:bg-blue-900/40",
            hoverBorder: "hover:border-blue-300 dark:hover:border-blue-800",
            hoverGradient: "from-blue-50/50 dark:from-blue-950/20",
            path: "/automation/campaigns",
        },
        {
            title: "Virtual Number",
            description: "Manage virtual numbers for your business.",
            icon: Phone,
            colorClass: "text-blue-600 dark:text-blue-400",
            bgClass: "bg-blue-100 dark:bg-blue-900/40",
            hoverBorder: "hover:border-blue-300 dark:hover:border-blue-800",
            hoverGradient: "from-blue-50/50 dark:from-blue-950/20",
            path: "/automation/virtual_number",
        },
        {
            title: "Email Templates",
            description: "Create and manage reusable email templates with simple or design editors.",
            icon: MailPlus,
            colorClass: "text-purple-600 dark:text-purple-400",
            bgClass: "bg-purple-100 dark:bg-purple-900/40",
            hoverBorder: "hover:border-purple-300 dark:hover:border-purple-800",
            hoverGradient: "from-purple-50/50 dark:from-purple-950/20",
            path: "/automation/mail_templates",
        },
        {
            title: "Lead Capture Forms",
            description: "Create and manage reusable lead capture forms with simple or design editors.",
            icon: FileDown,
            colorClass: "text-emerald-600 dark:text-emerald-400",
            bgClass: "bg-emerald-100 dark:bg-emerald-900/40",
            hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-800",
            hoverGradient: "from-emerald-50/50 dark:from-emerald-950/20",
            path: "/automation/lead_capture_forms",
        },
        {
            title: "Track Source and Subsource",
            description: "Track source and subsource of leads.",
            icon: SearchCode,
            colorClass: "text-orange-600 dark:text-orange-400",
            bgClass: "bg-orange-100 dark:bg-orange-900/40",
            hoverBorder: "hover:border-orange-300 dark:hover:border-orange-800",
            hoverGradient: "from-orange-50/50 dark:from-orange-950/20",
            path: "/automation/track_source_subsource",
        },


    ]

    const filteredCards = settingsCards.filter(
        (card) =>
            card.title.toLowerCase().includes(search.toLowerCase()) ||
            card.description.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-1 flex-col gap-4 px-6 py-4 max-w-[90%] mx-auto w-full">

            <div className="relative max-w-sm mx-auto w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground " />
                <Input
                    placeholder="Search settings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-input/30 dark:bg-input/50"
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-2">
                {filteredCards.map((card, index) => {
                    const Icon = card.icon
                    return (
                        <Card
                            key={index}
                            className={`group relative overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${card.hoverBorder}`}
                            onClick={() => card.path !== "#" && navigate(card.path)}
                        >
                            {/* Subtle background gradient on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.hoverGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <CardHeader className="flex flex-row items-start gap-4 pb-2 z-1 w-full space-y-0">
                                <div className={`p-2.5 rounded-lg transition-colors group-hover:bg-background/80 ${card.bgClass} ${card.colorClass}`}>
                                    <Icon size={24} strokeWidth={2} />
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                                        {card.title}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="z-1 pb-5 pt-2">
                                <CardDescription className="text-sm leading-relaxed">
                                    {card.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    )
                })}
                {filteredCards.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-[40vh] text-center">

                        <div className="bg-muted p-6 rounded-2xl shadow-sm mb-4">
                            <SearchX className="h-10 w-10 text-muted-foreground" />
                        </div>

                        <h3 className="text-lg font-semibold mb-1">
                            No Results Found
                        </h3>

                        <p className="text-sm text-muted-foreground max-w-sm">
                            We couldn't find any matching records. Try adjusting your search
                            criteria or clearing filters.
                        </p>

                    </div>
                )}            </div>
        </div>
    )
}