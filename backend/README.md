# Sevora Backend API

The RESTful API and document storage service for **Sevora**, built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **Multer**.

## 🛠️ Tech Stack & Key Modules

- **Runtime**: Node.js v18+
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **File Uploads**: Multer with private disk storage & binary magic-byte inspection (`detectLicenseFileType`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) with dual cookie delivery (`token`, `sevora_token`) and Bearer header fallback
- **Password Security**: `bcryptjs` (salt rounds: 12)

## 🚀 Quick Start (Windows / PowerShell)

```powershell
cd backend
npm install
node src/seedDemoData.js   # Seeds starter services & demo professionals
npm start                  # Runs at http://localhost:5000
```

## ⚙️ Environment Variables (.env)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sevora
JWT_SECRET=sevora_jwt_secret_key_prod_2026
CLIENT_URL=http://localhost:5173
```

## 🔐 Security Features

- **Private Uploads**: Driver licence documents are saved outside public static access under `backend/private_uploads/driver_licenses/`.
- **Magic-Byte Detection**: File extension spoofing is thwarted by inspecting genuine file signatures (`%PDF` for PDF, `\xFF\xD8\xFF` for JPEG, PNG header).
- **Driver Role-Gating**: Only accounts with active role `driver` can access upload/read endpoints for driving licences.
- **Role Sanitization**: Role switching cleanly assigns `[role]` preventing role pollution across accounts.
