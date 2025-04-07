import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "group dark:focus-visible:ring-brand-400 focus-visible:ring-brand-500 flex size-4 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-50 disabled:text-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:focus-visible:ring-offset-gray-950 dark:disabled:border-gray-700 dark:disabled:bg-gray-900 dark:data-[state=checked]:disabled:border-gray-700",
      "dark:data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600 dark:data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600 data-[state=checked]:text-white data-[state=checked]:disabled:border-gray-300 data-[state=checked]:disabled:bg-gray-50 data-[state=checked]:disabled:text-gray-300 dark:data-[state=checked]:disabled:border-gray-700 dark:data-[state=checked]:disabled:text-gray-600",
      "dark:data-[state=indeterminate]:bg-brand-600 data-[state=indeterminate]:border-brand-600 dark:data-[state=indeterminate]:border-brand-600 data-[state=indeterminate]:bg-brand-600 data-[state=indeterminate]:text-white data-[state=indeterminate]:disabled:border-gray-300 data-[state=indeterminate]:disabled:bg-gray-50 data-[state=indeterminate]:disabled:text-gray-300 dark:data-[state=indeterminate]:disabled:border-gray-700 dark:data-[state=indeterminate]:disabled:text-gray-600",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <CheckIcon className="hidden size-3 group-data-[state=checked]:block" />
      <MinusIcon className="hidden size-3 group-data-[state=indeterminate]:block" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
