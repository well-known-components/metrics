# metrics

`npm i @well-known-components/metrics`

## Define your metrics in a static file

```ts
// src/metrics.ts

import { IMetricsComponent } from "@well-known-components/interfaces"
import { validateMetricsDeclaration } from "@well-known-components/metrics"

export const metricDeclarations = {
  // IMetricsComponent.SummaryType
  // IMetricsComponent.HistogramType
  // IMetricsComponent.GaugeType
  // IMetricsComponent.CounterType
  user_counter: {
    type: IMetricsComponent.CounterType,
    help: "Count calls to /user/:userId",
    labelNames: ["userId"],
  }
}

// type assertions
validateMetricsDeclaration(metricDeclarations)
```

## Define the component

```ts
// src/components.ts

import { metricDeclarations } from "./metrics"

export async function initComponents(): Promise<AppComponents> {
  ...
  // const config
  // const server
  const metrics = await createMetricsComponent(metricDeclarations, { server, config })

  return { ...components, metrics }
}
```

## Register metrics

```ts
export async function userIdHandler(context: {
  components: Pick<AppComponents, "metrics">
}) {
  const { components: { metrics } } = context

  metrics.increment("user_counter", { userId: Math.random() })
  // metrics.decrement("user_counter", { userId: Math.random() })
  // metrics.observe("user_counter", { userId: Math.random() }, 1)
  // metrics.reset("user_counter")

  return {}
}
```
