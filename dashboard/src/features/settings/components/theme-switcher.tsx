import { useTheme } from "next-themes";

import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();

  return (
    <ScrollArea className="-mx-1 max-w-160">
      <RadioGroup
        className="flex gap-x-5 px-1 pt-1"
        defaultValue={theme}
        onValueChange={setTheme}
      >
        {/* System */}
        <Label htmlFor="system-preference">
          <div className="relative space-y-3 select-none">
            <div className="relative">
              <RadioGroupItem
                value="system"
                id="system-preference"
                className="absolute bottom-2 left-2 z-10 data-[state=unchecked]:opacity-0 dark:focus-visible:ring-offset-white"
              />
              <div
                className={cn(
                  "h-33 w-50 overflow-hidden rounded-[10px] border border-gray-300 bg-gray-100",
                  theme === "system" &&
                    "ring-brand-500 dark:ring-brand-400 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950",
                )}
              >
                <div>
                  <div className="absolute top-px left-[13.2px] h-10 w-[1.25px] bg-gray-200"></div>
                  <div className="absolute top-px right-[13.2px] h-10 w-[1.25px] bg-gray-200"></div>
                  <div className="absolute inset-x-px top-[13.2px] h-[1.25px] w-25 bg-gray-200"></div>
                  <div className="dark absolute right-0 z-10 -mt-[0.9px] h-full w-1/2 overflow-hidden">
                    <div className="relative -ml-25 h-33 w-50 overflow-hidden rounded-[10px] border dark:border-gray-700 dark:bg-gray-800">
                      <div>
                        <div className="absolute top-0 left-[13.2px] h-full w-[1.25px] dark:bg-gray-700"></div>
                        <div className="absolute top-0 right-[13.2px] h-full w-[1.25px] dark:bg-gray-700"></div>
                        <div className="absolute top-[13.2px] left-0 h-[1.25px] w-full dark:bg-gray-700"></div>
                      </div>
                      <div className="relative mx-[12.5px] mt-[12.5px] h-full overflow-hidden rounded-[5px] border-[0.6px] dark:border-gray-700 dark:bg-gray-950">
                        <div className="flex items-center justify-start gap-x-[2.5px] border-b-[0.6px] px-[4.5px] py-[3.5px] dark:border-gray-700 dark:bg-gray-900">
                          <div className="size-1 rounded-full border border-black/10 bg-[#EE6A5F]"></div>
                          <div className="size-1 rounded-full border border-black/10 bg-[#F5BD4F]"></div>
                          <div className="size-1 rounded-full border border-black/10 bg-[#61C454]"></div>
                        </div>
                        <div className="flex h-full">
                          <div className="space-y-[7.5px] border-r-[0.3px] p-1.5 dark:border-gray-700">
                            <div className="flex items-center gap-x-[1.5px]">
                              <div className="size-[5px] rounded-full dark:bg-gray-700"></div>
                              <div className="h-[3.75px] w-[13.75px] rounded-[1.25px] dark:bg-gray-700"></div>
                            </div>
                            <div className="space-y-[3.75px]">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "h-[5px] w-[27.5px] rounded-[1.25px] dark:bg-gray-800",
                                    i === 0 && "dark:bg-gray-700",
                                  )}
                                ></div>
                              ))}
                            </div>
                          </div>
                          <div className="w-full p-[6.25px]">
                            <div className="mb-[4.2px] flex w-full justify-between">
                              <p className="text-[6.88px] font-bold dark:text-gray-50">
                                Your dashboard
                              </p>
                              <div className="flex items-center gap-x-[3px]">
                                <div className="h-[6.88px] w-5 rounded-[1.88px] dark:bg-gray-800"></div>
                                <div className="h-[6.88px] w-5 rounded-[1.88px] dark:bg-gray-700"></div>
                              </div>
                            </div>
                            <div className="mb-[5px] h-[3.75px] w-[65px] rounded-[1.25px] dark:bg-gray-800"></div>
                            <div className="mb-[5px] h-[45px] w-full rounded-[3.75px] dark:bg-gray-900"></div>
                            <div className="mb-[5px] h-[45px] w-full rounded-[3.75px] dark:bg-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative mx-[12.5px] mt-[12.5px] h-full overflow-hidden rounded-[5px] border-[0.6px] border-gray-300 bg-white">
                  <div className="flex items-center justify-start gap-x-[2.5px] border-b-[0.6px] border-gray-200 bg-gray-50 px-[4.5px] py-[3.5px]">
                    <div className="size-1 rounded-full border border-black/10 bg-[#EE6A5F]"></div>
                    <div className="size-1 rounded-full border border-black/10 bg-[#F5BD4F]"></div>
                    <div className="size-1 rounded-full border border-black/10 bg-[#61C454]"></div>
                  </div>
                  <div className="flex h-full">
                    <div className="space-y-[7.5px] border-r-[0.3px] border-gray-200 p-1.5">
                      <div className="flex items-center gap-x-[1.5px]">
                        <div className="bg-brand-600 size-[5px] rounded-full"></div>
                        <div className="bg-brand-600 h-[3.75px] w-[13.75px] rounded-[1.25px]"></div>
                      </div>
                      <div className="space-y-[3.75px]">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-[5px] w-[27.5px] rounded-[1.25px] bg-gray-100",
                              i === 0 && "bg-brand-600",
                            )}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="w-full p-[6.25px]">
                      <div className="mb-[4.2px] flex w-full justify-between">
                        <p className="text-[6.88px] font-bold text-gray-900">
                          Your dashboard
                        </p>
                        <div className="flex items-center gap-x-[3px]">
                          <div className="h-[6.88px] w-5 rounded-[1.88px] bg-gray-100"></div>
                          <div className="bg-brand-600 h-[6.88px] w-5 rounded-[1.88px]"></div>
                        </div>
                      </div>
                      <div className="mb-[5px] h-[3.75px] w-[65px] rounded-[1.25px] bg-gray-100"></div>
                      <div className="mb-[5px] h-[45px] w-full rounded-[3.75px] bg-gray-50"></div>
                      <div className="mb-[5px] h-[45px] w-full rounded-[3.75px] bg-gray-50"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              System preference
            </p>
          </div>
        </Label>
        {/* Light */}
        <Label htmlFor="light-theme">
          <div className="space-y-3 select-none">
            <div
              className={cn(
                "relative h-33 w-50 overflow-hidden rounded-[10px] border border-gray-300 bg-gray-100",
                theme === "light" &&
                  "ring-brand-500 dark:ring-brand-400 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950",
              )}
            >
              <RadioGroupItem
                value="light"
                id="light-theme"
                className="absolute bottom-2 left-2 z-10 data-[state=unchecked]:opacity-0"
              />
              <div>
                <div className="absolute top-0 left-[13.2px] h-full w-[1.25px] bg-gray-200"></div>
                <div className="absolute top-0 right-[13.2px] h-full w-[1.25px] bg-gray-200"></div>
                <div className="absolute top-[13.2px] left-0 h-[1.25px] w-full bg-gray-200"></div>
              </div>
              <div className="relative mx-[12.5px] mt-[12.5px] h-full overflow-hidden rounded-[5px] border-[0.6px] border-gray-300 bg-white">
                <div className="flex items-center justify-start gap-x-[2.5px] border-b-[0.6px] border-gray-200 bg-gray-50 px-[4.5px] py-[3.5px]">
                  <div className="size-1 rounded-full border border-black/10 bg-[#EE6A5F]"></div>
                  <div className="size-1 rounded-full border border-black/10 bg-[#F5BD4F]"></div>
                  <div className="size-1 rounded-full border border-black/10 bg-[#61C454]"></div>
                </div>
                <div className="flex h-full">
                  <div className="space-y-[7.5px] border-r-[0.3px] border-gray-200 p-1.5">
                    <div className="flex items-center gap-x-[1.5px]">
                      <div className="bg-brand-600 size-[5px] rounded-full"></div>
                      <div className="bg-brand-600 h-[3.75px] w-[13.75px] rounded-[1.25px]"></div>
                    </div>
                    <div className="space-y-[3.75px]">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-[5px] w-[27.5px] rounded-[1.25px] bg-gray-100",
                            i === 0 && "bg-brand-600",
                          )}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full p-[6.25px]">
                    <div className="mb-[4.2px] flex w-full justify-between">
                      <p className="text-[6.88px] font-bold text-gray-900">
                        Your dashboard
                      </p>
                      <div className="flex items-center gap-x-[3px]">
                        <div className="h-[6.88px] w-5 rounded-[1.88px] bg-gray-100"></div>
                        <div className="bg-brand-600 h-[6.88px] w-5 rounded-[1.88px]"></div>
                      </div>
                    </div>
                    <div className="mb-[5px] h-[3.75px] w-[65px] rounded-[1.25px] bg-gray-100"></div>
                    <div className="mb-[5px] h-[45px] w-full rounded-[3.75px] bg-gray-50"></div>
                    <div className="mb-[5px] h-[45px] w-full rounded-[3.75px] bg-gray-50"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Light mode
            </p>
          </div>
        </Label>
        {/* Dark mode */}
        <Label htmlFor="dark-theme">
          <div className="space-y-3 select-none">
            <div className="dark">
              <div
                className={cn(
                  "relative h-33 w-50 overflow-hidden rounded-[10px] border dark:border-gray-700 dark:bg-gray-800",
                  theme === "dark" &&
                    "ring-brand-500 dark:ring-brand-400 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950",
                )}
              >
                <RadioGroupItem
                  value="dark"
                  id="dark-theme"
                  className="absolute bottom-2 left-2 z-10 data-[state=unchecked]:opacity-0"
                />
                <div>
                  <div className="absolute top-0 left-[13.2px] h-full w-[1.25px] dark:bg-gray-700"></div>
                  <div className="absolute top-0 right-[13.2px] h-full w-[1.25px] dark:bg-gray-700"></div>
                  <div className="absolute top-[13.2px] left-0 h-[1.25px] w-full dark:bg-gray-700"></div>
                </div>
                <div className="relative mx-[12.5px] mt-[12.5px] h-full overflow-hidden rounded-[5px] border-[0.6px] dark:border-gray-700 dark:bg-gray-950">
                  <div className="flex items-center justify-start gap-x-[2.5px] border-b-[0.6px] px-[4.5px] py-[3.5px] dark:border-gray-700 dark:bg-gray-900">
                    <div className="size-1 rounded-full border border-black/10 bg-[#EE6A5F]"></div>
                    <div className="size-1 rounded-full border border-black/10 bg-[#F5BD4F]"></div>
                    <div className="size-1 rounded-full border border-black/10 bg-[#61C454]"></div>
                  </div>
                  <div className="flex h-full">
                    <div className="space-y-[7.5px] border-r-[0.3px] p-1.5 dark:border-gray-700">
                      <div className="flex items-center gap-x-[1.5px]">
                        <div className="size-[5px] rounded-full dark:bg-gray-700"></div>
                        <div className="h-[3.75px] w-[13.75px] rounded-[1.25px] dark:bg-gray-700"></div>
                      </div>
                      <div className="space-y-[3.75px]">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-[5px] w-[27.5px] rounded-[1.25px] dark:bg-gray-800",
                              i === 0 && "dark:bg-gray-700",
                            )}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="w-full p-[6.25px]">
                      <div className="mb-[4.2px] flex w-full justify-between">
                        <p className="text-[6.88px] font-bold dark:text-gray-50">
                          Your dashboard
                        </p>
                        <div className="flex items-center gap-x-[3px]">
                          <div className="h-[6.88px] w-5 rounded-[1.88px] dark:bg-gray-800"></div>
                          <div className="h-[6.88px] w-5 rounded-[1.88px] dark:bg-gray-700"></div>
                        </div>
                      </div>
                      <div className="mb-[5px] h-[3.75px] w-[65px] rounded-[1.25px] dark:bg-gray-800"></div>
                      <div className="mb-[5px] h-[45px] w-full rounded-[3.75px] dark:bg-gray-900"></div>
                      <div className="mb-[5px] h-[45px] w-full rounded-[3.75px] dark:bg-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Dark mode
            </p>
          </div>
        </Label>
      </RadioGroup>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
