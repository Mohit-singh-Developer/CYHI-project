// models/Todo.js
const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    deadline: { type: Date },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    repeatDays: [{ type: String }], // <-- NEW FIELD
  },
  { timestamps: true }
);

module.exports = mongoose.model("Todo", TodoSchema);
