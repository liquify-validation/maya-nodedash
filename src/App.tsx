import { Component, type ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { OverlayHost } from "./components/ui/Modal";
import { NetworkDataProvider } from "./hooks/networkData";
import { ThemeProvider } from "./hooks/theme";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportPage } from "./pages/ReportPage";

/** Dashboard routes share one polling data source so switching between them is instant. */
function DashboardData() {
  return (
    <NetworkDataProvider>
      <Outlet />
    </NetworkDataProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardData />}>
              <Route index element={<DashboardPage key="overview" view="overview" />} />
              <Route path="active-dashboard" element={<DashboardPage key="active" view="active" />} />
              <Route path="standby-dashboard" element={<DashboardPage key="standby" view="standby" />} />
              <Route path="other-dashboard" element={<DashboardPage key="other" view="other" />} />
            </Route>
            <Route path="report/:nodeAddress" element={<ReportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <OverlayHost />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    return this.state.failed ? <div style={{ padding: 40 }}>Something went wrong. Please refresh the page.</div> : this.props.children;
  }
}
