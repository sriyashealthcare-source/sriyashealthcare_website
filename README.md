# Sriyas Healthcare Pvt. Ltd. — Full-Stack Web Application

A scalable, secure, production-ready full-stack web application for **Sriyas Healthcare Private Limited**, a premier distributor of surgical sutures, tissue adhesives, hernia meshes, wound care solutions, and biomaterials across India.

The platform provides two independent interfaces powered by a unified Node.js + Express REST API and MongoDB database:
1. **Customer-Facing Website (`/`)**: Preserves the established Sriyas Healthcare luxury gold-and-ivory design, partner brand showcase, category hero banners, dynamic product catalogue, multi-image galleries, technical specifications, and downloadable PDF brochures.
2. **Administrator Console (`/admin/*`)**: A separate, JWT-authenticated dashboard enabling company administrators to add, edit, disable, or archive products, manage brands and categories, upload product images and PDF brochures to Cloudinary, and monitor customer product-view analytics in real time without touching source code.

---

## 1. Project Architecture

```text
sriyas-healthcare/
├── client/                         # React 18 + Vite Frontend (Customer & Admin UI)
│   ├── public/
│   │   ├── assets/
│   │   │   ├── logos/              # Company emblems & partner brand logos
│   │   │   ├── categories/         # Extracted category hero banner images
│   │   │   ├── products/           # Extracted original product & gallery images
│   │   │   ├── documents/          # Extracted original product brochure PDFs
│   │   │   └── contact/            # Storefront location photo
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # DateRangeBar & shared UI controls
│   │   │   ├── navbar/             # Customer Navbar
│   │   │   ├── footer/             # Customer Footer
│   │   │   ├── product/            # ProductCard component
│   │   │   ├── product-details/    # ImageGallery component
│   │   │   └── admin/              # ProductForm & SVG AnalyticsCharts
│   │   ├── pages/
│   │   │   ├── customer/           # Home, Products, ProductDetails, Contact
│   │   │   └── admin/              # AdminLogin, AdminDashboard, ProductManagement,
│   │   │                           # AddProduct, EditProduct, BrandCategoryManagement,
│   │   │                           # ProductAnalytics, AdminSettings
│   │   ├── layouts/                # CustomerLayout & AdminLayout
│   │   ├── services/               # Axios API client, product, auth & analytics services
│   │   ├── context/                # AuthContext (Admin session management)
│   │   ├── utils/                  # Anonymous visitor session & asset URL resolver
│   │   ├── styles/                 # Modular CSS3 (variables, global, customer, admin)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json                 # Vercel SPA rewrite configuration
│   ├── vite.config.js
│   └── package.json
│
├── server/                         # Node.js + Express Backend REST API
│   ├── config/
│   │   ├── database.js             # MongoDB Atlas connection (+ local dev fallback)
│   │   └── cloudinary.js           # Cloudinary SDK integration (+ local dev fallback)
│   ├── controllers/                # Product, Brand, Category, Auth & Analytics logic
│   ├── models/                     # Mongoose Schemas (Product, Brand, Category, Admin, ProductView)
│   ├── routes/                     # Public & protected Admin Express routers
│   ├── middleware/                 # JWT Auth, Multer upload, Input validation & Error handling
│   ├── utils/                      # Local development persistence engine
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── scripts/
│   ├── catalogData.json            # Complete extracted catalogue (5 brands, 13 categories, 25 products)
│   └── seedProducts.js             # Idempotent MongoDB & Cloudinary migration/seed script
│
├── render.yaml                     # Render backend deployment blueprint
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 2. Prerequisites

- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **MongoDB Atlas Account**: For cloud production database storage
- **Cloudinary Account**: For cloud product image and PDF brochure storage

---

## 3. Installing Dependencies

Install dependencies for the root workspace, backend (`server/`), and frontend (`client/`):

```bash
npm run install:all
```

Or install each folder individually:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

---

## 4. Configuring MongoDB Atlas

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a cluster (Free M0 tier or higher).
2. Under **Database Access**, create a database user with **Read and write to any database** privileges.
3. Under **Network Access**, allow access from your local IP address and `0.0.0.0/0` (so Render can connect).
4. Click **Connect → Drivers** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/sriyas_healthcare?retryWrites=true&w=majority
   ```
5. Paste this URI as `MONGODB_URI` in your `.env` file.

> **Note for Local Development**: If `MONGODB_URI` is left blank during initial local testing (`NODE_ENV=development`), the backend automatically falls back to a local persistent database file (`server/data/sriyas_db.runtime.json`) and seeds all 25 products so you can run and test the entire application immediately.

---

## 5. Configuring Cloudinary

1. Sign in to [Cloudinary](https://cloudinary.com/) and open your **Dashboard**.
2. Copy your **Cloud Name**, **API Key**, and **API Secret**.
3. Add them to your root `.env` file:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

> **Note**: When Cloudinary credentials are provided, running `npm run seed` automatically uploads all extracted product images, category banners, and PDF brochures to Cloudinary and saves their `secure_url` and `public_id` in MongoDB.

---

## 6. Setting Environment Variables

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
2. Fill in the values in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development

   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/sriyas_healthcare?retryWrites=true&w=majority

   JWT_SECRET=replace_with_a_strong_64_char_random_hex_secret
   JWT_EXPIRES_IN=1d

   CLIENT_URL=http://localhost:5173

   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   ADMIN_NAME=Sriyas Healthcare Admin
   ADMIN_EMAIL=admin@sriyashealthcare.com
   ADMIN_PASSWORD=ChangeMe@Sriyas2026!
   ```
3. (Optional) In `client/.env`, `VITE_API_URL=/api` is used by default in local development. For production on Vercel, set `VITE_API_URL=https://<your-render-backend>.onrender.com/api`.

---

## 7. Creating the Initial Administrator

The initial administrator account is created automatically using `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `.env` whenever:
- You run `npm run seed`, **or**
- The backend server boots against an empty database.

The password is hashed using `bcryptjs` (12 salt rounds) before saving. Once logged in at `/admin/login`, the company owner can update their email or password anytime under **Settings (`/admin/settings`)**.

---

## 8. Migrating Existing Products

All **5 Partner Brands**, **13 Categories**, **25 Products**, **product image galleries**, and **2 GORE PDF Brochures** from the original monolithic `index.html` have been extracted into `scripts/catalogData.json` and `client/public/assets/`.

To run or re-run the idempotent migration and verification script at any time:

```bash
npm run seed
```

The script upserts every brand, category, and product by `slug` (never creating duplicates) and prints a verification report confirming that all 25 products, images, and brochures match the original catalogue.

---

## 9. Starting the Backend

To start the Express backend server in development mode (port `5000`):

```bash
npm run dev:server
```

Health check endpoint: `http://localhost:5000/api/health`

---

## 10. Starting the Frontend

To start the React + Vite frontend development server (port `5173`):

```bash
npm run dev:client
```

Or run both backend and frontend concurrently from the root folder:

```bash
npm run dev
```

- **Customer Website**: `http://localhost:5173/`
- **Administrator Login**: `http://localhost:5173/admin/login`

---

## 11. Building for Production

To compile and bundle the React + Vite frontend for production (`client/dist`):

```bash
npm run build
```

---

## 12. Deploying Backend to Render

1. Push this repository to GitHub.
2. In [Render](https://render.com/), click **New + → Web Service** and connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGODB_URI` = *(Your MongoDB Atlas connection string)*
   - `JWT_SECRET` = *(Strong random secret)*
   - `JWT_EXPIRES_IN` = `1d`
   - `CLIENT_URL` = `https://your-vercel-domain.vercel.app`
   - `CLOUDINARY_CLOUD_NAME` = *(Your Cloudinary cloud name)*
   - `CLOUDINARY_API_KEY` = *(Your Cloudinary API key)*
   - `CLOUDINARY_API_SECRET` = *(Your Cloudinary API secret)*
   - `ADMIN_NAME` = `Sriyas Healthcare Admin`
   - `ADMIN_EMAIL` = `admin@sriyashealthcare.com`
   - `ADMIN_PASSWORD` = *(Strong initial admin password)*
5. Deploy the service. On first boot, the server automatically seeds the 5 brands, 13 categories, 25 products, and initial admin if the database is empty.

---

## 13. Deploying Frontend to Vercel

1. In [Vercel](https://vercel.com/), click **Add New… → Project** and import your GitHub repository.
2. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://<your-render-service-name>.onrender.com/api`
4. Click **Deploy**. Note that `client/vercel.json` is pre-configured with SPA rewrites (`"source": "/(.*)", "destination": "/index.html"`) so direct navigation and page refreshes on `/products/i-col` or `/admin/dashboard` work without 404 errors.

---

## 14. Troubleshooting Common Issues

- **CORS Error in Production**: Ensure `CLIENT_URL` on Render matches your exact Vercel domain (e.g. `https://sriyas-healthcare.vercel.app`, with no trailing slash).
- **MongoDB Connection Timeout**: Verify that `0.0.0.0/0` is whitelisted under **Network Access** in MongoDB Atlas and that special characters in your database password are URL-encoded.
- **Image or PDF Upload Fails in Production**: Verify that `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set in Render's Environment Variables and that uploaded files are under 15 MB.
- **Admin Session Expires**: Log in again at `/admin/login`. Ensure `JWT_SECRET` is set and consistent across restarts.

