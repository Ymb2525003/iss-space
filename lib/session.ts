import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { type TeamMemberName, type UserProfile, getUserProfile, ALL_TEAM_MEMBERS } from "@/types";

const COOKIE_NAME = "iss-session";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

/**
 * Create a signed JWT containing only the team member name.
 * Role and permissions are always derived server-side from the name.
 */
async function signToken(name: TeamMemberName): Promise<string> {
  return new SignJWT({ name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

/**
 * Verify a JWT and return the team member name, or null if invalid.
 */
async function verifyToken(token: string): Promise<TeamMemberName | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const name = payload.name as string;
    if (ALL_TEAM_MEMBERS.includes(name as TeamMemberName)) {
      return name as TeamMemberName;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Set the session cookie after login.
 */
export async function createSession(name: TeamMemberName) {
  const token = await signToken(name);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear the session cookie on logout.
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Read and verify the session cookie.
 * Returns the full UserProfile (with role derived server-side) or null.
 */
export async function getSession(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const name = await verifyToken(token);
  if (!name) return null;

  return getUserProfile(name);
}
