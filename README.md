# Team Task Tracker

A full-stack team collaboration and task management application built with **Next.js, Django REST Framework, and MongoDB Atlas**. It helps teams organize work, assign tasks, track progress, and maintain an activity history.

## Live Demo

- **Frontend:** [Open Team Task Tracker](https://team-task-tracker-gl9jpp4y7-gursimrankaur0612s-projects.vercel.app)
- **Backend API:** [Render Backend](https://team-task-tracker-41nt.onrender.com)

## Features

- **User Authentication:** Register and log in securely using JWT authentication.
- **Team Management:** Create teams and manage team-related activities.
- **Task Management:** Create and view tasks associated with teams.
- **Task Assignment:** Assign tasks to users.
- **Status Tracking:** Update task statuses as work progresses.
- **Activity History:** Track team activities and changes.
- **Protected Access:** Use token-based authentication for protected API requests.
- **Cloud Deployment:** Frontend hosted on Vercel and backend hosted on Render.
- **Database Integration:** MongoDB Atlas for cloud database storage.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| Backend | Python, Django 5, Django REST Framework |
| Authentication | JWT, Simple JWT |
| Database | MongoDB Atlas, PyMongo |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

## Project Structure

```text
team-task-tracker/
├── backend/
│   ├── config/
│   ├── users/
│   ├── teams/
│   ├── tasks/
│   ├── activities/
│   ├── manage.py
│   ├── mongodb.py
│   └── requirements.txt
├── frontend/
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   └── lib/
│       ├── package.json
│       └── .eslintrc.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following:

- Python 3.10 or later
- Node.js and npm
- A MongoDB Atlas account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Gursimrankaur0612/team-task-tracker.git
cd team-task-tracker
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` directory and configure your environment variables:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB_NAME=your_database_name
```

Use your own MongoDB Atlas connection string and database name. Keep credentials private and never commit your `.env` file.

Start the backend:

```bash
python manage.py runserver
```

The local backend will be available at `http://127.0.0.1:8000`.

### 3. Configure the Frontend

Open a new terminal from the project root:

```bash
cd frontend/frontend
npm install
```

The API helper is configured to use the deployed Render backend. For local development, update the API base URL in `src/lib/api.ts` to:

```typescript
const API_BASE = "http://127.0.0.1:8000/api";
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## API Endpoints

The API is served under `/api/`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Register a user |
| POST | `/api/auth/login/` | Authenticate a user |
| GET | `/api/auth/me/` | Retrieve the current user |
| GET, POST | `/api/teams/` | List or create teams |
| POST | `/api/teams/<team_id>/invite/` | Invite a team member |
| GET, POST | `/api/tasks/` | List or create tasks |
| PATCH | `/api/tasks/<task_id>/` | Update a task |
| GET | `/api/activities/team/<team_id>/` | Retrieve team activity history |

Protected endpoints require a valid JWT access token.

## Deployment

- **Frontend:** Deployed through Vercel using the `frontend/frontend` root directory.
- **Backend:** Deployed on Render using Django and Gunicorn.
- **Database:** MongoDB Atlas.

Production deployments require the appropriate environment variables and CORS configuration. Never store database credentials or secret keys in source code.

## Future Improvements

- Real-time task notifications
- Task priorities and due dates
- Advanced search, filtering, and sorting
- Enhanced team roles and permissions
- Automated backend and frontend tests
- Docker-based deployment

## Author

**Gursimran Kaur**

- GitHub: [Gursimrankaur0612](https://github.com/Gursimrankaur0612)
- LinkedIn: [Gursimran Kaur](https://linkedin.com/in/simran-k06/)

---

Built to simplify team collaboration and task tracking.
