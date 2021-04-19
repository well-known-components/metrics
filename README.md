# metrics

`npm i @well-known-components/metrics`

## Configuration via config component

Here is a list of configuration keys that may be used by this component:

- `WKC_METRICS_PUBLIC_PATH`: `string` path to expose metrics, default: `/metrics`
- `WKC_METRICS_BEARER_TOKEN`: `string` bearer token to protect metrics, default: _not set_
- `WKC_METRICS_COLLECT_DEFAULT`: `"true" | "false"` collect default nodejs metrics, default: `true`

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
  },
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
export async function userIdHandler(context: { components: Pick<AppComponents, "metrics"> }) {
  const {
    components: { metrics },
  } = context

  metrics.increment("user_counter", { userId: Math.random() })
  // metrics.decrement("user_counter", { userId: Math.random() })
  // metrics.observe("user_counter", { userId: Math.random() }, 1)
  // metrics.reset("user_counter")

  return {}
}
```
