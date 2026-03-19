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
  ChartCandlestick,
  Users,
  ChartNoAxesCombined,
  PlusCircle,
  DollarSign,
  Briefcase,
  MailPlus,
  UserRoundX,
  MapPinX,
  PhoneOff,
  Info,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
        <Select value="/executive_dashboard" onValueChange={(val) => navigate(val)}>
          <SelectTrigger className="w-[220px] bg-background">
            <SelectValue placeholder="Select Dashboard View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="/executive_dashboard">Executive View</SelectItem>
            <SelectItem value="/master_dashboard">Master View</SelectItem>
            <SelectItem value="/management_dashboard">Management View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="py-3 gap-3 shadow-none dark:bg-input/20 border-none">
        <CardContent className="p-0 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                        <PhoneOff className="text-red-500" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                      <PlusCircle className="text-blue-500" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                      <MailPlus className="text-amber-500" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                      <FontAwesomeIcon icon={faWhatsapp} className="text-emerald-500" style={{ fontSize: "1.2rem" }} />
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
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                        <Users className="text-purple-500" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                      <PlusCircle className="text-teal-500" size={20} />
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
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                        <UserRoundX className="text-orange-500" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                      <MapPinX className="text-rose-500" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                      <DollarSign className="text-slate-500" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                      <Briefcase className="text-sky-500" size={20} />
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
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                        <Users className="text-indigo-500" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-muted/50 dark:bg-muted">
                      <PlusCircle className="text-lime-500" size={20} />
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
          <div className="pl-1">
            <Label htmlFor="stage" className="text-md font-bold text-primary"><ChartCandlestick className="inline-block mr-1 text-orange-500" />Lead Overview</Label>
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
          <div className="pl-1">
            <Label htmlFor="stage" className="text-md font-bold text-primary"><ChartNoAxesCombined className="inline-block mr-1 text-emerald-500" /> Daily Summary</Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
            {/* Total Calls */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Total Calls</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Total Talktime */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Total Talktime</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">min</span>
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">sec</span>
              </div>
            </div>

            {/* Average Call Duration */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Average Call Duration</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">min</span>
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">sec</span>
              </div>
            </div>

            {/* Average Callback Time */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Average Callback Time</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">min</span>
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">sec</span>
              </div>
            </div>

            {/* Time to First Contact */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Time to First Contact</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">min</span>
                <span className="text-5xl font-bold text-foreground">0</span>
                <span className="text-xl text-muted-foreground">sec</span>
              </div>
            </div>

            {/* Site Visits Created */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Site Visits Created</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Site Visits Scheduled */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Site Visits Scheduled</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Site Visits Conducted */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Site Visits Conducted</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Followup Schedule */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Followup Schedule</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>

            {/* Leads from Pre Sales */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Leads from Pre Sales</p>
              <p className="text-5xl font-bold text-foreground">0</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader className="px-3 py-0 flex justify-between">
          <div className="pl-1">
            <Label htmlFor="stage" className="text-md font-bold text-primary">
              <Users className="inline-block mr-1 text-purple-500" /> Team Productivity</Label>
          </div>
        </CardHeader>
        <CardContent>
          <TeamProductivityTable />
        </CardContent>
      </Card>

    </div>
  )
}
