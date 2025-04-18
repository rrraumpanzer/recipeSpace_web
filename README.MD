cd backend
poetry run python run.py












cd frontend
npm run dev




psql --version
sudo service postgresql start

#postgres \du - все пользователи
#postgres \l - все базы. База сервиса "recipespace_database"
psql recipespace_database

sudo -u postgres psql recipespace_database - войти чтоб редачить таблицу

\dt все таблицы