# Mobile App Development Showcase — Local Network Web Application

A professional, internal work showcase and project documentation web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **SQLite via Prisma**.

Designed for mobile application developers to document and present their work (features, technical architecture, changes, and before/after screenshots) directly to their manager or team over the local network.

---

## 🔒 Permanent Local Data Storage & Privacy

All project data, changelogs, technical specifications, and high-resolution screenshots are stored **permanently on this local PC**:

- **Database**: SQLite database stored at `./data/showcase.db` (configurable via `.env`: `DATABASE_URL="file:./data/showcase.db"`).
- **Uploaded Screenshots**: Stored on disk under `./uploads/project-<id>/[old-ui|new-ui|additional]/`.
- **Git Exclusions**:
  The `.gitignore` explicitly ignores:
  ```gitignore
  /data/*.db
  /data/*.db-journal
  /data/*.db-wal
  /data/*.db-shm
  /uploads/*
  ```
  **Your work records, internal project notes, and actual screenshot files remain strictly on this computer and are never committed or pushed to GitHub.** Empty `./data` and `./uploads` folders are maintained in version control via `.gitkeep`.

---

## ⚡ Quick Start (One Command)

### 1. Install & Run Dev Server
```bash
npm install && npm run dev
```

### 2. Production Build & Start
```bash
npm run build && npm start
```

Both dev and production servers automatically bind to **`0.0.0.0:3005`**, making the app accessible on your computer (`http://localhost:3005`) and to any device on your local Wi-Fi or Ethernet network (`http://YOUR-PC-IP:3005`).

---

## 🌐 How to Find Your PC's Local IP Address

### Windows
1. Open PowerShell or Command Prompt.
2. Run:
   ```cmd
   ipconfig
   ```
3. Look for **IPv4 Address** under your active connection (Wi-Fi or Ethernet), e.g. `192.168.100.74`.
4. Share `http://192.168.100.74:3005` with your manager.

*(Note: If devices cannot connect, allow port 3005 in Windows Firewall: `New-NetFirewallRule -DisplayName "Showcase" -Direction Inbound -LocalPort 3005 -Protocol TCP -Action Allow`)*

### macOS
1. Open Terminal.
2. Run:
   ```bash
   ipconfig getifaddr en0
   # If connected via Ethernet/Wi-Fi adapter, try en1:
   ipconfig getifaddr en1
   ```
3. Or go to **System Settings** → **Network** → Click your connected network to see your IP.

### Linux
1. Open Terminal.
2. Run:
   ```bash
   hostname -I | awk '{print $1}'
   # or
   ip -br a
   ```

---

## 💾 System Backup & Restore

In the Admin Dashboard (`/admin`), click **Data Backup** to open the backup manager:

1. **Full System Backup (.ZIP)**:
   - Click **Download Backup** to generate a single `showcase-backup.zip` containing the SQLite database and all uploaded screenshots from `./uploads`.
   - To restore on this or another computer, select **Upload Zip**. A clear confirmation prompt will warn that the current database and uploads will be replaced, validates the zip archive, and restores everything cleanly.
2. **JSON Export / Import**:
   - For lightweight data migration without binary images.

---

## 📂 Project Structure

```
├── app/
│   ├── admin/                    # Admin project management & form editor
│   ├── showcase/                 # Public presentation & detail views
│   ├── uploads/[...path]/        # Runtime image static server (with path-traversal protection)
│   ├── api/                      # REST endpoints (projects, stats, images, backup)
│   └── globals.css               # Tailwind & custom print styles
├── components/                   # Lightbox, ComparisonSlider, Timeline, Modals, Forms
├── data/                         # SQLite database storage (showcase.db)
├── uploads/                      # Permanent screenshot files (project-<id>/...)
├── lib/                          # Prisma client singleton, Sharp image processors
├── prisma/                       # Database schema and SQL migrations
└── README.md
```
