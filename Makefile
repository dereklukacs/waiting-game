
.PHONY: f server-run server-build server-clean server-deps server-kill

f: 
	cd stickrunner && pnpm run dev

# Run the multiplayer server
sr:
	cd multiplayer-server && go run main.go

# Build the server binary
sb:
	cd multiplayer-server && go build -o bin/server main.go

# Install server dependencies
sd:
	cd multiplayer-server && go mod tidy

# Kill any process running on port 8080
sk:
	lsof -ti :8080 | xargs kill -9 || true