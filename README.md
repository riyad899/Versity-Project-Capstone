# Versity Project Capstone

Unified full-stack project containing both frontend (`Clint`) and backend (`Server`).

---

## 📁 Project Structure

```text
versity-project-capstone/
├── Clint/                 # React + Vite Frontend
│   ├── .env.example       # Example environment variables template
│   ├── package.json
│   └── src/
├── Server/                # Express + MongoDB Backend
│   ├── .env.example       # Example environment variables template
│   ├── package.json
│   └── src/
├── .gitignore             # Root gitignore (excludes node_modules & .env files)
├── package.json           # Root package.json with unified runner scripts
└── README.md
```

---

## 🚀 Getting Started

### 1. Install All Dependencies

From the root directory:

```bash
npm run install:all
```

Or individually:

```bash
npm install
npm --prefix Clint install
npm --prefix Server install
```

### 2. Configure Environment Variables

Create `.env` files from their respective `.env.example`:

- **Frontend**: copy `Clint/.env.example` to `Clint/.env`
- **Backend**: copy `Server/.env.example` to `Server/.env` and update with your MongoDB URI and secrets.

> **Note**: Real `.env` files and `node_modules` are automatically ignored by Git to prevent leaking sensitive secrets.

---

## 🏃 Running the Project

To start both the client and server concurrently with one command:

```bash
npm run dev
```

### Separate Commands (Optional)

- Run only backend:
  ```bash
  npm run dev:server
  ```
- Run only frontend:
  ```bash
  npm run dev:client
  ```
- Build frontend:
  ```bash
  npm run build
  ```

---

## ✨ Features

- System can display the current location and movement of active buses on an interactive map.


