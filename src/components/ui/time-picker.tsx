import * as React from "react"
import { Clock } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function TimePicker({
    time,
    setTime,
}: {
    time: string
    setTime: (time: string) => void
}) {
    // time format is expected to be "HH:mm" in 24h
    const [hour12, setHour12] = React.useState("12")
    const [minute, setMinute] = React.useState("00")
    const [ampm, setAmpm] = React.useState("AM")

    React.useEffect(() => {
        if (time) {
            const [h, m] = time.split(":")
            let hourNum = parseInt(h, 10)
            if (hourNum >= 12) {
                setAmpm("PM")
                if (hourNum > 12) hourNum -= 12
            } else {
                setAmpm("AM")
                if (hourNum === 0) hourNum = 12
            }
            setHour12(hourNum.toString().padStart(2, "0"))
            setMinute(m)
        }
    }, [time])

    const updateTime = (h12: string, m: string, ap: string) => {
        let h24 = parseInt(h12, 10)
        if (ap === "PM" && h24 < 12) h24 += 12
        if (ap === "AM" && h24 === 12) h24 = 0
        setTime(`${h24.toString().padStart(2, "0")}:${m}`)
    }

    return (
        <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground mr-1" />
            <Select
                value={hour12}
                onValueChange={(v) => {
                    setHour12(v)
                    updateTime(v, minute, ampm)
                }}
            >
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                        const val = h.toString().padStart(2, "0")
                        return (
                            <SelectItem key={val} value={val}>
                                {val}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select
                value={minute}
                onValueChange={(v) => {
                    setMinute(v)
                    updateTime(hour12, v, ampm)
                }}
            >
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                    {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
                        (m) => (
                            <SelectItem key={m} value={m}>
                                {m}
                            </SelectItem>
                        )
                    )}
                </SelectContent>
            </Select>
            <Select
                value={ampm}
                onValueChange={(v) => {
                    setAmpm(v)
                    updateTime(hour12, minute, v)
                }}
            >
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
