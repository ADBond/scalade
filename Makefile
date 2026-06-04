start-app:
	docker compose up -d --build

stop-app:
	docker compose down -v

simulate:
	docker compose run --build --rm --entrypoint "npm run simulate" frontend
