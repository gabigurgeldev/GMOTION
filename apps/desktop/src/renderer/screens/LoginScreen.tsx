import { useTheme } from "../theme";
import { ThemeToggle } from "../components/ThemeToggle";
import { GoogleIcon } from "../components/icons";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: 20,
        }}
      >
        <ThemeToggle />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            padding: 36,
            borderRadius: 22,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadow,
            textAlign: "center",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: theme.accent,
              color: theme.accentText,
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 28,
              marginBottom: 18,
            }}
          >
            G
          </span>

          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800 }}>
            Bem-vindo ao GMOTION
          </h1>
          <p style={{ margin: "0 0 28px", color: theme.textMuted, fontSize: 14.5 }}>
            Crie vídeos e motion graphics em um só lugar.
          </p>

          <button
            onClick={onLogin}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              background: theme.surfaceAlt,
              color: theme.text,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            <GoogleIcon size={20} />
            Entrar com Google
          </button>

          <p style={{ margin: "22px 0 0", fontSize: 13, color: theme.textMuted }}>
            Não tem conta?{" "}
            <a
              onClick={onLogin}
              style={{ color: theme.accent, fontWeight: 700, cursor: "pointer" }}
            >
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
