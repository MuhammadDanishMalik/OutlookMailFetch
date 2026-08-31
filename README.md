# OutlookMailFetch 📬

A modern, high-performance Next.js application designed to fetch **Netflix Household Update links**, **temporary access codes**, and **2FA verification codes / OTPs** across multiple Outlook, Hotmail, and Microsoft Mail accounts without repetitive browser logins.

---

## ✨ Features

- **⚡ Direct IMAP Protocol**: Connects securely via SSL to `outlook.office365.com:993` (also auto-detects Hotmail, Live, MSN, and Yahoo/Gmail).
- **📺 Netflix Household & Link Extractor**: Automatically parses Netflix Household update emails, temporary 4-digit codes, and creates 1-click **"Update Household / Confirm Link"** action buttons.
- **🔐 Instant OTP & PIN Detection**: Smart regex and pattern matching to extract 4–8 digit verification codes with a **1-Click Copy** button.
- **🗄️ Multi-Account Vault**: Bulk import hundreds or thousands of accounts in `email:password` combo format. Credentials are saved locally on your machine in `data/accounts.json`.
- **🔄 Live Waiting Mode**: Toggle 10-second automatic polling with a live countdown timer when waiting for a verification code to drop.
- **📖 Full Email Reader**: Click any email to view formatted HTML, plaintext, and header details.
- **✨ Demo Mode**: Built-in simulator with sample Netflix and verification emails for instant preview.

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone git@github.com:MuhammadDanishMalik/OutlookMailFetch.git
cd OutlookMailFetch
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to use the app.

---

## 🛠️ Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **IMAP Engine**: [ImapFlow](https://imapflow.com/)
- **Parser**: [Mailparser](https://nodemailer.com/extras/mailparser/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📄 License
MIT
