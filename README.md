# CTFd Flask + React SPA POC

This is a modern, high-performance Single Page Application (SPA) frontend for CTFd, built with React, TypeScript, and Tailwind CSS, and served by a Flask API proxy.

## Features

- **Modern UI**: Built with React and Tailwind CSS for a premium look and feel.
- **SPA Architecture**: Smooth navigation without page reloads.
- **Scoreboard Visualization**: Dynamic charts using Chart.js to track competition progress.
- **Complete Flow**: Includes Home, Login, Challenges, Challenge Details, and Scoreboard.
- **API Proxy**: Flask acts as a secure intermediary to the CTFd v1 API.

## Setup & Development

### Backend (Flask)

1. Install `uv` if you haven't already.
2. Sync dependencies:
   ```bash
   uv sync
   ```
3. Run the backend:
   ```bash
   uv run app.py
   ```

### Frontend (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (with HMR):
   ```bash
   npm run dev
   ```
   The frontend will proxy API calls to `localhost:5000`.

## Production Build

To build the frontend for production (so Flask can serve it directly):

1. Build the assets:
   ```bash
   cd frontend
   ```
2. Run build:
   ```bash
   npm run build
   ```
3. The built files will be in `frontend/dist`. Flask is configured to serve these files automatically.

## Configuration

Modify `settings.toml` to point to your CTFd instance:

```toml
host = "https://demo.ctfd.io"
secret_key = "your-secret-key"
port = 5000
debug = true
```
