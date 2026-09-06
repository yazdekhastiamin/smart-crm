import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
        </Routes>
      </main>
    </div>
  );
}
