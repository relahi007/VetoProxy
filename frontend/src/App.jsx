import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppStateProvider } from "./state";
import Sidebar from "./components/Sidebar";
import Policy from "./pages/policy.jsx";
import Upload from "./pages/Upload.jsx";
import Results from "./pages/Results.jsx";
import Audit from "./pages/Audit.jsx";

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
          <Sidebar />
          <div style={{ flex: 1, marginLeft: 240, overflowY: "auto", minHeight: "100vh" }}>
            <Routes>
              <Route path="/" element={<Navigate to="/policy" replace />} />
              <Route path="/policy"  element={<Policy />} />
              <Route path="/upload"  element={<Upload />} />
              <Route path="/results" element={<Results />} />
              <Route path="/audit"   element={<Audit />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppStateProvider>
  );
}
