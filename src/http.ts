import { IHttpServerComponent, IMetricsComponent } from "@well-known-components/interfaces"

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

export function getDefaultHttpMetrics(): IMetricsComponent.MetricsRecordDefinition<HttpMetrics> {
  return metrics
}

export function instrumentHttpServer(
  server: IHttpServerComponent<IHttpServerComponent.DefaultContext<any>>,
  metrics: IMetricsComponent<any>
) {
  server.use(async (ctx, next) => {
    let labels = {
      method: ctx.request.method,
      handler: "",
      code: 200,
    }

    const { end } = metrics.startTimer("http_request_duration_seconds", labels)
    let res: IHttpServerComponent.IResponse | undefined

    try {
      return (res = await next())
    } finally {
      labels.code = (res && res.status) || labels.code

      if ((ctx as any).routerPath) {
        labels.handler = (ctx as any).routerPath
      }

      metrics.observe("http_request_size_bytes", labels, ctx.request.size)
      metrics.increment("http_requests_total", labels)
      end(labels)
    }
  })
}
