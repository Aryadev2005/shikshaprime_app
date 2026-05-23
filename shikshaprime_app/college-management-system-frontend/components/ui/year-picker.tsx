
import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface YearPickerProps {
    value?: string
    onChange: (year: string) => void
    startYear?: number
    endYear?: number
}

export function YearPicker({
    value,
    onChange,
    startYear = 1990,
    endYear = new Date().getFullYear(),
}: YearPickerProps) {
    const years = React.useMemo(() => {
        const years = []
        for (let i = endYear; i >= startYear; i--) {
            years.push(i.toString())
        }
        return years
    }, [startYear, endYear])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? value : "Pick a year"}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto p-0" align="start">
                <ScrollArea className="h-72 w-32 rounded-md border">
                    <div className="p-2">
                        {years.map((year) => (
                            <DropdownMenuItem
                                key={year}
                                onClick={() => onChange(year)}
                                className={cn(
                                    "cursor-pointer justify-center",
                                    value === year && "bg-accent text-accent-foreground"
                                )}
                            >
                                {year}
                            </DropdownMenuItem>
                        ))}
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
