// TODO: Denormalize stats into dedicated tables for better performance at scale

import {db} from "./db";
import {parseResultMap, type ResultMap} from "./result-map";

interface UserBalance {
    oderId: number;
    owes: number; // what they owe
    owed: number; // what they're owed
    net: number; // owed - owes (positive = winning)
}

// Calculate a user's balance from a result map
export function calculateUserBalance(
    resultMap: ResultMap,
    userId: number
): UserBalance {
    const userKey = userId.toString();
    let owes = 0;
    let owed = 0;

    // What this user owes others
    const userOwes = resultMap[userKey] || {};
    for (const amount of Object.values(userOwes)) {
        owes += amount;
    }

    // What others owe this user
    for (const [otherKey, otherOwes] of Object.entries(resultMap)) {
        if (otherKey === userKey) continue;
        owed += otherOwes[userKey] || 0;
    }

    return {
        oderId: userId,
        owes,
        owed,
        net: owed - owes,
    };
}

export interface BestGame {
    gameId: number;
    gameName: string;
    netWinnings: number;
}

export interface UserBestGame {
    oderId: number;
    userName: string;
    bestGame: BestGame | null;
}

// Get best game for each user
export async function computeBestGames(): Promise<UserBestGame[]> {
    const users = await db.user.findMany({
        select: {id: true, name: true},
    });

    const gameSessions = await db.gameSession.findMany({
        where: {ended: {not: null}},
        include: {game: true},
    });

    // Aggregate winnings per user per game
    const userGameWinnings: Record<number, Record<number, {gameName: string; net: number}>> = {};

    for (const user of users) {
        userGameWinnings[user.id] = {};
    }

    for (const gs of gameSessions) {
        const resultMap = parseResultMap(gs.result);

        for (const user of users) {
            if (!(user.id.toString() in resultMap)) continue;

            const balance = calculateUserBalance(resultMap, user.id);

            if (!userGameWinnings[user.id][gs.gameId]) {
                userGameWinnings[user.id][gs.gameId] = {
                    gameName: gs.game.name,
                    net: 0,
                };
            }
            userGameWinnings[user.id][gs.gameId].net += balance.net;
        }
    }

    // Find best game for each user
    const result: UserBestGame[] = [];

    for (const user of users) {
        const games = userGameWinnings[user.id];
        let bestGame: BestGame | null = null;

        for (const [gameIdStr, data] of Object.entries(games)) {
            if (data.net > 0 && (!bestGame || data.net > bestGame.netWinnings)) {
                bestGame = {
                    gameId: parseInt(gameIdStr),
                    gameName: data.gameName,
                    netWinnings: data.net,
                };
            }
        }

        result.push({
            oderId: user.id,
            userName: user.name,
            bestGame,
        });
    }

    return result;
}

export interface TopWinner {
    userId: number;
    userName: string;
    netWinnings: number;
}

export interface GameStats {
    gameId: number;
    gameName: string;
    totalRounds: number;
    totalWagered: number;
    avgWager: number;
    topWinners: TopWinner[];
}

// Get overview stats for all games
export async function computeGameStats(): Promise<GameStats[]> {
    const games = await db.game.findMany();
    const users = await db.user.findMany({
        select: {id: true, name: true},
    });

    const gameSessions = await db.gameSession.findMany({
        where: {ended: {not: null}},
        include: {rounds: true},
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const stats: Record<number, {
        totalRounds: number;
        totalWagered: number;
        userWinnings: Record<number, number>;
    }> = {};

    for (const game of games) {
        stats[game.id] = {
            totalRounds: 0,
            totalWagered: 0,
            userWinnings: {},
        };
    }

    for (const gs of gameSessions) {
        const gameStat = stats[gs.gameId];
        if (!gameStat) continue;

        // Count rounds and wagers
        for (const round of gs.rounds) {
            if (round.active === 0) {
                gameStat.totalRounds++;
                gameStat.totalWagered += round.wager;
            }
        }

        // Calculate user winnings for this game session
        const resultMap = parseResultMap(gs.result);
        for (const user of users) {
            if (!(user.id.toString() in resultMap)) continue;

            const balance = calculateUserBalance(resultMap, user.id);
            gameStat.userWinnings[user.id] =
                (gameStat.userWinnings[user.id] || 0) + balance.net;
        }
    }

    // Build result with top winners
    const result: GameStats[] = [];

    for (const game of games) {
        const gameStat = stats[game.id];

        // Find max net winnings
        let maxNet = 0;
        for (const net of Object.values(gameStat.userWinnings)) {
            if (net > maxNet) maxNet = net;
        }

        // Collect all users with max net winnings (handles ties)
        const topWinners: TopWinner[] = [];
        if (maxNet > 0) {
            for (const [userIdStr, net] of Object.entries(gameStat.userWinnings)) {
                if (net === maxNet) {
                    const userId = parseInt(userIdStr);
                    topWinners.push({
                        userId,
                        userName: userMap.get(userId) || "Unknown",
                        netWinnings: net,
                    });
                }
            }
            // Sort alphabetically by name for consistent display
            topWinners.sort((a, b) => a.userName.localeCompare(b.userName));
        }

        const avgWager = gameStat.totalRounds > 0
            ? Math.round(gameStat.totalWagered / gameStat.totalRounds)
            : 0;

        result.push({
            gameId: game.id,
            gameName: game.name,
            totalRounds: gameStat.totalRounds,
            totalWagered: gameStat.totalWagered,
            avgWager,
            topWinners,
        });
    }

    // Sort by average wager descending
    result.sort((a, b) => b.avgWager - a.avgWager);

    return result;
}

export interface HeadToHeadStats {
    player1: {id: number; name: string};
    player2: {id: number; name: string};
    player1Wins: number;
    player2Wins: number;
    netAmount: number; // absolute amount
    moneyLeader: {id: number; name: string} | null; // who's ahead, null if even
}

// Get head-to-head stats between two players
export async function computeHeadToHead(
    player1Id: number,
    player2Id: number
): Promise<HeadToHeadStats | null> {
    const [player1, player2] = await Promise.all([
        db.user.findUnique({where: {id: player1Id}, select: {id: true, name: true}}),
        db.user.findUnique({where: {id: player2Id}, select: {id: true, name: true}}),
    ]);

    if (!player1 || !player2) return null;

    // Get all completed game sessions where both players participated
    const gameSessions = await db.gameSession.findMany({
        where: {ended: {not: null}},
        include: {rounds: true},
    });

    let player1Wins = 0;
    let player2Wins = 0;
    let player1NetMoney = 0;

    for (const gs of gameSessions) {
        const resultMap = parseResultMap(gs.result);

        // Check if both players are in this session
        if (
            !(player1Id.toString() in resultMap) ||
            !(player2Id.toString() in resultMap)
        ) {
            continue;
        }

        // Count round wins by looking at each round's result
        for (const round of gs.rounds) {
            if (round.active === 1) continue;

            const roundResult = parseResultMap(round.result);
            const p1Balance = calculateUserBalance(roundResult, player1Id);
            const p2Balance = calculateUserBalance(roundResult, player2Id);

            // The player with positive net in this round won
            if (p1Balance.net > 0) player1Wins++;
            if (p2Balance.net > 0) player2Wins++;
        }

        // Calculate net money between them from the session result
        // What player1 owes player2
        const p1OwesP2 = resultMap[player1Id.toString()]?.[player2Id.toString()] || 0;
        // What player2 owes player1
        const p2OwesP1 = resultMap[player2Id.toString()]?.[player1Id.toString()] || 0;

        player1NetMoney += p2OwesP1 - p1OwesP2;
    }

    // Determine who's ahead and by how much
    let moneyLeader: {id: number; name: string} | null = null;
    if (player1NetMoney > 0) {
        moneyLeader = {id: player1.id, name: player1.name};
    } else if (player1NetMoney < 0) {
        moneyLeader = {id: player2.id, name: player2.name};
    }

    return {
        player1: {id: player1.id, name: player1.name},
        player2: {id: player2.id, name: player2.name},
        player1Wins,
        player2Wins,
        netAmount: Math.abs(player1NetMoney),
        moneyLeader,
    };
}

export interface EvolutionDataPoint {
    sessionId: number;
    timestamp: string;
    balances: Record<number, number>; // oderId -> cumulative balance
}

// Get evolution of player balances over time
export async function computeEvolution(): Promise<EvolutionDataPoint[]> {
    const users = await db.user.findMany({select: {id: true}});

    // Get all completed sessions ordered by end time
    const sessions = await db.session.findMany({
        where: {ended: {not: null}},
        orderBy: {ended: "asc"},
        include: {participants: true},
    });

    const cumulativeBalances: Record<number, number> = {};
    for (const user of users) {
        cumulativeBalances[user.id] = 0;
    }

    const dataPoints: EvolutionDataPoint[] = [];

    for (const session of sessions) {
        const resultMap = parseResultMap(session.result);

        // Update balances for participants
        for (const participant of session.participants) {
            const balance = calculateUserBalance(resultMap, participant.userId);
            cumulativeBalances[participant.userId] += balance.net;
        }

        dataPoints.push({
            sessionId: session.id,
            timestamp: session.ended!.toISOString(),
            balances: {...cumulativeBalances},
        });
    }

    return dataPoints;
}
