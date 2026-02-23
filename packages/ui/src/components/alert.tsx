import * as React from "react";
import { cn } from "../lib/utils";

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200",
        className
      )}
      role="alert"
      {...props}
    />
  );
}
