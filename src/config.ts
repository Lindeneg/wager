import dotenv from "dotenv";
import path from "path";

if (process.env["__WAGER_MODE"] === "test") {
    dotenv.config({
        path: path.join(process.cwd(), ".env.test"),
        override: true,
    });
}

type Config = {
    DATABASE_URL: string;
    PORT: number;
    JWT_SECRET: string;
    JWT_COOKIE: string;
    INVITE_CODE: string;
    HASH_COST: number;
    COOKIE_MAX_AGE: number;

    isProduction(): boolean;
    isDev(): boolean;
    isTest(): boolean;
};

type Transform<T> = (prop: keyof Config, value: string) => T;

function required(prop: keyof Config): string {
    const val = process.env[prop];
    if (!val) {
        throw new Error("Environmental variable " + prop + " is not set.");
    }
    return val;
}

function optional<TTransform extends Transform<any>>(
    prop: keyof Config,
    transform: TTransform,
    fallback: ReturnType<TTransform>
): ReturnType<TTransform> {
    const val = process.env[prop];
    if (!val) return fallback;
    return transform(prop, val);
}

function int(prop: keyof Config, value: string): number {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) {
        throw new Error(
            "Environmental variable " + prop + " cannot be parsed as a number."
        );
    }
    return n;
}

const config: Config = {
    DATABASE_URL: required("DATABASE_URL"),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_COOKIE: required("JWT_COOKIE"),
    INVITE_CODE: required("INVITE_CODE"),

    PORT: optional("PORT", int, 3000),
    HASH_COST: optional("HASH_COST", int, 10),
    COOKIE_MAX_AGE: optional("COOKIE_MAX_AGE", int, 7 * 24 * 60 * 60),

    isProduction() {
        return process.env.NODE_ENV === "production";
    },

    isDev() {
        return process.env.NODE_ENV === "development";
    },

    isTest() {
        return process.env.NODE_ENV === "test";
    },
};

export default config;
