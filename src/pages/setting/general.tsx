import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { UserRoundCog, FileText, CalendarClock, Import, UsersRound } from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-context"

export default function GeneralSetting() {
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        setBreadcrumbs([{ label: "General Settings" }])
    }, [setBreadcrumbs])

    // Configuration for settings cards to keep code DRY and clean
    const settingsCards = [
        {
            title: "Manage Users",
            description: "Add users, update roles, and manage system permissions.",
            icon: UserRoundCog,
            colorClass: "text-blue-600 dark:text-blue-400",
            bgClass: "bg-blue-100 dark:bg-blue-900/40",
            hoverBorder: "hover:border-blue-300 dark:hover:border-blue-800",
            hoverGradient: "from-blue-50/50 dark:from-blue-950/20",
            path: "/setting/user_management",
        },
        {
            title: "Manage Teams",
            description: "Create new teams and manage team assignments.",
            icon: UsersRound,
            colorClass: "text-purple-600 dark:text-purple-400",
            bgClass: "bg-purple-100 dark:bg-purple-900/40",
            hoverBorder: "hover:border-purple-300 dark:hover:border-purple-800",
            hoverGradient: "from-purple-50/50 dark:from-purple-950/20",
            path: "/setting/teams",
        },
        {
            title: "Billing",
            description: "Manage your invoices, payment methods, and dues.",
            icon: FileText,
            colorClass: "text-rose-600 dark:text-rose-400",
            bgClass: "bg-rose-100 dark:bg-rose-900/40",
            hoverBorder: "hover:border-rose-300 dark:hover:border-rose-800",
            hoverGradient: "from-rose-50/50 dark:from-rose-950/20",
            path: "#", // Placeholder
        },
        {
            title: "Attendance",
            description: "Review and manage user attendance records.",
            icon: CalendarClock,
            colorClass: "text-amber-600 dark:text-amber-400",
            bgClass: "bg-amber-100 dark:bg-amber-900/40",
            hoverBorder: "hover:border-amber-300 dark:hover:border-amber-800",
            hoverGradient: "from-amber-50/50 dark:from-amber-950/20",
            path: "#", // Placeholder
        },
        {
            title: "Import Data",
            description: "Bulk import leads and other data into the system.",
            icon: Import,
            colorClass: "text-emerald-600 dark:text-emerald-400",
            bgClass: "bg-emerald-100 dark:bg-emerald-900/40",
            hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-800",
            hoverGradient: "from-emerald-50/50 dark:from-emerald-950/20",
            path: "#", // Placeholder
        },
    ]

    return (
        <div className="flex flex-1 flex-col gap-6 px-6 py-6 max-w-[90%] mx-auto w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings Workspace</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Manage your preferences, user access, and system configurations.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-2">
                {settingsCards.map((card, index) => {
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
            </div>
        </div>
    )
}