import { IFetchComponent } from "@well-known-components/http-server"
import {
  IConfigComponent,
  IHttpServerComponent,
  ILoggerComponent,
  IMetricsComponent,
  Lifecycle,
} from "@well-known-components/interfaces"
import { metricDeclarations } from "./defaultMetrics"

export type TestComponents = {
  server: IHttpServerComponent<{ components: TestComponents }> & { resetMiddlewares(): void }
  logs: ILoggerComponent
  config: IConfigComponent
  metrics: IMetricsComponent<keyof typeof metricDeclarations>
  fetch: IFetchComponent
}

export type RunnerOptions<Components> = {
  main: (components: Components) => Promise<any>
  initComponents: () => Promise<Components>
}

export const createE2ERunner = (options: RunnerOptions<TestComponents>) => {
  return (name: string, suite: (getComponents: () => TestComponents) => void) => {
    describe(name, () => {
      let program: Lifecycle.ComponentBasedProgram<TestComponents>

      before(async () => {
        program = await Lifecycle.programEntryPoint<TestComponents>(options)
      })

      function getComponents() {
        if (!program) throw new Error("Cannot get the components before the test program is initialized")
        const c = program.components
        if (!c) throw new Error("Cannot get the components")
        return c
      }

      suite(getComponents)

      after(async () => {
        if (program) {
          await program.stop()
        }
      })
    })
  }
}
