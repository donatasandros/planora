import { BarChart3Icon, LineChartIcon, ListOrderedIcon } from "lucide-react";

export const NAV_LINKS = [
  {
    id: "7963ab9c-0fe9-4153-b328-20d9080e48c3",
    label: "Dashboard",
    to: "/",
  },
  {
    id: "32b37000-d51f-456a-b082-690795a998de",
    label: "Analytics",
    children: [
      {
        id: "bdda93af-515d-4833-854f-3950b9d74527",
        label: "Statistics",
        to: "/analytics/statistics",
        icon: BarChart3Icon,
        description: "View detailed usage staticis and trends over time.",
      },
      {
        idd: "1acd5264-f69f-4e36-a1ee-285e9611748d",
        label: "Insights",
        to: "/analytics/insights",
        icon: LineChartIcon,
        description:
          "Analyze key patterns and behaviors from tracked activity.",
      },
      {
        id: "dc5e7900-0416-4ff4-b690-e9147207bc29",
        label: "Summary",
        to: "/analytics/summary",
        icon: ListOrderedIcon,
        description:
          "Get a high-level overview of your activity and milestones.",
      },
    ],
  },
  {
    id: "d1c9dcbb-a11a-4756-98f0-d7cee1aeedeb",
    label: "Activity",
    to: "/activity",
  },
  {
    id: "0557ceae-444b-44f4-bb57-fd4f3c6eaf90",
    label: "Leaderboard",
    to: "/leaderboard",
  },
];
