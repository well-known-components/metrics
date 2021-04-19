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

export type ComponentBasedTestSuite<TestComponents> = (args: {
  getComponents: () => TestComponents
  run: () => Promise<Lifecycle.ComponentBasedProgram<TestComponents>>
}) => void

export const createE2ERunner = <TestComponents>(options: Lifecycle.ProgramConfig<TestComponents>) => {
  return (name: string, suite: ComponentBasedTestSuite<TestComponents>) => {
    describe(name, () => {
      let program: Lifecycle.ComponentBasedProgram<TestComponents>
      let runIsNecessary = true
      suite({
        getComponents() {
          if (!program)
            throw new Error(
              "Cannot get the components before the test program is initialized. Call start() in your test suite"
            )
          const c = program.components
          if (!c) throw new Error("Cannot get the components")
          return c
        },
        get run() {
          runIsNecessary = false
          return async () => {
            return (program = await Lifecycle.run(options))
          }
        },
      })

      before(async () => {
        if (runIsNecessary && !program) {
          return (program = await Lifecycle.run(options))
        }
      })

      after(async () => {
        if (program) {
          await program.stop()
        }
      })
    })
  }
}
