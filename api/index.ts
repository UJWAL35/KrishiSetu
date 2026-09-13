import { handle } from "hono/vercel";
import app from "../server/boot";

export const config = {
    runtime: "nodejs",
};

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
