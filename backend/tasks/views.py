
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from mongodb import db
from users.views import get_authenticated_user
from .serializers import TaskCreateSerializer, TaskUpdateSerializer


tasks_collection = db["tasks"]
teams_collection = db["teams"]
activities_collection = db["activities"]

VALID_STATUSES = ["Pending", "In Progress", "Done"]


def serialize_task(task):
    return {
        "id": str(task["_id"]),
        "title": task["title"],
        "description": task.get("description", ""),
        "assigned_to": task["assigned_to"],
        "status": task["status"],
        "team_id": task["team_id"],
        "created_by": task["created_by"],
        "created_at": task["created_at"].isoformat(),
        "updated_at": task["updated_at"].isoformat(),
    }


def record_activity(task, user, action, details=""):
    activities_collection.insert_one({
        "task_id": str(task["_id"]),
        "team_id": task["team_id"],
        "user_id": str(user["_id"]),
        "user_name": user["name"],
        "action": action,
        "details": details,
        "created_at": datetime.now(timezone.utc),
    })


def get_team_for_member(team_id, user_id):
    try:
        object_id = ObjectId(team_id)
    except (InvalidId, TypeError):
        return None

    return teams_collection.find_one({
        "_id": object_id,
        "members": user_id,
    })


@api_view(["GET", "POST"])
def task_list_create(request):
    user = get_authenticated_user(request)

    if not user:
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user_id = str(user["_id"])

    if request.method == "POST":
        serializer = TaskCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        team_id = data["team_id"]

        team = get_team_for_member(team_id, user_id)

        if not team:
            return Response(
                {"error": "Team not found or you are not a team member."},
                status=status.HTTP_403_FORBIDDEN,
            )

        assigned_to = data["assigned_to"]

        if assigned_to not in team["members"]:
            return Response(
                {"error": "Assignee must be a member of this team."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = datetime.now(timezone.utc)

        task = {
            "title": data["title"].strip(),
            "description": data.get("description", "").strip(),
            "assigned_to": assigned_to,
            "status": "Pending",
            "team_id": str(team["_id"]),
            "created_by": user_id,
            "created_at": now,
            "updated_at": now,
        }

        result = tasks_collection.insert_one(task)
        task["_id"] = result.inserted_id

        record_activity(
            task,
            user,
            "created",
            f"Created task: {task['title']}",
        )

        return Response(
            {
                "message": "Task created successfully.",
                "task": serialize_task(task),
            },
            status=status.HTTP_201_CREATED,
        )

    # Optional team_id query parameter filters the list to one team.
    requested_team_id = request.query_params.get("team_id")

    if requested_team_id:
        team = get_team_for_member(requested_team_id, user_id)

        if not team:
            return Response(
                {"error": "Team not found or you are not a team member."},
                status=status.HTTP_403_FORBIDDEN,
            )

        query = {"team_id": str(team["_id"])}
    else:
        user_teams = teams_collection.find(
            {"members": user_id},
            {"_id": 1},
        )
        team_ids = [str(team["_id"]) for team in user_teams]
        query = {"team_id": {"$in": team_ids}}

    tasks = tasks_collection.find(query).sort("created_at", -1)

    return Response({
        "tasks": [serialize_task(task) for task in tasks]
    })


@api_view(["PATCH"])
def task_detail(request, task_id):
    user = get_authenticated_user(request)

    if not user:
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        task_object_id = ObjectId(task_id)
    except (InvalidId, TypeError):
        return Response(
            {"error": "Invalid task ID."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    task = tasks_collection.find_one({"_id": task_object_id})

    if not task:
        return Response(
            {"error": "Task not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    user_id = str(user["_id"])

    # Check team membership before allowing any update.
    team = get_team_for_member(task["team_id"], user_id)

    if not team:
        return Response(
            {"error": "You are not a member of this task's team."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = TaskUpdateSerializer(data=request.data, partial=True)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    changes = serializer.validated_data

    if not changes:
        return Response(
            {"error": "Provide at least one field to update."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if "assigned_to" in changes:
        if changes["assigned_to"] not in team["members"]:
            return Response(
                {"error": "Assignee must be a member of this team."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    changes = dict(changes)

    if "title" in changes:
        changes["title"] = changes["title"].strip()

    if "description" in changes:
        changes["description"] = changes["description"].strip()

    changes["updated_at"] = datetime.now(timezone.utc)

    tasks_collection.update_one(
        {"_id": task_object_id},
        {"$set": changes},
    )

    updated_task = tasks_collection.find_one({"_id": task_object_id})

    changed_fields = [
        field for field in serializer.validated_data
    ]

    record_activity(
        updated_task,
        user,
        "updated",
        "Updated: " + ", ".join(changed_fields),
    )

    return Response({
        "message": "Task updated successfully.",
        "task": serialize_task(updated_task),
    })
