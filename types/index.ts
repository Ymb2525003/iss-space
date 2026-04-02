export const LEADERS = ["Yaseen", "Azza", "Ahmed"] as const;

export const MEMBERS = [
  "Malaz",
  "Abdallah",
  "Ababaker",
  "Ali",
  "Jbo",
  "Salah",
  "Abdelrahman",
  "Elbadawie",
] as const;

export const ALL_TEAM_MEMBERS = [...LEADERS, ...MEMBERS] as const;

export type TeamMemberName = (typeof ALL_TEAM_MEMBERS)[number];
export type LeaderName = (typeof LEADERS)[number];
export type MemberName = (typeof MEMBERS)[number];
export type UserRole = "admin" | "leader" | "member";
export type TaskType = "poster" | "workshop" | "video";
export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "high" | "medium" | "low";

export interface UserProfile {
  id: string;
  name: TeamMemberName;
  role: UserRole;
  canAssignTasks: boolean;
  createdAt: string;
}

export interface TeamUser {
  id: string;
  name: TeamMemberName;
  role: UserRole;
}

export interface TaskComment {
  id: string;
  authorName: TeamMemberName;
  body: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: MemberName;
  createdBy: LeaderName;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  memberNotes: string[];
}

export interface DirectMessageItem {
  id: string;
  senderName: TeamMemberName;
  recipientName: TeamMemberName;
  body: string;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  participants: TeamMemberName[];
  lastMessageAt: string;
  messages: DirectMessageItem[];
}

export interface RecommendationComment {
  id: string;
  authorName: TeamMemberName;
  body: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  type: TaskType;
  description: string;
  createdBy: TeamMemberName;
  createdAt: string;
  reactions: TeamMemberName[];
  comments: RecommendationComment[];
}

export interface Notification {
  id: string;
  recipientName: TeamMemberName;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  actorName: TeamMemberName;
  action: string;
  targetTitle: string;
  targetLink?: string;
  createdAt: string;
}

export interface AppData {
  users: TeamUser[];
  tasks: Task[];
  messageThreads: MessageThread[];
  recommendations: Recommendation[];
  notifications: Notification[];
  activityFeed: ActivityEntry[];
}

export function slugifyName(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function getUserRole(name: TeamMemberName): UserRole {
  if (name === "Yaseen") return "admin";
  if (LEADERS.includes(name as LeaderName)) return "leader";
  return "member";
}

export function canAssignTasks(name: TeamMemberName) {
  return name === "Yaseen";
}

export function isLeaderRole(role: UserRole) {
  return role === "admin" || role === "leader";
}

export function getUserProfile(name: TeamMemberName): UserProfile {
  return {
    id: `user-${slugifyName(name)}`,
    name,
    role: getUserRole(name),
    canAssignTasks: canAssignTasks(name),
    createdAt: new Date().toISOString(),
  };
}
