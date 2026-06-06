# GoTicket - Project Context & Recent Updates

*This file serves as a persistent context record to ensure continuity of understanding for future tasks and sessions.*

## 1. Project Overview
**GoTicket** is a comprehensive sports ticketing platform with role-based access control.
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, React Router.
- **Backend**: Node.js, Express, PostgreSQL, Socket.io (for real-time seat booking).
- **Infrastructure**: Docker & Docker Compose (`docker compose up --build -d`).

## 2. User Roles
- **Admin**: Manages users, leagues, stadiums, and global settings.
- **Manager (Club)**: Manages matches, sets ticket prices, and oversees club-level analytics.
- **Checker**: Scans QR codes at stadium entrances to validate and check-in tickets.
- **Audience**: Browses matches, buys tickets, manages their profile, and views their purchased tickets.

## 3. Recent Architectural & Feature Changes
Below is a summary of the most recently implemented features to maintain context:

### Authentication & Security
- **Forgot Password Flow**: Implemented a 3-step password recovery process.
  - Step 1: Request OTP via Email.
  - Step 2: Verify 6-digit OTP (expires in exactly 5 minutes, validated using PostgreSQL `NOW() + INTERVAL '5 minutes'` to avoid server vs. DB timezone conflicts). OTP input supports copy/paste across 6 distinct input squares.
  - Step 3: Set new password with an eye icon toggle for visibility.
- **Registration**: Added a "Confirm Password" field to the Registration page.

### Codebase Refactoring
- **Centralized Validations**: To improve maintainability, all inline form schemas (Auth, User, Profile, Match) were extracted from React components into a dedicated `frontend/src/validations/` folder.
  - Examples: `auth.validation.js`, `user.validation.js`, etc.
  - Form validations are enforced using the custom `validateForm()` utility.

### Checker Dashboard (QR Scan Page)
- **Table Structure Updates**:
  - Extracted the ticket code into a standalone **"Ticket Code"** column.
  - Added a **"Total Tickets"** column to automatically count the number of seats purchased in an order.
  - Simplified the **"Ticket Info"** column to group and display only the stadium stand blocks (e.g., `A4-T2` instead of `A4-T2-1-1, A4-T2-1-2`).

### Audience (My Tickets)
- **Tab Refactoring**: Replaced date-only filtering with status-aware tabs:
  - **Unused**: Tickets that are successfully paid (`status === 'paid'`) and for matches that have not yet occurred (`match_date >= now`).
  - **Used**: Tickets that have been checked-in at the stadium (`status === 'checked_in'`) OR belong to past matches (`match_date < now`).

## 4. Key Workflows & Guidelines
- **Docker**: Always rebuild the respective container (`frontend` or `backend`) after making code changes.
- **Component Styling**: We use vanilla CSS where applicable, but largely rely on Tailwind CSS utility classes and Lucide icons for quick and consistent UI development.
- **Form Handling**: Maintain the pattern of using `useState` for form payloads and validating against schemas located in `src/validations/`.
