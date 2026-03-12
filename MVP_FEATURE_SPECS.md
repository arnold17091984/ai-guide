# AI Guide: MVP Feature Specifications

**Phase:** Phase 0 (MVP)
**Timeline:** Weeks 1-8
**Launch Target:** Late April 2026

---

## Overview

The MVP focuses on establishing core community functionality with these features:
1. User authentication and profiles
2. Workflow/article creation and publishing
3. Basic skill registry and endorsements
4. Trending posts from X (Twitter) API
5. Search and basic recommendations
6. Comments, voting, and community features

**Technical Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Supabase (or equivalent)

---

## Feature 1: User Authentication & Profiles

### Requirements

**Authentication Methods:**
- Email/password signup and login
- OAuth (GitHub, Google) - optional for MVP but recommended
- Email verification before first publication
- Session management with JWT or secure cookies

**User Profile:**
```typescript
interface User {
  id: string;
  email: string;
  username: string; // unique, 3-30 chars, alphanumeric + dash
  displayName: string;
  bio: string; // max 500 chars
  avatarUrl: string; // profile picture
  website?: string;
  location?: string;
  skills: Skill[]; // claimed skills
  createdAt: Date;
  updatedAt: Date;
}

interface Skill {
  id: string;
  name: string; // "Claude Code: Advanced Prompting"
  level: "beginner" | "intermediate" | "advanced";
  endorsements: number; // how many users endorsed this
  verified: boolean; // has completed challenge
  addedAt: Date;
}
```

**Profile Features:**
- [ ] Public profile page (view own, other users)
- [ ] Edit profile (bio, avatar, website, location)
- [ ] Skill management (add/remove skills)
- [ ] View user's published articles
- [ ] Follow/unfollow users (future feature, but design for it)
- [ ] Reputation score (calculated from content engagement)

**Privacy:**
- [ ] Users can control profile visibility (public/private)
- [ ] Email address not publicly displayed
- [ ] Option to hide contribution counts

---

## Feature 2: Workflow/Article Creation & Publishing

### Data Model

```typescript
interface Article {
  id: string;
  title: string; // required, max 200 chars
  slug: string; // auto-generated from title, unique

  // Content
  description: string; // max 500 chars, shown in preview
  content: string; // markdown or rich text
  language?: string; // auto-detected or selected (ko/en/ja)

  // Metadata
  author: User;
  authorId: string;
  status: "draft" | "published" | "archived";

  // Tagging & Discovery
  skills: Skill[]; // 1-5 relevant skills
  difficulty: "beginner" | "intermediate" | "advanced";
  contentType: "workflow" | "guide" | "case-study" | "snippet";
  tags: string[]; // custom tags (max 10)

  // Engagement
  viewCount: number;
  commentCount: number;
  upvotes: number; // or like count
  savedCount: number;
  averageRating: number; // 1-5 stars

  // Collaboration (for Phase 1.5)
  collaborators?: User[];
  canEdit: User[]; // who can edit this
  editHistory?: EditLog[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

interface EditLog {
  editor: User;
  timestamp: Date;
  changes: string; // summary of what changed
}
```

### Editor Requirements

**Rich Text Editor:**
- [ ] Markdown support with live preview
- [ ] Code syntax highlighting (support: python, javascript, typescript, bash, etc.)
- [ ] Formatted text (bold, italic, headers, lists, links)
- [ ] Code blocks with language selection
- [ ] Image embedding (via file upload or URL)
- [ ] Table support
- [ ] Embedded quotes/callouts
- [ ] Auto-save drafts to local storage + backend
- [ ] Character count and reading time estimate

**Publishing Workflow:**
- [ ] Save as draft (no one can see except author)
- [ ] Preview before publish
- [ ] Publish to platform
- [ ] Edit after publishing (bumps "updated at" timestamp)
- [ ] Archive (hide from discovery but keep URL alive)

**Content Requirements:**
- [ ] Min 300 characters (enforce on publish)
- [ ] Max 100,000 characters (reasonable limit)
- [ ] Title required
- [ ] At least one skill tag required
- [ ] Difficulty level required
- [ ] Description required

---

## Feature 3: Skill Registry

### Skill Database

**Pre-defined Skills for MVP:**
```
Claude Code Basics
├── Setting up Claude Code
├── Basic keyboard shortcuts
├── Simple prompting techniques
├── Understanding @ mentions

Claude Code Workflows
├── Daily workflow setup
├── Debugging with Claude Code
├── Refactoring code with Claude
├── Writing tests with Claude
├── Code review with Claude

Advanced Patterns
├── Custom instructions
├── Memory management
├── Structured outputs
├── Agent configurations
├── Fine-tuning prompts

Tool Integration
├── Using Claude in VS Code
├── Terminal integration
├── Git workflows with Claude
├── IDE customization

AI Development Practices
├── Prompt engineering
├── Error handling in AI workflows
├── Testing AI-generated code
├── Documentation practices
```

### Features

**Skill Endorsement System:**
- [ ] User claims a skill (add to profile)
- [ ] Other users can endorse that skill (1-click, once per person)
- [ ] Endorsement counter visible on user profile and articles
- [ ] Sort users by endorsement count for each skill
- [ ] Skill pages show all practitioners (ranked by endorsements)

**Skill Detail Pages:**
- [ ] Skill overview (description, difficulty)
- [ ] List of all users who claimed this skill
- [ ] Filter by verification status
- [ ] Articles tagged with this skill (sorted by popularity)
- [ ] Resources section (curated learning materials)

**Verification (Phase 1.5, but design for it):**
- [ ] Skill has "verification challenge" (planned)
- [ ] Verified badge shown next to skill
- [ ] Separate filter for verified vs. unverified

---

## Feature 4: Trending Integration (X API)

### Technical Requirements

**X API Integration:**
- [ ] Authenticated access to X API v2
- [ ] Search for Claude Code related tweets
- [ ] Query: `#ClaudeCode OR "Claude Code" OR "claude.ai"`
- [ ] Filter: Only recent tweets (last 24 hours)
- [ ] Rate limit handling (X API has strict limits)
- [ ] Cache results (don't call API on every page load)

**Data Model:**
```typescript
interface TrendingPost {
  id: string; // X post ID
  author: {
    handle: string;
    displayName: string;
    avatarUrl: string;
  };
  content: string;
  url: string; // link to original post
  timestamp: Date; // when posted
  engagement: {
    likeCount: number;
    replyCount: number;
    retweetCount: number;
  };
  fetchedAt: Date; // when we crawled it
}
```

**Trending Feed UI:**
- [ ] Homepage section: "Trending Now" (top 10 posts)
- [ ] Dedicated trending page with filters
- [ ] Auto-refresh every 6 hours (or manual refresh button)
- [ ] Post preview: author, excerpt, engagement metrics
- [ ] "Read on X" link
- [ ] No requirement to embed posts on our platform (link out)

**Search Queries (Iterate Based on Data):**
- Initial: `"Claude Code" -is:retweet lang:en`
- Later: Add trending AI/coding terms, filter by engagement
- Monitor performance; adjust queries monthly

**Nice to Have (Not MVP):**
- [ ] Sentiment analysis (is this positive/negative)
- [ ] Topic clustering (group related posts)
- [ ] Scheduled crawl job (run every 6 hours)
- [ ] Filter trending by topic/skill

---

## Feature 5: Search & Discovery

### Search Functionality

**Search Index:**
- [ ] Full-text search across article titles and descriptions
- [ ] Optional: Search article content (nice to have)
- [ ] Search by skill tags
- [ ] Search by author username
- [ ] Case-insensitive matching
- [ ] Typo tolerance (nice to have; use Postgres fuzzy search)

**Search Filters:**
```typescript
interface SearchFilters {
  query: string;
  skills?: string[]; // filter by skills
  difficulty?: "beginner" | "intermediate" | "advanced";
  contentType?: "workflow" | "guide" | "case-study" | "snippet";
  author?: string;
  sortBy?: "relevance" | "newest" | "views" | "rating";
  language?: "en" | "ko" | "ja";
}
```

**Search Results Page:**
- [ ] Display matching articles with preview
- [ ] Show matching skills
- [ ] Show matching authors
- [ ] Pagination (20 per page)
- [ ] Applied filters shown; easy to clear
- [ ] "No results" state with suggestions

**Basic Recommendations (MVP):**
- [ ] Homepage: "Popular This Week" (sorted by views)
- [ ] Homepage: "Recently Published" (newest first)
- [ ] Article page: "Related Articles" (based on shared skills)
- [ ] Profile page: "More from this Author"

**Not MVP (Phase 2):**
- [ ] Personalized recommendations based on user history
- [ ] ML model for "users who read this also read"

---

## Feature 6: Comments & Community

### Comments System

```typescript
interface Comment {
  id: string;
  articleId: string;
  authorId: string;

  content: string; // markdown
  upvotes: number;
  status: "published" | "flagged" | "deleted";

  createdAt: Date;
  updatedAt?: Date;

  parentCommentId?: string; // for nested replies
  replies?: Comment[]; // one level deep only (MVP)
}
```

**Comment Features:**
- [ ] Add comment to any article
- [ ] Edit own comment (within 5 mins of posting, or always with "edited" marker)
- [ ] Delete own comment
- [ ] Upvote/downvote comments (but don't show down votes, just net)
- [ ] Nested replies (reply to a comment) - one level deep
- [ ] Markdown support in comments
- [ ] @ mention authors (optional for MVP)

**Comment Moderation:**
- [ ] Flag inappropriate comment (reason: spam, rude, off-topic, etc.)
- [ ] Author can delete comments on their articles
- [ ] Mods can delete/edit flagged comments
- [ ] Show comment count on article preview

**Discussion UX:**
- [ ] Comments shown in chronological order
- [ ] Newest first (with toggle to oldest first)
- [ ] Show comment author and timestamp
- [ ] Link to author profile
- [ ] Indentation for replies

---

## Feature 7: Voting & Social Feedback

### Upvote System

```typescript
interface ArticleVote {
  userId: string;
  articleId: string;
  voteType: "up" | "down" | "neutral"; // user can change
  timestamp: Date;
}

interface CommentVote {
  userId: string;
  commentId: string;
  voteType: "up"; // comments only get upvotes (MVP)
  timestamp: Date;
}
```

**Voting Features:**
- [ ] Upvote article (thumbs up icon)
- [ ] Downvote article (thumbs down icon; show net count)
- [ ] Upvote comment (thumbs up icon)
- [ ] Change vote or remove vote
- [ ] Vote count visible on article preview and detail
- [ ] "Save" or "Bookmark" article (different from upvote)

**Visibility:**
- [ ] Don't show individual voter names (just count)
- [ ] Show your own votes

### Ratings System

**Article Rating:**
- [ ] 1-5 star rating (optional for users)
- [ ] Show average rating on article preview
- [ ] Show rating distribution (nice to have)
- [ ] Use for sorting ("highest rated")

---

## Feature 8: Multilingual Support (ko/en/ja)

### Requirements

**UI Translation:**
- [ ] Keep existing next-intl setup
- [ ] Translate all Phase 0 strings
- [ ] Support language switching (top nav dropdown)
- [ ] User language preference saved to profile

**Content Language:**
- [ ] Auto-detect article language (language-detect library)
- [ ] Or let author select language on publish
- [ ] Filter search/discovery by language
- [ ] Show language tag on article preview

**Not MVP (Phase 1+):**
- [ ] Translate articles between languages
- [ ] Separate moderation teams per language

---

## Feature 9: Homepage & Navigation

### Homepage Layout

```
Header:
  - Logo / Brand
  - Search bar
  - User menu (if logged in) or Login/Signup button
  - Language switcher

Hero Section (logged out):
  - "Share your Claude Code knowledge"
  - Key benefits (3-4 points)
  - CTA: "Get Started Free"

Main Content (for all users):

Trending Section:
  - "Trending on X"
  - 5-10 trending posts with author info, excerpt, engagement
  - "See more" link to trending page

Featured Articles:
  - Recently published (last 7 days)
  - Sorted by views
  - Card preview: title, author, difficulty, views, rating

Skills Directory:
  - Browse all skills
  - "Explore all skills" link

Footer:
  - Links to Privacy, Terms, About
  - Social links
```

### Navigation

**Main Navigation:**
- [ ] Home
- [ ] Explore/Browse (articles by skill/difficulty)
- [ ] Trending (dedicated page)
- [ ] My Profile (if logged in)
- [ ] Create (publish new article)
- [ ] Search (prominent search bar)

**Breadcrumb Navigation:**
- [ ] Show path: Home > [Category] > Article
- [ ] Allow navigation back

---

## Feature 10: Authentication Flow

### Signup Flow

```
1. User clicks "Get Started" or "Sign Up"
2. Signup form:
   - Email
   - Password (min 8 chars, at least one number)
   - Display name
   - Terms/Privacy agreement
3. Submit
4. Email verification sent
5. User clicks link in email
6. Redirected to profile setup:
   - Bio (optional)
   - Avatar (optional)
   - Skills (optional, can add later)
7. Onboarded to dashboard

Time to first value: < 2 minutes
```

### Login Flow

```
1. User clicks "Log In"
2. Email + password form
3. Submit
4. Redirect to dashboard or referring page
```

### OAuth (Optional but Recommended)

```
- GitHub OAuth button on login form
- Google OAuth button on login form
- Link OAuth accounts to existing email accounts
```

---

## Feature 11: User Dashboard

### Personal Dashboard (Logged-in Users)

**Content:**
- [ ] Overview stats: articles published, views, upvotes, followers
- [ ] Recent activity: articles published, comments received
- [ ] Drafts section (articles in progress)
- [ ] Published articles section
- [ ] Notifications (new comments, upvotes, followers)

**Actions:**
- [ ] Create new article button
- [ ] Edit profile button
- [ ] View public profile preview

---

## MVP Non-Requirements (Phase 1+)

**Explicitly Not in MVP:**
- [ ] User followers/following
- [ ] Email notifications (can be manual for now)
- [ ] Dark mode (build foundation, ship in Phase 1)
- [ ] Article editing history / Wiki mode
- [ ] Skill verification challenges
- [ ] Team workspaces
- [ ] Advanced AI recommendations
- [ ] IDE extensions
- [ ] Video/podcast support

---

## Technical Considerations

### Database Schema (PostgreSQL/Supabase)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR,
  bio TEXT,
  avatar_url VARCHAR,
  website VARCHAR,
  location VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Articles
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR DEFAULT 'draft',
  content_type VARCHAR,
  difficulty VARCHAR,
  language VARCHAR,
  view_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  upvotes INT DEFAULT 0,
  average_rating FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  level VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Skills
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  skill_id UUID NOT NULL REFERENCES skills(id),
  level VARCHAR,
  verified BOOLEAN DEFAULT FALSE,
  endorsement_count INT DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Article Skills
CREATE TABLE article_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  skill_id UUID NOT NULL REFERENCES skills(id),
  UNIQUE(article_id, skill_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id),
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  status VARCHAR DEFAULT 'published',
  parent_comment_id UUID REFERENCES comments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Votes
CREATE TABLE article_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  article_id UUID NOT NULL REFERENCES articles(id),
  vote_type VARCHAR,
  timestamp TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Trending Posts (cached from X API)
CREATE TABLE trending_posts (
  id VARCHAR PRIMARY KEY,
  author_handle VARCHAR,
  author_display_name VARCHAR,
  author_avatar_url VARCHAR,
  content TEXT,
  url VARCHAR,
  post_timestamp TIMESTAMP,
  like_count INT,
  reply_count INT,
  retweet_count INT,
  fetched_at TIMESTAMP DEFAULT NOW()
);
```

### API Routes (Next.js App Router)

```
GET /api/articles - list articles (with filters)
POST /api/articles - create article
GET /api/articles/[slug] - get article detail
PATCH /api/articles/[slug] - update article
DELETE /api/articles/[slug] - delete article

GET /api/users/[username] - get user profile
PATCH /api/users/[username] - update profile

GET /api/skills - list all skills
GET /api/skills/[skillId] - get skill detail
POST /api/users/[userId]/skills - add skill to user
POST /api/users/[userId]/skills/[skillId]/endorse - endorse skill

GET /api/articles/[articleId]/comments - list comments
POST /api/articles/[articleId]/comments - create comment
PATCH /api/comments/[commentId] - update comment
DELETE /api/comments/[commentId] - delete comment

POST /api/articles/[articleId]/vote - vote on article
POST /api/comments/[commentId]/vote - vote on comment

GET /api/trending - get trending posts from X

GET /api/search - search articles

POST /api/auth/signup - signup
POST /api/auth/login - login
POST /api/auth/logout - logout
GET /api/auth/me - get current user
```

### Performance Considerations

- [ ] Cache trending posts (update every 6 hours)
- [ ] Pagination on all list endpoints
- [ ] Database indexes on: username, slug, created_at, skill_id
- [ ] Debounce search input (300ms)
- [ ] Lazy load comments (infinite scroll or pagination)

---

## Success Criteria for MVP

**Shipping Checklist:**
- [ ] All 11 features implemented and tested
- [ ] Zero critical bugs
- [ ] Mobile responsive design
- [ ] Loading times < 2s for key pages
- [ ] Accessible (WCAG AA standard)
- [ ] API rate limiting in place
- [ ] Error handling and user feedback
- [ ] Basic analytics/logging
- [ ] Documentation for team

**Launch Readiness:**
- [ ] Marketing copy and launch assets
- [ ] Founder comfortable explaining product
- [ ] Early access user list (100+)
- [ ] Community guidelines published
- [ ] Support email monitored
- [ ] Launch day plan (tweets, posts, emails)

---

## Appendix: Nice-to-Have Stretch Features (If Timeline Allows)

1. **Dark Mode** - Better for evening coding
2. **Email Notifications** - Subscribers get daily digest
3. **Markdown Editor Improvements** - WYSIWYG option
4. **Social Sharing** - Share articles to Twitter/LinkedIn
5. **Reading Time Estimate** - Shows on article
6. **Table of Contents** - Auto-generated for long articles
7. **User Avatar Upload** - Instead of Gravatar
8. **Advanced Analytics** - Views over time, engagement trends
9. **Keyboard Shortcuts** - Power-user features
10. **API Documentation** - For future integrations

---

*Specifications ready for engineering kickoff.*

