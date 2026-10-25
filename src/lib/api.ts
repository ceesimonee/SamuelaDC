import { projectId } from "../../utils/supabase/info";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4be684a3`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export interface Appointment {
  id: string;
  name: string;
  email: string;
  service: string;
  message: string;
  date: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  service: string | null;
  message: string;
  createdAt: string;
}

// ── Appointments ──────────────────────────────────────────────

export const createAppointment = (data: {
  name: string;
  email: string;
  service: string;
  message?: string;
  date?: string;
}) =>
  request<{ success: boolean; appointment: Appointment }>("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getAppointments = () =>
  request<{ appointments: Appointment[] }>("/appointments");

export const getAppointment = (id: string) =>
  request<{ appointment: Appointment }>(`/appointments/${id}`);

export const updateAppointmentStatus = (
  id: string,
  status: Appointment["status"]
) =>
  request<{ success: boolean; appointment: Appointment }>(
    `/appointments/${id}/status`,
    { method: "PUT", body: JSON.stringify({ status }) }
  );

// ── Contact ───────────────────────────────────────────────────

export const sendContactMessage = (data: {
  name: string;
  email: string;
  service?: string;
  message?: string;
}) =>
  request<{ success: boolean; contact: ContactMessage }>("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getContactMessages = () =>
  request<{ contacts: ContactMessage[] }>("/contact");
