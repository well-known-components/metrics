import { Router } from "@well-known-components/http-server"
import { IHttpServerComponent, IMetricsComponent } from "@well-known-components/interfaces"
import { Registry } from "prom-client"

export const httpLabels = ["method", "handler", "code"] as const

const metrics = {
  http_request_duration_seconds: {
    type: IMetricsComponent.HistogramType,
    help: "Request duration in seconds.",
    labelNames: httpLabels,
  },
  http_requests_total: {
    type: IMetricsComponent.CounterType,
    help: "Total number of HTTP requests",
    labelNames: httpLabels,
  },
  http_request_size_bytes: {
    type: IMetricsComponent.HistogramType,
    help: "Duration of HTTP requests size in bytes",
    labelNames: httpLabels,
  },
}

export type HttpMetrics = keyof typeof metrics

/**
 * @public
 */
export function getDefaultHttpMetrics(): IMetricsComponent.MetricsRecordDefinition<HttpMetrics> {
  return metrics
}

const noopStartTimer = { end(){} }

export function instrumentHttpServerWithPromClientRegistry<K extends string>(options: {
  server: IHttpServerComponent<IHttpServerComponent.DefaultContext<any>>
  metrics: IMetricsComponent<K | HttpMetrics> & { registry?: Registry }
  metricsPath: string
  bearerToken?: string
  resetEveryNight?: boolean
}) {
  const router = new Router<{}>()

  if (!options.metrics.registry) {
    throw new Error("The provisioned metrics do not have a valid prom-client registry")
  }

  function calculateNextReset() {
    return new Date(new Date(new Date().toDateString()).getTime() + 86400000).getTime()
  }

  let nextReset: number = calculateNextReset()

  const registry = options.metrics.registry

  // TODO: optional basic auth for /metrics
  router.get(options.metricsPath, async (ctx) => {
    if (options.bearerToken) {
      const header = ctx.request.headers.get("authorization")
      if (!header) return { status: 401 }
      const [_, value] = header.split(" ")
      if (value != options.bearerToken) {
        return { status: 401 }
      }
    }

    const body = await registry.metrics()

    // heavy-metric servers that run for long hours tend to generate precision problems
    // and memory degradation for histograms if not cleared enough. this method
    // resets the metrics once per day at 00.00UTC
    if (options.resetEveryNight && Date.now() > nextReset) {
      nextReset = calculateNextReset()
      options.metrics.resetAll()
    }

    return {
      status: 200,
      body,
      headers: {
        "content-type": registry.contentType,
      },
    }
  })

  options.server.use(async (ctx, next) => {
    let labels = {
      method: ctx.request.method,
      handler: "",
      code: 200,
    }
    const startTimerResult = options.metrics.startTimer("http_request_duration_seconds", labels)
    const { end } = startTimerResult || noopStartTimer
    let res: IHttpServerComponent.IResponse | undefined

    try {
      return (res = await next())
    } finally {
      labels.code = (res && res.status) || labels.code

      if ((ctx as any).routerPath) {
        labels.handler = (ctx as any).routerPath
      }

      options.metrics.observe("http_request_size_bytes", labels, ctx.request.size)
      options.metrics.increment("http_requests_total", labels)
      end(labels)
    }
  })

  options.server.use(router.middleware())
}
