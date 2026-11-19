import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../theme";
import { Header } from "../components/Header";
import { ActionMenu } from "../components/ActionMenu";
import { ProjectCard } from "../components/ProjectCard";
import { NewProjectModal } from "../components/NewProjectModal";
import { SettingsModal } from "../components/SettingsModal";
import type { Project, ProjectType } from "../../shared/types";

interface DashboardScreenProps {
  onOpenProject: (project: Project) => void;
  onLogout: () => void;
}

export function DashboardScreen({ onOpenProject, onLogout }: DashboardScreenProps) {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await window.gmotion.listProjects();
    setProjects(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = useCallback(
    async (input: { name: string; type: ProjectType }) => {
      const project = await window.gmotion.createProject(input);
      setModalOpen(false);
      await refresh();
      onOpenProject(project);
    },
    [onOpenProject, refresh],
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Header onProfile={onLogout} onSettings={() => setSettingsOpen(true)} />

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px",
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <ActionMenu onCreate={() => setModalOpen(true)} />

        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "32px 0 16px" }}>
          Meus projetos
        </h2>

        {loading ? (
          <p style={{ color: theme.textMuted }}>Carregando…</p>
        ) : projects.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              borderRadius: 16,
              border: `1px dashed ${theme.border}`,
              color: theme.textMuted,
            }}
          >
            Nenhum projeto ainda. Clique em{" "}
            <strong style={{ color: theme.text }}>Criar novo projeto</strong> pra
            começar.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
              gap: 18,
            }}
          >
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onOpen={onOpenProject} />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <NewProjectModal
          onClose={() => setModalOpen(false)}
          onConfirm={handleCreate}
        />
      )}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
