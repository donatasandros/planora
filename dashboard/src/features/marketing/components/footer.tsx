import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-gray-50 px-4 py-12 md:px-8 dark:bg-gray-900">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link to="/">
          <img
            src="https://cdn.zenpa.xyz/3Cg5.svg"
            alt="Logo"
            className="h-8 dark:hidden"
          />
          <img
            src="https://cdn.zenpa.xyz/Cr3O.svg"
            alt="Logo"
            className="hidden h-8 dark:block"
          />
        </Link>
        <p className="text-gray-500 dark:text-gray-400">
          © 2025 Planora. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
