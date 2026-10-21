
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps

from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from mongodb import db
from .serializers import RegisterSerializer, LoginSerializer


users_collection = db["users"]


def create_token(user):
    payload = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def get_authenticated_user(request):
    header = request.headers.get("Authorization", "")

    if not header.startswith("Bearer "):
        return None

    token = header.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
        )
        from bson import ObjectId

        user = users_collection.find_one(
            {"_id": ObjectId(payload["user_id"])}
        )
        return user
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None


@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    email = data["email"].strip().lower()

    if users_collection.find_one({"email": email}):
        return Response(
            {"error": "An account with this email already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    user = {
        "name": data["name"].strip(),
        "email": email,
        "password": make_password(data["password"]),
        "role": "Member",
        "created_at": datetime.now(timezone.utc),
    }

    result = users_collection.insert_one(user)
    user["_id"] = result.inserted_id

    return Response(
        {
            "message": "Registration successful.",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def login(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    email = data["email"].strip().lower()
    user = users_collection.find_one({"email": email})

    if not user or not check_password(data["password"], user["password"]):
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response({
        "message": "Login successful.",
        "token": create_token(user),
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    })


@api_view(["GET"])
def me(request):
    user = get_authenticated_user(request)

    if not user:
        return Response(
            {"error": "Invalid or missing token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response({
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        }
    })
