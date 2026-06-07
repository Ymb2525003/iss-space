# ISS Team Space

A simple team collaboration system built with **Next.js** and prepared for **MongoDB**.

This project is designed for a small internal team with fixed user names and clear roles:

- `Yaseen` can assign tasks to members only.
- `Azza` and `Ahmed` can review all tasks and comment on them.
- Members can view their own tasks, add notes, update progress, send direct messages, and join recommendations.

## Main Features

- Fixed-name login for the team
- Role-based dashboard
- Task assignment by `Yaseen` only
- Leader comments by `Azza` and `Ahmed`
- Member task notes and status updates
- Direct messages between all team users
- Recommendations with reactions and replies
- Calendar generated automatically from task due dates
- MongoDB-ready backend with API routes

## Team Roles

### Leaders

- `Yaseen` → admin leader
- `Azza` → leader
- `Ahmed` → leader

### Members

- `Malaz`
- `Abdallah`
- `Ababaker`
- `Ali`
- `Jbo`
- `Salah`
- `Abdelrahman`
- `Elbadawie`

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- MongoDB
- Radix UI
- Lucide Icons

## Project Structure

```bash
app/
  api/
  dashboard/
  (auth)/
components/
contexts/
data/
hooks/
lib/
types/
public/
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=iss
```

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start production mode:

```bash
npm run start
```

## Important Notes

- If `MONGODB_URI` is not provided, the app can fall back to local JSON seed data.
- This login system is intentionally simple and based on fixed names.
- It is suitable for an internal demo or controlled team use.
- If needed later, authentication can be upgraded to password-based or full secure auth.

## Main Pages

- `/login`
- `/dashboard`
- `/dashboard/tasks`
- `/dashboard/tasks/new`
- `/dashboard/messages`
- `/dashboard/recommendations`
- `/dashboard/calendar`
- `/dashboard/team`

## Deployment

You can deploy this project easily on **Vercel**:

1. Push the project to GitHub
2. Import the repository into Vercel
3. Add:
   - `MONGODB_URI`
   - `MONGODB_DB`
4. Deploy

## Status

This project is completed in its current requested scope:

- Role-based task workflow
- Recommendations
- Direct messaging
- Calendar integration
- MongoDB-ready backend

## Author

Built for the ISS team workflow project.
