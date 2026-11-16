// POST { text, title? } -> { text }
// Summarizes one section of a book the user imported (a PDF or EPUB they own) in the model's own words.
// The text lives only in this request's memory: never written to disk, R2, or a database. Requires a
// signed-in Kernel account (checked against jaybulb-api auth) so this can't become a free public endpoint.
// Clients split long chapters into pieces under MAX_CHARS and join the summaries (epub.js, Ebook.swift).
import { tooMany, slowDown } from "../../src/lib/quota.js";
// ponytail: same Gemma the photo reader used. max_tokens covers its thinking too; too low and content comes back null.
const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const API = "https://api.jaybulb.com";
export const MAX_CHARS = 24000;

export async function onRequest({ request, env }) {
  if (await tooMany(request, "summarize")) return slowDown();
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  if (!(await isSignedIn(request.headers.get("authorization") || ""))) return json({ error: "Sign in required." }, 401);

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return json({ error: "No text." }, 400);
  if (text.length > MAX_CHARS) return json({ error: "Text too long." }, 400);
  const title = typeof body?.title === "string" ? body.title.slice(0, 200) : "";

  let out;
  try {
    out = await env.AI.run(MODEL, {
      messages: [{
        role: "user",
        content:
          `This is part of a book${title ? ` section called "${title}"` : ""}. Summarize it in your own words: ` +
          "3 to 6 key ideas, each as a short paragraph in plain English. Markdown is fine but no headings. " +
          "No quotes longer than ten words, no copied code listings, no em dashes. Skip page numbers, " +
          "running headers and other print leftovers.\n\n" + text,
      }],
      max_tokens: 4096,
    });
  } catch {
    return json({ error: "Could not summarize that part." }, 502);
  }

  const summary = (out?.choices?.[0]?.message?.content || out?.response || "").trim();
  if (!summary) return json({ error: "Could not summarize that part." }, 502);
  return json({ text: summary });
}

async function isSignedIn(authHeader) {
  if (!authHeader.startsWith("Bearer ")) return false;
  const res = await fetch(`${API}/auth/user`, { headers: { authorization: authHeader } });
  return res.ok;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}
