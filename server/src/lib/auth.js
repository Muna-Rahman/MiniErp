import "dotenv/config";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";


const normalizeUrl = (v) => {
  if (!v) return undefined;
  let url = v.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(url)) url = `${process.env.VERCEL ? "https" : "http"}://${url}`;
  return url;
};

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
export const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: normalizeUrl(process.env.BETTER_AUTH_URL),
  trustedOrigins: [normalizeUrl(process.env.CLIENT_URL)].filter(Boolean),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
});