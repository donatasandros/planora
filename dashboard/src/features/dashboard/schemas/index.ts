import { z } from "zod";

const metricsTimeFilterEnum = z.enum(["all", "12m", "30d", "7d", "24h"]);
const chartTimeFilterEnum = z.enum(["12m", "30d", "7d"]);

export const overviewParamsSchema = z.object({
  metrics_tf: metricsTimeFilterEnum.optional().catch("all"),
  metrics_cr: z.tuple([z.string(), z.string()]).optional(),
  chart_tf: chartTimeFilterEnum.optional().catch("12m"),
});
