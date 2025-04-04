import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "~/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 shadow-xs dark:border-gray-800 dark:bg-gray-950",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 ml-[-1px] inline-flex h-9 items-center justify-center rounded-lg border border-transparent px-3 py-2 text-sm font-semibold whitespace-nowrap text-gray-500 ring-offset-white transition-all hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none data-[state=active]:border-gray-300 data-[state=active]:bg-white data-[state=active]:text-gray-700 data-[state=active]:shadow-xs dark:text-gray-400 dark:ring-offset-gray-950 dark:hover:text-gray-300 dark:data-[state=active]:border-gray-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-gray-300",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 mt-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:ring-offset-gray-950",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
