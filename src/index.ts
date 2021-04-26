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
 * Metrics configuration prefix.
 * @public
 */
export const CONFIG_PREFIX = "WKC_METRICS" as const

/**
 * @internal
 */
export function _configKey(key: Uppercase<string>): string {
  return `${CONFIG_PREFIX}_${key.toUpperCase().replace(/^(_*)/, "")}`
}

/**
 * @public
 */
export async function createMetricsComponent<K extends string, V extends object = {}>(
  metricsDefinition: IMetricsComponent.MetricsRecordDefinition<K>,
  components: { server?: IHttpServerComponent<V>; config: IConfigComponent }
): Promise<IMetricsComponent<K> & IBaseComponent> {
  const { config } = components

  const shouldInstrumentHttpServer: boolean = "server" in components && !!components.server

  let internalMetricsDefinitions: IMetricsComponent.MetricsRecordDefinition<K | HttpMetrics> = {} as any

  if (shouldInstrumentHttpServer) {
    internalMetricsDefinitions = { ...internalMetricsDefinitions, ...getDefaultHttpMetrics() }
  }

  internalMetricsDefinitions = { ...internalMetricsDefinitions, ...metricsDefinition }

  const basePort = createTestMetricsComponent<K | HttpMetrics>(internalMetricsDefinitions)

  if (shouldInstrumentHttpServer) {
    const server = components.server!
    const router = new Router<{}>()

    const metricsPath = (await config.getString(_configKey("PUBLIC_PATH"))) || "/metrics"
    const bearerToken = await config.getString(_configKey("BEARER_TOKEN"))
    // TODO: optional basic auth for /metrics

    router.get(metricsPath, async (ctx) => {
      if (bearerToken) {
        const header = ctx.request.headers.get("authorization")
        if (!header) return { status: 401 }
        const [_, value] = header.split(" ")
        if (value != bearerToken) {
          return { status: 401 }
        }
      }

      return {
        status: 200,
        body: await basePort.register.metrics(),
        headers: {
          "content-type": basePort.register.contentType,
        },
      }
    })

    instrumentHttpServer(server, basePort)

    server.use(router.middleware())
  }

  return {
    // IMetricsComponent<K>
    ...basePort,
    // IBaseComponent
    start: async () => {
      if ((await config.getString(_configKey("COLLECT_DEFAULT"))) != "false") {
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
