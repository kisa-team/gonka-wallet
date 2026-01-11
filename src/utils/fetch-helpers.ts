import deepmerge from "deepmerge";
import type { ObjectType } from "../types/primitives";

export const fetcher = async <T = any>(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<T> => {
    const res = await fetch(input, init);
    const text = await res.text();

    if (!res.ok) {
        let errorData: any = {};
        try {
            errorData = JSON.parse(text);
        } catch {}
        const error = new Error(errorData?.error || res.statusText);
        (error as any).status = res.status;
        throw error;
    }

    try {
        return JSON.parse(text, reviveDates);
    } catch {
        throw new Error("Invalid JSON");
    }
};

export async function getJson<R extends ObjectType, Q extends ObjectType = ObjectType>(
    url: string,
    query?: Q,
    init: RequestInit = {}
): Promise<R> {
    url = url.endsWith("/") ? url : url; // + "/"
    const queryString = Object.entries(query || {})
        .map(([field, value]) => `${field}=${value}`)
        .join("&");
    const urlWithQuery = queryString ? `${url}?${queryString}` : url;
    return await fetcher<R>(urlWithQuery, init);
}

export async function postJson<R extends ObjectType, B extends ObjectType = ObjectType>(
    url: string,
    body?: B,
    init: RequestInit = {}
): Promise<R> {
    const bodyData = JSON.stringify(body || {});
    // console.log(`[POST] ${url} | ${bodyData}`)
    return await fetcher<R>(
        url,
        deepmerge(
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: bodyData,
            },
            init
        )
    );
}

export async function postFormData<R extends ObjectType, B extends ObjectType = ObjectType>(
    url: string,
    body: Partial<B>,
    init: RequestInit = {},
    onProgress: (percent: number) => void = () => {}
): Promise<R> {
    return new Promise((resolve, reject) => {
        const data = new FormData();
        for (const [k, v] of Object.entries(body)) {
            data.set(k, v);
        }

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.responseType = "json";

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(new Error(xhr.response.error || xhr.response || `Failed: ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error("Upload error"));

        xhr.send(data);
    });
}

export function reviveDates(key: string, value: any) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
}
