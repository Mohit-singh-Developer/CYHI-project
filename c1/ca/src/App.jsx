import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Todos from "./pages/Todos";
import PerformancePage from "./pages/PerformancePage";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [view, setView] = useState("login");

  useEffect(() => {
    if (token) setView("todos");
    else setView("login");
  }, [token]);

  function handleLogin(newToken) {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setView("todos");
  }

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
        <Todos
          token={token}
          onLogout={handleLogout}
          onPerformance={() => setView("performance")}
        />
      )}

      {view === "performance" && (
        <PerformancePage token={token} onBack={() => setView("todos")} />
      )}
    </div>
  );
}
