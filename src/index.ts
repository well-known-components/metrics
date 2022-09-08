import {
  IBaseComponent,
  IConfigComponent,
  IHttpServerComponent,
  IMetricsComponent,
} from "@well-known-components/interfaces"

import { collectDefaultMetrics } from "prom-client"
import { HttpMetrics, instrumentHttpServerWithPromClientRegistry } from "./http"
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
  components: { config: IConfigComponent }
): Promise<IMetricsComponent<K> & IBaseComponent> {
  const { config } = components

  const basePort = createTestMetricsComponent<K>(metricsDefinition)

  return {
    // IMetricsComponent<K>
    ...basePort,
    // IBaseComponent
    start: async () => {
      if ((await config.getString(_configKey("COLLECT_DEFAULT"))) != "false") {
        collectDefaultMetrics({ register: basePort.registry })
      }
    },
  }
}

/**
 * Instruments an HTTP server with a IMetricsComponent created by this library
 *
 * @public
 */
export async function instrumentHttpServerWithMetrics<K extends string>(components: {
  metrics: IMetricsComponent<K | HttpMetrics>
  server: IHttpServerComponent<any>
  config: IConfigComponent
}) {
  const metricsPath = (await components.config.getString(_configKey("PUBLIC_PATH"))) || "/metrics"
  const bearerToken = await components.config.getString(_configKey("BEARER_TOKEN"))

  instrumentHttpServerWithPromClientRegistry<K>({
    server: components.server,
    metrics: components.metrics,
    metricsPath,
    bearerToken,
  })
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
