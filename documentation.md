# CodeLens AI — Documentation

> **AI-powered code analysis platform** with 13 specialized modes including architecture visualization, security scanning, AI debugging, documentation generation, PR review, and multi-repository understanding.

**Live URL**: [https://rapid-code-insight.lovable.app](https://rapid-code-insight.lovable.app)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Pricing & Plans](#pricing--plans)
- [Project Setup](#project-setup)
  - [Prerequisites](#prerequisites)
  - [Clone & Install](#clone--install)
  - [Environment Variables](#environment-variables)
  - [Supabase Setup](#supabase-setup)
  - [Database Schema](#database-schema)
  - [Edge Functions](#edge-functions)
  - [Running Locally](#running-locally)
  - [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Analysis Modes](#analysis-modes)
- [Landing Page](#landing-page)
- [User Guide](#user-guide)
  - [Getting Started](#getting-started)
  - [Analyzing Code by Pasting](#analyzing-code-by-pasting)
  - [Analyzing a GitHub Repository](#analyzing-a-github-repository)
  - [Reviewing a Pull Request](#reviewing-a-pull-request)
  - [Multi-Repository Analysis](#multi-repository-analysis)
  - [Generating Documentation](#generating-documentation)
  - [Follow-Up Questions](#follow-up-questions)
  - [Sharing Analyses](#sharing-analyses)
  - [Viewing History](#viewing-history)
  - [Usage Dashboard](#usage-dashboard)
  - [Exporting Results](#exporting-results)
- [Authentication](#authentication)
- [Data Flow](#data-flow)
- [API Reference](#api-reference)
  - [analyze-code Edge Function](#analyze-code-edge-function)
  - [fetch-github Edge Function](#fetch-github-edge-function)
- [Theming](#theming)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Overview

CodeLens AI is a web application that lets developers paste code, connect GitHub repositories, or submit Pull Request URLs — and instantly receive AI-powered analysis across 13 specialized modes. Results include rich markdown with inline Mermaid diagrams, syntax-highlighted code blocks, and actionable insights.

### Key Capabilities

| Capability | Description |
|---|---|
| 13 analysis modes | Architecture, security, debugging, test gen, documentation, and more |
| GitHub integration | Fetch public/private repos and PR diffs directly |
| Multi-repo analysis | Analyze 2–5 repositories together as a system |
| Streaming output | Real-time AI response streaming with Mermaid diagram rendering |
| Analysis history | Cloud-persisted history with search and replay |
| Shareable links | Generate short links to share analysis results |
| Usage dashboard | Track streaks, languages, modes used, and activity charts |
| Dark/Light themes | Full theme support with system preference detection |
| Authentication | Email/password and Google OAuth sign-in |

---

## Features

### Analysis Modes (13 total)

| Category | Mode | Description |
|---|---|---|
| **Understand** | Architecture | Patterns, modules, Mermaid diagrams |
| **Understand** | Request Flow | Trace data through the system with sequence diagrams |
| **Understand** | Knowledge Graph | Developer onboarding map with class diagrams |
| **Understand** | Multi-Repo | Cross-repository system analysis |
| **Analyze** | Security Scan | Vulnerabilities, injection risks, CSRF/CORS |
| **Analyze** | Performance | Bottlenecks, N+1 queries, bundle size |
| **Analyze** | AI Debug | Find bugs, race conditions, edge cases |
| **Analyze** | Impact Analysis | Change blast radius with dependency maps |
| **Improve** | Best Practices | Code quality scoring and suggestions |
| **Improve** | Refactoring | AI-powered refactor suggestions with before/after |
| **Improve** | Test Generation | Generate unit, integration, and component tests |
| **Improve** | Documentation | Production-grade markdown docs with diagrams |
| **Review** | PR Review | Diff analysis with verdict and regression detection |

---

## Project Setup

### Prerequisites

Ensure you have the following installed on your machine:

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 18.x | JavaScript runtime |
| **npm** or **bun** | Latest | Package manager (bun recommended for speed) |
| **Git** | Latest | Version control |
| **Supabase CLI** | ≥ 1.100.0 | Local Supabase development (optional) |

### Clone & Install

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/codelens-ai.git
cd codelens-ai

# 2. Install dependencies
npm install
# or with bun (faster):
bun install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase connection (required)
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

> **Note**: The `VITE_` prefix is required for Vite to expose these variables to the client bundle. Never put service role keys or private secrets in `VITE_` variables.

### Supabase Setup

#### Option A: Using Lovable Cloud (Recommended)

If deploying via [Lovable](https://lovable.dev), the Supabase project is automatically provisioned and connected. No manual setup needed.

#### Option B: Manual Supabase Project

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Copy your project URL and anon key** from Settings → API
3. **Set the environment variables** in `.env` as shown above
4. **Run the database migrations** (see below)
5. **Deploy edge functions** (see below)

### Database Schema

Run these SQL migrations in your Supabase SQL editor (or via the CLI):

#### 1. Profiles table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

#### 2. Analyses table (history)

```sql
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'Untitled' NOT NULL,
  code TEXT NOT NULL,
  output TEXT NOT NULL,
  question TEXT,
  source TEXT DEFAULT 'paste' NOT NULL,
  mode TEXT DEFAULT 'architecture' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Users can only access their own analyses
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

#### 3. Shared analyses table

```sql
CREATE TABLE public.shared_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8) NOT NULL,
  title TEXT DEFAULT 'Shared Analysis' NOT NULL,
  code TEXT NOT NULL,
  output TEXT NOT NULL,
  question TEXT,
  source TEXT DEFAULT 'paste' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;

-- Anyone can read shared analyses (public links)
CREATE POLICY "Anyone can view shared analyses"
  ON public.shared_analyses FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can create shared analyses
CREATE POLICY "Authenticated users can share"
  ON public.shared_analyses FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### Edge Functions

The project uses two Supabase Edge Functions:

#### 1. `analyze-code` — AI analysis engine

Located at `supabase/functions/analyze-code/index.ts`.

This function:
- Accepts code, an optional question, and a mode
- Selects the appropriate system prompt for the chosen mode
- Streams the AI response back to the client via Server-Sent Events (SSE)

**Required secrets:**
| Secret | Description |
|---|---|
| `LOVABLE_API_KEY` | API key for the Lovable AI Gateway |

#### 2. `fetch-github` — GitHub repository fetcher

Located at `supabase/functions/fetch-github/index.ts`.

This function:
- Fetches repository file trees and contents via GitHub API
- Supports PR diff fetching with metadata
- Accepts optional GitHub personal access tokens for private repos

**No additional secrets required** (uses public GitHub API by default).

#### Deploying Edge Functions

```bash
# If using Supabase CLI locally:
supabase functions deploy analyze-code
supabase functions deploy fetch-github

# Set the required secret:
supabase secrets set LOVABLE_API_KEY=your_lovable_api_key
```

> **If using Lovable Cloud**: Edge functions deploy automatically on every push. Secrets are managed through the Lovable Cloud settings panel.

### Running Locally

```bash
# Start the development server
npm run dev
# or
bun run dev

# The app will be available at http://localhost:5173
```

### Building for Production

```bash
# Create an optimized production build
npm run build

# Preview the production build locally
npm run preview
```

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
npm run lint
```

---

## Project Structure

```
codelens-ai/
├── public/                          # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── App.tsx                      # Root component with routing
│   ├── App.css                      # Global styles
│   ├── main.tsx                     # App entry point
│   ├── index.css                    # Tailwind + design tokens (CSS variables)
│   ├── vite-env.d.ts                # Vite type declarations
│   │
│   ├── pages/                       # Route-level page components
│   │   ├── Index.tsx                # Main analysis page (home)
│   │   ├── Auth.tsx                 # Sign in / Sign up page
│   │   ├── Dashboard.tsx            # Usage analytics dashboard
│   │   ├── ForgotPassword.tsx       # Password reset request
│   │   ├── ResetPassword.tsx        # Password reset form
│   │   ├── SharedAnalysis.tsx       # Public shared analysis viewer
│   │   └── NotFound.tsx             # 404 page
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── AnalysisModeSelector.tsx # 13-mode grid selector
│   │   ├── AnalysisOutput.tsx       # Markdown renderer with Mermaid + syntax highlighting
│   │   ├── CodeInput.tsx            # Code paste textarea with submit
│   │   ├── GitHubInput.tsx          # GitHub repo URL input with parsed preview
│   │   ├── PRInput.tsx              # Pull Request URL input with parsed preview
│   │   ├── MultiRepoInput.tsx       # Multi-repository URL input (2-5 repos)
│   │   ├── ExampleSnippets.tsx      # Pre-built code examples for quick start
│   │   ├── FollowUpInput.tsx        # Follow-up question input after analysis
│   │   ├── HistoryPanel.tsx         # Sliding panel with searchable history
│   │   ├── ShareButton.tsx          # Share analysis via short link
│   │   ├── ThemeToggle.tsx          # Dark/Light/System theme switch
│   │   ├── UserMenu.tsx             # User avatar dropdown with sign out
│   │   ├── NavLink.tsx              # Navigation link component
│   │   └── ui/                      # shadcn/ui component library (40+ components)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.tsx              # Authentication context & methods
│   │   ├── use-mobile.tsx           # Mobile viewport detection
│   │   └── use-toast.ts             # Toast notification hook
│   │
│   ├── lib/                         # Utility libraries
│   │   ├── streaming.ts             # SSE streaming client for AI analysis
│   │   ├── history.ts               # Analysis history CRUD operations
│   │   └── utils.ts                 # Tailwind class merge utility
│   │
│   ├── integrations/                # External service integrations
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabase client instance (auto-generated)
│   │   │   └── types.ts             # Database type definitions (auto-generated)
│   │   └── lovable/
│   │       └── index.ts             # Lovable Cloud auth integration
│   │
│   └── test/                        # Test setup
│       ├── setup.ts                 # Vitest global setup
│       └── example.test.ts          # Example test
│
├── supabase/
│   ├── config.toml                  # Supabase project configuration
│   └── functions/                   # Supabase Edge Functions (Deno)
│       ├── analyze-code/
│       │   └── index.ts             # AI analysis engine (13 mode prompts)
│       └── fetch-github/
│           └── index.ts             # GitHub API fetcher (repo + PR)
│
├── package.json                     # Dependencies and scripts
├── vite.config.ts                   # Vite bundler configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── vitest.config.ts                 # Vitest test runner configuration
├── components.json                  # shadcn/ui configuration
├── eslint.config.js                 # ESLint configuration
├── postcss.config.js                # PostCSS configuration
└── documentation.md                 # This file
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)              │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Auth Page │  │  Index Page  │  │   Dashboard Page      │ │
│  │ (sign in) │  │ (main app)   │  │   (analytics)         │ │
│  └──────────┘  └──────────────┘  └───────────────────────┘ │
│        │              │                     │               │
│        ▼              ▼                     ▼               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Supabase JS Client                     │    │
│  │  • Auth (signIn, signUp, OAuth)                     │    │
│  │  • Database (analyses, profiles, shared_analyses)   │    │
│  │  • Functions (invoke edge functions)                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Auth       │  │  PostgreSQL  │  │  Edge Functions   │  │
│  │  • Email/PW  │  │  • analyses  │  │  • analyze-code   │  │
│  │  • Google    │  │  • profiles  │  │  • fetch-github   │  │
│  │    OAuth     │  │  • shared_   │  │                    │  │
│  │              │  │    analyses  │  │                    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External APIs                             │
│  ┌───────────────────┐  ┌────────────────────────────────┐  │
│  │  Lovable AI       │  │  GitHub REST API v3             │  │
│  │  Gateway          │  │  • Repository trees & contents  │  │
│  │  • Gemini 3 Flash │  │  • Pull Request diffs           │  │
│  └───────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **UI Framework** | React 18 | Component-based UI |
| **Build Tool** | Vite 5 | Fast HMR and bundling |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **Component Library** | shadcn/ui + Radix | Accessible UI primitives |
| **Routing** | React Router 6 | Client-side routing |
| **State Management** | React Query + useState | Server/client state |
| **Charts** | Recharts | Dashboard visualizations |
| **Syntax Highlighting** | highlight.js | Code block highlighting |
| **Diagrams** | Mermaid.js | Inline diagram rendering |
| **Backend** | Supabase | Auth, database, edge functions |
| **AI** | Lovable AI Gateway | Gemini 3 Flash model |
| **Language** | TypeScript | Full type safety |
| **Testing** | Vitest | Unit and integration tests |

---

## User Guide

### Getting Started

1. **Open the app** at [https://rapid-code-insight.lovable.app](https://rapid-code-insight.lovable.app)
2. **Create an account** or sign in with Google
3. **Choose an analysis mode** from the grid (Architecture, Security, etc.)
4. **Input your code** via one of four methods:
   - Paste code directly
   - Enter a GitHub repository URL
   - Enter a Pull Request URL
   - Enter multiple repository URLs for cross-repo analysis

### Analyzing Code by Pasting

1. Select the **"Paste Code"** tab
2. Paste your code into the text area
3. Optionally type a specific question in the question field
4. Click **"Analyze"**
5. Watch the AI stream its analysis in real-time

### Analyzing a GitHub Repository

1. Select the **"GitHub Repo"** tab
2. Enter a repository URL in any of these formats:
   - `facebook/react` (shorthand)
   - `https://github.com/facebook/react` (full URL)
   - `github.com/facebook/react` (without protocol — auto-fixed)
   - `https://github.com/facebook/react/tree/main/src` (extra paths — auto-stripped)
3. A green ✓ indicator confirms the detected `owner/repo`
4. For **private repositories**, click "Private repo? Add token" and paste a GitHub Personal Access Token
5. Click **"Fetch"** — the app fetches up to 40 source files and the file tree
6. Analysis begins automatically after fetching

### Reviewing a Pull Request

1. Select the **"PR Review"** tab (or choose "PR Review" mode — it auto-switches)
2. Enter a PR URL: `https://github.com/owner/repo/pull/123`
3. A green ✓ shows the detected `owner/repo PR #123`
4. Click **"Analyze PR"**
5. The AI reviews the diff, identifies regressions, and provides a verdict (APPROVE / REQUEST CHANGES)

### Multi-Repository Analysis

1. Select **"Multi-Repo"** mode (or click the "Multi-Repo" tab)
2. Enter 2–5 GitHub repository URLs
3. Each valid URL shows a green ✓ with the parsed owner/repo
4. Click **"Fetch & Analyze"**
5. The AI analyzes how the repositories interact as a system

### Generating Documentation

1. Select the **"Documentation"** mode from the mode grid (under "Improve")
2. Paste your code or fetch a GitHub repo
3. Run the analysis
4. The AI generates a complete, production-grade README with:
   - Architecture diagrams (Mermaid)
   - API reference tables
   - Setup instructions
   - Data flow sequence diagrams
   - ER diagrams
5. Click the prominent **"Download .md"** button to save the documentation as a markdown file

### Follow-Up Questions

After any analysis completes:
1. A follow-up input appears below the output
2. Type a specific question about the analyzed code
3. The AI uses the same code context to answer your question

### Sharing Analyses

1. After analysis completes, click the **"Share"** button in the output header
2. A unique short link is generated (e.g., `/s/abc12345`)
3. Copy and share the link — recipients can view the full analysis without signing in

### Viewing History

1. Click the **clock icon** (History) in the header
2. A side panel slides open with all past analyses
3. **Search** analyses by title or question
4. Click any entry to **replay** it instantly
5. Delete individual entries or clear all history

### Usage Dashboard

1. Click **"Stats"** in the header to open the dashboard
2. View your analytics:
   - **Total analyses** count
   - **Current & best streak** (consecutive days of usage)
   - **Modes used** — how many of the 13 modes you've tried
   - **Languages detected** — auto-detected from your analyzed code
   - **14-day activity chart** — bar chart of daily usage
   - **Mode breakdown** — pie chart of which modes you use most
   - **Source breakdown** — how you input code (paste vs GitHub vs PR)

### Exporting Results

- **Copy**: Click "Copy" in the output header to copy raw markdown to clipboard
- **Export**: Click "Export" to download analysis as a `.md` file
- **Documentation mode**: Shows a prominent "Download .md" button for easy export

---

## Authentication

The app supports two authentication methods:

### Email & Password
1. Navigate to `/auth`
2. Click "Sign up" and enter email, password, and display name
3. Check your email for a verification link
4. Click the link to verify, then sign in

### Google OAuth
1. Navigate to `/auth`
2. Click "Continue with Google"
3. Authorize with your Google account
4. You're signed in automatically

### Password Reset
1. Click "Forgot password?" on the sign-in page
2. Enter your email address
3. Check your email for a reset link
4. Set a new password on the reset page

### Route Protection

| Route | Access |
|---|---|
| `/` | Authenticated only (redirects to `/auth`) |
| `/dashboard` | Authenticated only |
| `/auth` | Unauthenticated only (redirects to `/` if signed in) |
| `/forgot-password` | Public |
| `/reset-password` | Public |
| `/s/:shortId` | Public (shared analysis viewer) |

---

## Data Flow

### Analysis Request Flow

```
User Input (paste/GitHub/PR)
       │
       ▼
┌─────────────────┐
│  Index.tsx       │  ← Mode selection + code input
│  handleAnalyze() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  streaming.ts    │  ← HTTP POST to edge function
│  streamAnalysis()│     with SSE streaming
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  analyze-code (Edge Fn)  │  ← Selects system prompt by mode
│  Lovable AI Gateway      │     Streams response via SSE
└────────┬────────────────┘
         │
         ▼
┌─────────────────┐
│  AnalysisOutput  │  ← Renders markdown, Mermaid, syntax highlighting
│  MarkdownRenderer│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  history.ts      │  ← Saves to `analyses` table via Supabase
│  addToHistory()  │
└─────────────────┘
```

### GitHub Fetch Flow

```
GitHubInput / PRInput / MultiRepoInput
       │
       ▼
┌───────────────────┐
│  URL Parsing       │  ← normalizeUrl() + parseGitHubUrl()
│  + Live Preview    │     Shows ✓ owner/repo indicator
└────────┬──────────┘
         │
         ▼
┌───────────────────────┐
│  fetch-github (Edge)   │  ← Calls GitHub REST API v3
│  • Tree endpoint       │     Fetches file tree + contents
│  • Contents endpoint   │     Supports PR diff mode
│  • Pulls endpoint      │
└────────┬──────────────┘
         │
         ▼
┌───────────────────┐
│  Concatenated code │  ← Up to 40 files, 60KB max
│  sent to analysis  │
└───────────────────┘
```

---

## API Reference

### analyze-code Edge Function

**Endpoint**: `POST /functions/v1/analyze-code`

**Headers**:
| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <supabase_anon_key>` |

**Request Body**:
```json
{
  "code": "string (required) — the code to analyze",
  "mode": "string (optional, default: 'architecture') — one of 13 modes",
  "question": "string (optional) — specific question about the code"
}
```

**Valid modes**: `architecture`, `request_flow`, `security`, `performance`, `best_practices`, `debugging`, `impact_analysis`, `test_generation`, `refactoring`, `knowledge_graph`, `multi_repo`, `pr_diff`, `documentation`

**Response**: Server-Sent Events (SSE) stream

```
data: {"choices":[{"delta":{"content":"# Architecture..."}}]}
data: {"choices":[{"delta":{"content":" Overview\n"}}]}
...
data: [DONE]
```

**Error Responses**:
| Status | Meaning |
|---|---|
| `429` | Rate limit exceeded |
| `402` | Usage limit reached |
| `500` | AI analysis failed |

### fetch-github Edge Function

**Endpoint**: `POST /functions/v1/fetch-github`

**Request Body (Repository)**:
```json
{
  "owner": "facebook",
  "repo": "react",
  "token": "ghp_xxx (optional, for private repos)"
}
```

**Request Body (Pull Request)**:
```json
{
  "owner": "facebook",
  "repo": "react",
  "pr_number": 12345,
  "token": "ghp_xxx (optional)"
}
```

**Response (Repository)**:
```json
{
  "content": "# Repository: facebook/react\n\n## File Structure\n..."
}
```

**Response (Pull Request)**:
```json
{
  "content": "# Pull Request: Fix memory leak\n\n...",
  "title": "Fix memory leak in useEffect cleanup"
}
```

---

## Theming

The app uses CSS custom properties defined in `src/index.css` for full dark/light mode support.

Key design tokens:
- `--background`, `--foreground` — page background and text
- `--card`, `--card-foreground` — card surfaces
- `--primary`, `--primary-foreground` — accent color (green-teal)
- `--muted`, `--muted-foreground` — subdued elements
- `--destructive` — error states
- `--code-bg`, `--code-foreground` — code block styling

Theme switching is handled by `next-themes` with three options: Light, Dark, System.

---

## Testing

The project uses **Vitest** as the test runner with **jsdom** for DOM simulation.

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch
```

Test files use the `.test.ts` / `.test.tsx` extension and are located alongside source files or in `src/test/`.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| **"Repository not found or is private"** | Ensure the URL is correct. For private repos, add a GitHub Personal Access Token |
| **"Rate limit exceeded"** | Wait 60 seconds and try again. GitHub API has a 60 req/hour limit for unauthenticated requests |
| **Mermaid diagram not rendering** | The diagram may have syntax errors. The app falls back to displaying raw code |
| **Analysis output is empty** | Check that the edge function `LOVABLE_API_KEY` secret is configured |
| **"Check your email" after sign up** | Email verification is required. Check your inbox and spam folder |
| **Google sign-in fails** | Ensure Google OAuth is configured in the Supabase auth settings |
| **History not loading** | Make sure you're signed in. History is per-user and requires authentication |
| **GitHub URL not parsing** | Use format `owner/repo` or `https://github.com/owner/repo`. Extra path segments are auto-stripped |
| **Build fails** | Run `npm install` to ensure all dependencies are up to date |
| **Port 5173 in use** | Vite will automatically try the next available port, or kill the process using `lsof -ti:5173 | xargs kill` |

---

## Contributing

### Code Style

- **TypeScript** for all source files
- **Tailwind CSS** with semantic design tokens (never hardcode colors)
- **shadcn/ui** for all UI primitives
- **Small, focused components** — one component per file
- **Barrel exports** are not used — import directly from file paths

### Branch Naming

- `feature/description` — new features
- `fix/description` — bug fixes
- `refactor/description` — code improvements

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure `npm run build` and `npm test` pass
4. Open a PR with a description of changes
5. Wait for review and approval

---

## Building Extensions

### Chrome Extension (Manifest V3)

Use the following prompt with any AI coding assistant to generate a complete Chrome extension that connects to the CodeLens AI backend:

> **Build me a Chrome Manifest V3 browser extension called "CodeLens AI" that analyzes code on any webpage using my existing backend API.**
>
> **Backend API Details**
> - **Endpoint:** `https://ewtfekdegqowqpmmaudj.supabase.co/functions/v1/analyze-code`
> - **Method:** POST
> - **Headers:**
>   - `Content-Type: application/json`
>   - `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGZla2RlZ3Fvd3FwbW1hdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDE1MDEsImV4cCI6MjA4ODUxNzUwMX0.M0EUR7R1TeC1MiXrNIyd4zYMofXckqw-V6HMhI6Xnok`
> - **Body:** `{ "code": "<string>", "mode": "<string>", "question": "<string|optional>" }`
> - **Response:** Server-Sent Events (SSE) stream. Each line is `data: {...}` with OpenAI-compatible chat completion chunks. `data: [DONE]` signals end. Extract `choices[0].delta.content` from each chunk.
>
> **Available Analysis Modes**
> `architecture`, `request_flow`, `security`, `performance`, `best_practices`, `debugging`, `impact_analysis`, `test_generation`, `refactoring`, `knowledge_graph`, `documentation`, `pr_diff`, `multi_repo`
>
> **Extension Features**
>
> 1. **Popup UI** — A clean popup (400×500px) with:
>    - A dropdown to select analysis mode
>    - A "Grab Code from Page" button that extracts all `<code>` and `<pre>` blocks from the active tab
>    - A textarea to paste/edit code manually
>    - An "Analyze" button that streams results from the API
>    - A scrollable output area that renders markdown (use a lightweight MD renderer like `marked`)
>    - A follow-up question input to ask questions about the analysis
>
> 2. **Context Menu** — Right-click selected text → "Analyze with CodeLens AI" sends the selection to the popup for analysis.
>
> 3. **Content Script** — Injects a floating button on pages containing `<code>` or `<pre>` elements. Clicking it opens the popup pre-filled with that code.
>
> **Tech Stack**
> - Manifest V3 (Chrome extension)
> - Vanilla JS or lightweight framework (no React needed)
> - `marked` library for markdown rendering
> - SSE parsing for streaming responses
>
> **File Structure**
> ```
> codelens-extension/
> ├── manifest.json
> ├── popup/
> │   ├── popup.html
> │   ├── popup.css
> │   └── popup.js
> ├── background.js
> ├── content.js
> ├── lib/
> │   └── marked.min.js
> └── icons/
>     ├── icon16.png
>     ├── icon48.png
>     └── icon128.png
> ```
>
> **Key Requirements**
> - Handle SSE streaming properly (parse `data:` lines, accumulate content, render incrementally)
> - Show a loading spinner during analysis
> - Store the last selected mode in `chrome.storage.local`
> - Graceful error handling for 429 (rate limit) and 402 (usage limit) responses
> - Dark theme UI that matches a developer tool aesthetic
>
> Give me ALL the code for every file, ready to load as an unpacked extension in `chrome://extensions`.

---

### VS Code Extension

Use the following prompt with any AI coding assistant to generate a complete VS Code extension that connects to the CodeLens AI backend:

> **Build me a VS Code extension called "CodeLens AI" that analyzes code using my existing backend API.**
>
> **Backend API Details**
> - **Endpoint:** `https://ewtfekdegqowqpmmaudj.supabase.co/functions/v1/analyze-code`
> - **Method:** POST
> - **Headers:**
>   - `Content-Type: application/json`
>   - `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGZla2RlZ3Fvd3FwbW1hdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDE1MDEsImV4cCI6MjA4ODUxNzUwMX0.M0EUR7R1TeC1MiXrNIyd4zYMofXckqw-V6HMhI6Xnok`
> - **Body:** `{ "code": "<string>", "mode": "<string>", "question": "<string|optional>" }`
> - **Response:** Server-Sent Events (SSE) stream. Each line is `data: {...}` with OpenAI-compatible chat completion chunks. `data: [DONE]` signals end. Extract `choices[0].delta.content` from each chunk.
>
> **Available Analysis Modes**
> `architecture`, `request_flow`, `security`, `performance`, `best_practices`, `debugging`, `impact_analysis`, `test_generation`, `refactoring`, `knowledge_graph`, `documentation`, `pr_diff`, `multi_repo`
>
> **Extension Features**
>
> 1. **Sidebar Webview Panel** — A dedicated sidebar view with:
>    - Dropdown to select analysis mode
>    - "Analyze Current File" button — sends the entire active editor content
>    - "Analyze Selection" button — sends only highlighted/selected code
>    - A scrollable output area that renders markdown with syntax highlighting
>    - A follow-up question input to ask questions about the last analysis
>    - Loading spinner during streaming
>
> 2. **Commands** (accessible via Command Palette `Ctrl+Shift+P`):
>    - `CodeLens AI: Analyze Current File`
>    - `CodeLens AI: Analyze Selection`
>    - `CodeLens AI: Change Analysis Mode`
>    - `CodeLens AI: Ask Follow-Up Question`
>
> 3. **Context Menu** — Right-click in the editor → "Analyze with CodeLens AI" submenu with mode options
>
> 4. **Status Bar** — Show current analysis mode in the status bar; clicking it opens the mode picker
>
> 5. **CodeLens Inline** — Add clickable "🔍 Analyze this function" links above each function/class declaration
>
> **Tech Stack**
> - VS Code Extension API (TypeScript)
> - Webview API for the sidebar panel (HTML/CSS/JS)
> - `marked` for markdown rendering inside the webview
> - `highlight.js` for syntax highlighting in the webview
> - Native `fetch` for SSE streaming
>
> **File Structure**
> ```
> codelens-ai-vscode/
> ├── package.json          # Extension manifest with contributes, commands, menus
> ├── tsconfig.json
> ├── src/
> │   ├── extension.ts      # Activate/deactivate, register commands
> │   ├── sidebarProvider.ts # WebviewViewProvider for sidebar
> │   ├── api.ts             # SSE streaming client for the backend
> │   ├── codelensProvider.ts# Inline CodeLens above functions
> │   └── utils.ts           # Helpers (get selection, get file content)
> ├── media/
> │   ├── sidebar.html       # Webview HTML template
> │   ├── sidebar.css        # Dark theme styles matching VS Code
> │   └── sidebar.js         # Webview script (handles UI, messaging)
> └── icons/
>     └── icon.png
> ```
>
> **Key Requirements**
> - Handle SSE streaming properly (parse `data:` lines, accumulate content, render incrementally in the webview via `postMessage`)
> - Store last selected mode in `vscode.workspace.getConfiguration()`
> - Extension settings: allow users to override the API endpoint and auth token in VS Code settings
> - Graceful error handling for 429 (rate limit) and 402 (usage limit) with VS Code notification messages
> - Webview CSS should use VS Code's CSS variables (`--vscode-editor-background`, `--vscode-editor-foreground`, etc.) for native theme integration
> - Support both light and dark themes automatically
> - Add a keyboard shortcut: `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac) for "Analyze Selection"
>
> **package.json contributes section should include:**
> - `viewsContainers` and `views` for the sidebar
> - `commands` for all 4 commands
> - `menus` for editor context menu and editor title
> - `configuration` for extension settings (endpoint, token, default mode)
> - `keybindings` for the keyboard shortcut
>
> Give me ALL the code for every file, ready to run with `npm run compile` and test with F5 in VS Code.

---

*Built with [Lovable](https://lovable.dev) · Powered by AI*
