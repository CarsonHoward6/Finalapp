"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, Users, FileText, Loader2, Plus } from "lucide-react";
import { createCalendarEvent } from "@/app/actions/calendar";

interface CreateEventModalProps {
    teams?: Array<{ id: string; name: string }>;
    onEventCreated?: () => void;
}

const EVENT_TYPES = [
    { value: "personal", label: "Personal", color: "bg-blue-500" },
    { value: "team_practice", label: "Team Practice", color: "bg-green-500" },
    { value: "tournament", label: "Tournament", color: "bg-electric-blue" },
    { value: "match", label: "Match", color: "bg-red-500" },
    { value: "meeting", label: "Meeting", color: "bg-purple-500" },
    { value: "other", label: "Other", color: "bg-gray-500" }
];

export function CreateEventModal({ teams = [], onEventCreated }: CreateEventModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventType, setEventType] = useState("personal");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [location, setLocation] = useState("");
    const [teamId, setTeamId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("eventType", eventType);
            formData.append("startDate", startDate);
            formData.append("endDate", endDate);
            formData.append("allDay", allDay.toString());
            formData.append("location", location);
            if (teamId) formData.append("teamId", teamId);

            await createCalendarEvent(formData);

            // Reset form
            setTitle("");
            setDescription("");
            setEventType("personal");
            setStartDate("");
            setEndDate("");
            setAllDay(false);
            setLocation("");
            setTeamId("");
            setIsOpen(false);
            onEventCreated?.();
        } catch (err: any) {
            setError(err.message || "Failed to create event");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-600 hover:to-electric-blue text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
                <Plus className="w-5 h-5" />
                Add Event
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-midnight-800 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-white/5">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <Calendar className="w-6 h-6 text-electric-blue" />
                                        Create Event
                                    </h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Event Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                                            placeholder="Team practice session"
                                        />
                                    </div>

                                    {/* Event Type */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Event Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {EVENT_TYPES.map((type) => (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setEventType(type.value)}
                                                    className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                                                        eventType === type.value
                                                            ? "border-electric-blue bg-electric-blue/10 text-white"
                                                            : "border-white/10 bg-midnight-900/30 text-gray-400 hover:border-white/20"
                                                    }`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full ${type.color} mb-1 mx-auto`} />
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Description
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all resize-none"
                                            placeholder="Add details about the event..."
                                        />
                                    </div>

                                    {/* Date/Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                Start {allDay ? "Date" : "Date & Time"}
                                            </label>
                                            <input
                                                type={allDay ? "date" : "datetime-local"}
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                required
                                                className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all [color-scheme:dark]"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-400">End {allDay ? "Date" : "Date & Time"}</label>
                                            <input
                                                type={allDay ? "date" : "datetime-local"}
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    {/* All Day Toggle */}
                                    <label className="flex items-center gap-3 p-3 bg-midnight-900/30 rounded-lg cursor-pointer hover:bg-midnight-900/50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={allDay}
                                            onChange={(e) => setAllDay(e.target.checked)}
                                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                                        />
                                        <span className="text-gray-300">All-day event</span>
                                    </label>

                                    {/* Location */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Location (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                                            placeholder="Game Arena, Online, etc."
                                        />
                                    </div>

                                    {/* Team Selection */}
                                    {teams.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Associate with Team (Optional)
                                            </label>
                                            <select
                                                value={teamId}
                                                onChange={(e) => setTeamId(e.target.value)}
                                                className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                                            >
                                                <option value="">No team</option>
                                                {teams.map((team) => (
                                                    <option key={team.id} value={team.id}>
                                                        {team.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="flex-1 py-3 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white font-semibold rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !title || !startDate}
                                            className="flex-1 py-3 bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-600 hover:to-electric-blue text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Calendar className="w-5 h-5" />
                                                    Create Event
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
