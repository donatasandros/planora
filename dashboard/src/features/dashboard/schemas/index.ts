import { z } from "zod";

const metricsTimeFilterEnum = z.enum(["all", "12m", "30d", "7d", "24h"]);

export const overviewParamsSchema = z.object({
  metrics_tf: metricsTimeFilterEnum.optional().catch("all"),
  metrics_cr: z.tuple([z.string(), z.string()]).optional(),
});
