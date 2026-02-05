dev_bin := ./tmp/wager

ifeq ($(OS),Windows_NT)
	dev_bin = .\\tmp\\wager.exe
endif

build:
	go build -o ./bin/wager ./cmd/wager

run: build
	./bin/wager

run-mem: build
	./bin/wager test

dev:
	air \
		--build.cmd "go build -o $(dev_bin) ./cmd/wager" \
		--build.bin "$(dev_bin)" \
		--build.include_ext "go,gohtml,html,css,js" \
		--build.exclude_dir "bin,data,postman,sql,tmp"

test-unit:
	go test \
		./internal/pagination \
		./internal/result

test-e2e:
	./e2e

test: test-unit test-e2e

build-seed:
	go build -o ./bin/seed ./cmd/seed

seed-clean: build-seed
	./bin/seed dev none closed

seed-clean-prod: build-seed
	./bin/seed prod none closed

seed1: build-seed
	./bin/seed dev fixed open

seed2: build-seed
	./bin/seed dev fixed closed

seed-rand1: build-seed
	./bin/seed dev random open

seed-rand2: build-seed
	./bin/seed dev random closed

