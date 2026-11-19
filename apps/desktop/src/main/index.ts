import { join } from "path";
import { promises as fs } from "fs";
import { spawn } from "child_process";
import { pathToFileURL } from "url";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  net,
  protocol,
  safeStorage,
  shell,
} from "electron";
import type {
  FolderKind,
  GenerateBrief,
  NewProjectInput,
  PickedVideo,
  Project,
  ReindexResult,
  RenderResult,
  Settings,
} from "../shared/types";

const isDev = !!process.env.ELECTRON_RENDERER_URL;
// __dirname em runtime é apps/desktop/out/main (build do electron-vite).
const repoRoot = join(__dirname, "../../../..");

function projectsFile(): string {
  return join(app.getPath("userData"), "projects.json");
}

/** Caminho do asset-manifest.json na raiz do repo, se já foi indexado. */
async function assetsManifestArgs(): Promise<string[]> {
  const manifestPath = join(repoRoot, "asset-manifest.json");
  try {
    await fs.access(manifestPath);
    return ["--assets-manifest", manifestPath];
  } catch {
    return [];
  }
}

async function readProjects(): Promise<Project[]> {
  try {
    const raw = await fs.readFile(projectsFile(), "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as Project[]) : [];
  } catch {
    return [];
  }
}

async function writeProjects(projects: Project[]): Promise<void> {
  await fs.writeFile(projectsFile(), JSON.stringify(projects, null, 2), "utf-8");
}

const DEFAULT_SETTINGS: Settings = {
  assetsFolder: null,
  renderOutputFolder: null,
  aiProvider: "openrouter",
  openRouterApiKey: null,
  openRouterModel: null,
  claudeCliPath: null,
};

const ENCRYPTED_PREFIX = "enc:";

function settingsFile(): string {
  return join(app.getPath("userData"), "settings.json");
}

function encryptSecret(value: string): string {
  if (!safeStorage.isEncryptionAvailable()) return value;
  return ENCRYPTED_PREFIX + safeStorage.encryptString(value).toString("base64");
}

function decryptSecret(value: string): string {
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value;
  if (!safeStorage.isEncryptionAvailable()) return "";
  const buf = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), "base64");
  try {
    return safeStorage.decryptString(buf);
  } catch {
    return "";
  }
}

async function readSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(settingsFile(), "utf-8");
    const data = JSON.parse(raw);
    const merged: Settings = { ...DEFAULT_SETTINGS, ...data };
    if (merged.openRouterApiKey) {
      merged.openRouterApiKey = decryptSecret(merged.openRouterApiKey);
    }
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function writeSettings(settings: Settings): Promise<void> {
  const toPersist: Settings = { ...settings };
  if (toPersist.openRouterApiKey) {
    toPersist.openRouterApiKey = encryptSecret(toPersist.openRouterApiKey);
  }
  await fs.writeFile(settingsFile(), JSON.stringify(toPersist, null, 2), "utf-8");
}

const THUMB_COLORS = ["#2563eb", "#1d4ed8", "#3b82f6", "#1e40af", "#0ea5e9"];

function registerIpc(): void {
  ipcMain.handle("projects:list", async (): Promise<Project[]> => {
    const projects = await readProjects();
    return projects.sort((a, b) => b.createdAt - a.createdAt);
  });

  ipcMain.handle("projects:get", async (_e, id: string): Promise<Project | null> => {
    const projects = await readProjects();
    return projects.find((p) => p.id === id) ?? null;
  });

  ipcMain.handle(
    "projects:create",
    async (_e, input: NewProjectInput): Promise<Project> => {
      const projects = await readProjects();
      const project: Project = {
        id:
          typeof globalThis.crypto?.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: input.name?.trim() || `Novo projeto ${projects.length + 1}`,
        type: input.type,
        createdAt: Date.now(),
        thumbColor: THUMB_COLORS[projects.length % THUMB_COLORS.length],
      };
      projects.push(project);
      await writeProjects(projects);
      return project;
    },
  );

  ipcMain.handle("settings:get", async (): Promise<Settings> => {
    return readSettings();
  });

  ipcMain.handle(
    "settings:update",
    async (_e, partial: Partial<Settings>): Promise<Settings> => {
      const current = await readSettings();
      const next: Settings = { ...current, ...partial };
      await writeSettings(next);
      return next;
    },
  );

  ipcMain.handle(
    "settings:pickFolder",
    async (_e, kind: FolderKind): Promise<string | null> => {
      const win = BrowserWindow.getFocusedWindow();
      const result = win
        ? await dialog.showOpenDialog(win, { properties: ["openDirectory"] })
        : await dialog.showOpenDialog({ properties: ["openDirectory"] });
      if (result.canceled || result.filePaths.length === 0) return null;
      const folder = result.filePaths[0];
      const current = await readSettings();
      const field = kind === "assets" ? "assetsFolder" : "renderOutputFolder";
      await writeSettings({ ...current, [field]: folder });
      return folder;
    },
  );

  ipcMain.handle("assets:reindex", async (): Promise<ReindexResult> => {
    const settings = await readSettings();
    if (!settings.assetsFolder) {
      return { ok: false, log: "Nenhuma pasta de assets configurada." };
    }
    if (app.isPackaged) {
      return {
        ok: false,
        log: "Reindexação só disponível em modo de desenvolvimento por enquanto.",
      };
    }
    return new Promise((resolvePromise) => {
      const child = spawn(
        process.execPath,
        [
          join(repoRoot, "scripts/index-assets.mjs"),
          settings.assetsFolder as string,
          "--out",
          "asset-manifest.json",
        ],
        { cwd: repoRoot, env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" } },
      );
      let log = "";
      child.stdout?.on("data", (d) => (log += d.toString()));
      child.stderr?.on("data", (d) => (log += d.toString()));
      child.on("error", (err) => resolvePromise({ ok: false, log: String(err) }));
      child.on("close", (code) => resolvePromise({ ok: code === 0, log }));
    });
  });

  // --- Geração por agentes / preview / render ---

  ipcMain.handle(
    "generate:start",
    async (e, projectId: string, brief: GenerateBrief): Promise<void> => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (!win) return;
      if (app.isPackaged) {
        win.webContents.send("generate:progress", {
          type: "error",
          message: "Geração só disponível em modo de desenvolvimento por enquanto.",
        });
        return;
      }
      const projects = await readProjects();
      const project = projects.find((p) => p.id === projectId);
      const type = project?.type ?? "GM";
      const settings = await readSettings();
      const dir = projectDir(projectId);
      await fs.mkdir(dir, { recursive: true });
      const args = [
        "--project-dir",
        dir,
        "--type",
        type,
        "--name",
        project?.name ?? "Projeto",
        "--brief",
        JSON.stringify(brief.answers ?? {}),
      ];
      if (brief.sourceVideoPath) args.push("--video", brief.sourceVideoPath);
      if (settings.assetsFolder) args.push(...(await assetsManifestArgs()));
      await streamOrchestrator(win, args, aiEnv(settings));
    },
  );

  ipcMain.handle(
    "generate:refine",
    async (e, projectId: string, instruction: string): Promise<void> => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (!win) return;
      if (app.isPackaged) {
        win.webContents.send("generate:progress", {
          type: "error",
          message: "Geração só disponível em modo de desenvolvimento por enquanto.",
        });
        return;
      }
      const projects = await readProjects();
      const project = projects.find((p) => p.id === projectId);
      const type = project?.type ?? "GM";
      const settings = await readSettings();
      const dir = projectDir(projectId);
      const refineArgs = ["--project-dir", dir, "--type", type, "--refine", instruction];
      if (settings.assetsFolder) refineArgs.push(...(await assetsManifestArgs()));
      await streamOrchestrator(win, refineArgs, aiEnv(settings));
    },
  );

  ipcMain.handle(
    "generate:readTimeline",
    async (_e, projectId: string): Promise<unknown | null> => {
      try {
        const raw = await fs.readFile(
          join(projectDir(projectId), "timeline.json"),
          "utf-8",
        );
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  );

  ipcMain.handle("shell:openPath", async (_e, path: string): Promise<void> => {
    await shell.openPath(path);
  });

  ipcMain.handle("video:pick", async (e): Promise<PickedVideo | null> => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const opts = {
      properties: ["openFile" as const],
      filters: [
        { name: "Vídeo", extensions: ["mp4", "mov", "webm", "mkv", "avi", "m4v"] },
      ],
    };
    const result = win
      ? await dialog.showOpenDialog(win, opts)
      : await dialog.showOpenDialog(opts);
    if (result.canceled || !result.filePaths[0]) return null;
    const path = result.filePaths[0];
    let durationSeconds = 0;
    try {
      const { parseMedia } = await import("@remotion/media-parser");
      const { nodeReader } = await import("@remotion/media-parser/node");
      const parsed = await parseMedia({
        src: path,
        reader: nodeReader,
        fields: { durationInSeconds: true },
        acknowledgeRemotionLicense: true,
      });
      durationSeconds = parsed.durationInSeconds ?? 0;
    } catch {
      durationSeconds = 0;
    }
    return { path, durationSeconds };
  });

  ipcMain.handle(
    "render:start",
    async (e, projectId: string): Promise<RenderResult> => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (app.isPackaged) {
        return {
          ok: false,
          outputDir: null,
          log: "Render só disponível em modo de desenvolvimento por enquanto.",
        };
      }
      const settings = await readSettings();
      const dir = projectDir(projectId);
      try {
        await fs.access(join(dir, "timeline.json"));
      } catch {
        return {
          ok: false,
          outputDir: null,
          log: "Timeline não encontrada. Gere o vídeo primeiro.",
        };
      }
      const projects = await readProjects();
      const type = projects.find((p) => p.id === projectId)?.type ?? "GM";
      const compId = type === "EV" ? "CapcutImported" : "AiDirected";

      const env: NodeJS.ProcessEnv = {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
      };
      if (settings.renderOutputFolder) {
        env.GMOTION_RENDER_OUTPUT = settings.renderOutputFolder;
      }
      const outputDir = settings.renderOutputFolder
        ? join(settings.renderOutputFolder, compId)
        : join(repoRoot, "out", compId);

      // 1) Externaliza assets + grava generated/*.json; 2) batch-render.
      const runStep = (script: string, args: string[]): Promise<{ code: number; log: string }> =>
        new Promise((resolveStep) => {
          const child = spawn(process.execPath, [join(repoRoot, script), ...args], {
            cwd: repoRoot,
            env,
          });
          let log = "";
          const onData = (d: Buffer) => {
            const s = d.toString();
            log += s;
            win?.webContents.send("generate:progress", { type: "log", message: s });
          };
          child.stdout?.on("data", onData);
          child.stderr?.on("data", onData);
          child.on("error", (err) => resolveStep({ code: 1, log: log + String(err) }));
          child.on("close", (code) => resolveStep({ code: code ?? 1, log }));
        });

      const prep = await runStep("scripts/ai-prepare-render.mjs", [
        "--project-dir",
        dir,
        "--type",
        type,
      ]);
      if (prep.code !== 0) {
        return { ok: false, outputDir: null, log: prep.log };
      }
      const render = await runStep("scripts/batch-render.mjs", [
        compId,
        "--formats",
        "1080x1920",
      ]);
      return {
        ok: render.code === 0,
        outputDir: render.code === 0 ? outputDir : null,
        log: prep.log + render.log,
      };
    },
  );
}

function projectDir(id: string): string {
  return join(app.getPath("userData"), "projects", id);
}

function aiEnv(settings: Settings): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ELECTRON_RUN_AS_NODE: "1" };
  if (settings.aiProvider === "openrouter") {
    env.GMOTION_AI_PROVIDER = "openrouter";
    if (settings.openRouterApiKey) env.OPENROUTER_API_KEY = settings.openRouterApiKey;
    if (settings.openRouterModel) env.OPENROUTER_MODEL = settings.openRouterModel;
  } else if (settings.aiProvider === "claude-cli") {
    env.GMOTION_AI_PROVIDER = "claude-cli";
    if (settings.claudeCliPath) env.CLAUDE_CLI_PATH = settings.claudeCliPath;
  }
  return env;
}

/** Spawna o wrapper de orquestração e encaminha cada linha NDJSON ao renderer. */
function streamOrchestrator(
  win: BrowserWindow,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<void> {
  return new Promise((resolvePromise) => {
    const child = spawn(
      process.execPath,
      [join(repoRoot, "scripts/ai-orchestrate.mjs"), ...args],
      { cwd: repoRoot, env },
    );
    let buf = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      buf += chunk.toString();
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          win.webContents.send("generate:progress", JSON.parse(line));
        } catch {
          win.webContents.send("generate:progress", { type: "log", message: line });
        }
      }
    });
    child.stderr?.on("data", (d: Buffer) =>
      win.webContents.send("generate:progress", {
        type: "log",
        message: d.toString(),
      }),
    );
    child.on("error", (err) => {
      win.webContents.send("generate:progress", {
        type: "error",
        message: String(err),
      });
      resolvePromise();
    });
    child.on("close", () => resolvePromise());
  });
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: "#0b0f19",
    title: "GMOTION",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.on("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL as string);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// Protocolo pra servir mídia local (vídeo-fonte, narração) ao renderer no
// preview — caminhos absolutos do disco não carregam numa página http.
// URL: gm-media://local/?p=<encodeURIComponent(caminhoAbsoluto)>
protocol.registerSchemesAsPrivileged([
  {
    scheme: "gm-media",
    privileges: { stream: true, supportFetchAPI: true, bypassCSP: true },
  },
]);

app.whenReady().then(() => {
  protocol.handle("gm-media", (request) => {
    const p = new URL(request.url).searchParams.get("p");
    if (!p) return new Response("missing p", { status: 400 });
    return net.fetch(pathToFileURL(p).toString(), {
      headers: request.headers,
    });
  });
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
