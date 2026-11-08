import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { useAuth } from "./features/auth/useAuth";
import { ImageUploader } from "./features/upload/ImageUploader";
import { PresentationEditor } from "./features/editor/PresentationEditor";
import "./App.css";

function Dashboard() {
  const { user, signOut } = useAuth();
  const [lastUploaded, setLastUploaded] = useState<string | null>(null);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">T</span>
          <div>
            <strong>Thuyết trình 10</strong>
            <span>Không gian sáng tạo</span>
          </div>
        </div>
        <div className="header-user">
          <div className="user-chip">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              <span className="avatar"><User size={16} /></span>
            )}
            <span>{user?.displayName || user?.email}</span>
          </div>
          <button className="icon-button logout-button" onClick={signOut}>
            <LogOut size={17} /> Đăng xuất
          </button>
        </div>
      </header>
      <main className="workspace">
        <PresentationEditor imageUrl={lastUploaded} />
        <details className="media-library">
          <summary>Thư viện media</summary>
          <ImageUploader onUploaded={(url) => setLastUploaded(url)} />
        </details>
      </main>
    </div>
  );
}

export default function App() {
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}
