import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { UserRoundCog, FileText, CalendarClock, Import } from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-context"

export default function GeneralSetting() {
    const navigate = useNavigate()
    const { setBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        setBreadcrumbs([{ label: "General Settings" }])
    }, [setBreadcrumbs])
    return (
        <div className="flex flex-1 flex-col gap-4 px-3">
            <div className="grid auto-rows-min gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 mx-5 mt-6">
                <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                    <Card className="rounded-xl cardSelect p-1" onClick={() => navigate("/setting/user_management")} >
                        <CardHeader className="pt-2 px-2">
                            <div className="flex items-start justify-between gap-4 w-full">
                                <div className="flex items-center gap-3">

                                    <div>
                                        <CardTitle className="text-md text-foreground">Manage Users</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">
                                            Add users, teams, roles, permissions
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-end pe-3 pb-5">
                            <UserRoundCog strokeWidth={1.9} className="text-blue-600 dark:text-blue-400 mr-2" size={30} />
                        </CardContent>
                    </Card>
                </div>

                <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                    <Card className=" rounded-xl cardSelect p-1">
                        <CardHeader className="pt-2 px-2">
                            <div className="flex items-start justify-between gap-4 w-full">
                                <div className="flex items-center gap-3">

                                    <div>
                                        <CardTitle className="text-md text-foreground">Billing</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">
                                            Manage your invoices & dues
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-end pe-3 pb-5">
                            <FileText strokeWidth={1.9} className="text-red-600 dark:text-red-400 mr-2" size={30} />
                        </CardContent>
                    </Card>
                </div>

                <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                    <Card className=" rounded-xl cardSelect p-1">
                        <CardHeader className="pt-2 px-2">
                            <div className="flex items-start justify-between gap-4 w-full">
                                <div className="flex items-center gap-3">

                                    <div>
                                        <CardTitle className="text-md text-foreground">Attendance</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">
                                            Manage your user attendance
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-end pe-3 pb-5">
                            <CalendarClock strokeWidth={1.9} className="text-amber-600 dark:text-amber-400 mr-2" size={30} />
                        </CardContent>
                    </Card>
                </div>

                <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                    <Card className=" rounded-xl cardSelect p-1">
                        <CardHeader className="pt-2 px-2">
                            <div className="flex items-start justify-between gap-4 w-full">
                                <div className="flex items-center gap-3">

                                    <div>
                                        <CardTitle className="text-md text-foreground">Import</CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground">
                                            Import bulk lead
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-end pe-3 pb-5">
                            <Import strokeWidth={1.9} className="text-green-600 dark:text-green-400 mr-2" size={30} />
                        </CardContent>
                    </Card>
                </div>





            </div>
        </div>
    )
}