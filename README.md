# MeshCore Bay Area Map

A self-hosted web app for visualizing MeshCore nodes and your personal repeaters across the SF Bay Area (SFO/OAK/SJC).

## Features
- Live map of all community nodes synced from letsmesh.net (Bay Area only)
- Add/edit/delete your own repeaters with full technical details
- Auto-syncs community nodes every 5 minutes

## Setup

### Prerequisites
- Node.js 18+
- npm

### Backend
```bash
cd backend
npm install
npm start
```
Runs on http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm start
```
Runs on http://localhost:3000

## Production Deployment (Ubuntu VM)

### Install dependencies
```bash
sudo apt update && sudo apt install -y nodejs npm
sudo npm install -g pm2
```

### Build and run
```bash
# Backend
cd backend && npm install
pm2 start src/server.js --name meshcore-backend

# Frontend — build static files
cd frontend && npm install && npm run build
# Serve with nginx or pm2 serve
pm2 serve build 3000 --name meshcore-frontend --spa

pm2 save
pm2 startup
```

## Project Structure
```
meshcore-map/
├── backend/
│   ├── src/
│   │   ├── server.js       # Express app
│   │   ├── db.js           # SQLite setup
│   │   ├── sync.js         # Cron sync from letsmesh.net
│   │   └── routes/
│   │       ├── nodes.js    # Community node endpoints
│   │       └── repeaters.js # Your repeater CRUD
│   └── data/               # SQLite DB (git-ignored)
└── frontend/
    └── src/
        ├── App.js           # Map + state
        └── components/
            └── RepeaterPanel.js  # Add/edit form
```

## Notes
- Community node field names from api.letsmesh.net may need adjustment in `backend/src/sync.js` once the actual API response is inspected
- Bay Area bounding box can be adjusted in `backend/src/sync.js`
