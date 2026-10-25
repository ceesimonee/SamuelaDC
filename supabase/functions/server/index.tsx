import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const BASE = "/make-server-4be684a3";

// Health check
app.get(`${BASE}/health`, (c) => c.json({ status: "ok" }));

// ── Appointments ──────────────────────────────────────────────

// POST /appointments — save a new appointment request
app.post(`${BASE}/appointments`, async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, service, message, date } = body;

    if (!name || !email || !service) {
      return c.json({ error: "name, email, and service are required" }, 400);
    }

    const id = crypto.randomUUID();
    const record = {
      id,
      name,
      email,
      service,
      message: message ?? "",
      date: date ?? null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await kv.set(`appointment:${id}`, record);

    // Keep an index of all appointment IDs
    const index: string[] = (await kv.get("appointments:index")) ?? [];
    index.push(id);
    await kv.set("appointments:index", index);

    return c.json({ success: true, appointment: record }, 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to save appointment" }, 500);
  }
});

// GET /appointments — list all appointments
app.get(`${BASE}/appointments`, async (c) => {
  try {
    const index: string[] = (await kv.get("appointments:index")) ?? [];
    if (index.length === 0) return c.json({ appointments: [] });

    const keys = index.map((id) => `appointment:${id}`);
    const records = await kv.mget(keys);

    return c.json({ appointments: records.filter(Boolean) });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to fetch appointments" }, 500);
  }
});

// GET /appointments/:id — get a single appointment
app.get(`${BASE}/appointments/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const record = await kv.get(`appointment:${id}`);
    if (!record) return c.json({ error: "Not found" }, 404);
    return c.json({ appointment: record });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to fetch appointment" }, 500);
  }
});

// PUT /appointments/:id/status — update status (pending → confirmed → completed)
app.put(`${BASE}/appointments/:id/status`, async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    const allowed = ["pending", "confirmed", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return c.json({ error: `status must be one of: ${allowed.join(", ")}` }, 400);
    }
    const record = await kv.get(`appointment:${id}`);
    if (!record) return c.json({ error: "Not found" }, 404);
    const updated = { ...record, status, updatedAt: new Date().toISOString() };
    await kv.set(`appointment:${id}`, updated);
    return c.json({ success: true, appointment: updated });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to update appointment" }, 500);
  }
});

// ── Contact messages ──────────────────────────────────────────

// POST /contact — save a contact form message
app.post(`${BASE}/contact`, async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, service, message } = body;

    if (!name || !email) {
      return c.json({ error: "name and email are required" }, 400);
    }

    const id = crypto.randomUUID();
    const record = {
      id,
      name,
      email,
      service: service ?? null,
      message: message ?? "",
      createdAt: new Date().toISOString(),
    };

    await kv.set(`contact:${id}`, record);

    const index: string[] = (await kv.get("contacts:index")) ?? [];
    index.push(id);
    await kv.set("contacts:index", index);

    return c.json({ success: true, contact: record }, 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to save message" }, 500);
  }
});

// GET /contact — list all contact messages
app.get(`${BASE}/contact`, async (c) => {
  try {
    const index: string[] = (await kv.get("contacts:index")) ?? [];
    if (index.length === 0) return c.json({ contacts: [] });

    const keys = index.map((id) => `contact:${id}`);
    const records = await kv.mget(keys);

    return c.json({ contacts: records.filter(Boolean) });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to fetch contacts" }, 500);
  }
});

Deno.serve(app.fetch);
