import type { ReactNode } from "react";
import { useAuth } from "./useAuth";
import { LoginPage } from "./LoginPage";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.1rem",
          color: "#718096",
        }}
      >
        Đang tải...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
