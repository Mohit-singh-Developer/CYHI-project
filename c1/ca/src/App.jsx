import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Todos from "./pages/Todos";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [view, setView] = useState("login"); // "login" | "register" | "todos"

  useEffect(() => {
    if (token) setView("todos");
    else setView("login");
  }, [token]);

  // when login succeeds
  function handleLogin(newToken) {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setView("todos");
  }

  // logout and clear token
  function handleLogout() {
    setToken(null);
    localStorage.removeItem("token");
    setView("login");
  }

  return (
    <div>
      {view === "login" && (
        <Login onLogin={handleLogin} onSwitch={() => setView("register")} />
      )}

      {view === "register" && (
        <Register onSwitch={() => setView("login")} />
      )}

      {view === "todos" && (
        <Todos token={token} onLogout={handleLogout} />
      )}
    </div>
  );
}
