
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function GeneralReports() {
    return (
        <div className="flex items-center justify-center min-h-[80vh] w-full p-4">
            <Card className="w-full max-w-md text-center border-dashed shadow-none bg-background/50">
                <CardContent className="pt-10 pb-10 flex flex-col items-center gap-6">
                    <div className="p-4 bg-muted/50 rounded-full ring-1 ring-border">
                        <Construction className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Coming Soon</h2>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                            This page is currently under construction. We're working hard to bring you these reports!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
