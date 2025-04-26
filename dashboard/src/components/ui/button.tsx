import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

import type { VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "focus-visible:ring-brand-500 group dark:focus-visible:ring-brand-400 relative isolate rounded-lg border font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:pointer-events-none dark:focus-visible:ring-offset-gray-950 [&_span]:inline-flex [&_span]:items-center [&_span]:justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-600 dark:hover:bg-brand-500 hover:bg-brand-700 text-white not-disabled:border-0 before:inset-0 before:rounded-lg before:shadow-[0px_1px_2px_0px_rgba(10,13,18,5%),inset_0px_-2px_0px_0px_rgba(10,13,18,5%),inset_0px_0px_0px_1px_rgba(10,13,18,18%)] not-disabled:before:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-b after:from-white/[.12] after:to-transparent not-disabled:after:absolute disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-xs dark:disabled:border-gray-800 dark:disabled:bg-gray-800 dark:disabled:text-gray-500",
        secondary:
          "border-gray-300 bg-white text-gray-700 not-disabled:border-0 before:inset-0 before:rounded-lg before:shadow-[0px_1px_2px_0px_rgba(10,13,18,5%),inset_0px_-2px_0px_0px_rgba(10,13,18,5%),inset_0px_0px_0px_1px_var(--color-gray-300)] not-disabled:before:absolute hover:bg-gray-50 hover:text-gray-800 disabled:border-gray-200 disabled:bg-white disabled:text-gray-400 disabled:shadow-xs dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:before:shadow-[0px_1px_2px_0px_rgba(10,13,18,5%),inset_0px_-2px_0px_0px_rgba(10,13,18,5%),inset_0px_0px_0px_1px_var(--color-gray-700)] dark:hover:bg-gray-800 dark:hover:text-gray-200 dark:disabled:border-gray-800 dark:disabled:bg-gray-950 dark:disabled:text-gray-500",
        tertiary:
          "border-transparent bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-700 disabled:border-transparent disabled:bg-transparent disabled:text-gray-400 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-300 dark:disabled:text-gray-500",
        link: "rounded-sm border-transparent bg-transparent text-gray-600 hover:text-gray-700 disabled:text-gray-400 dark:text-gray-400 dark:hover:text-gray-300",
        link_color:
          "text-brand-700 hover:text-brand-800 border-transparent bg-transparent disabled:text-gray-400 dark:text-gray-300 dark:hover:text-gray-200",
        destructive:
          "focus-visible:ring-error-500 dark:focus-visible:ring-error-500 bg-error-600 text-white not-disabled:border-0 before:inset-0 before:rounded-lg before:shadow-[0px_1px_2px_0px_rgba(10,13,18,5%),inset_0px_-2px_0px_0px_rgba(10,13,18,5%),inset_0px_0px_0px_1px_rgba(10,13,18,18%)] not-disabled:before:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-b after:from-white/[.12] after:to-transparent not-disabled:after:absolute disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-xs dark:disabled:border-gray-800 dark:disabled:bg-gray-800 dark:disabled:text-gray-500",
      },
      size: {
        sm: "h-9 px-3 py-2 text-sm [&_span]:gap-1.5 [&_svg]:size-5",
        md: "h-10 px-3.5 py-2.5 text-sm [&_span]:gap-1.5 [&_svg]:size-5",
        lg: "h-11 px-4 py-2.5 [&_span]:gap-2 [&_svg]:size-5",
        "2xl": "h-15 px-5.5 py-4 text-lg [&_span]:gap-2.5 [&_svg]:size-6",
        icon_sm: "size-9 p-2 [&_svg]:size-5",
        icon_md: "size-10 p-2.5 [&_svg]:size-5",
        link_sm: "gap-1.5 text-sm [&_svg]:size-5",
        link_md: "gap-1.5 text-sm [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

const buttonInnerVariants = cva("absolute inset-0.5 z-10 rounded-md", {
  variants: {
    variant: {
      primary:
        "bg-brand-600 group-hover:bg-brand-700 dark:group-hover:bg-brand-500 group-disabled:hidden",
      secondary:
        "bg-white group-hover:bg-gray-50 group-disabled:hidden dark:bg-gray-950 dark:group-hover:bg-gray-800",
      destructive: "bg-error-600 group-disabled:hidden",
    },
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    const innerVariant =
      variant === "primary" ||
      variant === "secondary" ||
      variant === "destructive"
        ? variant
        : undefined;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {innerVariant && (
          <div
            aria-hidden="true"
            className={buttonInnerVariants({ variant: innerVariant })}
          />
        )}
        {isLoading ? (
          <span>
            <Loader2Icon className="relative z-10 animate-spin" />
            <span className="sr-only">Loading...</span>
          </span>
        ) : (
          <span className="relative z-10">{children}</span>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
