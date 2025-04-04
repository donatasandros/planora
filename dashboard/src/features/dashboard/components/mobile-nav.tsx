import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDownIcon, MenuIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { DARK_LOGO_URL, LIGHT_LOGO_URL } from "~/constants";
import { UserButton } from "~/features/auth/components/user-button";
import { NAV_LINKS } from "~/features/dashboard/constants";
import { cn } from "~/lib/utils";

export function MobileNav() {
  const router = useRouterState();

  return (
    <nav className="fixed top-0 left-0 z-100 flex h-16 w-full justify-center border-b border-gray-200 bg-white px-4 py-4 md:hidden dark:border-gray-800 dark:bg-gray-950">
      <div className="flex w-full items-center justify-between">
        <Link to="/dashboard">
          <img
            src={LIGHT_LOGO_URL}
            alt="Planora logo"
            className="h-8 dark:hidden"
          />
          <img
            src={DARK_LOGO_URL}
            alt="Planora logo"
            className="hidden h-8 dark:block"
          />
        </Link>
        <div className="flex items-center gap-x-3">
          <UserButton variant="dashboard" />
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="tertiary" size="icon_md">
                <MenuIcon />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerTitle className="sr-only">Navigation menu</DrawerTitle>
              <div className="flex flex-col gap-4 py-6">
                <ul className="space-y-0.5">
                  {NAV_LINKS.map((link) => (
                    <li key={`${link.id}-mobile`}>
                      {!link.children ? (
                        <Link
                          to={link.to}
                          className={cn(
                            "block px-4 py-3 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-50 dark:hover:bg-gray-800",
                            {
                              "bg-gray-50 dark:bg-gray-800":
                                link.to === router.location.pathname,
                            },
                          )}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <AccordionPrimitive.Root
                          type="single"
                          collapsible={true}
                        >
                          <AccordionPrimitive.Item value={link.label}>
                            <AccordionPrimitive.Header>
                              <AccordionPrimitive.Trigger
                                className={cn(
                                  "group flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-50 dark:hover:bg-gray-800",
                                  {
                                    "bg-gray-50 dark:bg-gray-800":
                                      link.children.some(
                                        (subLink) =>
                                          subLink.to ===
                                          router.location.pathname,
                                      ),
                                  },
                                )}
                              >
                                {link.label}
                                <ChevronDownIcon className="size-4 text-gray-400 group-data-[state=open]:rotate-180 dark:text-gray-600" />
                              </AccordionPrimitive.Trigger>
                            </AccordionPrimitive.Header>
                            <AccordionPrimitive.Content className="mx-3 mt-0.5 mb-2 rounded-xl border border-gray-200 bg-white py-2 shadow-xs dark:border-gray-800 dark:bg-gray-950">
                              <div className="flex flex-col gap-1">
                                {link.children.map((subLink) => (
                                  <Link
                                    key={`${subLink.id}-mobile`}
                                    to={subLink.to}
                                    className={cn(
                                      "flex items-start gap-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800",
                                      {
                                        "bg-gray-50 dark:bg-gray-800":
                                          subLink.to ===
                                          router.location.pathname,
                                      },
                                    )}
                                  >
                                    <subLink.icon className="text-brand-600 dark:text-brand-500 mt-0.5 size-5" />
                                    <div className="space-y-0.5">
                                      <p className="font-semibold text-gray-900 dark:text-gray-50">
                                        {subLink.label}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {subLink.description}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </AccordionPrimitive.Content>
                          </AccordionPrimitive.Item>
                        </AccordionPrimitive.Root>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </nav>
  );
}
