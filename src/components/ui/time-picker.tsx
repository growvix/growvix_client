import * as React from "react"
import { Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

export function TimePicker({
    time,
    setTime,
}: {
    time: string
    setTime: (time: string) => void
}) {
    return (
        <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-[150px]"
            />
        </div>
    )
}
