/**
 * Check if a tournament is open for registration (within 15 min of start)
 */
export function isTournamentOpenForRegistration(startDate: string | null): { open: boolean; message: string } {
    if (!startDate) return { open: false, message: "No start date set" };

    const now = new Date();
    const start = new Date(startDate);
    const timeDiff = start.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < -60) {
        return { open: false, message: "Tournament has ended" };
    }
    if (minutesDiff < 0) {
        return { open: false, message: "Tournament in progress" };
    }
    if (minutesDiff > 15) {
        const hours = Math.floor(minutesDiff / 60);
        const mins = Math.floor(minutesDiff % 60);
        return {
            open: false,
            message: hours > 0 ? `Opens in ${hours}h ${mins}m` : `Opens in ${mins}m`
        };
    }

    return { open: true, message: `Closes in ${Math.floor(minutesDiff)}m` };
}
