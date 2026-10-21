
from bson import ObjectId
from bson.errors import InvalidId
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from mongodb import db
from users.views import get_authenticated_user


@api_view(["GET"])
def team_activities(request, team_id):
    user = get_authenticated_user(request)

    if not user:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        team_object_id = ObjectId(team_id)
    except (InvalidId, TypeError):
        return Response(
            {"error": "Invalid team ID"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_id = str(user["_id"])

    team = db.teams.find_one({
        "_id": team_object_id,
        "members": user_id,
    })

    if not team:
        return Response(
            {"error": "Team not found or access denied"},
            status=status.HTTP_403_FORBIDDEN,
        )

    activities = db.activities.find(
        {"team_id": team_id}
    ).sort("created_at", -1).limit(100)

    results = []

    for activity in activities:
        results.append({
            "id": str(activity["_id"]),
            "task_id": activity["task_id"],
            "team_id": activity["team_id"],
            "user_id": activity["user_id"],
            "user_name": activity["user_name"],
            "action": activity["action"],
            "details": activity["details"],
            "created_at": activity["created_at"].isoformat(),
        })

    return Response({"activities": results})
