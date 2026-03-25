import type { MuninError } from "./types.js";

export class MuninSdkError extends Error {
  public readonly code: MuninError["code"];
  public readonly details?: Record<string, unknown>;

  constructor(error: MuninError) {
    super(error.message);
    this.name = "MuninSdkError";
    this.code = error.code;
    this.details = error.details;
  }
}

export class MuninTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MuninTransportError";
  }
}
