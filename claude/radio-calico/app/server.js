"use strict";

/*
 * RadioCalico backend — song ratings API.
 *
 * Endpoints (all under /api, nginx strips nothing — it proxies /api/ through):
 *   GET  /api/health
 *   GET  /api/ratings?artist=..&title=..   -> { up, down, yourRating }
 *   POST /api/ratings   body { artist, title, rating }  rating ∈ {1,-1,0}
 *                       -> { up, down, yourRating }   (rating 0 removes the vote)
 *
 * No login. A listener is identified by a server-side fingerprint derived from
 * their IP (nginx X-Real-IP) + User-Agent — there is no client token to clear.
 *
 * A song has no stable id in the stream metadata, so we derive one by hashing
 * the normalized artist + title. One row per (song_id, voter_fp) guarantees a
 * listener can never rate the same song more than once; re-voting updates the
 * existing row, and rating 0 deletes it (toggle off).
 */

const http = require("http");
const crypto = require("crypto");
const { Pool } = require("pg");

const PORT = parseInt(process.env.PORT || "3000", 10);

const pool = new Pool({
  host: process.env.PGHOST || "radiocalico-db",
  port: parseInt(process.env.PGPORT || "5432", 10),
  user: process.env.PGUSER || "radiocalico",
  password: process.env.PGPASSWORD || "radiocalico_dev",
  database: process.env.PGDATABASE || "radiocalico",
  max: 5,
  idleTimeoutMillis: 30000,
});

function songId(artist, title) {
  const norm = (s) => String(s || "").trim().toLowerCase();
  return crypto
    .createHash("sha1")
    .update(norm(artist) + "\n" + norm(title))
    .digest("hex");
}

// Identify the listener by IP (+ User-Agent) — no login, no client token.
// nginx forwards the real client IP in X-Real-IP / X-Forwarded-For; fall back
// to the socket address. The raw IP is never stored, only this hash.
function fingerprint(req) {
  const xff = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip =
    String(req.headers["x-real-ip"] || "").trim() ||
    xff ||
    (req.socket && req.socket.remoteAddress) ||
    "";
  const ua = String(req.headers["user-agent"] || "");
  return crypto.createHash("sha256").update(ip + "|" + ua).digest("hex");
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
    "Cache-Control": "no-store",
  });
  res.end(data);
}

async function readBody(req, limit = 16 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// Return { up, down, yourRating } for a song, scoped to one fingerprint.
async function tallyFor(sid, fp) {
  const totals = await pool.query(
    `SELECT
        COUNT(*) FILTER (WHERE rating =  1) AS up,
        COUNT(*) FILTER (WHERE rating = -1) AS down
       FROM song_ratings WHERE song_id = $1`,
    [sid]
  );
  let yourRating = 0;
  const mine = await pool.query(
    `SELECT rating FROM song_ratings WHERE song_id = $1 AND voter_fp = $2`,
    [sid, fp]
  );
  if (mine.rowCount) yourRating = mine.rows[0].rating;
  const row = totals.rows[0] || { up: 0, down: 0 };
  return { up: Number(row.up) || 0, down: Number(row.down) || 0, yourRating };
}

async function handleGet(req, res, url) {
  const artist = url.searchParams.get("artist") || "";
  const title = url.searchParams.get("title") || "";
  if (!artist && !title) return sendJson(res, 400, { error: "artist or title required" });
  const tally = await tallyFor(songId(artist, title), fingerprint(req));
  return sendJson(res, 200, tally);
}

async function handlePost(req, res) {
  let payload;
  try {
    payload = JSON.parse((await readBody(req)) || "{}");
  } catch (_) {
    return sendJson(res, 400, { error: "invalid JSON" });
  }

  const { artist = "", title = "" } = payload;
  const rating = Number(payload.rating);

  if (!artist && !title) return sendJson(res, 400, { error: "artist or title required" });
  if (![1, -1, 0].includes(rating)) return sendJson(res, 400, { error: "rating must be 1, -1, or 0" });

  const sid = songId(artist, title);
  const fp = fingerprint(req);

  if (rating === 0) {
    // Toggle off — remove this listener's rating for the song.
    await pool.query(`DELETE FROM song_ratings WHERE song_id = $1 AND voter_fp = $2`, [sid, fp]);
  } else {
    // Insert, or update the existing vote. The PK keeps it to one row per
    // (song, fingerprint), so a listener never counts more than once.
    await pool.query(
      `INSERT INTO song_ratings (song_id, voter_fp, rating, artist, title)
         VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (song_id, voter_fp)
         DO UPDATE SET rating = EXCLUDED.rating, updated_at = now()`,
      [sid, fp, rating, String(artist).slice(0, 300), String(title).slice(0, 300)]
    );
  }

  const tally = await tallyFor(sid, fp);
  return sendJson(res, 200, tally);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, { status: "ok" });
    }
    if (url.pathname === "/api/ratings") {
      if (req.method === "GET") return await handleGet(req, res, url);
      if (req.method === "POST") return await handlePost(req, res);
      res.writeHead(405, { Allow: "GET, POST" });
      return res.end();
    }
    return sendJson(res, 404, { error: "not found" });
  } catch (err) {
    console.error("request error:", err);
    return sendJson(res, 500, { error: "internal error" });
  }
});

server.listen(PORT, () => console.log(`radiocalico-app listening on :${PORT}`));

function shutdown() {
  server.close(() => pool.end().then(() => process.exit(0)));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
