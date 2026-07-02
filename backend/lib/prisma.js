// Single shared PrismaClient — every require() gets the same connection pool.
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

module.exports = prisma;
