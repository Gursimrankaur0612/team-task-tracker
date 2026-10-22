
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Team = {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  members?: string[];
};

type Task = {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  status: "Pending" | "In Progress" | "Done";
  assigned_to?: string;
  team_id?: string;
};

type Activity = {
  id?: string;
  action?: string;
  message?: string;
  type?: string;
  created_at?: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState("Pending");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Each action has its own loading state.
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [invitingMember, setInvitingMember] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [teamResult, taskResult] = await Promise.all([
        apiRequest<any>("/teams/"),
        apiRequest<any>("/tasks/"),
      ]);

      const teamList: Team[] = Array.isArray(teamResult)
        ? teamResult
        : teamResult.teams ?? teamResult.results ?? [];

      const taskList: Task[] = Array.isArray(taskResult)
        ? taskResult
        : taskResult.tasks ?? taskResult.results ?? [];

      setTeams(teamList);
      setTasks(taskList);

      const currentTeam =
        selectedTeam || teamList[0]?.id || teamList[0]?._id || "";

      if (currentTeam) {
        setSelectedTeam(currentTeam);

        const activityResult = await apiRequest<any>(
          `/activities/team/${currentTeam}/`
        );

        setActivities(
          Array.isArray(activityResult)
            ? activityResult
            : activityResult.activities ?? []
        );
      } else {
        setActivities([]);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load dashboard data"
      );
    }
  }, [selectedTeam]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token) {
      router.replace("/");
      return;
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    loadDashboard();

    const interval = window.setInterval(loadDashboard, 10000);

    return () => window.clearInterval(interval);
  }, [router, loadDashboard]);

  async function createTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setCreatingTeam(true);

    try {
      await apiRequest("/teams/", {
        method: "POST",
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
        }),
      });

      setTeamName("");
      setTeamDescription("");
      setNotice("Team created successfully.");

      await loadDashboard();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not create team"
      );
    } finally {
      setCreatingTeam(false);
    }
  }

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedTeam) {
      setError("Create or select a team first.");
      return;
    }

    setError("");
    setNotice("");
    setCreatingTask(true);

    try {
      await apiRequest("/tasks/", {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          status: taskStatus,
          team_id: selectedTeam,
          assigned_to: user?.id,
        }),
      });

      setTaskTitle("");
      setTaskDescription("");
      setNotice("Task created successfully.");

      await loadDashboard();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not create task"
      );
    } finally {
      setCreatingTask(false);
    }
  }

  async function inviteMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedTeam) {
      setError("Select a team before inviting a member.");
      return;
    }

    setError("");
    setNotice("");
    setInvitingMember(true);

    try {
      const result = await apiRequest<any>(
        `/teams/${selectedTeam}/invite/`,
        {
          method: "POST",
          body: JSON.stringify({
            email: inviteEmail.trim().toLowerCase(),
          }),
        }
      );

      setInviteEmail("");
      setNotice(result.message || "Member added successfully.");

      await loadDashboard();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not invite member."
      );
    } finally {
      setInvitingMember(false);
    }
  }

  async function updateStatus(
    task: Task,
    status: Task["status"]
  ) {
    const id = task.id || task._id;

    if (!id) return;

    setError("");

    try {
      await apiRequest(`/tasks/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setNotice("Task status updated.");
      await loadDashboard();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update task"
      );
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/");
  }

  const visibleTasks = tasks.filter(
    (task) =>
      !selectedTeam ||
      task.team_id === selectedTeam ||
      (task as any).team_id?.$oid === selectedTeam
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5 lg:px-10">
        <div>
          <p className="text-sm font-medium text-indigo-400">
            WORKSPACE
          </p>
          <h1 className="text-2xl font-bold">
            Team Task Tracker
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">
              {user?.name || "Team member"}
            </p>
            <p className="text-xs text-slate-400">
              {user?.role || "Member"}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-800 bg-red-950/60 p-4 text-red-200"
          >
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-emerald-800 bg-emerald-950/50 p-4 text-emerald-200">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Your teams</p>
            <p className="mt-2 text-3xl font-bold">
              {teams.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Tasks</p>
            <p className="mt-2 text-3xl font-bold">
              {visibleTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Completed</p>
            <p className="mt-2 text-3xl font-bold">
              {visibleTasks.filter((t) => t.status === "Done").length}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {user?.role?.toLowerCase() === "admin" && (
            <form
              onSubmit={createTeam}
              className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <h2 className="text-xl font-bold">Create a team</h2>

              <input
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />

              <textarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Team description"
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
              />

              <button
                type="submit"
                disabled={creatingTeam}
                className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
              >
                {creatingTeam ? "Creating team..." : "Create team"}
              </button>
            </form>
          )}

          {user?.role?.toLowerCase() === "admin" && (
            <form
              onSubmit={inviteMember}
              className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <h2 className="text-xl font-bold">
                Invite a team member
              </h2>

              <label className="block text-sm text-slate-300">
                Selected team
              </label>

              <select
                required
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
              >
                <option value="">Select team</option>
                {teams.map((team, i) => (
                  <option
                    key={team.id || team._id || i}
                    value={team.id || team._id}
                  >
                    {team.name}
                  </option>
                ))}
              </select>

              <label className="block text-sm text-slate-300">
                Registered member&apos;s email
              </label>

              <input
                required
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
              />

              <p className="text-sm text-slate-400">
                The user must register before you can add them to
                the team.
              </p>

              <button
                type="submit"
                disabled={invitingMember || !teams.length}
                className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
              >
                {invitingMember
                  ? "Inviting member..."
                  : "Invite member"}
              </button>
            </form>
          )}

          <form
            onSubmit={createTask}
            className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-xl font-bold">Create a task</h2>

            <label className="block text-sm text-slate-300">
              Team
            </label>

            <select
              required
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
            >
              <option value="">Select team</option>
              {teams.map((team, i) => (
                <option
                  key={team.id || team._id || i}
                  value={team.id || team._id}
                >
                  {team.name}
                </option>
              ))}
            </select>

            <input
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
            />

            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Task description"
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500"
            />

            <select
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>

            <button
              type="submit"
              disabled={creatingTask || !teams.length}
              className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {creatingTask ? "Adding task..." : "Add task"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Tasks</h2>

            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2"
            >
              {teams.map((team, i) => (
                <option
                  key={team.id || team._id || i}
                  value={team.id || team._id}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {visibleTasks.length === 0 ? (
            <p className="py-8 text-center text-slate-400">
              No tasks yet. Create one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map((task, i) => (
                <article
                  key={task.id || task._id || i}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {task.description || "No description"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      Status
                    </span>

                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateStatus(
                          task,
                          e.target.value as Task["status"]
                        )
                      }
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent activity</h2>
            <span className="text-xs text-slate-500">
              Refreshes every 10 seconds
            </span>
          </div>

          {activities.length === 0 ? (
            <p className="py-4 text-slate-400">
              No activity recorded for this team yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {activities.map((activity, i) => (
                <li
                  key={activity.id || i}
                  className="border-l-2 border-indigo-500 pl-4"
                >
                  <p>
                    {activity.message ||
                      activity.action ||
                      activity.type ||
                      "Task activity"}
                  </p>

                  {activity.created_at && (
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
