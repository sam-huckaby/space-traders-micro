import * as React from "react";
import { createVariants, type VariantProps } from "../lib/variants";

const badgeVariants = createVariants(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition",
  {
    variants: {
      variant: {
        default: "border-cyan-300/40 bg-cyan-300/15 text-cyan-100",
        neutral: "border-slate-600 bg-slate-800 text-slate-200",
        warning: "border-amber-300/40 bg-amber-300/15 text-amber-100"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}
