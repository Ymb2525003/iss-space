import { promises as fs } from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { ALL_TEAM_MEMBERS, type TeamMemberName } from "@/types";

const COLLECTION_NAME = "users";
const FALLBACK_FILE = path.join(process.cwd(), "data", "registered-users.json");

let mongoClientPromise: Promise<MongoClient> | null = null;

interface RegisteredUser {
  name: TeamMemberName;
  email: string;
  registeredAt: string;
}

async function readFallbackUsers(): Promise<RegisteredUser[]> {
  try {
    const raw = await fs.readFile(FALLBACK_FILE, "utf8");
    return JSON.parse(raw) as RegisteredUser[];
  } catch {
    return [];
  }
}

async function writeFallbackUsers(users: RegisteredUser[]) {
  await fs.mkdir(path.dirname(FALLBACK_FILE), { recursive: true });
  await fs.writeFile(FALLBACK_FILE, JSON.stringify(users, null, 2), "utf8");
}

async function getUsersCollection() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "Sudan";

  if (!uri) {
    return null;
  }

  if (!mongoClientPromise) {
    mongoClientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 }).connect().catch((err) => {
      mongoClientPromise = null;
      throw err;
    });
  }

  try {
    const client = await mongoClientPromise;
    return client.db(dbName).collection<RegisteredUser>(COLLECTION_NAME);
  } catch (error) {
    console.error("MongoDB user store unavailable, using local fallback:", error);
    mongoClientPromise = null;
    return null;
  }
}

/** Get all names that have already been registered. */
export async function getRegisteredNames(): Promise<TeamMemberName[]> {
  const col = await getUsersCollection();
  if (!col) {
    const users = await readFallbackUsers();
    return users.map((u) => u.name);
  }

  const users = await col.find({}, { projection: { name: 1, _id: 0 } }).toArray();
  return users.map((u) => u.name);
}

/** Register a new user and claim a team name with an email. */
export async function registerUser(
  name: TeamMemberName,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  if (!ALL_TEAM_MEMBERS.includes(name)) {
    return { ok: false, error: "Invalid team member name." };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const col = await getUsersCollection();

  if (!col) {
    const users = await readFallbackUsers();
    if (users.some((user) => user.name === name)) {
      return { ok: false, error: "This name is already registered." };
    }
    if (users.some((user) => user.email === normalizedEmail)) {
      return { ok: false, error: "This email is already registered." };
    }

    users.push({
      name,
      email: normalizedEmail,
      registeredAt: new Date().toISOString(),
    });
    await writeFallbackUsers(users);
    return { ok: true };
  }

  const existing = await col.findOne({ name });
  if (existing) {
    return { ok: false, error: "This name is already registered." };
  }

  const emailTaken = await col.findOne({ email: normalizedEmail });
  if (emailTaken) {
    return { ok: false, error: "This email is already registered." };
  }

  await col.insertOne({
    name,
    email: normalizedEmail,
    registeredAt: new Date().toISOString(),
  });

  return { ok: true };
}

/** Find the team member name linked to an email. */
export async function findUserByEmail(email: string): Promise<TeamMemberName | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const col = await getUsersCollection();

  if (!col) {
    const users = await readFallbackUsers();
    return users.find((user) => user.email === normalizedEmail)?.name ?? null;
  }

  const user = await col.findOne({ email: normalizedEmail });
  return user?.name ?? null;
}

/** Find the email linked to a team member name. */
export async function findEmailByName(name: TeamMemberName): Promise<string | null> {
  const col = await getUsersCollection();

  if (!col) {
    const users = await readFallbackUsers();
    return users.find((user) => user.name === name)?.email ?? null;
  }

  const user = await col.findOne({ name });
  return user?.email ?? null;
}
