
ifneq ($(CI), true)
LOCAL_ARG = --local --verbose --diagnostics
endif

ifeq ($(INSPECT), true)
INSPECT = --inspect --inspect-brk
endif

build:
	./node_modules/.bin/tsc -p tsconfig.json
	rm -rf node_modules/@microsoft/api-extractor/node_modules/typescript || true
	./node_modules/.bin/api-extractor run $(LOCAL_ARG) --typescript-compiler-folder ./node_modules/typescript

test:
	export TS_NODE_PROJECT='./test/tsconfig.json'; node $(INSPECT) --require ts-node/register --async-stack-traces --experimental-modules node_modules/.bin/_mocha --timeout 10000 --reporter spec

ci: | build test

update-interfaces-next:
	npm install @well-known-components/interfaces@next

update-interfaces-latest:
	npm install @well-known-components/interfaces@latest

.PHONY: build test