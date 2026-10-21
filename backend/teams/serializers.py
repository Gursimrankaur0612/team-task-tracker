
from rest_framework import serializers


class TeamCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    description = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
    )


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
