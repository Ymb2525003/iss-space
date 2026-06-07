import type {
  ActivityEntry,
  AppData,
  MessageThread,
  Notification,
  Order,
  OrderStatus,
  Recommendation,
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
  TeamMemberName,
  UserProfile,
} from "@/types";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Request failed");
  }

  return response.json();
}

export function fetchBootstrap() {
  return request<AppData>("/api/bootstrap");
}

export function loginWithEmail(email: string, password: string) {
  return request<UserProfile>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser(name: TeamMemberName, email: string, password: string) {
  return request<{ ok: boolean }>("/api/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function fetchAvailableNames() {
  return request<{ name: TeamMemberName; taken: boolean }[]>("/api/available-names");
}

export function createTaskRequest(payload: {
  title: string;
  type: TaskType;
  description: string;
  dueDate: string;
  assignedTo: TeamMemberName;
  createdBy: TeamMemberName;
  priority?: TaskPriority;
}) {
  return request<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTaskRequest(taskId: string, payload: {
  status?: TaskStatus;
  commentBody?: string;
  noteBody?: string;
  authorName?: TeamMemberName;
}) {
  return request<Task>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function sendMessageRequest(payload: {
  senderName: TeamMemberName;
  recipientName: TeamMemberName;
  body: string;
}) {
  return request<MessageThread[]>("/api/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createRecommendationRequest(payload: {
  title: string;
  type: TaskType;
  description: string;
  createdBy: TeamMemberName;
}) {
  return request<Recommendation>("/api/recommendations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRecommendationRequest(
  recommendationId: string,
  payload: {
    actorName: TeamMemberName;
    toggleReaction?: boolean;
    commentBody?: string;
    title?: string;
    type?: TaskType;
    description?: string;
  }
) {
  return request<Recommendation>(`/api/recommendations/${recommendationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRecommendationRequest(recommendationId: string) {
  return request<{ ok: boolean }>(`/api/recommendations/${recommendationId}`, {
    method: "DELETE",
  });
}

export function fetchNotifications() {
  return request<Notification[]>("/api/notifications");
}

export function markNotificationsReadRequest() {
  return request<{ ok: boolean }>("/api/notifications", {
    method: "POST",
  });
}

// --- Orders ---

export function fetchOrders() {
  return request<Order[]>("/api/orders");
}

export function createOrderRequest(payload: {
  category: string;
  quantity: number;
  note?: string;
}) {
  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOrderRequest(orderId: string, payload: {
  status?: OrderStatus;
  paid?: boolean;
}) {
  return request<Order>(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteOrderRequest(orderId: string) {
  return request<{ ok: boolean }>(`/api/orders/${orderId}`, {
    method: "DELETE",
  });
}
