import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ActivityIcon,
  BarChart2Icon,
  BarChartIcon,
  CheckCircle2Icon,
  ClockIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  PlusIcon,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa6";

import { buttonVariants } from "~/components/ui/button";
import { FAQS } from "~/features/marketing/constants";

export const Route = createFileRoute("/_marketing/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="overflow-x-hidden">
      <section className="bg-brand-50 relative flex w-full px-4 pt-36 pb-16 md:px-8 md:pt-44 md:pb-24 dark:bg-gray-900">
        <div className="z-10 mx-auto max-w-[1280px]">
          <div>
            <div className="mb-8 space-y-4 text-center md:mb-12 md:space-y-6">
              <h1 className="text-brand-900 mx-auto max-w-[1024px] text-4xl font-semibold text-balance md:text-6xl dark:text-gray-50">
                Track Your Presence. Gain New Insights.
              </h1>
              <p className="text-brand-700 mx-auto max-w-[768px] text-lg md:text-xl dark:text-gray-300">
                Easily track your Discord activity with detailed statistics on
                your time, sessions, and trends. Understand your patterns and
                stay informed with just a glance.
              </p>
            </div>
            <div className="mb-16 flex flex-col-reverse items-center justify-center gap-3 md:flex-row">
              <a
                href="#features"
                className={buttonVariants({
                  variant: "secondary",
                  size: "lg",
                  class: "max-md:w-full",
                })}
              >
                Learn more
              </a>
              <a
                href="/"
                className={buttonVariants({
                  variant: "primary",
                  size: "lg",
                  class: "max-md:w-full",
                })}
              >
                <FaDiscord />
                Add Planora
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 z-[100] w-full md:bottom-4">
          <div className="bg-brand-400 absolute bottom-0 h-9 w-[150%] translate-x-[-10%] rotate-[-8deg] md:h-18 dark:bg-gray-600"></div>
          <div className="bg-brand-200 absolute -bottom-9 h-9 w-[150%] translate-x-[-10%] rotate-[-8deg] md:bottom-[-72px] md:h-18 dark:bg-gray-700"></div>
          <div
            style={{
              clipPath: "polygon(70.4% 0, 100% 0, 100% 100%, 70% 100%)",
            }}
            className="bg-brand-100 absolute bottom-[-144px] h-9 w-[150%] translate-x-[-10%] rotate-[-8deg] max-md:hidden md:h-18 dark:bg-gray-800"
          ></div>
        </div>
      </section>
      <section className="relative mx-auto -mt-24 max-w-[1280px] px-4 md:px-8">
        <img
          src="https://placehold.co/960x540/png"
          className="relative z-110 mx-auto aspect-video max-h-[540px] w-full max-w-[960px]"
        />
        <div
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 15%, 0 35%)",
          }}
          className="from-brand-50 absolute inset-0 z-[0] h-full w-full bg-gradient-to-r from-40% to-white to-50% dark:from-gray-900 dark:to-gray-950"
        ></div>
      </section>
      <section className="mx-auto max-w-[1280px] px-4 md:px-8">
        <div className="border-b border-gray-200 py-16 md:py-24 dark:border-gray-800">
          <div className="mx-auto mb-12 max-w-[768px] text-center md:mb-16">
            <div className="text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800 mx-auto mb-4 w-fit rounded-full border px-2.5 py-0.5 text-sm font-medium md:px-3 md:py-1">
              How it works
            </div>
            <h2 className="mb-4 text-3xl font-semibold text-gray-900 md:mb-5 md:text-4xl dark:text-gray-50">
              Seamless tracking, meaningful insights
            </h2>
            <p className="text-lg text-gray-600 md:text-xl dark:text-gray-400">
              No setup, no hassle—just add the bot and track your presence
              across apps using Discord Rich Presence. Get clear activity
              insights effortlessly.
            </p>
          </div>
          <div className="flex flex-col items-center gap-x-8 gap-y-10 md:flex-row">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-[10px] border border-gray-300 bg-white shadow-xs md:size-12 dark:border-gray-700 dark:bg-gray-950">
                <PlusIcon className="size-5 text-gray-700 md:size-6 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Add the bot
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Invite the bot to your server, and it starts tracking your
                  presence automatically—no configuration needed.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-[10px] border border-gray-300 bg-white shadow-xs md:size-12 dark:border-gray-700 dark:bg-gray-950">
                <ClockIcon className="size-5 text-gray-700 md:size-6 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Track your sessions
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  See a history of your activity across games, apps, and tools
                  that support Discord Rich Presence.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-[10px] border border-gray-300 bg-white shadow-xs md:size-12 dark:border-gray-700 dark:bg-gray-950">
                <BarChartIcon className="size-5 text-gray-700 md:size-6 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                  View your insights
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Analyze your activity with detailed breakdowns of time spent
                  in different apps and sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-24">
        <div className="rounded-2xl bg-gray-50 py-10 md:rounded-none md:bg-transparent md:py-0 dark:bg-gray-900 dark:md:bg-transparent">
          <div className="px-6 text-center md:mb-16 md:px-0">
            <h2 className="mb-4 text-3xl font-semibold text-gray-900 md:mb-5 md:text-4xl dark:text-gray-50">
              Your activity at a glance
            </h2>
            <p className="text-lg text-gray-600 md:text-xl dark:text-gray-400">
              See your time spent across apps with real-time insights and
              detailed breakdowns.
            </p>
          </div>
          <div className="flex flex-col items-center gap-8 px-6 pt-8 md:flex-row md:rounded-2xl md:bg-gray-50 md:p-16 md:dark:bg-gray-900">
            <div className="flex-1 text-center">
              <p className="text-brand-600 mb-3 text-5xl font-semibold md:text-6xl dark:text-gray-50">
                100+
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Hours tracked
              </p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-brand-600 mb-3 text-5xl font-semibold md:text-6xl dark:text-gray-50">
                10,000+
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Sessions logged
              </p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-brand-600 mb-3 text-5xl font-semibold md:text-6xl dark:text-gray-50">
                50+
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Apps tracked
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        id="features"
        className="mx-auto max-w-[1280px] scroll-my-36 px-4 pb-16 md:scroll-my-44 md:px-8 md:pb-24"
      >
        <div className="mx-auto mb-12 max-w-[768px] text-center md:mb-24">
          <div className="text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800 mx-auto mb-4 w-fit rounded-full border px-2.5 py-0.5 text-sm font-medium md:px-3 md:py-1">
            Features
          </div>
          <h2 className="mb-4 text-3xl font-semibold text-gray-900 md:mb-5 md:text-4xl dark:text-gray-50">
            Track your activity with ease
          </h2>
          <p className="text-lg text-gray-600 md:text-xl dark:text-gray-400">
            Track activity across apps with Discord Rich Presence. Get real-time
            insights to manage your time and sessions, trusted by gamers and
            productivity enthusiasts.
          </p>
        </div>
        <div className="space-y-12 md:space-y-24">
          <div className="flex flex-col gap-x-24 gap-y-10 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="mb-8">
                <div className="mb-5 flex size-12 items-center justify-center rounded-[10px] border border-gray-300 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-950">
                  <ActivityIcon className="size-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="mb-2 text-2xl font-semibold text-gray-900 md:mb-4 md:text-3xl dark:text-gray-50">
                  Track your activity
                </h3>
                <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                  Effortlessly track your activity across various apps using
                  Discord Rich Presence. Simply add Planora to Discord and start
                  gaining real-time insights into your activity patterns.
                </p>
              </div>
              <div>
                <ul className="space-y-4 pl-2 md:space-y-5 md:pl-4">
                  <li className="flex items-center gap-x-3">
                    <CheckCircle2Icon className="text-brand-600 dark:text-brand-500 size-7" />
                    <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                      Automatically track your activity
                    </p>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircle2Icon className="text-brand-600 dark:text-brand-500 size-7" />
                    <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                      View detailed activity insights in real time
                    </p>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircle2Icon className="text-brand-600 dark:text-brand-500 size-7" />
                    <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                      Set it up once and track progress effortlessly
                    </p>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex-1">
              <img src="https://placehold.co/560x512/png" className="w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-x-24 gap-y-10 md:flex-row-reverse md:items-center">
            <div className="flex-1">
              <div className="mb-8">
                <div className="mb-5 flex size-12 items-center justify-center rounded-[10px] border border-gray-300 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-950">
                  <ClockIcon className="size-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="mb-2 text-2xl font-semibold text-gray-900 md:mb-4 md:text-3xl dark:text-gray-50">
                  View playtime & sessions
                </h3>
                <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                  Monitor your gaming and app usage with detailed session
                  tracking. Easily see total playtime and session duration for a
                  complete view of your activities.
                </p>
              </div>
              <div>
                <ul className="space-y-4 pl-2 md:space-y-5 md:pl-4">
                  <li className="flex items-center gap-x-3">
                    <CheckCircle2Icon className="text-brand-600 dark:text-brand-500 size-7" />
                    <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                      Track session playtime and app usage time
                    </p>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircle2Icon className="text-brand-600 dark:text-brand-500 size-7" />
                    <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                      Get insights into session durations and activity history
                    </p>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircle2Icon className="text-brand-600 dark:text-brand-500 size-7" />
                    <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                      See your most active times and games
                    </p>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex-1">
              <img src="https://placehold.co/560x512/png" className="w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-x-24 gap-y-10 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="mb-8">
                <div className="mb-5 flex size-12 items-center justify-center rounded-[10px] border border-gray-300 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-950">
                  <BarChart2Icon className="size-6 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="mb-2 text-2xl font-semibold text-gray-900 md:mb-4 md:text-3xl dark:text-gray-50">
                  Analyze Usage Trends
                </h3>
                <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                  Understand your usage patterns with easy-to-read insights.
                  Planora helps you identify trends to improve time management
                  and boost productivity.
                </p>
              </div>
              <div>
                <ul className="space-y-4 pl-2 md:space-y-5 md:pl-4">
                  <li className="flex items-center gap-x-3">
                    <CheckCircle2Icon className="text-brand-600 dark:text-brand-500 size-7" />
                    <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                      Track daily, weekly, and monthly usage trends
                    </p>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircle2Icon className="text-brand-600 dark:text-brand-500 size-7" />
                    <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                      Visualize activity patterns for informed decisions
                    </p>
                  </li>
                  <li className="flex items-center gap-x-3">
                    <CheckCircle2Icon className="text-brand-600 dark:text-brand-500 size-7" />
                    <p className="text-base text-gray-600 md:text-lg dark:text-gray-400">
                      Get insights to improve productivity and focus
                    </p>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex-1">
              <img src="https://placehold.co/560x512/png" className="w-full" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1280px] px-4 md:px-8">
        <div className="border-y border-gray-200 py-16 md:py-24 dark:border-gray-800">
          <div className="mx-auto mb-12 max-w-[768px] text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-semibold text-gray-900 md:mb-5 md:text-4xl dark:text-gray-50">
              Frequently asked questions
            </h2>
            <p className="text-lg text-gray-600 md:text-xl dark:text-gray-400">
              Find answers to the most common questions about Planora.
            </p>
          </div>
          <div className="mx-auto mb-12 max-w-[768px] md:mb-16">
            <AccordionPrimitive.Root
              type="single"
              collapsible={true}
              className="*:mb-8 *:border-t *:border-gray-200 *:pt-6 *:first:border-none *:first:pt-0 *:last:mb-0 *:dark:border-gray-800"
            >
              {FAQS.map((faq) => (
                <AccordionPrimitive.Item key={faq.id} value={faq.title}>
                  <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-x-2 md:gap-x-4">
                      <p className="font-semibold text-gray-900 dark:text-gray-50">
                        {faq.title}
                      </p>
                      <PlusCircleIcon className="size-6 text-gray-400 group-data-[state=open]:hidden dark:text-gray-600" />
                      <MinusCircleIcon className="size-6 text-gray-400 group-data-[state=closed]:hidden dark:text-gray-600" />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content className="mt-1 pr-8 text-gray-600 md:pr-10 dark:text-gray-400">
                    {faq.description}
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          </div>
          <div className="mx-0 rounded-2xl bg-gray-50 px-5 py-8 text-center md:mx-8 md:px-8 md:pb-10 dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-center md:mb-8">
              <img
                src="https://cdn.discordapp.com/avatars/408587203703341058/a_c9424d260afbd5f79b38b01e7bf5f66d.png?size=1024"
                alt="User"
                className="-mr-3 size-12 rounded-full border-[1.5px] border-gray-50 dark:border-gray-900"
              />
              <img
                src="https://cdn.discordapp.com/avatars/559303647864029184/c9b56adc3979392208537ef0e7da8084.png?size=1024"
                alt="User"
                className="z-10 size-14 rounded-full border-[1.5px] border-gray-50 dark:border-gray-900"
              />
              <img
                src="https://cdn.discordapp.com/avatars/687065657270862025/2c99c318f1bf46fda4afbd7ddd89f2cb.png?size=1024"
                alt="User"
                className="-ml-3 size-12 rounded-full border-[1.5px] border-gray-50 dark:border-gray-900"
              />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-50">
                Still have questions?
              </h3>
              <p className="mb-6 text-lg text-gray-600 md:mb-8 dark:text-gray-400">
                Can't find the anwswer you're looking for? Please chat to our
                friendly team.
              </p>
              <a
                href="/"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[768px] text-center">
          <h2 className="mb-4 text-3xl font-semibold text-gray-900 md:mb-5 md:text-4xl dark:text-gray-50">
            Take control of your time
          </h2>
          <p className="mb-8 text-lg text-gray-600 md:text-xl dark:text-gray-400">
            Start tracking your activity effortlessly with Planora. Gain
            insights, manage your time, and optimize your sessions—all with zero
            setup.
          </p>
          <div className="flex flex-col-reverse items-center justify-center gap-3 md:flex-row">
            <a
              href="/#features"
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                class: "max-md:w-full",
              })}
            >
              Learn more
            </a>
            <a
              href="/"
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                class: "max-md:w-full",
              })}
            >
              <FaDiscord />
              Add Planora
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
