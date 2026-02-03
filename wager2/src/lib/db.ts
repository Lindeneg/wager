import {PrismaClient} from "@/generated/prisma";
import {PrismaBetterSqlite3} from "@prisma/adapter-better-sqlite3";

const createPrismaClient = () => {
    const adapter = new PrismaBetterSqlite3({
        url: process.env["DATABASE_URL"]!,
    });

    return new PrismaClient({
        adapter,
    });
};

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}
