import { IMetricsComponent } from "@well-known-components/interfaces"
import { validateMetricsDeclaration, getDefaultHttpMetrics } from "../../src"
import { metricDeclarations as logMetricDeclarations } from "@well-known-components/logger"

export const metricDeclarations = {
  ...logMetricDeclarations,
  test_counter: {
    type: IMetricsComponent.CounterType,
    help: "Count calls to ping",
    labelNames: ["pathname"],
  },
  test_gauge: {
    type: IMetricsComponent.GaugeType,
    help: "Gauges calls to ping (?)",
    labelNames: ["pathname"],
  },
  test_histogram: {
    type: IMetricsComponent.HistogramType,
    help: "Histograms calls to ping (?)",
    labelNames: ["pathname"],
  },
  test_summary: {
    type: IMetricsComponent.SummaryType,
    help: "Summaries calls to ping (?)",
    labelNames: ["pathname"],
  },
  user_counter: {
    type: IMetricsComponent.CounterType,
    help: "Count calls to /user/:userId",
    labelNames: ["userId"],
  },
  ...getDefaultHttpMetrics()
}

// type assertions
validateMetricsDeclaration(metricDeclarations)
