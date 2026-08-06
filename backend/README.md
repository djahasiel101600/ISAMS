# ISAMS Django Backend

This backend provides the Django REST Framework API used by the ISAMS frontend.

## Setup

1. Create a Python virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Configure the database connection using environment variables or the `.env.example` file.
   - Default PostgreSQL settings:
     - DB name: `isams`
     - User: `isams`
     - Password: ``
     - Host: `localhost`
     - Port: `5432`

4. Run migrations:

   ```powershell
   python manage.py migrate
   ```

5. Start the server on port `8001`:
   ```powershell
   python manage.py runserver 8001
   ```

## Notes

- The frontend expects the API root at `http://localhost:8001/api/v1`.
- This backend exposes endpoints for organizations, users, categories, locations, assets, room scans, auditing, reporting, and system bootstrapping.
