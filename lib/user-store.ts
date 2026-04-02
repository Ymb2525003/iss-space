import { MongoClient } from "mongodb";
import { ALL_TEAM_MEMBERS, type TeamMemberName } from "@/types";

const COLLECTION_NAME = "users";

let mongoClientPromise: Promise<MongoClient> | null = null;

interface RegisteredUser {
  name: TeamMemberName;
  email: string;
  registeredAt: string;
}

async function getUsersCollection() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "Sudan";

  if (!uri) {
    throw new Error("MONGODB_URI is required for user registration");
  }

  if (!mongoClientPromise) {
    mongoClientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 }).connect().catch((err) => {
      mongoClientPromise = null;
      throw err;
    });
  }

  const client = await mongoClientPromise;
  return client.db(dbName).collection<RegisteredUser>(COLLECTION_NAME);
}

/** Get all names that have already been registered. */
export async function getRegisteredNames(): Promise<TeamMemberName[]> {
  const col = await getUsersCollection();
  const users = await col.find({}, { projection: { name: 1, _id: 0 } }).toArray();
  return users.map((u) => u.name);
}

/** Register a new user — claim a team name with an email. */
export async function registerUser(
  name: TeamMemberName,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  if (!ALL_TEAM_MEMBERS.includes(name)) {
    return { ok: false, error: "Invalid team member name." };
  }

  const col = await getUsersCollection();

  // Check if name is already taken
  const existing = await col.findOne({ name });
  if (existing) {
    return { ok: false, error: "This name is already registered." };
  }

  // Check if email is already used
  const emailTaken = await col.findOne({ email: email.toLowerCase().trim() });
  if (emailTaken) {
    return { ok: false, error: "This email is already registered." };
  }

  await col.insertOne({
    name,
    email: email.toLowerCase().trim(),
    registeredAt: new Date().toISOString(),
  });

  return { ok: true };
}

/** Verify that a name is registered (for login). */
export async function isNameRegistered(name: TeamMemberName): Promise<boolean> {
  const col = await getUsersCollection();
  const user = await col.findOne({ name });
  return !!user;
}

/** Find the team member name linked to an email. Returns null if not found. */
export async function findUserByEmail(email: string): Promise<TeamMemberName | null> {
  const col = await getUsersCollection();
  const user = await col.findOne({ email: email.toLowerCase().trim() });
  return user?.name ?? null;
}

/** Find the email linked to a team member name. Returns null if not found. */
export async function findEmailByName(name: TeamMemberName): Promise<string | null> {
  const col = await getUsersCollection();
  const user = await col.findOne({ name });
  return user?.email ?? null;
}
