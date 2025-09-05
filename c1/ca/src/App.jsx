import React, { useMemo, useState } from "react";

export default function App() {
  const [user, setUser] = useState({ name: "Mohit" });
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [dueDateTime, setDueDateTime] = useState(""); // YYYY-MM-DDTHH:mm

  // Calculate hours left until due
  const hoursLeft = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    const now = new Date();
    const due = new Date(dateTimeStr);
    return (due - now) / (1000 * 60 * 60); // in hours
  };

  // Determine priority from hours left
  const priorityFromTime = (dateTimeStr) => {
    const hrs = hoursLeft(dateTimeStr);
    if (hrs === null) return { label: "No time", cls: "bg-gray-100 text-gray-600", order: 3 };
    if (hrs < 0) return { label: "Overdue", cls: "bg-red-200 text-red-700", order: 0 };
    if (hrs <= 6) return { label: "High", cls: "bg-red-100 text-red-600", order: 1 };
    if (hrs <= 12) return { label: "Medium", cls: "bg-orange-100 text-orange-600", order: 2 };
    return { label: "Low", cls: "bg-green-100 text-green-600", order: 3 };
  };

  // Add a todo
  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        dueDateTime,
      },
    ]);
    setNewTodo("");
    setDueDateTime("");
  };

  // Toggle completion
  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Delete a todo
  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // Sort todos: incomplete first → by priority (time-based order)
  const sortedTodos = useMemo(() => {
    const copy = [...todos];
    copy.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pa = priorityFromTime(a.dueDateTime).order;
      const pb = priorityFromTime(b.dueDateTime).order;
      return pa - pb;
    });
    return copy;
  }, [todos]);

  // Completion stats
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Logout
  const handleLogout = () => {
    setUser(null);
    setTodos([]);
    alert("Logged out");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">You are logged out</h1>
          <button
            onClick={() => setUser({ name: "Mohit" })}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
          >
            Log in again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">✅ Todo App</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Hi, {user.name}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl border hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Enter a new todo..."
            className="border rounded-xl px-3 py-2 md:col-span-2"
          />
          <input
            type="datetime-local"
            value={dueDateTime}
            onChange={(e) => setDueDateTime(e.target.value)}
            className="border rounded-xl px-3 py-2"
          />
          <button
            onClick={addTodo}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 md:col-span-3"
          >
            Add Task
          </button>
        </div>

        {/* Todo List */}
        <ul className="space-y-2">
          {sortedTodos.map((todo) => {
            const priority = priorityFromTime(todo.dueDateTime);
            const hrs = hoursLeft(todo.dueDateTime);
            return (
              <li
                key={todo.id}
                className="flex items-center gap-2 p-3 border rounded-xl"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="h-5 w-5"
                />
                <div className="flex-1">
                  <div
                    className={`font-medium ${
                      todo.completed ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {todo.text}
                  </div>
                  <div className="text-xs text-gray-600">
                    {todo.dueDateTime
                      ? new Date(todo.dueDateTime).toLocaleString()
                      : "No due date"}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-lg ${priority.cls}`}
                >
                  {priority.label}
                  {hrs !== null &&
                    hrs >= 0 &&
                    ` (${Math.floor(hrs)}h left)`}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="ml-2 text-xs px-2 py-1 rounded-lg border hover:bg-gray-50"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>

        {/* Progress */}
        <div className="mt-6">
          <p className="text-center font-medium">
            Completed: {completed}/{total} ({percentage}%)
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: total ? `${percentage}%` : "0%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
