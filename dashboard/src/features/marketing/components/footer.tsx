import { FaDiscord, FaGithub, FaXTwitter } from "react-icons/fa6";

export function Footer() {
  return (
    <footer className="bg-gray-50 px-4 py-12 md:px-8 dark:bg-gray-900">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-x-6">
          <a href="">
            <FaDiscord className="size-6 fill-gray-400 hover:fill-gray-500 dark:fill-gray-600 dark:hover:fill-gray-500" />
          </a>
          <a href="">
            <FaGithub className="size-6 fill-gray-400 hover:fill-gray-500 dark:fill-gray-600 dark:hover:fill-gray-500" />
          </a>
          <a href="">
            <FaXTwitter className="size-6 fill-gray-400 hover:fill-gray-500 dark:fill-gray-600 dark:hover:fill-gray-500" />
          </a>
        </div>
        <p className="flex-1 text-right text-gray-500 dark:text-gray-400">
          © 2025 Planora. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
