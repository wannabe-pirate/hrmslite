curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install --lts
nvm use --lts

curl -LsSf https://astral.sh/uv/install.sh | sh


cd frontend && npm run dev
cd ../hrmslite && uv sync && uv run python manage.py runserver
