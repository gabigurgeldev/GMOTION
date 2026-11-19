import { useState } from "react";
import { useTheme } from "./theme";
import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { GenerateScreen } from "./screens/GenerateScreen";
import type { Project } from "../shared/types";

type Screen =
  | { name: "login" }
  | { name: "dashboard" }
  | { name: "generate"; project: Project };

export function App() {
  const { theme } = useTheme();
  const [screen, setScreen] = useState<Screen>({ name: "login" });

  return (
    <div
      style={{
        height: "100%",
        background: theme.bg,
        color: theme.text,
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      {screen.name === "login" && (
        <LoginScreen onLogin={() => setScreen({ name: "dashboard" })} />
      )}

      {screen.name === "dashboard" && (
        <DashboardScreen
          onOpenProject={(project) => setScreen({ name: "generate", project })}
          onLogout={() => setScreen({ name: "login" })}
        />
      )}

      {screen.name === "generate" && (
        <GenerateScreen
          project={screen.project}
          onBack={() => setScreen({ name: "dashboard" })}
        />
      )}
    </div>
  );
}
