
# 🌸 AniTrackr

**AniTrackr** is a modern, responsive, and social anime tracking dashboard. It allows users to track their watching progress, receive AI-powered recommendations, read community news, and earn achievements.

Built with **React 19**, **Vite**, **Supabase**, and powered by **Google Gemini AI**.

---

## ✨ Key Features

-   **📚 Library Management**: Track anime you are watching, completed, or planning to watch. Update episodes and scores easily.
-   **🤖 AI-Powered Insights**: Uses Google Gemini to analyze your library and generate a unique "Otaku Personality" and personalized recommendations.
-   **📰 Community News**: A user-generated news feed to share updates, reviews, and rumors.
-   **🏆 Gamification**: Earn badges (Bronze, Silver, Gold) for watching episodes, completing series, and engaging with the community.
-   **📱 Fully Responsive**: A seamless experience on desktop and mobile devices.
-   **🔎 Live Search**: Integrated with the AniList GraphQL API for instant, accurate anime data.
-   **🔒 Secure Auth**: robust authentication and user management via Supabase.

---

## 🛠️ Tech Stack

-   **Frontend**: React 19, Vite, TypeScript
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **Charts**: Recharts
-   **Backend / Database**: Supabase (PostgreSQL, Auth, Realtime)
-   **AI**: Google Gemini API (`@google/genai`)
-   **Image Hosting**: Cloudinary
-   **Data Source**: AniList GraphQL API

---

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18+)
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/anitrackr.git
    cd anitrackr
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory. You will need keys from Supabase, Google AI Studio, and Cloudinary.

    ```env
    # Google Gemini AI (Required for AI features)
    API_KEY=your_google_gemini_api_key

    # Supabase (Auth & DB)
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

    # Cloudinary (Image Uploads)
    VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
    VITE_CLOUDINARY_UPLOAD_PRESET=anitrackr_uploads
    ```

    *Note: Currently, some keys are hardcoded in `services/` for demo purposes. For production, ensure you replace the hardcoded strings in `supabaseClient.ts` and `cloudinaryService.ts` with these variables.*

4.  **Run the development server**
    ```bash
    npm run dev
    ```

---

## 🗄️ Database Setup (Supabase)

To get the app running, you need to create the following tables in your Supabase SQL Editor.

```sql
-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- 1. Profiles Table
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  banner_url text,
  bio text,
  favorite_genres text[],
  is_private boolean default false,
  show_adult_content boolean default false,
  post_login_default text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Library Table
create table library (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  anime_id bigint not null,
  status text not null, -- WATCHING, COMPLETED, etc.
  progress int default 0,
  score float default 0,
  notes text,
  metadata jsonb, -- Stores AniList data snapshot
  updated_at bigint,
  unique(user_id, anime_id)
);

-- 3. News Posts
create table news_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  author_name text,
  author_avatar text,
  is_anonymous boolean default false,
  title text not null,
  body text not null,
  image_url text,
  source_name text,
  source_url text,
  related_anime_id int,
  likes_count int default 0,
  comments_count int default 0,
  view_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. News Comments
create table news_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references news_posts(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  username text,
  avatar_url text,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. News Likes
create table news_likes (
  user_id uuid references profiles(id) not null,
  post_id uuid references news_posts(id) on delete cascade not null,
  primary key (user_id, post_id)
);

-- 6. User Badges
create table user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  badge_id text not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Favorites
create table favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  anime_id bigint not null,
  title text,
  cover_image text,
  format text
);

-- IMPORTANT: Enable RLS and add Policies for 'select', 'insert', 'update', 'delete' 
-- so users can only modify their own data.
```

---

## 📦 Deployment

This project is optimized for **Vercel**.

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  Vercel will detect the `Vite` framework automatically.
4.  Add your **Environment Variables** in the Vercel dashboard.
5.  Deploy!

### Important: Supabase Auth Redirect
After deploying, go to your Supabase Dashboard > Authentication > URL Configuration.
Add your Vercel URL (e.g., `https://anitrackr.vercel.app/**`) to the **Redirect URLs**.

---

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License.
