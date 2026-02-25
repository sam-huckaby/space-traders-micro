import React from "react";
import type { HttpError } from "@deck/http";
import { Alert } from "@deck/ui";

function isHttpError(error: unknown): error is HttpError {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { status?: unknown; message?: unknown };
  return typeof candidate.status === "number" && typeof candidate.message === "string";
}

function extractSpaceTradersMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const candidate = body as { error?: unknown; message?: unknown };

  if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message.trim();
  }

  if (typeof candidate.error === "object" && candidate.error !== null) {
    const errorObj = candidate.error as { message?: unknown };
    if (typeof errorObj.message === "string" && errorObj.message.trim().length > 0) {
      return errorObj.message.trim();
    }
  }

  return null;
}

export function getApiErrorMessage(error: unknown): string {
  if (!error) return "Unknown error.";

  if (isHttpError(error)) {
    const stMessage = extractSpaceTradersMessage(error.body);
    if (stMessage) return stMessage;
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: unknown };
    if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
      return candidate.message.trim();
    }
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }

  return "Unknown error.";
}

export function ApiDisclosure({
  title,
  subtitle,
  defaultOpen,
  children
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-md border border-emerald-200/15 bg-emerald-300/5 px-3 py-2" open={defaultOpen}>
      <summary className="cursor-pointer select-none text-sm font-semibold text-emerald-100">
        {title}
        {subtitle ? <span className="ml-2 text-xs font-normal text-emerald-200/70">{subtitle}</span> : null}
      </summary>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  );
}

export function ApiErrorAlert({ error }: { error: unknown }) {
  const message = getApiErrorMessage(error);
  return <Alert className="border-rose-300/30 bg-rose-400/10 text-rose-100">{message}</Alert>;
}

export function JsonPreview({ data, maxHeight = 260 }: { data: unknown; maxHeight?: number }) {
  let text = "";
  try {
    text = JSON.stringify(data, null, 2);
  } catch {
    text = String(data);
  }

  return (
    <pre
      className="overflow-auto rounded-md border border-emerald-200/15 bg-emerald-950/50 p-2 text-xs text-emerald-50/90"
      style={{ maxHeight }}
    >
      {text}
    </pre>
  );
}

