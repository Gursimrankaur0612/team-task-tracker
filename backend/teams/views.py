
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from mongodb import db
from users.views import get_authenticated_user
from .serializers import TeamCreateSerializer, InviteMemberSerializer


teams_collection = db["teams"]
users_collection = db["users"]


def serialize_team(team):
    return {
        "id": str(team["_id"]),
        "name": team["name"],
        "description": team.get("description", ""),
        "created_by": team["created_by"],
        "members": team["members"],
        "created_at": team["created_at"].isoformat(),
    }


@api_view(["GET", "POST"])
def team_list_create(request):
    user = get_authenticated_user(request)

    if not user:
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user_id = str(user["_id"])

    if request.method == "POST":
        if user.get("role") != "Admin":
            return Response(
                {"error": "Only Admins can create teams."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TeamCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        team = {
            "name": data["name"].strip(),
            "description": data.get("description", "").strip(),
            "created_by": user_id,
            "members": [user_id],
            "created_at": datetime.now(timezone.utc),
        }

        result = teams_collection.insert_one(team)
        team["_id"] = result.inserted_id

        return Response(
            {
                "message": "Team created successfully.",
                "team": serialize_team(team),
            },
            status=status.HTTP_201_CREATED,
        )

    teams = teams_collection.find({"members": user_id}).sort(
        "created_at", -1
    )

    return Response({
        "teams": [serialize_team(team) for team in teams]
    })


@api_view(["POST"])
def invite_member(request, team_id):
    user = get_authenticated_user(request)

    if not user:
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if user.get("role") != "Admin":
        return Response(
            {"error": "Only Admins can invite members."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        team_object_id = ObjectId(team_id)
    except (InvalidId, TypeError):
        return Response(
            {"error": "Invalid team ID."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    team = teams_collection.find_one({"_id": team_object_id})

    if not team:
        return Response(
            {"error": "Team not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = InviteMemberSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = serializer.validated_data["email"].strip().lower()
    member = users_collection.find_one({"email": email})

    if not member:
        return Response(
            {
                "error": "User not found. Ask them to register first."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    member_id = str(member["_id"])

    if member_id in team["members"]:
        return Response(
            {"message": "This user is already a team member."},
            status=status.HTTP_200_OK,
        )

    teams_collection.update_one(
        {"_id": team_object_id},
        {"$addToSet": {"members": member_id}},
    )

    return Response({
        "message": f"{email} was added to the team successfully.",
    })
