import { useState, useMemo, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useBreadcrumb } from "@/context/breadcrumb-context"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useNavigate } from "react-router-dom"
import { getCookie } from "@/utils/cookies"

import { Label } from "@/components/ui/label"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import {
  PhoneOff,
  Info,
  PhoneCall,
  Activity,
  Clock,
  PhoneForwarded,
  Timer,
  CalendarPlus,
  CalendarDays,
  CalendarCheck,
  Clock9,
  UserPlus,
  ChartCandlestick,
  Users,
  ChartNoAxesCombined,
  PlusCircle,
  DollarSign,
  Briefcase,
  MailPlus,
  UserRoundX,
  MapPinX,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import TeamProductivityTable from "@/components/team_productivity_table"

import { CHART_COLORS } from "@/constants"

export default function UserDashboard() {
  const { setBreadcrumbs } = useBreadcrumb()
  const navigate = useNavigate()

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard" },
      {
        label: (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4.5 w-4.5" />
              </TooltipTrigger>
              <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                <p className="font-medium">Overview & Analytics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    ])
  }, [setBreadcrumbs])

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })

  const chartData = [
    { month: "January", desktop: 18, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 305, mobile: 200 },
    { month: "May", desktop: 237, mobile: 120 },
  ]

  const chartConfig = useMemo(() => ({
    desktop: {
      label: "Desktop",
      color: CHART_COLORS.desktop,
    },
    mobile: {
      label: "Mobile",
      color: CHART_COLORS.mobile,
    },
  } satisfies ChartConfig), [])

  const setPredefinedRange = (range: string) => {
    const today = new Date()
    let from: Date
    from = today
    let to: Date = today

    switch (range) {
      case "today":
        from = today
        break
      case "yesterday":
        from = new Date(today)
        from.setDate(today.getDate() - 1)
        to = from
        break
      case "last7days":
        from = new Date(today)
        from.setDate(today.getDate() - 7)
        break
      case "lastmonth":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case "last6months":
        from = new Date(today)
        from.setMonth(today.getMonth() - 6)
        break
      default:
        return
    }
    setDate({ from, to })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 mx-auto w-full">

      <Card className="py-3 gap-3 shadow-none dark:bg-input/20 border-none">
        <CardContent className="p-0 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-red-100 dark:bg-red-900/40">
                        <PhoneOff className="text-red-600 dark:text-red-400" size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-sm text-foreground">Missed Calls</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Since a few moments ago
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">{(21).toLocaleString('en-US')}</div>
                </CardContent>
              </Card>
            </div>


            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-blue-100 dark:bg-blue-900/40">
                      <PlusCircle className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>

                    <div>
                      <CardTitle className="text-sm text-foreground">New Enquiries</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Since a few moments ago
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">{(5628).toLocaleString('en-US')}</div>
                </CardContent>
              </Card>
            </div>


            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-amber-100 dark:bg-amber-900/40">
                      <MailPlus className="text-amber-600 dark:text-amber-400" size={20} />
                    </div>

                    <div>
                      <CardTitle className="text-sm text-foreground">Unread Emails</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Since a few moments ago
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">{(1375).toLocaleString('en-US')}</div>
                </CardContent>
              </Card>
            </div>


            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-emerald-100 dark:bg-emerald-900/40">
                      <FontAwesomeIcon icon={faWhatsapp} className="text-emerald-600 dark:text-emerald-400" style={{ fontSize: "1.2rem" }} />
                    </div>

                    <div>
                      <CardTitle className="text-sm text-foreground">Unread WhatsApp</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Since a few moments ago
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">12</div>
                </CardContent>
              </Card>
            </div>

            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-purple-100 dark:bg-purple-900/40">
                        <Users className="text-purple-600 dark:text-purple-400" size={20} />
                      </div>

                      <div>
                        <CardTitle className="text-sm text-foreground">No Future Activity</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Since a few moments ago
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">432</div>
                </CardContent>

              </Card>
            </div>

            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-teal-100 dark:bg-teal-900/40">
                      <PlusCircle className="text-teal-600 dark:text-teal-400" size={20} />
                    </div>

                    <div>
                      <CardTitle className="text-sm text-foreground">Re-Engaged Leads</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Since a few moments ago
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">6</div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-3">

            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-orange-100 dark:bg-orange-900/40">
                        <UserRoundX className="text-orange-600 dark:text-orange-400" size={20} />
                      </div>

                      <div>
                        <CardTitle className="text-sm text-foreground">Missed Follow-ups</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Since a few moments ago
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">432</div>
                </CardContent>

              </Card>
            </div>

            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-rose-100 dark:bg-rose-900/40">
                      <MapPinX className="text-rose-600 dark:text-rose-400" size={20} />
                    </div>

                    <div>
                      <CardTitle className="text-sm text-foreground">Missed Site Visits</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Contacts in nurturing stage
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">{(1375).toLocaleString('en-US')}</div>
                </CardContent>
              </Card>

            </div>

            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-slate-100 dark:bg-slate-900/40">
                      <DollarSign className="text-slate-600 dark:text-slate-400" size={20} />
                    </div>

                    <div>
                      <CardTitle className="text-sm text-foreground">Lost Bucket</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Since a few moments ago
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">$1.55M</div>
                </CardContent>
              </Card>
            </div>


            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-sky-100 dark:bg-sky-900/40">
                      <Briefcase className="text-sky-600 dark:text-sky-400" size={20} />
                    </div>

                    <div>
                      <CardTitle className="text-sm text-foreground">Projects</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Active deals & initiatives
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">12</div>
                </CardContent>
              </Card>
            </div>

            <div
              className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => {
                let userId = getCookie('user_id');
                if (!userId || userId === "undefined") userId = "all";

                // Only send today's date if it's supposed to be filtered, otherwise the user can change it
                const today = new Date().toISOString().split('T')[0];
                navigate('/all_leads', {
                  state: {
                    presetFilters: {
                      name: "", company: "", status: "all", source: "",
                      assignedTo: userId,
                      receivedOn: today
                    }
                  }
                });
              }}
            >
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-indigo-100 dark:bg-indigo-900/40">
                        <Users className="text-indigo-600 dark:text-indigo-400" size={20} />
                      </div>

                      <div>
                        <CardTitle className="text-sm text-foreground">Assigned Leads</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Leads to your team
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">+ 432</div>
                </CardContent>

              </Card>
            </div>

            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-lime-100 dark:bg-lime-900/40">
                      <PlusCircle className="text-lime-600 dark:text-lime-400" size={20} />
                    </div>

                    <div>
                      <CardTitle className="text-sm text-foreground">Active Prospects</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Contacts in nurturing stage
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-end pe-3 pb-1">
                  <div className="text-3xl font-semibold text-foreground">+ 6</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none gap-3">
        <CardHeader className="px-3 py-0 flex justify-between">
          <div className="pl-1 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
              <ChartCandlestick size={18} />
            </div>
            <Label htmlFor="stage" className="text-md font-bold text-primary">Lead Overview</Label>
          </div>
          <Tabs defaultValue="today" className="py-0">
            <TabsList className="">
              <TabsTrigger className="p-2" value="today" onClick={() => setPredefinedRange("today")}>Today</TabsTrigger>
              <TabsTrigger className="p-2" value="yesterday" onClick={() => setPredefinedRange("yesterday")}>Yesterday</TabsTrigger>
              <TabsTrigger className="p-2" value="last7days" onClick={() => setPredefinedRange("last7days")}>Last 7 days</TabsTrigger>
              <TabsTrigger className="p-2" value="lastmonth" onClick={() => setPredefinedRange("lastmonth")}>Last month</TabsTrigger>
              <TabsTrigger className="p-2" value="last6months" onClick={() => setPredefinedRange("last6months")}>Last 6 months</TabsTrigger>
              <Popover>
                <PopoverTrigger asChild>
                  <TabsTrigger
                    value="custom"
                    className={cn(
                      "px-5 w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </TabsTrigger>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="flex justify-center">
            <ChartContainer config={chartConfig} className="h-[26rem] w-full px-30">
              <BarChart accessibilityLayer data={chartData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  dataKey="month"
                  type="category"
                  tickLine={true}
                  tickMargin={12}
                  axisLine={true}
                  tickFormatter={(value) => value.slice(0,)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader className="px-3 py-0 flex justify-between">
          <div className="pl-1 pt-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <ChartNoAxesCombined size={18} />
            </div>
            <Label htmlFor="stage" className="text-md font-bold text-primary"> Daily Summary</Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
            {/* Total Calls */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors">
                <PhoneCall className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Total Calls</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Total Talktime */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 mb-3 group-hover:bg-green-200 dark:group-hover:bg-green-800/60 transition-colors">
                <Activity className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Total Talktime</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">min</span>
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">sec</span>
              </div>
            </div>

            {/* Average Call Duration */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mb-3 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/60 transition-colors">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Average Call Duration</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">min</span>
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">sec</span>
              </div>
            </div>

            {/* Average Callback Time */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 mb-3 group-hover:bg-teal-200 dark:group-hover:bg-teal-800/60 transition-colors">
                <PhoneForwarded className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Average Callback Time</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">min</span>
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">sec</span>
              </div>
            </div>

            {/* Time to First Contact */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 mb-3 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800/60 transition-colors">
                <Timer className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Time to First Contact</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">min</span>
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">sec</span>
              </div>
            </div>

            {/* Site Visits Created */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/60 transition-colors">
                <CalendarPlus className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Site Visits Created</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Site Visits Scheduled */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 mb-3 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/60 transition-colors">
                <CalendarDays className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Site Visits Scheduled</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Site Visits Conducted */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-3 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 transition-colors">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Site Visits Conducted</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Followup Schedule */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 mb-3 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/60 transition-colors">
                <Clock9 className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Followup Schedule</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Leads from Pre Sales */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border group">
              <div className="p-2.5 rounded-lg bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 mb-3 group-hover:bg-pink-200 dark:group-hover:bg-pink-800/60 transition-colors">
                <UserPlus className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Leads from Pre Sales</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader className="px-3 py-0 flex justify-between">
          <div className="pl-1 flex items-center gap-2 pt-3">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <Users size={18} />
            </div>
            <Label htmlFor="stage" className="text-md font-bold text-primary">Team Productivity</Label>
          </div>
        </CardHeader>
        <CardContent>
          <TeamProductivityTable />
        </CardContent>
      </Card>

    </div>
  )
}
