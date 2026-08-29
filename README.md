# ✨ Modern Cinematic Portfolio & CMS

<div align="center">

![Portfolio Banner](https://img.shields.io/badge/Live%20Demo-Available-00f0ff?style=for-the-badge&logo=google-chrome&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-Deployment-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

<br/>

**A state-of-the-art, high-performance personal portfolio and interactive CMS designed for modern engineers, creators, and community managers.**

Featuring **scene-based navigation**, **refractive glassmorphism**, **3D canvas particle physics**, **interactive coverflow carousels**, **elastic experience accordions**, and a **fully integrated Supabase headless content management system**.

[Explore Features](#-key-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Supabase Setup](#-supabase-backend-setup) • [Admin Panel](#-admin-panel--cms) • [Deployment](#-deployment)

</div>

---

## 🌟 Highlights

- 🛸 **Cinematic Scene Navigation**: Fullpage section paging with mouse wheel inertia dampening, touch gesture recognition, and arrow key support.
- 💎 **Liquid Glassmorphism UI**: Custom refractive glass styling with backdrop blur, dynamic lighting highlights, and fluid hover physics.
- 🌌 **Interactive Physics Particles**: Interactive Canvas particle constellation with mouse proximity physics, velocity damping, and ambient glow.
- 🎨 **Dynamic Accent Color Engine**: Real-time theme customization with instant CSS variable injection and persistent multi-layer storage.
- 📱 **Zero-Lag Mobile Experience**: Responsive viewport adaptation with hardware-accelerated GPU scrolling and touch-friendly controls.
- ⚡ **Supabase Headless CMS**: Real-time synchronization for projects, experience timeline, client testimonials, skills, and site settings.
- 🔒 **Secure Admin Dashboard**: Single-page administrative studio with Supabase authentication, image uploading, analytics tracking, and maintenance toggles.

---

## 📸 Section Overview

| Scene | Description | Interactive Highlights |
| :--- | :--- | :--- |
| **Hero** | High-impact introduction with status badge, role cycler, and quick CTA links. | Ambient glow tracker, floating badges, dynamic avatar frame. |
| **About** | Professional bio, core metrics, and structured background details. | Refractive data cards, 2-column balanced layout. |
| **Work / Projects** | Showcase for Software Engineering and Community Management. | 3D Coverflow slider with direct GitHub/Live preview modals. |
| **Skills** | Categorized toolchain and technology stack cards. | Glass hover elevation, dynamic accent borders, tech tags. |
| **Experience** | Chronological career history and organizational roles. | Elastic accordion cards that expand smoothly on cursor hover. |
| **Testimonials** | Client feedback and ratings from Fiverr and global clients. | Multi-tab coverflow carousel with review stars and client avatars. |
| **Contact** | Integrated communication hub and direct mail gateway. | Authentic 4-color Gmail hover button and social links. |

---

## 🛠️ Tech Stack

### Frontend & Core
- **Markup**: Semantic HTML5 with modern OpenGraph & Twitter Card SEO metadata.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Vanilla CSS Design System (`styles.css`).
- **Typography**: [Geist](https://fonts.google.com/specimen/Geist), [Outfit](https://fonts.google.com/specimen/Outfit), Google Material Symbols, [Font Awesome 6](https://fontawesome.com/).
- **Animations**: CSS3 GPU-accelerated transitions, Canvas 2D Physics engine, custom RAF ticker loops.

### Backend & Cloud Services
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security).
- **Authentication**: Supabase Auth (Email & Password with Session Persistence).
- **Analytics & SEO**: Google Analytics 4 (GA4) integration & Google Search Console verification support.
- **Hosting / Edge**: [Cloudflare Pages](https://pages.cloudflare.com/) (`wrangler.toml`).

---

## 📁 Repository Structure

```tree
├── admin.html               # Administrative CMS Dashboard UI
├── index.html               # Main Public Portfolio (Single-Page Scenes)
├── apps.html                # Standalone Web Applications Showcase
├── wrangler.toml            # Cloudflare Pages deployment configuration
├── package.json             # Development scripts and CLI tooling
│
├── assets/
│   ├── css/
│   │   └── styles.css       # Core design tokens, glassmorphism, animations & media queries
│   │
│   └── js/
│       ├── admin.js         # Admin CMS logic (CRUD operations, auth, file uploads)
│       ├── ambient-glow.js  # Dynamic mouse-tracking ambient radial light effect
│       ├── particles-bg.js  # Interactive HTML5 Canvas particle constellation engine
│       ├── render-content.js# Public data fetching, DOM hydration & fallback rendering
│       ├── scene-nav.js     # Cinematic scene paging & scroll-lock coordinator
│       ├── supabase-client.js# Supabase SDK initialization
│       ├── tailwind-config.js# Custom Tailwind color palettes, radii & fonts
│       └── work-tabs.js     # Category filtering & tab gliders
│
└── supabase/
    ├── setup.sql            # Core database schema, RLS policies, and triggers
    ├── migration_4_full_content.sql
    ├── migration_5_admin_v2.sql
    └── ...                  # Incremental database migrations
```

---

## 🚀 Quick Start

### 1. Prerequisites
- A modern web browser with ES6+ support.
- Optional: Node.js (v18+) for local development servers or Cloudflare Wrangler CLI.

### 2. Clone the Repository
```bash
git clone https://github.com/Ehsanultanjil/My-portfolio-.git
cd My-portfolio-
```

### 3. Run Locally

You can serve the static files using any lightweight HTTP server:

**Using Python:**
```bash
# Python 3
python -m http.server 3000
```

**Using Node / npx:**
```bash
npx serve .
# or
npx live-server .
```

**Using Cloudflare Wrangler:**
```bash
npm install
npx wrangler pages dev .
```

Open [http://localhost:3000](http://localhost:3000) (or the displayed local URL) in your browser.

---

## 🗄️ Supabase Backend Setup

To enable dynamic content editing and the Admin Panel:

1. **Create a Supabase Project**: Head to [supabase.com](https://supabase.com/) and create a new project.
2. **Execute Database Setup**:
   - Navigate to the **SQL Editor** in your Supabase dashboard.
   - Run the contents of [`supabase/setup.sql`](file:///e:/projects/portfolio/supabase/setup.sql).
   - Run additional migration scripts in the [`supabase/`](file:///e:/projects/portfolio/supabase/) folder if needed.
3. **Configure API Credentials**:
   - Open [`assets/js/supabase-client.js`](file:///e:/projects/portfolio/assets/js/supabase-client.js) and insert your project URL and public Anon Key:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
4. **Create Admin User**:
   - In Supabase Dashboard, go to **Authentication** > **Users** > **Add User** (enter an admin email & password).
   - Log into `/admin.html` with those credentials.

---

## 🎛️ Admin Panel & CMS (`/admin.html`)

The portfolio includes a built-in content management suite accessible at `/admin.html`:

- **Site Settings**: Customize SEO titles, meta descriptions, favicon, navbar logo, and maintenance mode.
- **Color Theme Customizer**: Pick any custom hex accent color or choose from curated presets (Neon Cyan, Cyber Purple, Emerald Green, Golden Amber, Electric Blue, Crimson Rose).
- **Visual FX Toggles**: Toggle Particle Background, Ambient Cursor Glow, Preloader, and Video/Image Backgrounds with a single click.
- **Project Manager**: Add, edit, reorder, or delete engineering and community projects with image uploads, tags, and live URLs.
- **Experience Timeline**: Manage employment, internships, and freelance roles.
- **Testimonials Hub**: Add client testimonials, star ratings, review platforms (Fiverr, Upwork, Direct), and client profile photos.
- **Skills Matrix**: Add tools, libraries, and frameworks categorized by domain.

---

## ☁️ Deployment

### Cloudflare Pages (Recommended)
This repository contains a pre-configured [`wrangler.toml`](file:///e:/projects/portfolio/wrangler.toml).
1. Connect your GitHub repository to Cloudflare Pages.
2. Set the build output directory to `/` (Root directory).
3. Deploy!

### GitHub Pages
1. Go to repository **Settings** > **Pages**.
2. Select `Deploy from a branch` and choose `main` / `root`.
3. Save to publish instantly.

### Vercel / Netlify
Deploy directly as a static site by selecting the root directory. No custom build step required.

---

## 👤 Author

**Ehsanul Karim Tanjil**
*Computer Science & Engineering Student @ BUBT | Web Developer | Fiverr Level 2 Seller*

- 🌐 **Portfolio**: [https://tanjil.pages.dev](https://tanjil.pages.dev)
- 💼 **Fiverr**: [fiverr.com/ehsanultanjil](https://www.fiverr.com/ehsanultanjil) (65+ Reviews, 4.9★)
- 🐙 **GitHub**: [@Ehsanultanjil](https://github.com/Ehsanultanjil)
- ✉️ **Email**: [ehsanultanjil@gmail.com](mailto:ehsanultanjil@gmail.com)
- 💬 **Telegram**: [@Ehsanultanjil](https://t.me/Ehsanultanjil)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — you are free to customize and use it for your own portfolio.
