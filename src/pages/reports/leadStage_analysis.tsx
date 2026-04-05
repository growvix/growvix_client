import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
    Info,
    Calendar as CalendarIcon,
    ChevronDown,
    RefreshCcw,
    Printer,
    Download,
    Filter,
    Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreadcrumb } from "@/context/breadcrumb-context";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { DateRange } from 'react-day-picker';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"

// Mock Data for Team (Existing)
const teamData = [
    {
        name: 'Rohil Pune Sales',
        totalLeads: 38,
        conversion: 52.63,
        stages: {
            booked: 0,
            custom_2: 0,
            follow: 0,
            incoming: 13,
            opportunity: 0,
            prospect: 0,
            fresh: 0
        }
    },
    {
        name: 'Sachin Patil',
        totalLeads: 38,
        conversion: 2.63,
        stages: {
            booked: 0,
            custom_2: 0,
            follow: 0,
            incoming: 0,
            opportunity: 0,
            prospect: 1,
            fresh: 0
        }
    },
    {
        name: 'Tejas Sales',
        totalLeads: 38,
        conversion: 39.47,
        stages: {
            booked: 5,
            custom_2: 0,
            follow: 0,
            incoming: 0,
            opportunity: 0,
            prospect: 5,
            fresh: 1
        }
    }
];

// Mock Data for Project (Different for demo)
const projectData = [
    {
        name: 'Project Alpha',
        totalLeads: 120,
        conversion: 15.5,
        stages: {
            booked: 10,
            custom_2: 5,
            follow: 20,
            incoming: 50,
            opportunity: 15,
            prospect: 15,
            fresh: 5
        }
    },
    {
        name: 'Project Beta',
        totalLeads: 80,
        conversion: 65.2,
        stages: {
            booked: 40,
            custom_2: 5,
            follow: 10,
            incoming: 10,
            opportunity: 5,
            prospect: 10,
            fresh: 0
        }
    },
    {
        name: 'Project Gamma',
        totalLeads: 45,
        conversion: 45.0,
        stages: {
            booked: 15,
            custom_2: 0,
            follow: 5,
            incoming: 10,
            opportunity: 5,
            prospect: 5,
            fresh: 5
        }
    }
];

const COLORS = {
    booked: '#82ca9d',
    custom_2: '#5bf7dc',
    follow: '#5cdbd3',
    incoming: '#795548',
    opportunity: '#8b5cf6',
    prospect: '#f59e0b',
    fresh: '#000000'
};

const chartConfig = {
    booked: { label: "Booked(sales)", color: COLORS.booked },
    custom_2: { label: "custom_2", color: COLORS.custom_2 },
    follow: { label: "Follow(pre_sales)", color: COLORS.follow },
    incoming: { label: "Incoming(pre_sales)", color: COLORS.incoming },
    opportunity: { label: "Opportunity(pre_sales)", color: COLORS.opportunity },
    prospect: { label: "Prospect(sales)", color: COLORS.prospect },
    fresh: { label: "Fresh Leads(sales)(Incoming)", color: COLORS.fresh }
} satisfies ChartConfig

const CustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-4 mb-4 text-xs">
        {Object.entries(chartConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: (COLORS as any)[key] }}></span> 
                {config.label}
            </div>
        ))}
    </div>
);

export default function LeadStageAnalysis() {
    const { setBreadcrumbs } = useBreadcrumb();
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(2026, 1, 1),
        to: new Date(2026, 1, 19),
    });
    const [activeTab, setActiveTab] = React.useState("Team");
    const [chartType, setChartType] = React.useState("bar");
    const [isApplied, setIsApplied] = React.useState(false);

    React.useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "#" },
            { label: "Lead Stage Analysis" },
            {
                label: (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4.5 w-4.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white border border-slate-200 shadow-md dark:bg-white dark:text-slate-900 dark:border-slate-800">
                                <p className="font-medium">Stage Analytics</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        ]);
    }, [setBreadcrumbs]);

    const handleApply = () => {
        setIsApplied(true);
    };

    const handleReset = () => {
        setIsApplied(false);
        setDate({
            from: new Date(2026, 1, 1),
            to: new Date(2026, 1, 19),
        });
    }

    // Select data based on active tab
    const currentData = activeTab === "Project" ? projectData : teamData;

    // ALways sort low to high on conversion
    const sortedData = React.useMemo(() => {
        return [...currentData].sort((a, b) => a.conversion - b.conversion);
    }, [currentData]);

    const NavTab = ({ name }: { name: string }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={cn(
                "hover:text-primary transition-colors",
                activeTab === name ? "text-black font-semibold dark:text-white" : "text-muted-foreground"
            )}
        >
            {name}
        </button>
    );

    const Separator = () => <span className="text-muted-foreground/30">|</span>;

    return (
        <div className="p-4 bg-gray-50/50 min-h-screen dark:bg-background">
            <Card className="rounded-none shadow-sm border-0 bg-transparent">
                <CardContent className="p-0 flex flex-col gap-6">
                    
                    {/* Filter Card */}
                    <Card className="rounded-xl border shadow-sm p-4 bg-white dark:bg-card">
                        <div className="flex items-center justify-between border-b pb-4 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 px-3 bg-blue-600 rounded-lg text-white font-extrabold text-xs uppercase tracking-wider italic">
                                    Lead Stage Analysis
                                </div>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "justify-start text-left font-normal border-none bg-muted/30 h-10",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                            {date?.from ? (
                                                date.to ? (
                                                    <span className="text-xs">
                                                        {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                                                    </span>
                                                ) : (
                                                    format(date.from, "dd/MM/yyyy")
                                                )
                                            ) : (
                                                <span className="text-xs">Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
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

                                <div className="h-6 w-px bg-border"></div>

                                <Button variant="outline" className="h-10 border-none bg-muted/30 gap-2 text-xs">
                                    <Filter className="h-3 w-3" /> Filters (2)
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <span>Owners:</span>
                                <div className="flex items-center gap-3">
                                    <NavTab name="Team" /> <Separator />
                                    <NavTab name="Project" /> <Separator />
                                    <NavTab name="Campaign" /> <Separator />
                                    <NavTab name="Source" /> 
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isApplied && (
                                    <Button variant="ghost" onClick={handleReset} className="h-10 text-xs gap-2 hover:bg-destructive/10 hover:text-destructive">
                                        <RefreshCcw className="h-3 w-3" /> Reset
                                    </Button>
                                )}
                                <Button onClick={handleApply} className="h-10 px-8 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 gap-2">
                                    <Play className="h-4 w-4 fill-current" /> Apply Filters
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {isApplied ? (
                        <Card className="rounded-xl border shadow-xl bg-white dark:bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/5">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-xs font-bold uppercase text-muted-foreground">Chart Type:</span>
                                    <Select value={chartType} onValueChange={setChartType}>
                                        <SelectTrigger className="w-[120px] h-9 text-xs border-none bg-muted/20">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bar">Bar Chart</SelectItem>
                                            <SelectItem value="pie">Pie Chart</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-9 gap-2 border-none bg-muted/20 text-xs">
                                        <Printer className="h-3 w-3" /> Print
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9 gap-2 border-none bg-muted/20 text-xs">
                                        <Download className="h-3 w-3" /> Export
                                    </Button>
                                </div>
                            </div>

                            {/* Visualization Content */}
                            <div className="p-8">
                                <CustomLegend />

                                <div className="h-[500px] w-full mt-8">
                                    <ChartContainer config={chartConfig} className="h-full">
                                        {chartType === "bar" ? (
                                            <BarChart
                                                data={sortedData.map(item => ({
                                                    name: item.name,
                                                    ...item.stages
                                                }))}
                                                layout="vertical"
                                                margin={{ top: 20, right: 120, left: 40, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                                                <XAxis type="number" hide />
                                                <YAxis 
                                                    type="category" 
                                                    dataKey="name" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 12, fontWeight: 'bold' }} 
                                                    width={150}
                                                />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="incoming" stackId="a" fill={COLORS.incoming} barSize={30} />
                                                <Bar dataKey="prospect" stackId="a" fill={COLORS.prospect} />
                                                <Bar dataKey="booked" stackId="a" fill={COLORS.booked} />
                                                <Bar dataKey="fresh" stackId="a" fill={COLORS.fresh} />
                                                <Bar dataKey="follow" stackId="a" fill={COLORS.follow} />
                                                <Bar dataKey="opportunity" stackId="a" fill={COLORS.opportunity} />
                                            </BarChart>
                                        ) : (
                                            <PieChart>
                                                <Pie
                                                    data={Object.keys(COLORS).map(key => ({
                                                        name: key,
                                                        value: currentData.reduce((acc, curr: any) => acc + (curr.stages[key] || 0), 0)
                                                    })).filter(d => d.value > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={140}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${chartConfig[name as keyof typeof chartConfig].label} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {Object.keys(COLORS).map((key, index) => (
                                                        <Cell key={`cell-${index}`} fill={(COLORS as any)[key]} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                            </PieChart>
                                        )}
                                    </ChartContainer>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-24 border-2 border-dashed rounded-3xl bg-muted/5 border-muted-foreground/10 group hover:border-primary/20 hover:bg-primary/5 transition-all duration-500 cursor-default">
                            <div className="p-6 rounded-full bg-muted/20 text-muted-foreground/40 mb-6 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-700">
                                <Filter className="w-16 h-16" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground/80 mb-2 group-hover:text-primary transition-colors text-left items-start text-left items-start">Awaiting Filter Parameters</h3>
                            <p className="text-muted-foreground text-sm max-w-sm text-center leading-relaxed font-medium italic opacity-80 group-hover:opacity-100">
                                Please define your criteria above to generate the stage analysis.
                                Data will appear here instantly once filters are applied.
                            </p>
                            <div className="mt-8 flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '200ms' }} />
                                <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '400ms' }} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}