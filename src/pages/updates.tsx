import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Cpu,
    Bot,
    BarChart3,
    Glasses,
    Box,
    RefreshCw,
    CalendarClock,
    UserPlus,
    HeartHandshake,
    Search,
    SearchX,
    Info,
    Sparkles
} from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

export default function UpdatesPage() {
    const { setBreadcrumbs } = useBreadcrumb()
    const [search, setSearch] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Updates" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Experience the future of Growvix CRM</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    const updateCards = [
        {
            title: "AI Project Management",
            description: "Transform your project workflows with intelligent task prioritization and automated scheduling.",
            icon: Cpu,
            colorClass: "text-blue-600 dark:text-blue-400",
            bgClass: "bg-blue-100 dark:bg-blue-900/40",
            hoverBorder: "hover:border-blue-300 dark:hover:border-blue-800",
            hoverGradient: "from-blue-50/50 dark:from-blue-950/20",
        },
        {
            title: "AI Bot",
            description: "24/7 intelligent assistant for lead engagement and instant query resolution.",
            icon: Bot,
            colorClass: "text-purple-600 dark:text-purple-400",
            bgClass: "bg-purple-100 dark:bg-purple-900/40",
            hoverBorder: "hover:border-purple-300 dark:hover:border-purple-800",
            hoverGradient: "from-purple-50/50 dark:from-purple-950/20",
        },
        {
            title: "AI Report Management",
            description: "Get deep insights with automated data analysis and predictive performance reporting.",
            icon: BarChart3,
            colorClass: "text-emerald-600 dark:text-emerald-400",
            bgClass: "bg-emerald-100 dark:bg-emerald-900/40",
            hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-800",
            hoverGradient: "from-emerald-50/50 dark:from-emerald-950/20",
        },
        {
            title: "VR Project Management",
            description: "Immersive virtual reality tools for remote project monitoring and team collaboration.",
            icon: Glasses,
            colorClass: "text-rose-600 dark:text-rose-400",
            bgClass: "bg-rose-100 dark:bg-rose-900/40",
            hoverBorder: "hover:border-rose-300 dark:hover:border-rose-800",
            hoverGradient: "from-rose-50/50 dark:from-rose-950/20",
        },
        {
            title: "3D Walkthrough Showcase",
            description: "Stun your clients with high-fidelity, interactive 3D virtual tours of your properties.",
            icon: Box,
            colorClass: "text-orange-600 dark:text-orange-400",
            bgClass: "bg-orange-100 dark:bg-orange-900/40",
            hoverBorder: "hover:border-orange-300 dark:hover:border-orange-800",
            hoverGradient: "from-orange-50/50 dark:from-orange-950/20",
        },
        {
            title: "Project 360",
            description: "A comprehensive 360-degree view of project lifecycles, from planning to delivery.",
            icon: RefreshCw,
            colorClass: "text-indigo-600 dark:text-indigo-400",
            bgClass: "bg-indigo-100 dark:bg-indigo-900/40",
            hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-800",
            hoverGradient: "from-indigo-50/50 dark:from-indigo-950/20",
        },
        {
            title: "Advanced Dynamic Calendar",
            description: "Intelligently managed schedules with automated follow-up reminders.",
            icon: CalendarClock,
            colorClass: "text-amber-600 dark:text-amber-400",
            bgClass: "bg-amber-100 dark:bg-amber-900/40",
            hoverBorder: "hover:border-amber-300 dark:hover:border-amber-800",
            hoverGradient: "from-amber-50/50 dark:from-amber-950/20",
        },
        {
            title: "Growvix HRM",
            description: "Seamless human resource management tailored for real estate professionals.",
            icon: UserPlus,
            colorClass: "text-teal-600 dark:text-teal-400",
            bgClass: "bg-teal-100 dark:bg-teal-900/40",
            hoverBorder: "hover:border-teal-300 dark:hover:border-teal-800",
            hoverGradient: "from-teal-50/50 dark:from-teal-950/20",
        },
        {
            title: "Post Sales",
            description: "Dedicated tools for managing client relationships after the deal is closed.",
            icon: HeartHandshake,
            colorClass: "text-pink-600 dark:text-pink-400",
            bgClass: "bg-pink-100 dark:bg-pink-900/40",
            hoverBorder: "hover:border-pink-300 dark:hover:border-pink-800",
            hoverGradient: "from-pink-50/50 dark:from-pink-950/20",
        },
    ]

    const filteredCards = updateCards.filter(
        (card) =>
            card.title.toLowerCase().includes(search.toLowerCase()) ||
            card.description.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-1 flex-col gap-4 px-6 py-4 max-w-[90%] mx-auto w-full">
            <div className="flex flex-col gap-4 mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                    <h1 className="text-3xl font-bold tracking-tight">Platform Updates</h1>
                </div>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Stay ahead with the latest AI-driven innovations and advanced management tools designed to elevate your real estate business.
                </p>
            </div>

            <div className="relative max-w-sm mx-auto w-full mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground " />
                <Input
                    placeholder="Search updates..."
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
                            className={`group relative overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-2 border-2 border-transparent ${card.hoverBorder}`}
                        >
                            {/* Subtle background gradient on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.hoverGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <CardHeader className="flex flex-row items-start gap-4 pb-4 z-1 w-full space-y-0">
                                <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-background/80 ${card.bgClass} ${card.colorClass}`}>
                                    <Icon size={28} strokeWidth={2} />
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                        {card.title}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="z-1 pb-6 pt-2">
                                <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {card.description}
                                </CardDescription>
                                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                    Learn More <Sparkles size={12} className="ml-1" />
                                </div>
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
                            No matching updates
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Try searching for something else or browse all platform features.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
