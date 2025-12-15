"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    color: string;
    link?: string | null;
}

interface CalendarGridProps {
    events: CalendarEvent[];
}

export function CalendarGrid({ events }: CalendarGridProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<"month" | "day" | "year">("month");

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split("T")[0];
        return events.filter(e => e.date?.split("T")[0] === dateStr);
    };

    const goToMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const goToYear = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear() + offset, currentDate.getMonth(), 1));
    };

    const renderMonthView = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="bg-midnight-900/30 rounded-lg p-2 min-h-24" />
            );
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayEvents = getEventsForDate(date);
            const isToday =
                date.toDateString() === new Date().toDateString();

            days.push(
                <div
                    key={day}
                    className={`rounded-lg p-2 min-h-24 ${
                        isToday
                            ? "bg-electric-blue/10 border border-electric-blue/30"
                            : "bg-midnight-800/50 border border-white/5"
                    } hover:border-white/10 transition-all`}
                >
                    <div className={`text-sm font-semibold mb-1 ${isToday ? "text-electric-blue" : "text-gray-300"}`}>
                        {day}
                    </div>
                    <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                            <div
                                key={event.id}
                                className={`text-xs px-2 py-1 rounded truncate ${event.color} text-white`}
                                title={event.title}
                            >
                                {event.title}
                            </div>
                        ))}
                        {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 px-2">
                                +{dayEvents.length - 2} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {days}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const dayEvents = events
            .filter(e => e.date?.split("T")[0] === currentDate.toISOString().split("T")[0])
            .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

        return (
            <div className="space-y-4">
                <div className="text-lg font-semibold text-white mb-6">
                    {monthNames[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
                </div>
                {dayEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No events scheduled for this day</p>
                ) : (
                    <div className="space-y-3">
                        {dayEvents.map(event => (
                            <div
                                key={event.id}
                                className={`p-4 rounded-lg border border-white/10 ${event.color} text-white`}
                            >
                                <div className="font-semibold">{event.title}</div>
                                <div className="text-sm opacity-90 mt-1">
                                    {event.date && new Date(event.date).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderYearView = () => {
        const months = [];
        const year = currentDate.getFullYear();

        for (let m = 0; m < 12; m++) {
            const date = new Date(year, m, 1);
            const daysInMonth = getDaysInMonth(date);
            const firstDay = getFirstDayOfMonth(date);
            const monthEvents = events.filter(e => {
                const eDate = new Date(e.date || "");
                return eDate.getMonth() === m && eDate.getFullYear() === year;
            });

            months.push(
                <div key={m} className="bg-midnight-800/50 border border-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3 text-sm">{monthNames[m]}</h3>
                    <div className="grid grid-cols-7 gap-1">
                        {dayNames.map(day => (
                            <div key={day} className="text-center text-xs text-gray-500">
                                {day.substring(0, 1)}
                            </div>
                        ))}
                        {Array(firstDay).fill(null).map((_, i) => (
                            <div key={`empty-${i}`} className="text-center text-xs" />
                        ))}
                        {Array(daysInMonth).fill(null).map((_, i) => {
                            const day = i + 1;
                            const dayStr = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const dayHasEvents = monthEvents.some(e => e.date?.startsWith(dayStr));
                            return (
                                <div
                                    key={day}
                                    className={`text-center text-xs py-1 rounded ${
                                        dayHasEvents
                                            ? "bg-electric-blue/20 text-electric-blue font-semibold"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return <div className="grid grid-cols-3 gap-4">{months}</div>;
    };

    return (
        <div className="space-y-6">
            {/* Header with Navigation and View Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => goToMonth(-1)}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        title="Previous"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold text-white min-w-48">
                        {viewType === "month" ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` :
                         viewType === "year" ? currentDate.getFullYear() :
                         `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`}
                    </h2>
                    <button
                        onClick={() => viewType === "year" ? goToYear(1) : goToMonth(1)}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        title="Next"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* View Type Toggle */}
                <div className="flex gap-2">
                    {(["month", "day", "year"] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setViewType(type)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                viewType === type
                                    ? "bg-electric-blue text-midnight-900"
                                    : "bg-midnight-800 text-gray-400 hover:text-white hover:bg-midnight-700"
                            }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calendar View */}
            <div className="bg-midnight-800/30 border border-white/5 rounded-xl p-6">
                {viewType === "month" && renderMonthView()}
                {viewType === "day" && renderDayView()}
                {viewType === "year" && renderYearView()}
            </div>
        </div>
    );
}
