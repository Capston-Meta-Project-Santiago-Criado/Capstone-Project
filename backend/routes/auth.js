const MIN_PASSWORD_LENGTH = 8;

const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const express = require("express");
const app = express();
app.use(express.json());
const router = express.Router({ mergeParams: true });
const argon2 = require("argon2");
const rateLimit = require("express-rate-limit");
const LOCKED_OUT_MINUTES = 10; // how long a user is locked out of their account for too many wrong passwords
const INDUSTRY_LENGTH = 160; // slightly more than # of industries, used to index industry lengths.
const SECTOR_LENGTH = 15; // agian longer than # of sectors, used for easy indexing.

router.post("/check-signup", async (req, res) => {
  const { username, password, email, name } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        {
          username,
        },
        {
          email,
        },
      ],
    },
  });
  if (existingUser != null) {
    res.json({ isUserExisting: true });
    return;
  }
  res.json({ isUserExisting: false });
});

router.post("/signup", async (req, res) => {
  const { username, password, email, name, interestedIndustries, sectors } =
    req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        {
          username,
        },
        {
          email,
        },
      ],
    },
  });

  if (existingUser != null) {
    return res.status(400).json({ error: "Username or email already used." });
  }
  const hashedPassword = await argon2.hash(password);

  const industryArray = new Array(INDUSTRY_LENGTH).fill(0);
  for (let industryIndex of interestedIndustries) {
    industryArray[industryIndex] = 1;
  } // use exploration to then modify algorithim. Use user interaction as "labels",
  // so positive indicators mean clicking on correct industries vs incorrect industries, with gD

  const sectorArray = new Array(SECTOR_LENGTH).fill(0);
  for (let sectorIndex of sectors) {
    sectorArray[sectorIndex] = 0.5;
  }

  const now = new Date();

  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      email,
      name,
      interestedIndustries,
      sectors,
      industryWeights: industryArray,
      sectorWeights: sectorArray,
      lastCached: new Date(now.getTime() - 5 * 60 * 1000),
    },
  });

  res.status(201).json(newUser);
});

router.get("/get-interests", async (req, res) => {
  const userId = req.session.userId;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  res.json({
    interestedIndustries: user.interestedIndustries,
    sectors: user.sectors,
  });
});

router.post("/change-settings", async (req, res) => {
  const userId = req.session.userId;
  const { interestedIndustries, sectors } = req.body;

  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  let currentIndWeights = currentUser.industryWeights;
  let currentSectWeights = currentUser.sectorWeights;
  for (let i = 0; i < currentIndWeights.length; i++) {
    if (currentUser.interestedIndustries.includes(i)) {
      continue;
    }
    if (interestedIndustries.includes(i)) {
      currentIndWeights[i] += 1;
    }
  }
  for (let i = 0; i < currentIndWeights.length; i++) {
    if (currentUser.sectors.includes(i)) {
      continue;
    }
    if (sectors.includes(i)) {
      currentSectWeights[i] += 0.5;
    }
  }
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      interestedIndustries,
      sectors,
      industryWeights: currentIndWeights,
      sectorWeights: currentSectWeights,
    },
  });
  res.json({ messsage: "updated settings" });
});

// login routes!

const loginLimiter = rateLimit({
  windowMs: LOCKED_OUT_MINUTES * 60 * 1000, //  LOCKED_OUT_MINUTES minutes
  max: 100, // Limit each IP to xx login attempts per windowMs
  message: {
    error: `Too many failed login attempts. Try again in ${LOCKED_OUT_MINUTES} minutes`,
  },
});

router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (user == null) {
    return res.status(400).json({ error: "Invalid username or password." });
  }
  const isValidPassword = await argon2.verify(user.password, password);
  if (!isValidPassword) {
    return res.status(400).json({ error: "Invalid username or password." });
  }
  req.session.isGuest = false;
  req.session.userId = user.id;
  res.status(200).json({ name: user.name });
});

// check if valid session exists!
router.get("/me", async (req, res) => {
  const userId = req.session.userId;
  if (userId == null) {
    return res.json({ isGuest: true });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true }, // Only return necessary data
  });

  res.status(200).json({
    id: req.session.userId,
    username: user.username,
    name: user.name,
    isGuest: false,
  });
});

router.get("/sectors", async (req, res) => {
  const sectors = await prisma.sector.findMany();
  res.json(sectors);
});

router.get("/industries", async (req, res) => {
  const industries = await prisma.industry.findMany();
  res.json(industries);
});

router.delete("/signout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
    }
    res.clearCookie("sid", { path: "/" });
    return res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
