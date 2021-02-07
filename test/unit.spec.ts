import { createTestMetricsComponent } from "../src"
import expect from "expect"
import { metricDeclarations } from "./harness/defaultMetrics"
import { pingHandler } from "./harness/mockedServer"

describe("unit", function () {
  it("creates a test metric component with no metrics", async function () {
    createTestMetricsComponent({})
  })

  describe("ping-controller-unit", () => {
    it("must return the pathname of a URL", async () => {
      const url = new URL("https://github.com/well-known-components")
      const metrics = createTestMetricsComponent(metricDeclarations)
      expect((await metrics.getValue("test_counter")).values).toEqual([])
      expect(await pingHandler({ url, components: { metrics } })).toEqual({ body: url.pathname })
      expect((await metrics.getValue("test_counter")).values).toEqual([
        { labels: { pathname: "/well-known-components" }, value: 1 },
      ])
    })

    it("metrics should create a brand new registry", async () => {
      const url = new URL("https://github.com/well-known-components")
      const metrics = createTestMetricsComponent(metricDeclarations)
      expect((await metrics.getValue("test_counter")).values).toEqual([])
      expect(await pingHandler({ url, components: { metrics } })).toEqual({ body: url.pathname })
      expect((await metrics.getValue("test_counter")).values).toEqual([
        { labels: { pathname: "/well-known-components" }, value: 1 },
      ])
    })
    it("calling twice should increment twice", async () => {
      const url = new URL("https://github.com/well-known-components")
      const metrics = createTestMetricsComponent(metricDeclarations)
      expect((await metrics.getValue("test_counter")).values).toEqual([])
      expect(await pingHandler({ url, components: { metrics } })).toEqual({ body: url.pathname })
      expect(await pingHandler({ url, components: { metrics } })).toEqual({ body: url.pathname })
      expect((await metrics.getValue("test_counter")).values).toEqual([
        { labels: { pathname: "/well-known-components" }, value: 2 },
      ])
    })
  })
})
