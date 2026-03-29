const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { BadParams, DoesNotExist } = require("./routes/middleware/CustomErrors");
const { Server } = require("socket.io");
const http = require("http");

const express = require("express");
const PORT = process.env.PORT || 3000;
require("dotenv").config();
const ORIGIN = process.env.origin;
const isProd = process.env.NODE_ENV === "production";

const cors = require("cors");
const app = express();

app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

if (isProd) {
  // behind Heroku, Nginx, Cloudflare, etc.
  app.set("trust proxy", 1);
}
const session = require("express-session");
app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const sessionMiddleware = session({
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // ms
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  },
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  store: new PrismaSessionStore(new PrismaClient(), {
    checkPeriod: 2 * 60 * 1000, //ms
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
});

app.use(sessionMiddleware);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [ORIGIN, process.env.devorigin],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on("connection", (socket) => {
  socket.emit("connected", "connected");
  // Join a user-specific room so we can target notifications precisely
  const userId = socket.request.session?.userId;
  if (userId) {
    socket.join(`user:${userId}`);
  }
});

app.set("io", io);

app.use((req, res, next) => {
  if (req.session.isGuest == null) {
    req.session.isGuest = true;
  }
  const userId = req.session.userId;
  const path = req.path;
  const publicRoutes = [
    "/login",
    "/signup",
    "/search",
    "/auth/me",
    "/sectors",
    "/industries",
    "/check-signup",
    "/public",
    "/curated",
    "/getters",
    "/swings",
    "/permissions",
    "/model-exists",
    "/basic",
    "/company",
    "/getNotes",
    "/models",
    "/history",
    "/performance",
    "/populators",
  ];
  const isPublic = publicRoutes.some((route) => path.includes(route));
  if (!isPublic && userId == null) {
    console.warn(`[AUTH] 401 on path="${path}" method=${req.method}`);
  }
  if (isPublic) {
    next();
    return;
  }
  if (userId == null) {
    return res.status(401).json({ message: "you are not logged in" });
  }
  next();
});

const authRoutes = require("./routes/auth");
const getterRoutes = require("./routes/getters");
const { router } = require("./populators/tickers");
const portfolioRoutes = require("./routes/portfolios");
const companyRoutes = require("./routes/company");
const modelRoutes = require("./routes/model");
const recommendationRoutes = require("./routes/recommendations");
const notificationsRoutes = require("./routes/notifications");
const excelRoutes = require("./routes/excel");
app.use("/models", modelRoutes);
app.use("/getters", getterRoutes);
app.use("/auth", authRoutes);
app.use("/populators", router);
app.use("/portfolios", portfolioRoutes);
app.use("/company", companyRoutes);
app.use("/recommendations", recommendationRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/excel", excelRoutes);

// Global error handler — always return JSON, never HTML
app.use((err, req, res, next) => {
  console.error(err?.message ?? err);
  res.status(err?.status ?? err?.statusCode ?? 500).json({ error: err?.message ?? "Internal Server Error" });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
