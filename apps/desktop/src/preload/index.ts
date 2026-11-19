import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type {
  AgentEvent,
  FolderKind,
  GenerateBrief,
  GmotionApi,
  NewProjectInput,
  Settings,
} from "../shared/types";

const api: GmotionApi = {
  listProjects: () => ipcRenderer.invoke("projects:list"),
  getProject: (id: string) => ipcRenderer.invoke("projects:get", id),
  createProject: (input: NewProjectInput) =>
    ipcRenderer.invoke("projects:create", input),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: (partial: Partial<Settings>) =>
    ipcRenderer.invoke("settings:update", partial),
  pickFolder: (kind: FolderKind) => ipcRenderer.invoke("settings:pickFolder", kind),
  reindexAssets: () => ipcRenderer.invoke("assets:reindex"),
  pickVideo: () => ipcRenderer.invoke("video:pick"),
  startGenerate: (projectId: string, brief: GenerateBrief) =>
    ipcRenderer.invoke("generate:start", projectId, brief),
  refineGenerate: (projectId: string, instruction: string) =>
    ipcRenderer.invoke("generate:refine", projectId, instruction),
  readTimeline: (projectId: string) =>
    ipcRenderer.invoke("generate:readTimeline", projectId),
  startRender: (projectId: string) => ipcRenderer.invoke("render:start", projectId),
  openPath: (path: string) => ipcRenderer.invoke("shell:openPath", path),
  onProgress: (cb: (evt: AgentEvent) => void) => {
    const listener = (_e: IpcRendererEvent, evt: AgentEvent) => cb(evt);
    ipcRenderer.on("generate:progress", listener);
    return () => ipcRenderer.removeListener("generate:progress", listener);
  },
};

contextBridge.exposeInMainWorld("gmotion", api);
