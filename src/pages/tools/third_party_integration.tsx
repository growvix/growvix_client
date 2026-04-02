import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Search,
    ArrowLeft,
    Globe,
    Facebook,
    MessageCircle,
    Plug2,
    Info,
    ExternalLink,
    ChevronRight,
} from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

export default function ThirdPartyIntegration() {
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()
    const [search, setSearch] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "General Settings", href: "/settings" },
            { label: "Third-Party Integration" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Integrations</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    const integrationCards = [
        {
            title: "Google Workspace",
            description: "Sync your Google Contacts, Calendar, and Drive with the CRM.",
            icon: Globe,
            colorClass: "text-blue-600 dark:text-blue-400",
            bgClass: "bg-blue-100 dark:bg-blue-900/40",
            hoverBorder: "hover:border-blue-300 dark:hover:border-blue-800",
            hoverGradient: "from-blue-50/50 dark:from-blue-950/20",
        },
        {
            title: "Meta (Facebook/Instagram)",
            description: "Import leads directly from Facebook Lead Ads and Instagram.",
            icon: Facebook,
            colorClass: "text-indigo-600 dark:text-indigo-400",
            bgClass: "bg-indigo-100 dark:bg-indigo-900/40",
            hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-800",
            hoverGradient: "from-indigo-50/50 dark:from-indigo-950/20",
        },
        {
            title: "WhatsApp",
            description: "Enable two-way communication and automated messages.",
            icon: MessageCircle,
            colorClass: "text-green-600 dark:text-green-400",
            bgClass: "bg-green-100 dark:bg-green-900/40",
            hoverBorder: "hover:border-green-300 dark:hover:border-green-800",
            hoverGradient: "from-green-50/50 dark:from-green-950/20",
        },
    ]

    const filteredCards = integrationCards.filter(
        (card) =>
            card.title.toLowerCase().includes(search.toLowerCase()) ||
            card.description.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-1 flex-col gap-4 px-6 py-4 max-w-[90%] mx-auto w-full">
            <div className="relative max-w-sm mx-auto w-full mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground " />
                <Input
                    placeholder="Search integrations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-input/30 dark:bg-input/50"
                />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-2">
                {filteredCards.map((card, index) => {
                    const Icon = card.icon
                    return (
                        <Card
                            key={index}
                            className={`group relative overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${card.hoverBorder}`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.hoverGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <CardHeader className="flex flex-row items-center gap-4 pb-2 z-1 w-full space-y-0">
                                <div className={`p-4 rounded-xl transition-all duration-300 group-hover:scale-110 ${card.bgClass} ${card.colorClass}`}>
                                    <Icon size={32} strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <CardTitle className="text-lg group-hover:text-primary transition-colors font-bold">
                                        {card.title}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="z-1 pb-6 pt-4 flex-1 flex flex-col justify-between gap-6 ">
                                <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                                    {card.description}
                                </CardDescription>
                                <Button 
                                    className="w-full h-11 font-bold gap-2 rounded-xl bg-slate-950 text-white hover:bg-slate-800 transition-all shadow-md group/btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (card.title === "Google Workspace") {
                                            navigate("/tools/third_party_integration/google_ads");
                                        }
                                    }}
                                >
                                    Manage Integration
                                    <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
                {filteredCards.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-[40vh] text-center">
                        <div className="bg-muted p-6 rounded-2xl shadow-sm mb-4">
                            <Plug2 className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">
                            No Integrations Found
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Try adjusting your search criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
