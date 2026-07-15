// The backend API base URL.
// - Locally: falls back to http://localhost:3000
// - In production: set VITE_API_URL in the host's env (e.g. https://your-app.onrender.com)
export const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
