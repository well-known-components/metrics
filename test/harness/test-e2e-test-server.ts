import { createConfigComponent } from "@well-known-components/env-config-provider"
import { createLogComponent } from "@well-known-components/logger"
import { createMetricsComponent } from "../../src"
import { TestComponents } from "./test-helpers"
import { metricDeclarations } from "./defaultMetrics"
import { createTestServerComponent, IFetchComponent } from "@well-known-components/http-server"
import { createRunner } from "@well-known-components/test-helpers"
import { mockedRouter } from "./mockedServer"

// creates a "jest-like" describe function to run tests using the test components
export const describeTestE2E = createRunner({
  async main({components, startComponents}) {
    components.server.use(mockedRouter())
    components.server.setContext({components})

    await startComponents()
  },
  initComponents,
})

async function initComponents(): Promise<TestComponents> {
  const logs = createLogComponent()

  const config = createConfigComponent(process.env)

  const server = createTestServerComponent<any>()

  const fetch: IFetchComponent = server
  const metrics = await createMetricsComponent(metricDeclarations, { server, config })

  return { logs, config, server, fetch, metrics }
}
