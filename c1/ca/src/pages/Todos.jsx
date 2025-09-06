import React, { useState, useEffect } from "react";

export default function Todos({ token, onLogout, onPerformance }) {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [deadline, setDeadline] = useState("");
  const [repeatDays, setRepeatDays] = useState([]);

  // Fetch todos
  useEffect(() => {
    fetch("http://localhost:3001/api/todos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setTodos)
      .catch(console.error);
  }, [token]);

  // Add todo
  async function handleAdd(e) {
    e.preventDefault();
    if (!text) return;

    // Convert the datetime-local string to an absolute UTC instant
    const payload = {
      text,
      repeatDays,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    };

    const res = await fetch("http://localhost:3001/api/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setTodos([...todos, data]);
    setText("");
    setDeadline("");
    setRepeatDays([]);
  }

  // Toggle complete
  async function toggleComplete(todo) {
    const res = await fetch(`http://localhost:3001/api/todos/${todo._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...todo,
        completed: !todo.completed,
        // keep deadline untouched; if you ever edit it, send ISO again
      }),
    });
    const updated = await res.json();
    setTodos(todos.map((t) => (t._id === updated._id ? updated : t)));
  }

  // Delete todo
  async function handleDelete(id) {
    await fetch(`http://localhost:3001/api/todos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setTodos(todos.filter((t) => t._id !== id));
  }

  // Completion Rate
  const completedCount = todos.filter((t) => t.completed).length;
  const completionRate = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  // Sort: incomplete first by deadline, then completed at bottom
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  // Priority color
  function getPriority(deadline, completed) {
    if (completed) return "bg-gray-100 border-gray-400";
    if (!deadline) return "bg-green-100 border-green-400";
    const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60); // hours left
    if (diff <= 6) return "bg-red-100 border-red-400";
    if (diff <= 12) return "bg-yellow-100 border-yellow-400";
    return "bg-green-100 border-green-400";
  }

  // Toggle repeat day
  function toggleDay(day) {
    setRepeatDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">My Todos</h1>
        <div className="flex gap-3">
          <button
            onClick={onPerformance}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            👤
          </button>
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <p className="mb-1 font-medium text-gray-700">Completion Rate: {completionRate}%</p>
        <div className="w-full bg-gray-300 rounded h-4">
          <div className="bg-blue-500 h-4 rounded" style={{ width: `${completionRate}%` }}></div>
        </div>
      </div>

      {/* Add Todo */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-6 bg-white p-4 shadow rounded">
        <input
          type="text"
          placeholder="Enter todo..."
          className="border p-2 rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          type="datetime-local"
          className="border p-2 rounded"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        {/* Repeat Days Selection */}
        <div>
          <label className="block mb-2 font-medium">Repeat on:</label>
          <div className="flex gap-3 flex-wrap">
            {days.map((day) => (
              <label key={day} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={repeatDays.includes(day)}
                  onChange={() => toggleDay(day)}
                />
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add
        </button>
      </form>

      {/* Todo List */}
      <div className="space-y-3">
        {sortedTodos.map((todo) => {
          const priorityClass = getPriority(todo.deadline, todo.completed);
          return (
            <div
              key={todo._id}
              className={`flex justify-between items-center p-4 border-l-4 shadow rounded ${priorityClass}`}
            >
              <div>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo)}
                  className="mr-2"
                />
                <span className={`${todo.completed ? "line-through text-gray-500" : "font-medium"}`}>
                  {todo.text}
                </span>

                {todo.deadline && (
                  <p className="text-sm text-gray-600">
                    Deadline:{" "}
                    {new Date(todo.deadline).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour12: true,
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}

                {todo.repeatDays?.length > 0 && (
                  <p className="text-xs text-blue-500">🔁 Repeats: {todo.repeatDays.join(", ")}</p>
                )}
              </div>
              <button onClick={() => handleDelete(todo._id)} className="text-red-500 hover:text-red-700">
                ✖
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
