import "dotenv/config";

function required(name: string): string {
    const value = process.env[name];
    if (!value && process.env.NODE_ENV === "production") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value ?? "";
}

function optional(name: string, fallback = ""): string {
    return process.env[name] ?? fallback;
}

export const env = {
    appId: required("APP_ID"),
    appSecret: required("APP_SECRET"),
    isProduction: process.env.NODE_ENV === "production",
    databaseUrl: required("DATABASE_URL"),
    kimiAuthUrl: optional("KIMI_AUTH_URL", "https://auth.kimi.com"),
    kimiOpenUrl: optional("KIMI_OPEN_URL", "https://open.kimi.com"),
    ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
