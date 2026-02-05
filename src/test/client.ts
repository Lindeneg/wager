import config from "@/config";

const BASE_URL = `http://localhost:${config.PORT}`;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
    body?: unknown;
    headers?: Record<string, string>;
}

interface TestResponse<T = unknown> {
    status: number;
    ok: boolean;
    data: T;
    headers: Headers;
}

class TestClient {
    private cookies: Map<string, string> = new Map();

    private buildCookieHeader(): string {
        return Array.from(this.cookies.entries())
            .map(([name, value]) => `${name}=${value}`)
            .join("; ");
    }

    private parseCookies(response: Response): void {
        const setCookie = response.headers.getSetCookie?.() || [];
        for (const cookie of setCookie) {
            const [nameValue] = cookie.split(";");
            const [name, value] = nameValue.split("=");
            if (name && value !== undefined) {
                if (value === "" || cookie.includes("Max-Age=0")) {
                    this.cookies.delete(name.trim());
                } else {
                    this.cookies.set(name.trim(), value.trim());
                }
            }
        }
    }

    async request<T = unknown>(
        method: HttpMethod,
        path: string,
        options: RequestOptions = {}
    ): Promise<TestResponse<T>> {
        const url = `${BASE_URL}${path}`;
        const headers: Record<string, string> = {
            ...options.headers,
        };

        if (options.body) {
            headers["Content-Type"] = "application/json";
        }

        const cookieHeader = this.buildCookieHeader();
        if (cookieHeader) {
            headers["Cookie"] = cookieHeader;
        }

        const response = await fetch(url, {
            method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
            redirect: "manual",
        });

        this.parseCookies(response);

        let data: T;
        const contentType = response.headers.get("Content-Type");
        if (contentType?.includes("application/json")) {
            data = await response.json();
        } else {
            data = (await response.text()) as T;
        }

        return {
            status: response.status,
            ok: response.ok,
            data,
            headers: response.headers,
        };
    }

    get<T = unknown>(path: string, options?: RequestOptions) {
        return this.request<T>("GET", path, options);
    }

    post<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>("POST", path, {...options, body});
    }

    put<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>("PUT", path, {...options, body});
    }

    patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>("PATCH", path, {...options, body});
    }

    delete<T = unknown>(path: string, options?: RequestOptions) {
        return this.request<T>("DELETE", path, options);
    }

    clearCookies() {
        this.cookies.clear();
    }

    hasCookie(name: string): boolean {
        return this.cookies.has(name);
    }
}

// Shared client instance for stateful tests
export const client = new TestClient();

// Create a fresh client when needed
export function createClient(): TestClient {
    return new TestClient();
}
