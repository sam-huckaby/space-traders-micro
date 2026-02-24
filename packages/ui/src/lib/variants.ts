import type { ClassValue } from "clsx";
import { cn } from "./utils";

type VariantDefinitions = Record<string, Record<string, ClassValue>>;

type VariantSelection<TVariants extends VariantDefinitions> = {
  [TVariant in keyof TVariants]?: keyof TVariants[TVariant] | null | undefined;
};

type DefaultVariants<TVariants extends VariantDefinitions> = {
  [TVariant in keyof TVariants]?: keyof TVariants[TVariant];
};

type VariantPropsInput<TVariants extends VariantDefinitions> = VariantSelection<TVariants> & {
  className?: ClassValue;
};

interface VariantConfig<TVariants extends VariantDefinitions> {
  variants?: TVariants;
  defaultVariants?: DefaultVariants<TVariants>;
}

export type VariantProps<T extends (...args: any[]) => string> = T extends (
  props?: infer TProps
) => string
  ? TProps extends object
    ? Omit<TProps, "className">
    : never
  : never;

export function createVariants<TVariants extends VariantDefinitions = Record<never, never>>(
  base: ClassValue,
  config: VariantConfig<TVariants> = {}
) {
  const {
    variants = {} as TVariants,
    defaultVariants = {} as DefaultVariants<TVariants>
  } = config;

  return (props: VariantPropsInput<TVariants> = {} as VariantPropsInput<TVariants>) => {
    const classes: ClassValue[] = [base];

    for (const variantName of Object.keys(variants) as Array<keyof TVariants>) {
      const variantOptions = variants[variantName];
      const variantValue = props[variantName] ?? defaultVariants[variantName];

      if (variantValue == null) {
        continue;
      }

      const variantClassName = variantOptions[variantValue as keyof typeof variantOptions];

      if (variantClassName) {
        classes.push(variantClassName);
      }
    }

    if (props.className) {
      classes.push(props.className);
    }

    return cn(...classes);
  };
}
