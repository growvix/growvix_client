import { useState, useMemo, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useBreadcrumb } from "@/context/breadcrumb-context"

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

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }])
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
    <div className="flex flex-1 flex-col gap-2 px-3">
      <Card className="py-3 gap-3 shadow-none dark:bg-input/20 border-none">
        <CardContent className="p-0 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-red-50 dark:bg-red-900/20">
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-blue-50 dark:bg-blue-900/20">
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-yellow-50 dark:bg-yellow-900/20">
                      <MailPlus className="text-yellow-600 dark:text-yellow-400" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-green-50 dark:bg-green-900/20">
                      <FontAwesomeIcon icon={faWhatsapp} className="text-green-600 dark:text-green-400" style={{ fontSize: "1.2rem" }} />
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
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-purple-50 dark:bg-purple-900/20">
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-indigo-50 dark:bg-indigo-900/20">
                      <PlusCircle className="text-indigo-600 dark:text-indigo-400" size={20} />
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
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-pink-50 dark:bg-pink-900/20">
                        <UserRoundX className="text-pink-600 dark:text-pink-400" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-orange-50 dark:bg-orange-900/20">
                      <MapPinX className="text-orange-600 dark:text-orange-400" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-teal-50 dark:bg-teal-900/20">
                      <DollarSign className="text-teal-600 dark:text-teal-400" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-cyan-50 dark:bg-cyan-900/20">
                      <Briefcase className="text-cyan-600 dark:text-cyan-400" size={20} />
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

            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
              <Card className=" rounded-xl cardSelect p-1">
                <CardHeader className="pt-2 px-2">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center rounded-lg p-2 bg-lime-50 dark:bg-lime-900/20">
                        <Users className="text-lime-600 dark:text-lime-400" size={20} />
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
                    <div className="inline-flex items-center justify-center rounded-lg p-2 bg-rose-50 dark:bg-rose-900/20">
                      <PlusCircle className="text-rose-600 dark:text-rose-400" size={20} />
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
            <Label htmlFor="stage" className="text-md font-bold text-primary"><ChartCandlestick className="inline-block mr-1" />Lead Overview</Label>
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
            <Label htmlFor="stage" className="text-md font-bold text-primary"><ChartNoAxesCombined className="inline-block mr-1" /> Daily Summary</Label>
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
              <Users className="inline-block mr-1" /> Team Productivity</Label>
          </div>
        </CardHeader>
        <CardContent>
          <TeamProductivityTable />
        </CardContent>
      </Card>

    </div>
  )
}
