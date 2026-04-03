import { useEffect } from "react";
import { useBreadcrumb } from "@/context/breadcrumb-context";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function SubSourceLevelReport() {
    const { setBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        setBreadcrumbs([
            { label: "Reports", href: "/reports_template" },
            { label: "Sub Source Level Report" },
        ]);
    }, [setBreadcrumbs]);

    return (
        <div className="flex items-center justify-center min-h-[70vh] w-full p-4">
            <Card className="w-full max-w-md text-center border-dashed shadow-none bg-background/50">
                <CardContent className="pt-10 pb-10 flex flex-col items-center gap-6">
                    <div className="p-4 bg-muted/50 rounded-full ring-1 ring-border">
                        <Construction className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Coming Soon</h2>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                            The Sub Source Level Report is currently under development. Stay tuned!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
