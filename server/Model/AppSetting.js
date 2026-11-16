const mongoose = require("mongoose");
module.exports = mongoose.model("AppSetting", new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true }));
