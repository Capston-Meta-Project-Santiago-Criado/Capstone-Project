const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router({ mergeParams: true });

// getting all notifications

router.get("/", async (req, res) => {
  const userId = req.session.userId;
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      created_at: "desc",
    },
  });
  if (notifications == null) {
    res.json([]);
    return;
  }
  res.json(notifications);
});

router.get("/unread", async (req, res) => {
  const userId = req.session.userId;
  const userData = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  res.json(userData.unreadNotifications);
});

router.post("/reset", async (req, res) => {
  const userId = req.session.userId;
  await prisma.user.update({
    where: { id: userId },
    data: { unreadNotifications: 0 },
  });
  res.json({ ok: true });
});

module.exports = router;
