import {describe, test, expect} from "vitest";
import {client, createClient} from "../client";

// Store IDs for stateful tests
const state: {
    milesId: number;
    billId: number;
    johnId: number;
    pokerGameId: number;
    blackjackGameId: number;
    sessionId: number;
    session2Id: number;
    gameSessionId: number;
    gameSession2Id: number;
    gameSession3Id: number;
} = {} as typeof state;

describe("API", () => {
    // =========================================================================
    // UNAUTHENTICATED ACCESS
    // =========================================================================
    describe("Unauthenticated", () => {
        test("cannot access protected routes without auth", async () => {
            const unauthClient = createClient();
            const res = await unauthClient.get("/api/user");

            expect(res.status).toBe(401);
            expect(res.data).toHaveProperty("msg");
        });

        test("cannot access session routes without auth", async () => {
            const unauthClient = createClient();
            const res = await unauthClient.get("/api/session");

            expect(res.status).toBe(401);
        });

        test("cannot access game routes without auth", async () => {
            const unauthClient = createClient();
            const res = await unauthClient.get("/api/game");

            expect(res.status).toBe(401);
        });
    });

    // =========================================================================
    // SIGNUP
    // =========================================================================
    describe("Signup", () => {
        test("cannot signup with empty body", async () => {
            const res = await client.post("/api/signup", {});

            expect(res.status).toBe(400);
        });

        test("cannot signup without invite code", async () => {
            const res = await client.post("/api/signup", {
                username: "testuser",
                password: "testpassword",
            });

            expect(res.status).toBe(400);
        });

        test("cannot signup with invalid invite code", async () => {
            const res = await client.post("/api/signup", {
                username: "testuser",
                password: "testpassword",
                inviteCode: "wrong-code",
            });

            expect(res.status).toBe(403);
        });

        test("cannot signup with short username", async () => {
            const res = await client.post("/api/signup", {
                username: "ab",
                password: "testpassword",
                inviteCode: "test-invite",
            });

            expect(res.status).toBe(400);
        });

        test("cannot signup with short password", async () => {
            const res = await client.post("/api/signup", {
                username: "testuser",
                password: "short",
                inviteCode: "test-invite",
            });

            expect(res.status).toBe(400);
        });

        test("can signup user Miles", async () => {
            const res = await client.post("/api/signup", {
                username: "Miles",
                password: "testpassword",
                inviteCode: "test-invite",
            });

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("id");
            expect(res.data).toHaveProperty("name", "Miles");
            expect(client.hasCookie("test-cookie")).toBe(true);
            state.milesId = res.data.id;
        });

        test("cannot signup with same username (exact case)", async () => {
            const newClient = createClient();
            const res = await newClient.post("/api/signup", {
                username: "Miles",
                password: "testpassword",
                inviteCode: "test-invite",
            });

            expect(res.status).toBe(422);
        });

        test("cannot signup with same username (different case)", async () => {
            const newClient = createClient();
            const res = await newClient.post("/api/signup", {
                username: "mILES",
                password: "testpassword",
                inviteCode: "test-invite",
            });

            expect(res.status).toBe(422);
        });

        test("can signup user Bill", async () => {
            const res = await client.post("/api/signup", {
                username: "Bill",
                password: "testpassword",
                inviteCode: "test-invite",
            });

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("name", "Bill");
            state.billId = res.data.id;
        });

        test("can signup user John", async () => {
            const res = await client.post("/api/signup", {
                username: "John",
                password: "testpassword",
                inviteCode: "test-invite",
            });

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("name", "John");
            state.johnId = res.data.id;
        });
    });

    // =========================================================================
    // LOGIN
    // =========================================================================
    describe("Login", () => {
        test("cannot login with wrong password", async () => {
            const newClient = createClient();
            const res = await newClient.post("/api/login", {
                username: "miles",
                password: "wrongpassword",
            });

            expect(res.status).toBe(404);
        });

        test("cannot login with nonexistent user", async () => {
            const newClient = createClient();
            const res = await newClient.post("/api/login", {
                username: "nonexistent",
                password: "testpassword",
            });

            expect(res.status).toBe(404);
        });

        test("can login as Miles (case insensitive)", async () => {
            client.clearCookies();
            const res = await client.post("/api/login", {
                username: "miles",
                password: "testpassword",
            });

            expect(res.status).toBe(204);
            expect(client.hasCookie("test-cookie")).toBe(true);
        });
    });

    // =========================================================================
    // SIGNOUT
    // =========================================================================
    describe("Signout", () => {
        test("can signout", async () => {
            const res = await client.get("/api/signout");

            expect(res.status).toBe(204);
            expect(client.hasCookie("test-cookie")).toBe(false);
        });

        test("is unauthenticated after signout", async () => {
            const res = await client.get("/api/user");

            expect(res.status).toBe(401);
        });
    });

    // =========================================================================
    // SESSION (logged in as Miles)
    // =========================================================================
    describe("Session", () => {
        test("login as Miles", async () => {
            const res = await client.post("/api/login", {
                username: "Miles",
                password: "testpassword",
            });

            expect(res.status).toBe(204);
        });

        test("can list sessions (empty initially)", async () => {
            const res = await client.get("/api/session");

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("sessions");
            expect(res.data).toHaveProperty("pagination");
            expect(Array.isArray(res.data.sessions)).toBe(true);
            expect(res.data.sessions.length).toBe(0);
        });

        test("returns 404 for non-existent session", async () => {
            const res = await client.get("/api/session/99999");

            expect(res.status).toBe(404);
        });

        test("returns 400 for invalid session ID", async () => {
            const res = await client.get("/api/session/invalid");

            expect(res.status).toBe(400);
        });
    });

    // =========================================================================
    // GAME
    // =========================================================================
    describe("Game", () => {
        test("can list games (empty initially)", async () => {
            const res = await client.get("/api/game");

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("games");
            expect(Array.isArray(res.data.games)).toBe(true);
        });

        test("can create a game", async () => {
            const res = await client.post("/api/game", {name: "Poker"});

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("id");
            expect(res.data).toHaveProperty("name", "Poker");
            state.pokerGameId = res.data.id;
        });

        test("cannot create game with duplicate name", async () => {
            const res = await client.post("/api/game", {name: "Poker"});

            expect(res.status).toBe(422);
        });

        test("game appears in list", async () => {
            const res = await client.get("/api/game");

            expect(res.status).toBe(200);
            expect(res.data.games.length).toBe(1);
            expect(res.data.games[0].name).toBe("Poker");
        });
    });

    // =========================================================================
    // WAGER FLOW - Full session with game rounds
    // Note: Each loser pays (wager / numLosers) to winner
    // Session 1: Poker with Miles, Bill, John (3 players, 2 losers each round)
    // - Round 1: Miles wins @10 → each loser pays 5 → Miles: +10, Bill: -5, John: -5
    // - Round 2: Bill wins @20 → each loser pays 10 → Miles: -10, Bill: +20, John: -10
    // - Round 3: Miles wins @15 → each loser pays 7 → Miles: +14, Bill: -7, John: -7
    // Session 1 Totals: Miles: +14, Bill: +8, John: -22
    // =========================================================================
    describe("Wager Flow - Session 1", () => {
        test("can create a session with participants", async () => {
            const res = await client.post("/api/session", {
                userIds: [state.milesId, state.billId, state.johnId],
            });

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("id");
            expect(res.data).toHaveProperty("users");
            expect(res.data.users.length).toBe(3);
            expect(res.data.ended).toBeNull();
            state.sessionId = res.data.id;
        });

        test("cannot create another session while one is active", async () => {
            const res = await client.post("/api/session", {
                userIds: [state.milesId, state.billId],
            });

            expect(res.status).toBe(422);
        });

        test("session appears in list", async () => {
            const res = await client.get("/api/session");

            expect(res.status).toBe(200);
            expect(res.data.sessions.length).toBe(1);
            expect(res.data.sessions[0].isActive).toBe(true);
        });

        test("can get session details", async () => {
            const res = await client.get(`/api/session/${state.sessionId}`);

            expect(res.status).toBe(200);
            expect(res.data.id).toBe(state.sessionId);
            expect(res.data.users.length).toBe(3);
            expect(res.data.gameSessions.length).toBe(0);
        });

        test("can create a game session (Poker)", async () => {
            const res = await client.post("/api/game-session", {
                sessionId: state.sessionId,
                gameId: state.pokerGameId,
                wager: 10,
            });

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("id");
            expect(res.data.gameName).toBe("Poker");
            expect(res.data.rounds.length).toBe(1);
            expect(res.data.rounds[0].wager).toBe(10);
            expect(res.data.rounds[0].active).toBe(true);
            state.gameSessionId = res.data.id;
        });

        test("cannot create another game session while one is active", async () => {
            const res = await client.post("/api/game-session", {
                sessionId: state.sessionId,
                gameId: state.pokerGameId,
                wager: 10,
            });

            expect(res.status).toBe(422);
        });

        test("Miles wins round 1 @10", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSessionId}/end-round`,
                {winnerId: state.milesId}
            );

            expect(res.status).toBe(200);
            expect(res.data.rounds[0].active).toBe(false);
        });

        test("can start round 2", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSessionId}/new-round`,
                {wager: 20}
            );

            expect(res.status).toBe(200);
            expect(res.data.round).toBe(2);
            expect(res.data.wager).toBe(20);
            expect(res.data.active).toBe(true);
        });

        test("Bill wins round 2 @20", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSessionId}/end-round`,
                {winnerId: state.billId}
            );

            expect(res.status).toBe(200);
            expect(res.data.rounds.length).toBe(2);
        });

        test("can start round 3", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSessionId}/new-round`,
                {wager: 15}
            );

            expect(res.status).toBe(200);
            expect(res.data.round).toBe(3);
        });

        test("Miles wins round 3 @15", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSessionId}/end-round`,
                {winnerId: state.milesId}
            );

            expect(res.status).toBe(200);
        });

        test("can end game session (Poker)", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSessionId}/end`
            );

            expect(res.status).toBe(200);
            expect(res.data.ended).not.toBeNull();
        });

        test("cannot end game session again", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSessionId}/end`
            );

            expect(res.status).toBe(422);
        });

        test("can end session 1", async () => {
            const res = await client.post(
                `/api/session/${state.sessionId}/end`
            );

            expect(res.status).toBe(200);
        });

        test("session 1 is no longer active", async () => {
            const res = await client.get(`/api/session/${state.sessionId}`);

            expect(res.status).toBe(200);
            expect(res.data.ended).not.toBeNull();
        });
    });

    // =========================================================================
    // WAGER FLOW - Session 2 with Blackjack
    // Session 2: Blackjack with Miles, Bill, John (3 players)
    // - Round 1: John wins @25 → each loser pays 12 → John: +24, Miles: -12, Bill: -12
    // - Round 2: John wins @30 → each loser pays 15 → John: +30, Miles: -15, Bill: -15
    // - Round 3: Bill wins @10 → each loser pays 5 → Bill: +10, Miles: -5, John: -5
    // Session 2 Totals: Miles: -32, Bill: -17, John: +49
    //
    // Cumulative after both sessions:
    // - Miles: +14 - 32 = -18
    // - Bill: +8 - 17 = -9
    // - John: -22 + 49 = +27
    // =========================================================================
    describe("Wager Flow - Session 2", () => {
        test("can create Blackjack game", async () => {
            const res = await client.post("/api/game", {name: "Blackjack"});

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("id");
            expect(res.data).toHaveProperty("name", "Blackjack");
            state.blackjackGameId = res.data.id;
        });

        test("can create session 2 with all participants", async () => {
            const res = await client.post("/api/session", {
                userIds: [state.milesId, state.billId, state.johnId],
            });

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("id");
            state.session2Id = res.data.id;
        });

        test("can create Blackjack game session", async () => {
            const res = await client.post("/api/game-session", {
                sessionId: state.session2Id,
                gameId: state.blackjackGameId,
                wager: 25,
            });

            expect(res.status).toBe(200);
            expect(res.data.gameName).toBe("Blackjack");
            state.gameSession2Id = res.data.id;
        });

        test("John wins Blackjack round 1 @25", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSession2Id}/end-round`,
                {winnerId: state.johnId}
            );

            expect(res.status).toBe(200);
        });

        test("start Blackjack round 2", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSession2Id}/new-round`,
                {wager: 30}
            );

            expect(res.status).toBe(200);
            expect(res.data.round).toBe(2);
        });

        test("John wins Blackjack round 2 @30", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSession2Id}/end-round`,
                {winnerId: state.johnId}
            );

            expect(res.status).toBe(200);
        });

        test("start Blackjack round 3", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSession2Id}/new-round`,
                {wager: 10}
            );

            expect(res.status).toBe(200);
            expect(res.data.round).toBe(3);
        });

        test("Bill wins Blackjack round 3 @10", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSession2Id}/end-round`,
                {winnerId: state.billId}
            );

            expect(res.status).toBe(200);
        });

        test("can end Blackjack game session", async () => {
            const res = await client.post(
                `/api/game-session/${state.gameSession2Id}/end`
            );

            expect(res.status).toBe(200);
            expect(res.data.ended).not.toBeNull();
        });

        test("can end session 2", async () => {
            const res = await client.post(
                `/api/session/${state.session2Id}/end`
            );

            expect(res.status).toBe(200);
        });
    });

    // =========================================================================
    // WAGER FLOW - Session 3 with more Poker
    // Session 3: Poker with Miles, Bill, John (3 players)
    // - Round 1: Bill wins @50 → each loser pays 25 → Bill: +50, Miles: -25, John: -25
    // Session 3 Totals: Bill: +50, Miles: -25, John: -25
    //
    // Cumulative after all sessions:
    // - Miles: +14 - 32 - 25 = -43
    // - Bill: +8 - 17 + 50 = +41
    // - John: -22 + 49 - 25 = +2
    //
    // Poker totals: Miles +14-25=-11, Bill +8+50=+58, John -22-25=-47
    // Blackjack totals: Miles -32, Bill -17, John +49
    // =========================================================================
    describe("Wager Flow - Session 3", () => {
        let session3Id: number;
        let pokerGameSession3Id: number;

        test("can create session 3", async () => {
            const res = await client.post("/api/session", {
                userIds: [state.milesId, state.billId, state.johnId],
            });

            expect(res.status).toBe(200);
            session3Id = res.data.id;
        });

        test("can create another Poker game session", async () => {
            const res = await client.post("/api/game-session", {
                sessionId: session3Id,
                gameId: state.pokerGameId,
                wager: 50,
            });

            expect(res.status).toBe(200);
            expect(res.data.gameName).toBe("Poker");
            pokerGameSession3Id = res.data.id;
        });

        test("Bill wins Poker round @50", async () => {
            const res = await client.post(
                `/api/game-session/${pokerGameSession3Id}/end-round`,
                {winnerId: state.billId}
            );

            expect(res.status).toBe(200);
        });

        test("end session 3 Poker game session", async () => {
            const res = await client.post(
                `/api/game-session/${pokerGameSession3Id}/end`
            );
            expect(res.status).toBe(200);
        });

        test("end session 3", async () => {
            const res = await client.post(`/api/session/${session3Id}/end`);
            expect(res.status).toBe(200);
        });
    });

    // =========================================================================
    // STATS - Verify computed statistics
    // =========================================================================
    describe("Stats", () => {
        test("best-games returns correct data", async () => {
            const res = await client.get("/api/stats/best-games");

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("bestGames");
            expect(Array.isArray(res.data.bestGames)).toBe(true);

            const bestGames = res.data.bestGames;

            // Miles: Poker -11, Blackjack -32 → no best game (both negative)
            const miles = bestGames.find(
                (bg: {userName: string}) => bg.userName === "Miles"
            );
            expect(miles).toBeDefined();
            expect(miles.bestGame).toBeNull();

            // Bill: Poker +58, Blackjack -17 → best game is Poker
            const bill = bestGames.find(
                (bg: {userName: string}) => bg.userName === "Bill"
            );
            expect(bill).toBeDefined();
            expect(bill.bestGame).not.toBeNull();
            expect(bill.bestGame.gameName).toBe("Poker");
            expect(bill.bestGame.netWinnings).toBe(58);

            // John: Poker -47, Blackjack +49 → best game is Blackjack
            const john = bestGames.find(
                (bg: {userName: string}) => bg.userName === "John"
            );
            expect(john).toBeDefined();
            expect(john.bestGame).not.toBeNull();
            expect(john.bestGame.gameName).toBe("Blackjack");
            expect(john.bestGame.netWinnings).toBe(49);
        });

        test("game stats returns correct totals", async () => {
            const res = await client.get("/api/stats/games");

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("games");

            const games = res.data.games;

            // Poker: 4 rounds total (3 in session 1, 1 in session 3)
            // Wagers: 10 + 20 + 15 + 50 = 95, avgWager = 24 (rounded)
            const poker = games.find(
                (g: {gameName: string}) => g.gameName === "Poker"
            );
            expect(poker).toBeDefined();
            expect(poker.totalRounds).toBe(4);
            expect(poker.totalWagered).toBe(95);
            expect(poker.avgWager).toBe(24);
            expect(poker.topWinners).toHaveLength(1);
            expect(poker.topWinners[0].userName).toBe("Bill");
            expect(poker.topWinners[0].netWinnings).toBe(58);

            // Blackjack: 3 rounds, wagers: 25 + 30 + 10 = 65, avgWager = 22 (rounded)
            const blackjack = games.find(
                (g: {gameName: string}) => g.gameName === "Blackjack"
            );
            expect(blackjack).toBeDefined();
            expect(blackjack.totalRounds).toBe(3);
            expect(blackjack.totalWagered).toBe(65);
            expect(blackjack.avgWager).toBe(22);
            expect(blackjack.topWinners).toHaveLength(1);
            expect(blackjack.topWinners[0].userName).toBe("John");
            expect(blackjack.topWinners[0].netWinnings).toBe(49);
        });

        test("head-to-head Miles vs Bill returns correct stats", async () => {
            const res = await client.get(
                `/api/stats/head-to-head?player1=${state.milesId}&player2=${state.billId}`
            );

            expect(res.status).toBe(200);
            expect(res.data.player1.name).toBe("Miles");
            expect(res.data.player2.name).toBe("Bill");

            // Miles won rounds: R1@10, R3@15 in session 1 = 2 wins
            // Bill won rounds: R2@20 in session 1, R3@10 in session 2, R1@50 in session 3 = 3 wins
            expect(res.data.player1Wins).toBe(2);
            expect(res.data.player2Wins).toBe(3);

            // Net money between Miles and Bill:
            // Session 1 Poker: Miles +5-10+7 = +2 vs Bill
            // Session 2 Blackjack: Bill gets 5 from Miles in R3 = -5 vs Bill
            // Session 3 Poker: Bill gets 25 from Miles = -25 vs Bill
            // Total: 2 - 5 - 25 = -28 → Bill ahead by 28
            expect(res.data.netAmount).toBe(28);
            expect(res.data.moneyLeader.name).toBe("Bill");
        });

        test("head-to-head Miles vs John returns correct stats", async () => {
            const res = await client.get(
                `/api/stats/head-to-head?player1=${state.milesId}&player2=${state.johnId}`
            );

            expect(res.status).toBe(200);
            expect(res.data.player1.name).toBe("Miles");
            expect(res.data.player2.name).toBe("John");

            // Miles won rounds: R1@10, R3@15 in session 1 = 2 wins
            // John won rounds: R1@25, R2@30 in session 2 = 2 wins
            expect(res.data.player1Wins).toBe(2);
            expect(res.data.player2Wins).toBe(2);

            // Net money between Miles and John:
            // Session 1 Poker: Miles gets 5+7 = +12 from John
            // Session 2 Blackjack: John gets 12+15 = -27 from Miles
            // Session 3 Poker: Both lose to Bill, 0 exchange
            // Total: 12 - 27 = -15 → John ahead by 15
            expect(res.data.netAmount).toBe(15);
            expect(res.data.moneyLeader.name).toBe("John");
        });

        test("head-to-head Bill vs John returns correct stats", async () => {
            const res = await client.get(
                `/api/stats/head-to-head?player1=${state.billId}&player2=${state.johnId}`
            );

            expect(res.status).toBe(200);
            expect(res.data.player1.name).toBe("Bill");
            expect(res.data.player2.name).toBe("John");

            // Bill won rounds: R2@20 in session 1, R3@10 in session 2, R1@50 in session 3 = 3 wins
            // John won rounds: R1@25, R2@30 in session 2 = 2 wins
            expect(res.data.player1Wins).toBe(3);
            expect(res.data.player2Wins).toBe(2);

            // Net money between Bill and John:
            // Session 1 Poker: Bill gets 10 from John = +10 for Bill
            // Session 2 Blackjack: John gets 12+15=27 from Bill, Bill gets 5 from John = -22 for Bill
            // Session 3 Poker: Bill gets 25 from John = +25 for Bill
            // Total: 10 - 22 + 25 = +13 → Bill ahead by 13
            expect(res.data.netAmount).toBe(13);
            expect(res.data.moneyLeader.name).toBe("Bill");
        });

        test("evolution returns data points for each session", async () => {
            const res = await client.get("/api/stats/evolution");

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("evolution");
            expect(Array.isArray(res.data.evolution)).toBe(true);

            // We have 3 completed sessions
            expect(res.data.evolution.length).toBe(3);

            const evolution = res.data.evolution;

            // After session 1: Miles +14, Bill +8, John -22
            expect(evolution[0].balances[state.milesId]).toBe(14);
            expect(evolution[0].balances[state.billId]).toBe(8);
            expect(evolution[0].balances[state.johnId]).toBe(-22);

            // After session 2: Miles -18, Bill -9, John +27
            expect(evolution[1].balances[state.milesId]).toBe(-18);
            expect(evolution[1].balances[state.billId]).toBe(-9);
            expect(evolution[1].balances[state.johnId]).toBe(27);

            // After session 3: Miles -43, Bill +41, John +2
            expect(evolution[2].balances[state.milesId]).toBe(-43);
            expect(evolution[2].balances[state.billId]).toBe(41);
            expect(evolution[2].balances[state.johnId]).toBe(2);
        });
    });
});
