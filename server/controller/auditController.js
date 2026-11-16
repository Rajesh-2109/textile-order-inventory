const AuditLog = require("../Model/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const { parsePaging, pagination } = require("../utils/query");

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const [data, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(),
  ]);
  res.json({ success: true, data, pagination: pagination(page, limit, total) });
});

module.exports = { list };
