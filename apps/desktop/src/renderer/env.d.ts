/// <reference types="vite/client" />
import type { GmotionApi } from "../shared/types";

declare global {
  interface Window {
    gmotion: GmotionApi;
  }
}

export {};
