# Ordering Restaurant 🍽️

A simple restaurant ordering project.

✅ Online demo (Frontend only) is available on GitHub Pages (static).  
🛠️ Full version (Backend + Admin + Database) runs locally using WAMP (PHP + MySQL).

---

## Live Demo (Frontend Only)
This demo uses a static JSON menu (no PHP / no database online).

- Menu source: menu.json
- Images: stored in images/

> GitHub Pages does not execute PHP, so backend features are available only locally.

---

## Features

### Frontend
- Show menu items
- Categories / search (if implemented)
- Cart & order UI

### Backend (Local - WAMP)
- api.php endpoints (login/register/orders/products/admin actions)
- Admin panel: admin.html
- MySQL database: foodie_db

---

## Project Structure
/css /js /images /videos index.html admin.html api.php menu.json

---

## Run Locally (Full Project) ✅

### 1) Requirements
- Windows
- WAMP Server (Apache + PHP + MySQL)

### 2) Setup
1. Install and run WAMP
2. Copy the project folder into WAMP www directory, for example: C:\wamp64\www\ordering-restaurant\
3. Make sure WAMP icon is green (Apache + MySQL running)

### 3) Database
The database schema is included in this repository.

- Database name: foodie_db
- SQL file: foodie_db.sql
- 
### 4) Import Database (WAMP)

1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Create a new database named: foodie_db
3. Import the SQL file: foodie_db.sql

### 5) Default DB Credentials (WAMP)
Common default WAMP credentials:
- Host: localhost
- Username: root
- Password: *(empty)*
- Database: foodie_db

> If your WAMP credentials are different, update them inside api.php.

## Notes
- This repository includes a static demo for GitHub Pages.
- Backend requires a PHP + MySQL server (WAMP recommended for local setup).
