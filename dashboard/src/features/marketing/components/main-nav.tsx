import { Link } from "@tanstack/react-router";
import * as React from "react";

import { buttonVariants } from "~/components/ui/button";
import { DARK_LOGO_URL, LIGHT_LOGO_URL } from "~/constants";
import { cn } from "~/lib/utils";

export function MainNav() {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 z-200 w-full px-4 transition-all md:px-8",
        isScrolled ? "pt-3" : "py-4.5",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1280px] items-center justify-between border transition-all",
          isScrolled
            ? "h-16 rounded-2xl border-gray-200 bg-white/70 py-3 pr-3 pl-4 shadow-xs backdrop-blur-3xl dark:border-gray-800 dark:bg-gray-950/80"
            : "h-11 border-transparent",
        )}
      >
        <div className="flex items-center">
          <Link to="/">
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
        </div>
        <div className="flex items-center gap-x-3">
          <Link
            to="/auth/sign-in"
            className={buttonVariants({ variant: "secondary", size: "md" })}
          >
            Log in
          </Link>
          <Link
            to="/auth/sign-in"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}
