import { createAuthClient } from "better-auth/react";

// Same-origin: requests go to /api/auth/* and Next proxies them to Express.
export const authClient = createAuthClient();
