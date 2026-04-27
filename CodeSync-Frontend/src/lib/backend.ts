export class BackendNotImplementedError extends Error {
  constructor(feature: string) {
    super(
      `[Backend missing] "${feature}" is not implemented. ` +
        `Connect the Java Spring Boot backend (see docs/JAVA_BACKEND.md).`
    );
    this.name = 'BackendNotImplementedError';
  }
}

export function notImplemented(feature: string): never {
  throw new BackendNotImplementedError(feature);
}

/** Base URL for the Java backend (set this in `.env` once the backend is running). */
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? '';
