import {
  IBaseComponent,
  IConfigComponent,
  IHttpServerComponent,
  IMetricsComponent,
} from "@well-known-components/interfaces"

import { collectDefaultMetrics } from "prom-client"
import { Router } from "@well-known-components/http-server"
import { getDefaultHttpMetrics, HttpMetrics, instrumentHttpServer } from "./http"
import { createTestMetricsComponent } from "./base"

export { createTestMetricsComponent }

/**
 * @public
 */
export async function createMetricsComponent<K extends string, V extends object = {}>(
  metricsDefinition: IMetricsComponent.MetricsRecordDefinition<K>,
  components: { server: IHttpServerComponent<V>; config: IConfigComponent }
): Promise<IMetricsComponent<K> & IBaseComponent> {
  const { server, config } = components

  // TODO: configurable http instrumentation toggle
  const shouldInstrumentHttpServer: boolean = true
  // TODO: optional basic auth for /metrics
  // TODO: optional bearer token for /metrics
  // TODO: configurable /metrics endpoint

  let internalMetricsDefinitions: IMetricsComponent.MetricsRecordDefinition<K | HttpMetrics> = {} as any

  if (shouldInstrumentHttpServer) {
    internalMetricsDefinitions = { ...internalMetricsDefinitions, ...getDefaultHttpMetrics() }
  }

  internalMetricsDefinitions = { ...internalMetricsDefinitions, ...metricsDefinition }

  const basePort = createTestMetricsComponent<K | HttpMetrics>(internalMetricsDefinitions)

  const router = new Router<{}>()

  router.get("/metrics", async (ctx) => {
    return {
      status: 200,
      body: await basePort.register.metrics(),
      headers: {
        "content-type": basePort.register.contentType,
      },
    }
  })

  if (shouldInstrumentHttpServer) {
    instrumentHttpServer(server, basePort)
  }

  server.use(router.middleware())

  return {
    // IMetricsComponent<K>
    ...basePort,
    // IBaseComponent
    start: async () => {
      if ((await config.getString("METRICS_COLLECT_DEFAULT")) != "false") {
        collectDefaultMetrics({ register: basePort.register })
      }
    },
  }
}

/**
 * This function only validates the types.
 * In the future it may perform real runtime assertions.
 *
 * @public
 */
export function validateMetricsDeclaration<T extends string>(
  metricsDefinition: IMetricsComponent.MetricsRecordDefinition<T>
): IMetricsComponent.MetricsRecordDefinition<T> {
  return metricsDefinition
}
