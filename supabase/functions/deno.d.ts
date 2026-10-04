declare namespace Deno {
    interface Env {
        get(key: string): string | undefined;
    }
    export const env: Env;
    export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

