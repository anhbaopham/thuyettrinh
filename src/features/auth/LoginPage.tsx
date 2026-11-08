import { useState, type FormEvent } from "react";
import { useAuth } from "./useAuth";
import { getAuthErrorMessage } from "./authErrors";
import { Eye, EyeOff, LogIn, UserPlus, Mail, ArrowLeft } from "lucide-react";

type Mode = "login" | "register" | "reset";

export function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setPassword("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else if (mode === "register") {
        if (!displayName.trim()) {
          throw Object.assign(new Error("missing-name"), {
            code: "missing-name",
          });
        }
        if (password.length < 6) {
          throw Object.assign(new Error("weak-password"), {
            code: "auth/weak-password",
          });
        }
        await signUp(email.trim(), password, displayName.trim());
      } else {
        await resetPassword(email.trim());
        setSuccess("Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư của bạn.");
        setLoading(false);
        return;
      }
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "unknown";
      if (code === "missing-name") {
        setError("Vui lòng nhập tên hiển thị.");
      } else {
        setError(getAuthErrorMessage(code));
      }
      setLoading(false);
    }
  };

  const title =
    mode === "login"
      ? "Đăng nhập"
      : mode === "register"
        ? "Tạo tài khoản"
        : "Quên mật khẩu";

  const subtitle =
    mode === "login"
      ? "Chào mừng trở lại!"
      : mode === "register"
        ? "Bắt đầu tạo bài thuyết trình của bạn."
        : "Nhập email để nhận liên kết đặt lại mật khẩu.";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.brand}>ThuyetTrinh10</h1>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.subtitle}>{subtitle}</p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {mode === "register" && (
            <div style={styles.field}>
              <label style={styles.label} htmlFor="displayName">
                Tên hiển thị
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                required
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@example.com"
              autoComplete="email"
              required
              style={styles.input}
            />
          </div>

          {mode !== "reset" && (
            <div style={styles.field}>
              <label style={styles.label} htmlFor="password">
                Mật khẩu
              </label>
              <div style={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "register" ? "Ít nhất 6 ký tự" : "••••••••"
                  }
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  style={{ ...styles.input, paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.primaryBtn,
              background: loading ? "#a0aec0" : "#3182ce",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {mode === "login" && <LogIn size={18} />}
            {mode === "register" && <UserPlus size={18} />}
            {mode === "reset" && <Mail size={18} />}
            {loading
              ? "Đang xử lý..."
              : mode === "login"
                ? "Đăng nhập"
                : mode === "register"
                  ? "Tạo tài khoản"
                  : "Gửi email đặt lại"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => resetForm("reset")}
              style={styles.linkBtn}
            >
              Quên mật khẩu?
            </button>
          )}

          {mode === "reset" && (
            <button
              type="button"
              onClick={() => resetForm("login")}
              style={{
                ...styles.linkBtn,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <ArrowLeft size={14} /> Quay lại đăng nhập
            </button>
          )}
        </form>

        {mode !== "reset" && (
          <div style={styles.footer}>
            {mode === "login" ? (
              <>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => resetForm("register")}
                  style={styles.footerLink}
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => resetForm("login")}
                  style={styles.footerLink}
                >
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "1rem",
  } as const,
  card: {
    background: "white",
    padding: "2.5rem 2rem",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    maxWidth: "420px",
    width: "100%",
  } as const,
  brand: {
    margin: 0,
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#3182ce",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    textAlign: "center",
  } as const,
  title: {
    margin: "0.25rem 0 0.25rem",
    fontSize: "1.5rem",
    color: "#1a202c",
    textAlign: "center",
  } as const,
  subtitle: {
    color: "#718096",
    margin: "0 0 1.5rem",
    fontSize: "0.9rem",
    textAlign: "center",
  } as const,
  form: { display: "flex", flexDirection: "column", gap: "1rem" } as const,
  field: { display: "flex", flexDirection: "column", gap: "0.35rem" } as const,
  label: { fontSize: "0.85rem", fontWeight: 500, color: "#4a5568" } as const,
  input: {
    width: "100%",
    padding: "0.7rem 0.85rem",
    fontSize: "0.95rem",
    border: "1px solid #cbd5e0",
    borderRadius: "8px",
    outline: "none",
    color: "#1a202c",
    background: "white",
    boxSizing: "border-box",
  } as const,
  passwordWrap: { position: "relative", display: "flex" } as const,
  eyeBtn: {
    position: "absolute",
    right: "0.6rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#718096",
    display: "flex",
    alignItems: "center",
    padding: 0,
  } as const,
  primaryBtn: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "white",
    border: "none",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginTop: "0.25rem",
    transition: "background 0.2s",
  } as const,
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#3182ce",
    fontSize: "0.85rem",
    cursor: "pointer",
    padding: 0,
    textAlign: "center",
    width: "100%",
  } as const,
  error: {
    background: "#fff5f5",
    border: "1px solid #fed7d7",
    color: "#c53030",
    padding: "0.6rem 0.75rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
  } as const,
  success: {
    background: "#f0fff4",
    border: "1px solid #c6f6d5",
    color: "#2f855a",
    padding: "0.6rem 0.75rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
  } as const,
  footer: {
    marginTop: "1.5rem",
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#718096",
  } as const,
  footerLink: {
    background: "transparent",
    border: "none",
    color: "#3182ce",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
    fontSize: "inherit",
    textDecoration: "underline",
  } as const,
};
