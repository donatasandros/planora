import { ActivityIcon, BarChart2Icon, ClockIcon } from "lucide-react";
import { FaDiscord, FaGithub, FaXTwitter } from "react-icons/fa6";

export const FAQS = [
  {
    id: "6f078e03-f5d3-49cb-8887-c1212c03fe73",
    title: "How does Planora track my activity?",
    description:
      "Planora uses Discord Rich Presence to track your activity across apps and games. Once added to your server, it automatically logs your sessions.",
  },
  {
    id: "f0272db5-418d-4427-8d65-0c1ee4491769",
    title: "Do I need to set up anything?",
    description:
      "No setup required! Just add Planora to Discord, and it will start tracking your activity right away.",
  },
  {
    id: "9c026c48-14fc-4e82-9c5d-c64a37cb5e63",
    title: "Can I see my past activity?",
    description:
      "Yes! Planora logs your sessions, allowing you to view past activity, playtime, and trends over time.",
  },
  {
    id: "dfdee792-74cb-4c00-a5dd-6cf6b379f1c9",
    title: "Is my data private?",
    description:
      "Absolutely. Your activity data is only visible to you unless you choose to make it public. We don’t share or sell any of your information.",
  },
  {
    id: "cd04999c-021e-468d-b064-8a8edfe3d4ac",
    title: "Does Planora work with all apps?",
    description:
      "Planora tracks any app or game that supports Discord Rich Presence, but Discord must be open for tracking to work properly. Additionally, you need to enable the Discord setting that allows sharing detected activities with others.",
  },
  {
    id: "ac5bffbe-7b4f-4114-a714-b236d54e641d",
    title: "Can I export my activity data?",
    description:
      "Yes, you can export your session data for deeper analysis and personal record-keeping.",
  },
];

export const INVITE_LINK = "";

export const COMMUNITY_LINK = "https://discord.gg/tjA3Gx77fb";

export const HERO_IMAGE = "https://placehold.co/960x540/png";

export const METRICS = [
  {
    id: "e429ae10-1fa9-40be-850f-3f1fa8671a79",
    title: "Hours tracked",
    value: "100+",
  },
  {
    id: "9c72e5ed-0008-48b5-9e9c-84da3660dbbe",
    title: "Sessions logged",
    value: "10,000+",
  },
  {
    id: "cec27b30-fb6e-4b00-a33f-1ccc3fd7f450",
    title: "Apps tracked",
    value: "50+",
  },
];

export const FEATURES = [
  {
    id: "06dc000f-0c67-48aa-9ef4-5294e46e5082",
    icon: ActivityIcon,
    title: "Track your activity",
    description:
      "Effortlessly track your activity across various apps using Discord Rich Presence. Simply add Planora to Discord and start gaining real-time insights into your activity patterns.",
    image: "https://placehold.co/560x512/png",
    children: [
      {
        id: "05bfc918-f376-4a38-a976-55461eb7b8a6",
        title: "Automatically track your activity",
      },
      {
        id: "f322165d-cd9a-4794-9537-d28b43c25d35",
        title: "View detailed activity insights in real time",
      },
      {
        id: "a6056c5d-d1f0-4c67-8fd6-5d83fc7312b3",
        title: "Set it up once and track progress effortlessly",
      },
    ],
  },
  {
    id: "b2399628-4b82-4a92-ab6b-0b028942b622",
    icon: ClockIcon,
    title: "View playtime & sessions",
    description:
      "Monitor your gaming and app usage with detailed session tracking. Easily see total playtime and session duration for a complete view of your activities.",
    image: "https://placehold.co/560x512/png",
    children: [
      {
        id: "702f5f59-a238-4875-8e2e-edeb9b61779b",
        title: "Track session playtime and app usage time",
      },
      {
        id: "58fe4738-8100-4ae4-9c1c-658f8bbb71dc",
        title: "Get insights into session durations and activity history",
      },
      {
        id: "e61d123c-df36-497b-a081-a35956800ff5",
        title: "See your most active times and games",
      },
    ],
  },
  {
    id: "7a4df3dc-b2c5-463e-8f83-ca62d383cfe9",
    icon: BarChart2Icon,
    title: "Analyze Usage Trends",
    description:
      "Understand your usage patterns with easy-to-read insights. Planora helps you identify trends to improve time management and boost productivity.",
    image: "https://placehold.co/560x512/png",
    children: [
      {
        id: "6ace5d74-c72f-447e-974e-3de2b52f5238",
        title: "Track daily, weekly, and monthly usage trends",
      },
      {
        id: "01bd32aa-6dfd-4170-942c-32b5708e9124",
        title: "Visualize activity patterns for informed decisions",
      },
      {
        id: "62dbf37a-048e-4239-b502-bfea28b32cfd",
        title: "Get insights to improve productivity and focus",
      },
    ],
  },
];

export const FAQ_AVATARS = [
  {
    id: "abba735a-fe4c-4bfd-80a8-b12e6a6d5831",
    image:
      "https://cdn.discordapp.com/avatars/408587203703341058/a_c9424d260afbd5f79b38b01e7bf5f66d.png?size=1024",
  },
  {
    id: "7f81b817-a3bf-4163-a77c-10386c6db06d",
    image:
      "https://cdn.discordapp.com/avatars/559303647864029184/c9b56adc3979392208537ef0e7da8084.png?size=1024",
  },
  {
    id: "9c875814-fef2-4f41-a27e-e0011d234536",
    image:
      "https://cdn.discordapp.com/avatars/687065657270862025/2c99c318f1bf46fda4afbd7ddd89f2cb.png?size=1024",
  },
];

export const SOCIAL_LINKS = [
  {
    id: "87ea132f-2823-4a8f-b380-493ffd2137af",
    icon: FaDiscord,
    url: COMMUNITY_LINK,
  },
  {
    id: "24b84f62-7333-4e63-8fe6-85cad9605f4d",
    icon: FaGithub,
    url: "https://github.com/donatasandros/planora",
  },
  {
    id: "7340ad35-f2bd-470e-94a6-a6fdb8855dca",
    icon: FaXTwitter,
    url: "https://x.com/donatas_andros",
  },
];
