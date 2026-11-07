// POST multipart/form-data { image } -> { text }
// Reads a photographed book page with Workers AI vision and returns the text/summary
// of that page. The image lives only in this request's memory: it is never written to
// disk, R2, or a database. Requires a signed-in Kernel account (checked against spark-api
// auth) so this can't become a free public OCR endpoint.
import { tooMany, slowDown } from "../../src/lib/quota.js";
// ponytail: Gemma over the Moondream Cloudflare suggests, which returns {} unless streamed.
// max_tokens covers its thinking too; too low and content comes back null.
const VISION_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const API = "https://api.jaybulb.com";
const MAX_BYTES = 8 * 1024 * 1024;

export async function onRequest({ request, env }) {
  if (await tooMany(request, "photo")) return slowDown();
  if (request.method !== "POST") return json({ error: "POST only" }, 405);

  const auth = request.headers.get("authorization") || "";
  const authed = await isSignedIn(auth);
  if (!authed) return json({ error: "Sign in required." }, 401);

  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!file || typeof file === "string") return json({ error: "No image." }, 400);
  if (file.size > MAX_BYTES) return json({ error: "Image too large." }, 400);

  const image = await dataUri(file);

  let out;
  try {
    out = await env.AI.run(VISION_MODEL, {
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text:
              "This is a photo of a page from a book. Summarize what happens or what is argued " +
              "on this page in 2-4 plain sentences. Do not describe the physical page, just its content.",
          },
          { type: "image_url", image_url: { url: image } },
        ],
      }],
      max_tokens: 2048,
    });
  } catch {
    return json({ error: "Could not read that photo." }, 502);
  }

  const text = (out?.choices?.[0]?.message?.content || out?.response || "").trim();
  if (!text) return json({ error: "Could not read that photo." }, 502);
  return json({ text });
}

async function dataUri(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return `data:${file.type || "image/jpeg"};base64,${btoa(bin)}`;
}

async function isSignedIn(authHeader) {
  if (!authHeader.startsWith("Bearer ")) return false;
  const res = await fetch(`${API}/auth/user`, {
    headers: { authorization: authHeader },
  });
  return res.ok;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}
