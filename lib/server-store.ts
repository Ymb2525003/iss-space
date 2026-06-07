import { promises as fs } from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import type {
  ActivityEntry,
  AppData,
  MemberName,
  MessageThread,
  Notification,
  Recommendation,
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
  TeamMemberName,
} from "@/types";
import { ALL_TEAM_MEMBERS, getUserRole, slugifyName } from "@/types";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "app-data.json");
const COLLECTION_NAME = "team-workspace";

let mongoClientPromise: Promise<MongoClient> | null = null;

function createDefaultData(): AppData {
  return {
    users: ALL_TEAM_MEMBERS.map((name) => ({
      id: `user-${slugifyName(name)}`,
      name,
      role: getUserRole(name),
    })),
    tasks: [],
    messageThreads: [],
    recommendations: [],
    notifications: [],
    activityFeed: [],
  };
}

async function readFileData(): Promise<AppData> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf8");
    return JSON.parse(raw) as AppData;
  } catch {
    const fallback = createDefaultData();
    await writeFileData(fallback);
    return fallback;
  }
}

async function writeFileData(data: AppData) {
  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
}

async function getMongoCollection() {
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
    return client.db(dbName).collection<AppData>(COLLECTION_NAME);
  } catch (error) {
    console.error("MongoDB app store unavailable, using local fallback:", error);
    mongoClientPromise = null;
    return null;
  }
}

export async function getAppData(): Promise<AppData> {
  const collection = await getMongoCollection();

  if (!collection) {
    return readFileData();
  }

  const existing = await collection.findOne({ _id: "workspace" } as never);
  if (existing) {
    const { _id, ...data } = existing as unknown as AppData & { _id: string };
    // Ensure new fields exist for backward compatibility
    if (!data.notifications) data.notifications = [];
    if (!data.activityFeed) data.activityFeed = [];
    return data;
  }

  const initial = await readFileData();
  await collection.updateOne(
    { _id: "workspace" } as never,
    { $set: initial },
    { upsert: true }
  );
  return initial;
}

export async function saveAppData(data: AppData) {
  const collection = await getMongoCollection();

  if (!collection) {
    await writeFileData(data);
    return data;
  }

  await collection.updateOne(
    { _id: "workspace" } as never,
    { $set: data },
    { upsert: true }
  );
  return data;
}

export async function createTask(input: {
  title: string;
  type: TaskType;
  description: string;
  dueDate: string;
  assignedTo: MemberName;
  createdBy: TeamMemberName;
  priority?: TaskPriority;
}) {
  const data = await getAppData();
  const now = new Date().toISOString();

  const task: Task = {
    id: `task-${Date.now()}`,
    title: input.title,
    type: input.type,
    description: input.description,
    status: "todo",
    priority: input.priority || "medium",
    assignedTo: input.assignedTo,
    createdBy: input.createdBy as Task["createdBy"],
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now,
    comments: [],
    memberNotes: [],
  };

  const next = { ...data, tasks: [task, ...data.tasks] };
  await addActivity(next, input.createdBy, "assigned a task", input.title, `/dashboard/tasks`);
  await addNotification(next, input.assignedTo, `New task assigned: ${input.title}`, `/dashboard/tasks`);
  await saveAppData(next);
  return task;
}

export async function updateTask(input: {
  taskId: string;
  status?: TaskStatus;
  commentBody?: string;
  noteBody?: string;
  authorName?: TeamMemberName;
}) {
  const data = await getAppData();
  const now = new Date().toISOString();

  const tasks = data.tasks.map((task) => {
    if (task.id !== input.taskId) {
      return task;
    }

    const nextTask = { ...task, updatedAt: now };
    // Ensure priority exists for old tasks
    if (!nextTask.priority) nextTask.priority = "medium";

    if (input.status) {
      nextTask.status = input.status;
      addActivity(data, input.authorName || task.assignedTo, `changed status to "${input.status}"`, task.title, `/dashboard/tasks`);
      // Notify the task creator when status changes
      if (task.createdBy !== (input.authorName || task.assignedTo)) {
        addNotification(data, task.createdBy, `${task.assignedTo} updated "${task.title}" to ${input.status}`, `/dashboard/tasks`);
      }
    }

    if (input.commentBody && input.authorName) {
      nextTask.comments = [
        ...task.comments,
        {
          id: `task-comment-${Date.now()}`,
          authorName: input.authorName,
          body: input.commentBody,
          createdAt: now,
        },
      ];
      addActivity(data, input.authorName, "commented on", task.title, `/dashboard/tasks`);
      if (task.assignedTo !== input.authorName) {
        addNotification(data, task.assignedTo, `${input.authorName} commented on "${task.title}"`, `/dashboard/tasks`);
      }
    }

    if (input.noteBody) {
      nextTask.memberNotes = [...task.memberNotes, input.noteBody];
    }

    return nextTask;
  });

  const next = { ...data, tasks };
  await saveAppData(next);
  return tasks.find((task) => task.id === input.taskId) ?? null;
}

function sortThreadParticipants(participants: TeamMemberName[]) {
  return [...participants].sort((a, b) => a.localeCompare(b));
}

export async function sendDirectMessage(input: {
  senderName: TeamMemberName;
  recipientName: TeamMemberName;
  body: string;
}) {
  const data = await getAppData();
  const participants = sortThreadParticipants([input.senderName, input.recipientName]);
  const now = new Date().toISOString();

  const newMessage = {
    id: `message-${Date.now()}`,
    senderName: input.senderName,
    recipientName: input.recipientName,
    body: input.body,
    createdAt: now,
  };

  const existingThread = data.messageThreads.find(
    (thread) =>
      thread.participants.length === participants.length &&
      thread.participants.every((name, index) => name === participants[index])
  );

  let messageThreads: MessageThread[];

  if (existingThread) {
    messageThreads = data.messageThreads.map((thread) =>
      thread.id === existingThread.id
        ? {
            ...thread,
            lastMessageAt: now,
            messages: [...thread.messages, newMessage],
          }
        : thread
    );
  } else {
    messageThreads = [
      {
        id: `thread-${Date.now()}`,
        participants,
        lastMessageAt: now,
        messages: [newMessage],
      },
      ...data.messageThreads,
    ];
  }

  const next = {
    ...data,
    messageThreads: [...messageThreads].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    ),
  };
  await saveAppData(next);
  return next.messageThreads;
}

export async function addRecommendation(input: {
  title: string;
  type: TaskType;
  description: string;
  createdBy: TeamMemberName;
}) {
  const data = await getAppData();
  const recommendation: Recommendation = {
    id: `recommendation-${Date.now()}`,
    title: input.title,
    type: input.type,
    description: input.description,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    reactions: [],
    comments: [],
  };

  const next = {
    ...data,
    recommendations: [recommendation, ...data.recommendations],
  };
  await saveAppData(next);
  return recommendation;
}

export async function updateRecommendation(input: {
  recommendationId: string;
  actorName: TeamMemberName;
  toggleReaction?: boolean;
  commentBody?: string;
  title?: string;
  type?: TaskType;
  description?: string;
}) {
  const data = await getAppData();
  const now = new Date().toISOString();

  const recommendations = data.recommendations.map((recommendation) => {
    if (recommendation.id !== input.recommendationId) {
      return recommendation;
    }

    const nextRecommendation = { ...recommendation };

    if (input.title) {
      nextRecommendation.title = input.title;
    }

    if (input.type) {
      nextRecommendation.type = input.type;
    }

    if (input.description) {
      nextRecommendation.description = input.description;
    }

    if (input.toggleReaction) {
      nextRecommendation.reactions = recommendation.reactions.includes(input.actorName)
        ? recommendation.reactions.filter((name) => name !== input.actorName)
        : [...recommendation.reactions, input.actorName];
    }

    if (input.commentBody) {
      nextRecommendation.comments = [
        ...recommendation.comments,
        {
          id: `recommendation-comment-${Date.now()}`,
          authorName: input.actorName,
          body: input.commentBody,
          createdAt: now,
        },
      ];
    }

    return nextRecommendation;
  });

  const next = { ...data, recommendations };
  await saveAppData(next);
  return recommendations.find((item) => item.id === input.recommendationId) ?? null;
}

export async function deleteRecommendation(recommendationId: string): Promise<boolean> {
  const data = await getAppData();
  const before = data.recommendations.length;
  const rec = data.recommendations.find((r) => r.id === recommendationId);
  const recommendations = data.recommendations.filter((r) => r.id !== recommendationId);
  if (recommendations.length === before) return false;
  const next = { ...data, recommendations };
  if (rec) {
    addActivity(next, rec.createdBy, "deleted a recommendation", rec.title);
  }
  await saveAppData(next);
  return true;
}

// --- Notifications ---

function addNotification(data: AppData, recipientName: TeamMemberName, message: string, link?: string) {
  if (!data.notifications) data.notifications = [];
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientName,
    message,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  };
  data.notifications = [notification, ...data.notifications].slice(0, 200);
}

export async function markNotificationsRead(recipientName: TeamMemberName) {
  const data = await getAppData();
  if (!data.notifications) data.notifications = [];
  data.notifications = data.notifications.map((n) =>
    n.recipientName === recipientName ? { ...n, read: true } : n
  );
  await saveAppData(data);
}

export async function getNotificationsForUser(recipientName: TeamMemberName): Promise<Notification[]> {
  const data = await getAppData();
  if (!data.notifications) return [];
  return data.notifications.filter((n) => n.recipientName === recipientName);
}

// --- Activity Feed ---

function addActivity(data: AppData, actorName: TeamMemberName, action: string, targetTitle: string, targetLink?: string) {
  if (!data.activityFeed) data.activityFeed = [];
  const entry: ActivityEntry = {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorName,
    action,
    targetTitle,
    targetLink,
    createdAt: new Date().toISOString(),
  };
  data.activityFeed = [entry, ...data.activityFeed].slice(0, 100);
}
