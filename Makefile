setup-venv:
	python3 -m venv venv

# 1. Preparar entorno
setup:
	pip install -r requirements-dev.txt

# 2. Migraciones
migrate:
	python manage.py migrate

# 3. Levantar servidor
run:
	python manage.py runserver

# 4. Formatear con Black + isort
fmt:
	black . && isort .

# 5. Linting local (hooks de pre-commit)
lint:
	pre-commit run --all-files

setup-db:
	docker-compose up -d