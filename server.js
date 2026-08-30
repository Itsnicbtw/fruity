require("dotenv").config();

const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(ROOT, "data");
const UPLOADS = path.join(PUBLIC, "uploads");
const SITE_FILE = path.join(DATA, "site.json");
const PRODUCTS_FILE = path.join(DATA, "products.json");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SESSION_SECRET) {
  console.warn(
    "[Fruity] Admin login is disabled until ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_SECRET are set in .env"
  );
}

fs.mkdirSync(UPLOADS, { recursive: true });

app.disable("x-powered-by");
app.use(express.json({ limit: "600kb" }));
app.use(express.urlencoded({ extended: false, limit: "600kb" }));

app.use(session({
  name: "fruity_admin",
  secret: SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 6
  }
}));

app.use(express.static(PUBLIC, {
  etag: true,
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function writeJsonAtomic(file, value) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

function cleanText(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function safeUrl(value) {
  const raw = cleanText(value, 1600);
  if (!raw) return "";
  if (raw.startsWith("/uploads/")) return raw;
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function requireAdmin(req, res, next) {
  if (!req.session?.admin) return res.status(401).json({ error: "Admin login required." });
  next();
}

app.get("/api/site", (_req, res) => res.json(readJson(SITE_FILE, {})));
app.get("/api/products", (_req, res) => {
  res.json(readJson(PRODUCTS_FILE, []).filter(p => p.active !== false));
});
app.get("/api/products/:slug", (req, res) => {
  const product = readJson(PRODUCTS_FILE, []).find(
    p => p.slug === req.params.slug && p.active !== false
  );
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json(product);
});

app.get("/api/admin/session", (req, res) => {
  res.json({ authenticated: Boolean(req.session?.admin) });
});

app.post("/api/admin/login", (req, res) => {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SESSION_SECRET) {
    return res.status(503).json({ error: "Admin login is not configured in .env." });
  }

  const usernameOk = safeEqual(req.body?.username, ADMIN_USERNAME);
  const passwordOk = safeEqual(req.body?.password, ADMIN_PASSWORD);

  if (!usernameOk || !passwordOk) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  req.session.regenerate(error => {
    if (error) return res.status(500).json({ error: "Could not create admin session." });
    req.session.admin = true;
    res.json({ ok: true });
  });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("fruity_admin");
    res.json({ ok: true });
  });
});

app.put("/api/admin/about", requireAdmin, (req, res) => {
  const current = readJson(SITE_FILE, {});
  current.about = current.about || {};
  current.about.eyebrow = cleanText(req.body?.eyebrow, 100);
  current.about.title = cleanText(req.body?.title, 200);
  current.about.intro = cleanText(req.body?.intro, 1600);
  current.about.body = cleanText(req.body?.body, 6000);
  current.about.secondary = cleanText(req.body?.secondary, 3500);
  writeJsonAtomic(SITE_FILE, current);
  res.json(current.about);
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `fruity-logo-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
    if (!allowed.has(file.mimetype)) return cb(new Error("Use PNG, JPG, WEBP or SVG."));
    cb(null, true);
  }
});

app.post("/api/admin/logo", requireAdmin, upload.single("logo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a logo file." });
  const current = readJson(SITE_FILE, {});
  current.brand = current.brand || {};
  const previous = current.brand.logoUrl || "";
  current.brand.logoUrl = `/uploads/${req.file.filename}`;
  writeJsonAtomic(SITE_FILE, current);

  if (previous.startsWith("/uploads/fruity-logo-")) {
    fs.rm(path.join(PUBLIC, previous), { force: true }, () => {});
  }
  res.json({ logoUrl: current.brand.logoUrl });
});

function slugify(value) {
  return cleanText(value, 120).toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

const categories = new Set(["hoodies", "t-shirts", "caps", "accessories"]);

function sanitizeProduct(body) {
  const name = cleanText(body.name, 180);
  const slug = slugify(body.slug || name);
  const category = cleanText(body.category, 30).toLowerCase();
  const price = Number(body.price);
  const currency = ["USD","GBP","EUR"].includes(cleanText(body.currency,3).toUpperCase())
    ? cleanText(body.currency,3).toUpperCase() : "USD";

  if (!name || !slug) throw new Error("Product name is required.");
  if (!categories.has(category)) throw new Error("Invalid category.");
  if (!Number.isFinite(price) || price < 0 || price > 100000) throw new Error("Invalid price.");

  const gallery = (Array.isArray(body.gallery) ? body.gallery : [])
    .map(safeUrl).filter(Boolean).slice(0,8);

  return {
    id: crypto.randomUUID(),
    name,
    slug,
    category,
    price: Math.round(price * 100) / 100,
    currency,
    badge: cleanText(body.badge, 100) || "FRUITFUL ESSENTIALS",
    description: cleanText(body.description, 6000),
    image: safeUrl(body.image) || gallery[0] || "",
    gallery,
    colors: (Array.isArray(body.colors) ? body.colors : [])
      .map(v => cleanText(v,20))
      .filter(v => /^#[0-9a-fA-F]{3,8}$/.test(v)).slice(0,12),
    sizes: (Array.isArray(body.sizes) ? body.sizes : [])
      .map(v => cleanText(v,20)).filter(Boolean).slice(0,15),
    active: true,
    createdAt: new Date().toISOString()
  };
}

app.post("/api/admin/products", requireAdmin, (req, res) => {
  try {
    const products = readJson(PRODUCTS_FILE, []);
    const product = sanitizeProduct(req.body || {});
    if (products.some(p => p.slug === product.slug)) {
      return res.status(409).json({ error: "That product slug already exists." });
    }
    products.push(product);
    writeJsonAtomic(PRODUCTS_FILE, products);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message || "Invalid product." });
  }
});

app.delete("/api/admin/products/:slug", requireAdmin, (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const next = products.filter(p => p.slug !== req.params.slug);
  if (next.length === products.length) return res.status(404).json({ error: "Product not found." });
  writeJsonAtomic(PRODUCTS_FILE, next);
  res.json({ ok: true });
});

app.get("/admin", (_req, res) => res.sendFile(path.join(PUBLIC, "admin.html")));

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`[Fruity] http://localhost:${PORT}`);
});
