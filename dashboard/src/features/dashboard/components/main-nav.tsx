import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDownIcon, SearchIcon, SettingsIcon } from "lucide-react";

import { Button, buttonVariants } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { DARK_LOGO_URL, LIGHT_LOGO_URL } from "~/constants";
import { UserButton } from "~/features/auth/components/user-button";
import { NAV_LINKS } from "~/features/dashboard/constants";
import { cn } from "~/lib/utils";

export function MainNav() {
  const router = useRouterState();

  return (
    <nav className="fixed top-0 left-0 z-100 flex h-18 w-full justify-center border-b border-gray-200 bg-white px-8 py-4 max-md:hidden dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between">
        <div className="flex items-center gap-x-4">
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
          <ul className="flex items-center gap-x-0.5">
            {NAV_LINKS.map((link) => (
              <li key={`${link.id}-desktop`}>
                {!link.children ? (
                  <Link
                    to={link.to}
                    className={cn(
                      "flex h-10 items-center gap-x-1 rounded-md px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                      {
                        "bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200":
                          router.location.pathname === link.to,
                      },
                    )}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        "group flex h-10 cursor-pointer items-center gap-x-1 rounded-md px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-800 focus-visible:bg-gray-50 focus-visible:text-gray-800 focus-visible:outline-0 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-200 dark:focus-visible:bg-gray-800 dark:focus-visible:text-gray-200",
                        {
                          "bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200":
                            link.children.some(
                              (subLink) =>
                                subLink.to === router.location.pathname,
                            ),
                        },
                      )}
                    >
                      {link.label}
                      <ChevronDownIcon className="size-4 text-gray-400 group-data-[state=open]:rotate-180 dark:text-gray-600" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="z-100 w-84 space-y-0.5 p-2"
                    >
                      {link.children.map((subLink) => (
                        <DropdownMenuItem
                          key={`${subLink.id}-desktop`}
                          className="cursor-pointer p-3"
                          asChild
                        >
                          <Link
                            to={subLink.to}
                            className={cn(
                              "[&>svg]:text-brand-600! dark:[&>svg]:text-brand-500! flex items-start gap-x-3 [&>svg]:size-5",
                              {
                                "bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200":
                                  subLink.to === router.location.pathname,
                              },
                            )}
                          >
                            <subLink.icon className="mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                                {subLink.label}
                              </p>
                              <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                {subLink.description}
                              </p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-x-3">
          <div className="flex items-center gap-x-0.5 max-lg:hidden">
            <Button variant="tertiary" size="icon_sm">
              <SearchIcon />
            </Button>
            <Link
              to="/dashboard"
              className={buttonVariants({
                variant: "tertiary",
                size: "icon_sm",
              })}
            >
              <SettingsIcon />
            </Link>
          </div>
          <UserButton variant="dashboard" />
        </div>
      </div>
    </nav>
  );
}
