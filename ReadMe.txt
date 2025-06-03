Name: Project Integrado

Laravel:
  Pre-setup: 
    Command: composer update
  To change Database: PI/Laravel/.env
  Database config:
    Host: 127.0.0.1:3306
    Database: PI_2023 
  SQL Queries: pi_2023.sql
  Migrations: php artisan migrate
  Seeders: php artisan db:seed

Angular: 
  Login:
    User: bibilioteca@staff.ipbeja.pt
    Password: IPBejaBiblioteca2024
  To change login: PI/Laravel/database/seeders/DatabaseSeeder.php

To change the site's name and icon:
  In Pi/Angular/dist/projeto-integrado/index.html
    Name: Line 5
    Icon: Line 8

