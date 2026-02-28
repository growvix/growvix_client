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
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreadcrumb } from "@/context/breadcrumb-context";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { DateRange } from 'react-day-picker';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

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

const CustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.booked }}></span> Booked(sales)</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.custom_2 }}></span> custom_2</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.follow }}></span> Follow(pre_sales)</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.incoming }}></span> Incoming(pre_sales)</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.opportunity }}></span> Opportunity(pre_sales)</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.prospect }}></span> Prospect(sales)</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.fresh }}></span> Fresh Leads(sales)(Incoming)</div>
    </div>
);

export default function LeadStageAnalysis() {
    const { setBreadcrumbs } = useBreadcrumb();
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(2026, 1, 1),
        to: new Date(2026, 1, 19),
    });
    const [activeTab, setActiveTab] = React.useState("Team");

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
            <Card className="rounded-none shadow-sm border-0">
                <CardContent className="p-0">
                    {/* Top Header */}
                    <div className="flex items-center justify-between p-3 border-b">
                        <div className="flex items-center gap-2">
                            <div className="p-1 px-2 bg-blue-600 rounded text-white font-bold text-sm">
                                Lead Stage Analysis
                            </div>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </div>

                        <div className="flex items-center gap-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"ghost"}
                                        className={cn(
                                            "justify-start text-left font-normal text-muted-foreground hover:bg-transparent hover:text-foreground p-0 h-auto",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                        {date?.from ? (
                                            date.to ? (
                                                <span className="text-sm">
                                                    {format(date.from, "dd/MM/yyyy HH:mm:ss")} - {format(date.to, "dd/MM/yyyy HH:mm:ss")}
                                                </span>
                                            ) : (
                                                format(date.from, "dd/MM/yyyy HH:mm:ss")
                                            )
                                        ) : (
                                            <span>Pick a date</span>
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
                                    />
                                </PopoverContent>
                            </Popover>

                            <div className="h-6 w-px bg-border"></div>

                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" className="gap-2 h-8 font-normal">
                                        Filters (2) <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Filters</SheetTitle>
                                        <SheetDescription>
                                            Apply filters to analyze lead stages.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-1">
                                            <span className="text-sm font-medium">Status</span>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {/* Add more filters here as needed */}
                                    </div>
                                    <div className="flex flex-col gap-3 mt-4">
                                        <Button>Apply Filters</Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    {/* Secondary Navigation & Toolbar */}
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-white dark:bg-card">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground/50">Owners</span> <Separator />
                            <NavTab name="Team" /> <Separator />
                            <NavTab name="Project" /> <Separator />
                            <NavTab name="Campaign" /> <Separator />
                            <NavTab name="Source" /> <Separator />
                            <NavTab name="Sub Source / Sub Campaign" /> <Separator />
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">Chart Type:</span>
                            <Select defaultValue="bar">
                                <SelectTrigger className="w-[110px] h-7 text-xs">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bar">Bar Chart</SelectItem>
                                    <SelectItem value="pie">Pie Chart</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs font-normal">
                                <RefreshCcw className="h-3 w-3" /> Refresh
                            </Button>
                            <Separator />
                            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs font-normal">
                                <Printer className="h-3 w-3" /> Print
                            </Button>
                            <Separator />
                            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs font-normal">
                                <Download className="h-3 w-3" /> Export
                            </Button>
                        </div>
                    </div>

                    {/* Visualization Content */}
                    <div className="p-6">
                        <CustomLegend />

                        <style>{`
                            @keyframes bar-grow {
                                from { width: 0; }
                            }
                            .animate-bar-grow {
                                animation: bar-grow 1s ease-out forwards;
                            }
                        `}</style>

                        <div className="relative pt-6 max-w-4xl mx-auto">
                            <div className="absolute top-0 right-0 bg-transparent text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
                                Total Leads - 38
                            </div>

                            <div className="space-y-12 mt-10">
                                {sortedData.map((item) => (
                                    <div key={item.name} className="flex flex-col md:flex-row gap-4">
                                        <div className="w-full md:w-64 flex-shrink-0 text-sm">
                                            <div className="font-medium text-gray-700 dark:text-gray-300">{item.name}</div>
                                            <div className="text-muted-foreground text-xs mt-1">
                                                (Total Leads: {Math.ceil(item.totalLeads * (item.conversion / 100))}/{item.totalLeads})
                                            </div>
                                            <div className="text-muted-foreground text-xs">
                                                ({item.conversion}%)
                                            </div>
                                        </div>

                                        <div className="flex-grow h-24 relative border-l border-b border-gray-200 dark:border-gray-700 pl-2">
                                            <div className="w-full h-full flex flex-col justify-end pb-1 gap-2">
                                                {/* Logic to replicate specific stacked/adjacent bar visual */}
                                                {item.stages.incoming > 0 && (
                                                    <div className="relative h-2.5 w-[65%] animate-bar-grow" style={{ backgroundColor: COLORS.incoming }}>
                                                        <span className="absolute left-full ml-2 text-[10px] text-gray-600 whitespace-nowrap -top-1">
                                                            Incoming ({item.stages.incoming}/{Math.ceil(item.totalLeads * (item.conversion / 100))})({item.conversion}%)
                                                        </span>
                                                    </div>
                                                )}
                                                {item.stages.prospect > 0 && (
                                                    <div className="relative h-2.5 w-[100%] animate-bar-grow" style={{ backgroundColor: COLORS.prospect }}>
                                                        <span className="absolute left-full ml-2 text-[10px] text-gray-600 whitespace-nowrap -top-1">
                                                            Prospect (1/1)(100.00%)
                                                        </span>
                                                    </div>
                                                )}
                                                {item.stages.booked > 0 && (
                                                    <div className="relative h-2.5 w-[33%] animate-bar-grow" style={{ backgroundColor: COLORS.booked }}>
                                                        <span className="absolute left-full ml-2 text-[10px] text-gray-600 whitespace-nowrap -top-1">
                                                            booked ({item.stages.booked}/15)(33.33%)
                                                        </span>
                                                    </div>
                                                )}
                                                {item.stages.fresh > 0 && (
                                                    <div className="relative h-2.5 w-[6%] animate-bar-grow" style={{ backgroundColor: COLORS.fresh }}>
                                                        <span className="absolute left-full ml-2 text-[10px] text-gray-600 whitespace-nowrap -top-1">
                                                            Fresh Leads (1/15)(6.67%)
                                                        </span>
                                                    </div>
                                                )}
                                                {/* For the third row specifically to match screenshot where lines are separate */}
                                                {item.name.includes('Tejas') && item.stages.prospect > 0 && (
                                                    <div className="relative h-2.5 w-[33%] animate-bar-grow" style={{ backgroundColor: COLORS.prospect }}>
                                                        <span className="absolute left-full ml-2 text-[10px] text-gray-600 whitespace-nowrap -top-1">
                                                            Prospect (5/15)(33.33%)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}