import { SOCIAL_LINKS } from "~/features/marketing/constants";

export function Footer() {
  return (
    <footer className="bg-gray-50 px-4 py-12 md:px-8 dark:bg-gray-900">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-x-6">
          {SOCIAL_LINKS.map((link) => (
            <a key={link.id} href={link.url} target="_blank">
              <link.icon className="size-6 fill-gray-400 hover:fill-gray-500 dark:fill-gray-600 dark:hover:fill-gray-500" />
            </a>
          ))}
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          © 2025 Planora. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
