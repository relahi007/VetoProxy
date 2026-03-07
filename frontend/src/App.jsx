import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { AppStateProvider } from "./state";
import Policy from "./pages/policy.jsx";
import Upload from "./pages/Upload.jsx";
import Results from "./pages/Results.jsx";
import Audit from "./pages/Audit.jsx";

const navStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 16px",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 14,
  color: isActive ? "#f9fafb" : "#6b7280",
  background: isActive ? "#1f2937" : "transparent",
  borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
  marginBottom: 4,
  transition: "all .15s",
});

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e", fontFamily: "sans-serif" }}>

          <div style={{ width: 240, background: "#070d1a", padding: "24px 16px", flexShrink: 0, borderRight: "1px solid #1f2937", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, paddingLeft: 8 }}>
              <div style={{ width: 28, height: 28, background: "#6366f1", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>V</div>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#f9fafb" }}>VetoProxy</span>
            </div>

            <nav style={{ display: "flex", flexDirection: "column" }}>
              <NavLink to="/policy" style={navStyle}>Policy</NavLink>
              <NavLink to="/upload" style={navStyle}>Upload</NavLink>
              <NavLink to="/results" style={navStyle}>Results</NavLink>
              <NavLink to="/audit" style={navStyle}>Audit Log</NavLink>
            </nav>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            <Routes>
              <Route path="/" element={<Policy />} />
              <Route path="/policy" element={<Policy />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/results" element={<Results />} />
              <Route path="/audit" element={<Audit />} />
            </Routes>
          </div>

        </div>
      </BrowserRouter>
    </AppStateProvider>
  );
}