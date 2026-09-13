import { handle } from "hono/vercel";
import app from "../server/boot";

export const config = {
    runtime: "nodejs",
};

export default handle(app);
