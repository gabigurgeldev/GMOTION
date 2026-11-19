import { useTheme } from "../theme";
import { LayersIcon, VideoIcon } from "./icons";
import type { Project } from "../../shared/types";

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
}

const TYPE_LABEL: Record<Project["type"], string> = {
  EV: "Edição de vídeo",
  GM: "Graphics Motion",
};

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const { theme } = useTheme();
  const isEV = project.type === "EV";

  return (
    <button
      onClick={() => onOpen(project)}
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        padding: 0,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${theme.border}`,
        background: theme.surface,
        boxShadow: theme.shadow,
        transition: "transform 0.12s ease, border-color 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = theme.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = theme.border;
      }}
    >
      {/* Preview placeholder: cor + ícone do tipo. Render real vem depois. */}
      <div
        style={{
          position: "relative",
          height: 150,
          background: `linear-gradient(135deg, ${project.thumbColor}, #0b0f19)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
        }}
      >
        {isEV ? <VideoIcon size={44} /> : <LayersIcon size={44} />}
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            background: "rgba(0,0,0,0.45)",
            color: "#ffffff",
          }}
        >
          {project.type}
        </span>
      </div>

      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>
          {project.name}
        </div>
        <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 3 }}>
          {TYPE_LABEL[project.type]}
        </div>
      </div>
    </button>
  );
}
