import {describe, test, expect} from "vitest";
import {client, createClient} from "../client";

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
        });

        test("can signup user John", async () => {
            const res = await client.post("/api/signup", {
                username: "John",
                password: "testpassword",
                inviteCode: "test-invite",
            });

            expect(res.status).toBe(200);
            expect(res.data).toHaveProperty("name", "John");
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
    });
});
