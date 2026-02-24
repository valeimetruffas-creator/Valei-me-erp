import { createLogger, format, transports } from "winston";
import { isProduction } from "./env.js";

export const logger = createLogger({
  level: isProduction() ? "info" : "debug",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  defaultMeta: { service: "valei-me-backend" },
  transports: [new transports.Console()],
});
