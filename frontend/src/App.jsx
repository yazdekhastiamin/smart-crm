import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Contacts from "./pages/Contacts";

export default function App() {
  const [province, setProvince] = useState(null);
  const [provinceName, setProvinceName] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const bump = () => setRefreshToken((v) => v + 1);

  function handleSelectProvince(id, name) {
    setProvince(id);
    setProvinceName(name || "");
  }

  return (
    <LanguageProvider>
      <div className="app">
        <AppHeader province={province} provinceName={provinceName} onClearProvince={() => setProvince(null)} />
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard province={province} onSelectProvince={handleSelectProvince} refreshToken={refreshToken} />
              }
            />
            <Route path="/pipeline" element={<Pipeline refreshToken={refreshToken} onChanged={bump} />} />
            <Route path="/contacts" element={<Contacts />} />
          </Routes>
        </main>
        <AppFooter />
      </div>
    </LanguageProvider>
  );
}
