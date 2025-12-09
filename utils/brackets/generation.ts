export type Participant = {
    id: string;
    seed: number;
};

export type BracketMatch = {
    round: number;
    matchNum: number;
    tempId: string;
    nextMatchTempId: string | null;
    bracketType?: "winners" | "losers" | "grand";
};

/**
 * Generate Single Elimination Matches
 */
export function generateSingleElimination(participants: Participant[]): BracketMatch[] {
    const count = participants.length;
    let size = 2;
    while (size < count) size *= 2;

    const totalRounds = Math.log2(size);
    const rounds: BracketMatch[][] = [];

    let numMatchesInRound = size / 2;
    for (let r = 1; r <= totalRounds; r++) {
        const roundMatches: BracketMatch[] = [];
        for (let m = 0; m < numMatchesInRound; m++) {
            roundMatches.push({
                round: r,
                matchNum: m + 1,
                tempId: `W-${r}-${m + 1}`,
                nextMatchTempId: r < totalRounds ? `W-${r + 1}-${Math.floor(m / 2) + 1}` : null,
                bracketType: "winners"
            });
        }
        rounds.push(roundMatches);
        numMatchesInRound /= 2;
    }

    return rounds.flat();
}

/**
 * Generate Double Elimination Matches
 * Winners Bracket + Losers Bracket + Grand Final
 */
export function generateDoubleElimination(participants: Participant[]): BracketMatch[] {
    const count = participants.length;
    let size = 2;
    while (size < count) size *= 2;

    const winnersRounds = Math.log2(size);
    const losersRounds = (winnersRounds - 1) * 2; // Losers takes more rounds

    const matches: BracketMatch[] = [];

    // Winners Bracket
    let numMatchesInRound = size / 2;
    for (let r = 1; r <= winnersRounds; r++) {
        for (let m = 0; m < numMatchesInRound; m++) {
            matches.push({
                round: r,
                matchNum: m + 1,
                tempId: `W-${r}-${m + 1}`,
                nextMatchTempId: r < winnersRounds ? `W-${r + 1}-${Math.floor(m / 2) + 1}` : `GF-1`,
                bracketType: "winners"
            });
        }
        numMatchesInRound /= 2;
    }

    // Losers Bracket (simplified structure)
    numMatchesInRound = size / 4;
    for (let lr = 1; lr <= losersRounds && numMatchesInRound >= 1; lr++) {
        for (let m = 0; m < numMatchesInRound; m++) {
            matches.push({
                round: lr,
                matchNum: m + 1,
                tempId: `L-${lr}-${m + 1}`,
                nextMatchTempId: lr < losersRounds ? `L-${lr + 1}-${Math.floor(m / 2) + 1}` : `GF-1`,
                bracketType: "losers"
            });
        }
        // Every other losers round halves the matches
        if (lr % 2 === 0) numMatchesInRound /= 2;
    }

    // Grand Final
    matches.push({
        round: 1,
        matchNum: 1,
        tempId: `GF-1`,
        nextMatchTempId: null,
        bracketType: "grand"
    });

    return matches;
}

/**
 * Generate Round Robin Matches
 * Every participant plays every other participant once.
 */
export function generateRoundRobin(participants: Participant[]): BracketMatch[] {
    const matches: BracketMatch[] = [];
    const n = participants.length;
    let matchCounter = 1;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            matches.push({
                round: 1, // Round Robin is typically one "phase"
                matchNum: matchCounter,
                tempId: `RR-${matchCounter}`,
                nextMatchTempId: null, // No advancement in round robin
                bracketType: "winners" // Treat as main bracket
            });
            matchCounter++;
        }
    }

    return matches;
}

/**
 * Generate Swiss Format Matches (Basic MVP)
 * In Swiss, pairings are made each round based on standings.
 * For MVP, we just generate placeholder rounds.
 */
export function generateSwiss(participants: Participant[], numRounds: number = 5): BracketMatch[] {
    const matches: BracketMatch[] = [];
    const matchesPerRound = Math.floor(participants.length / 2);

    for (let r = 1; r <= numRounds; r++) {
        for (let m = 1; m <= matchesPerRound; m++) {
            matches.push({
                round: r,
                matchNum: m,
                tempId: `SW-${r}-${m}`,
                nextMatchTempId: null, // Swiss has no direct advancement
                bracketType: "winners"
            });
        }
    }

    return matches;
}
