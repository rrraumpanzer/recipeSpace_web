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
Тяжко

http POST http://localhost:8000/add_string text="Тест" - проверка связи с БД
http POST http://localhost:8000/add_string text="Тест4";
http POST http://localhost:8000/user/signup username="Ivan" email="ivan2@example.com" password="strongpassword123";
http -v PATCH http://localhost:8000/user/update/2 bio="Тестовая биография";
http -v DELETE http://localhost:8000/user/delete/2;
http --form POST http://localhost:8000/user/token username="Ivan" password="strongpassword123"
http GET http://localhost:8000/user/me/ "Authorization: Bearer *********"  Вместо звёздочек подставить пароль
http GET http://localhost:8000/user/me/ Без авторизации

http POST http://localhost:8000/recipe/create title="Рыба под шоколадом" description="Всё понятно из названия" tags:='["fish"]' ingredients:='["fish", "chocolade"]' cooking_time_minutes=10 difficulty=1 steps="fsfas" author_id=1 "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJJdmFuIiwiZXhwIjoxNzQ4MDk4NDQ5fQ.GKb5DYTYn_42NI-H-RKn5zX823d8cjtWp6bbnu_tvps"

http --form POST http://localhost:8000/user/upload-avatar/1   "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJJdmFuIiwiZXhwIjo
xNzQ4MDk4NDQ5fQ.GKb5DYTYn_42NI-H-RKn5zX823d8cjtWp6bbnu_tvps"   file@./temp/catto.png

http --form POST http://localhost:8000/recipe/upload-image/1  "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJJdmFuIiwiZXhwIjoxNzQ4MjkwMjkxfQ.kNes0b9ovDzbvQjtXn_FZ-fQ9JbcxsRZiqMSgjM1XBE" file@./temp/fisheauchokolat.png