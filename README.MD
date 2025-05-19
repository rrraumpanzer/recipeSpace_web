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
SELECT * FROM название_таблицы; - посмотреть содержимое
\dt все таблицы
sudo ss -tulnp | grep postgres - проверка подключения

### Если проблемы с peer подключением
sudo nano /etc/postgresql/<версия>/main/pg_hba.conf
вставить строку
local   recipespace_database    web_rsp_service                md5
сохранить
перезапустить: sudo service postgresql restart

Проверка подлючения с паролем:
PGPASSWORD=пароль psql -U web_rsp_service -d recipespace_database -h 127.0.0.1
###
Проверка наличия пароля в окружении -> printenv DB_PASSWORD 
Установка пароля в переменную окружения -> export DB_PASSWORD='***'


http POST http://localhost:8000/add_string text="Тест" - проверка связи с БД
