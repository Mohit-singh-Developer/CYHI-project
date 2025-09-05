import React, { useState, useEffect } from "react";

export default function Todos({ token, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [deadline, setDeadline] = useState("");

  async function fetchTodos() {
    const res = await fetch("http://localhost:3001/api/todos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      onLogout();
      return;
    }
    const data = await res.json();
    setTodos(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  async function addTodo() {
    if (!input.trim()) return;
    await fetch("http://localhost:3001/api/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: input, deadline }),
    });
    setInput("");
    setDeadline("");
    fetchTodos();
  }

  async function toggleTodo(id, completed) {
    await fetch(`http://localhost:3001/api/todos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: !completed }),
    });
    fetchTodos();
  }

  async function deleteTodo(id) {
    await fetch(`http://localhost:3001/api/todos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTodos();
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-10">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Todo List</h2>
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Add Todo */}
        <div className="flex flex-col sm:flex-row sm:space-x-2 mb-4">
          <input
            type="text"
            className="flex-1 border rounded p-2 focus:outline-none"
            placeholder="Add a new task"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <input
            type="datetime-local"
            className="border rounded p-2 mt-2 sm:mt-0"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <button
            onClick={addTodo}
            className="bg-blue-600 text-white rounded px-4 py-2 mt-2 sm:mt-0 hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* Todo List */}
        <ul>
          {todos.map((todo) => {
            const isNearDeadline =
              todo.deadline &&
              new Date(todo.deadline).getTime() - Date.now() < 2 * 60 * 60 * 1000 &&
              !todo.completed;

            return (
              <li
                key={todo._id}
                className={`flex flex-col bg-gray-50 p-3 mb-2 rounded shadow-sm ${
                  isNearDeadline ? "border-l-4 border-red-500" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    onClick={() => toggleTodo(todo._id, todo.completed)}
                    className={`cursor-pointer flex-1 ${
                      todo.completed ? "line-through text-gray-400" : "text-gray-800"
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo._id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    Delete
                  </button>
                </div>
                {todo.deadline && (
                  <small
                    className={`mt-1 ${
                      isNearDeadline ? "text-red-600 font-bold" : "text-gray-500"
                    }`}
                  >
                    ⏰ Due: {new Date(todo.deadline).toLocaleString()}
                  </small>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
