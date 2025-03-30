import { Link, useRouter } from "@tanstack/react-router";
import {
  LayoutGridIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { authClient } from "~/lib/auth-client";
import { getInitials } from "~/utils/get-initials";

export function UserButton() {
  const router = useRouter();

  const { data, isPending } = authClient.useSession();
  const { setTheme, theme } = useTheme();

  if (isPending) {
    return <Skeleton className="size-10 rounded-full bg-gray-200" />;
  }

  if (!data?.user) {
    return null;
  }

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.invalidate();
        },
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 size-10 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none dark:focus-visible:ring-offset-gray-950">
        <Avatar>
          <AvatarImage
            src={data.user.image as string}
            alt={`${data.user.name} avatar`}
          />
          <AvatarFallback>{getInitials(data.user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[248px]">
        <div className="mb-1 flex items-center gap-x-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <Avatar>
            <AvatarImage
              src={data.user.image as string}
              alt={`${data.user.name} avatar`}
            />
            <AvatarFallback>{getInitials(data.user.name)}</AvatarFallback>
          </Avatar>
          <div className="w-full overflow-hidden">
            <p
              title={data.user.name}
              className="truncate text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              {data.user.name}
            </p>
            <p
              title={data.user.email}
              className="truncate text-sm text-gray-600 dark:text-gray-400"
            >
              {data.user.email}
            </p>
          </div>
        </div>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/">
              <UserIcon />
              View profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/">
              <LayoutGridIcon />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              setTheme(theme === "light" ? "dark" : "light");
            }}
          >
            {theme === "light" ? (
              <>
                <MoonIcon />
                Dark theme
              </>
            ) : (
              <>
                <SunIcon />
                Light theme
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/">
              <SettingsIcon />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="mb-1">
          <DropdownMenuItem onSelect={handleSignOut}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
