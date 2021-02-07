import { createConfigComponent } from "@well-known-components/env-config-provider"
import { createLogComponent } from "@well-known-components/logger"
import { createMetricsComponent } from "../../src"
import { createE2ERunner, TestComponents } from "./test-helpers"
import { metricDeclarations } from "./defaultMetrics"
import { createTestServerComponent, IFetchComponent } from "@well-known-components/http-server"
import { mockedRouter } from "./mockedServer"

// creates a "mocha-like" describe function to run tests using the test components
export const describeTestE2E = createE2ERunner({
  async main(components) {
    components.server.use(mockedRouter())
    components.server.setContext({components})
  },
  initComponents,
})

async function initComponents(): Promise<TestComponents> {
  const logs = createLogComponent()

  const config = createConfigComponent({})

  const server = createTestServerComponent<any>()

  const fetch: IFetchComponent = server
  const metrics = await createMetricsComponent(metricDeclarations, { server, config })

  return { logs, config, server, fetch, metrics }
}
