import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Megaphone, Globe, GitBranch, Building2, Search, SearchX, ArrowRight, BarChart3 } from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

export default function ReportsTemplate() {
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()
    const [search, setSearch] = useState("")

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5 text-primary/60 cursor-help transition-colors hover:text-primary" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover text-popover-foreground border-border shadow-xl">
                                <p className="font-medium text-xs">Explore all available reporting modules</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ])
    }, [setBreadcrumbs])

    const reportCards = [
        {
            title: "Campaign Level Report",
            description: "Deep dive into campaign performance with source and project-level granularity.",
            icon: Megaphone,
            colorClass: "text-blue-600 dark:text-blue-400",
            bgClass: "bg-blue-100/50 dark:bg-blue-900/30",
            hoverBorder: "hover:border-blue-400/50 dark:hover:border-blue-700/50",
            hoverGradient: "group-hover:from-blue-500/10 dark:group-hover:from-blue-500/5",
            accentColor: "blue",
            path: "/reports/campaign_level_report",
        },
        {
            title: "Source Level Report",
            description: "Analyze lead distribution and efficiency across various digital and offline sources.",
            icon: Globe,
            colorClass: "text-emerald-600 dark:text-emerald-400",
            bgClass: "bg-emerald-100/50 dark:bg-emerald-900/30",
            hoverBorder: "hover:border-emerald-400/50 dark:hover:border-emerald-700/50",
            hoverGradient: "group-hover:from-emerald-500/10 dark:group-hover:from-emerald-500/5",
            accentColor: "emerald",
            path: "/reports/source_level_report",
        },
        {
            title: "Sub Source Level Report",
            description: "Drill down into sub-source performance for precise attribution and ROI tracking.",
            icon: GitBranch,
            colorClass: "text-purple-600 dark:text-purple-400",
            bgClass: "bg-purple-100/50 dark:bg-purple-900/30",
            hoverBorder: "hover:border-purple-400/50 dark:hover:border-purple-700/50",
            hoverGradient: "group-hover:from-purple-500/10 dark:group-hover:from-purple-500/5",
            accentColor: "purple",
            path: "/reports/sub_source_level_report",
        },
        {
            title: "Project Level Report",
            description: "Track sales velocity, site visits, and booking performance across all projects.",
            icon: Building2,
            colorClass: "text-orange-600 dark:text-orange-400",
            bgClass: "bg-orange-100/50 dark:bg-orange-900/30",
            hoverBorder: "hover:border-orange-400/50 dark:hover:border-orange-700/50",
            hoverGradient: "group-hover:from-orange-500/10 dark:group-hover:from-orange-500/5",
            accentColor: "orange",
            path: "/reports/project_level_report",
        },
    ]

    const filteredCards = reportCards.filter(
        (card) =>
            card.title.toLowerCase().includes(search.toLowerCase()) ||
            card.description.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="relative flex flex-1 flex-col gap-8 px-6 py-8 max-w-[95%] mx-auto w-full overflow-hidden min-h-[90vh]">

            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] -z-10" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 z-10">
                <div className="space-y-1.5">
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <BarChart3 className="h-9 w-9 text-primary animate-pulse" />
                        Reports Portal
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg italic opacity-80">
                        Harness data-driven insights to optimize your sales funnel.
                    </p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search report modules..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 z-10">
                {filteredCards.map((card, index) => {
                    const Icon = card.icon
                    return (
                        <Card
                            key={index}
                            className={`group relative overflow-hidden flex flex-col cursor-pointer border-muted-foreground/10 bg-background/40 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-${card.accentColor}-500/10 hover:-translate-y-2 ${card.hoverBorder} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                            style={{ "--delay": `${index * 100}ms` } as React.CSSProperties}
                            onClick={() => navigate(card.path)}
                        >
                            {/* Animated background gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.hoverGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                            <CardHeader className="flex flex-col items-start gap-4 pb-4 z-10">
                                <div className={`p-4 rounded-2xl ring-1 ring-inset ring-foreground/5 shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${card.bgClass} ${card.colorClass}`}>
                                    <Icon size={28} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1.5 pt-2">
                                    <CardTitle className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">
                                        {card.title}
                                    </CardTitle>
                                    <CardDescription className="text-sm font-medium leading-relaxed opacity-70">
                                        {card.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent className="mt-auto pt-4 pb-6 flex items-center justify-between z-10">
                                <div className="h-px flex-1 bg-muted-foreground/10 mr-4" />
                                <div className={`flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest ${card.colorClass} opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-500`}>
                                    View Report
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                            </CardContent>

                            {/* Corner Accent */}
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-${card.accentColor}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                        </Card>
                    )
                })}

                {filteredCards.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-20 text-center animate-in zoom-in-95 duration-500">
                        <div className="bg-muted/30 p-10 rounded-[3rem] shadow-inner mb-6 ring-2 ring-muted-foreground/5">
                            <SearchX className="h-16 w-16 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight mb-2 italic">
                            No Matching Reports
                        </h3>
                        <p className="text-muted-foreground font-medium max-w-xs leading-relaxed opacity-80">
                            We couldn't find any report matching your search query. Try different terms.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
