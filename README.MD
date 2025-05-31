### Настройка PostgreSQL
Необходимо создать базу данных и пользователя, со всеми правами на неё, а желательно вообще авторством

В файлах бекенде в файлах alembic.ini и database/connection.py обновить URL для БД (установить название пользователя, пароль, имя БД) 

Зайдя в папку backend, зайти в терминал poetry

>poetry shell

Установить зависимости

>poetry install

Произвести миграцию таблиц базы данных

>alembic upgrade head


### Запуск бекенда

> cd backend

> poetry run python run.py

### Запуск фронтенда

> cd frontend

> npm run dev

### Работа с БД

*Проверка установки и запуск*

psql --version
sudo service postgresql start

*Полезные команды*

> \du 
- все пользователи

> \l 
- все базы. База сервиса "recipespace_database"

> \dt 
- все таблицы

> psql recipespace_database 
- подключение к БД

> sudo -u postgres psql recipespace_database 
- войти через рут пользователя чтоб редачить таблицу (не рекомендуется)

> SELECT * FROM название_таблицы; 
- посмотреть содержимое

> sudo ss -tulnp | grep postgres 
- проверка подключения

### Если проблемы с peer подключением

> sudo nano /etc/postgresql/<версия>/main/pg_hba.conf
вставить строку

> local   recipespace_database    web_rsp_service                md5

сохранить

перезапустить: 
> sudo service postgresql restart

### Подключение к БД через пользователя для веб-сервиса

>PGPASSWORD=пароль psql -U web_rsp_service -d recipespace_database -h 127.0.0.1;

### Проверка эндпоинтов через HTTPie

Для всех эндпоинтов требующих авторизации необходимо добавлять в запрос "Authorization: Bearer *********", где звёздочки это токен полученный по запросу /token"

> http POST http://localhost:8000/user/signup username="Ivan" email="ivan2@example.com" password="strongpassword123";

> http -v PATCH http://localhost:8000/user/update/2 bio="Тестовая биография";

> http -v DELETE http://localhost:8000/user/delete/2;

> http --form POST http://localhost:8000/user/token username="Ivan" password="strongpassword123"

http GET http://localhost:8000/user/me/ "Authorization: Bearer *********"  
  Вместо звёздочек подставить токен

> http GET http://localhost:8000/user/me/ 
  Без авторизации выдаст ошибку

> http POST http://localhost:8000/recipe/create title="Рыба под шоколадом" description="Всё понятно из названия" tags:='["fish"]' ingredients:='["fish", "chocolade"]' cooking_time_minutes=10 difficulty=1 steps="fsfas" author_id=1 "Authorization: Bearer *******"

> http --form POST http://localhost:8000/user/upload-avatar/1   
  "Authorization: Bearer *******"   file@./temp/catto.png

> http --form POST http://localhost:8000/recipe/upload-image/1  
  "Authorization: Bearer *******" file@./temp/fisheauchokolat.png
