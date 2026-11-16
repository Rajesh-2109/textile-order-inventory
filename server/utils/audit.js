const AuditLog = require("../Model/AuditLog");

module.exports = (user, action, entityType, entityId, summary = "") =>
  AuditLog.create({
    actor: user._id,
    actorName: user.name,
    action,
    entityType,
    entityId,
    summary,
  }).catch((e) => console.error("Audit log failed:", e.message));
