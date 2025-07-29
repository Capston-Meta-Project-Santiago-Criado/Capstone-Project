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

if (isProd) {
  // behind Heroku, Nginx, Cloudflare, etc.
  app.set("trust proxy", 1);
}
const session = require("express-session");
app.use(
  cors({
    origin: [ORIGIN, process.env.devorigin],
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
  secret: "a santa at nasa",
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
  ];
  if (publicRoutes.some((route) => path.includes(route))) {
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

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
