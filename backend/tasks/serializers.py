
from rest_framework import serializers


class TaskCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    assigned_to = serializers.CharField()
    team_id = serializers.CharField()


class TaskUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, required=False)
    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    assigned_to = serializers.CharField(required=False)
    status = serializers.ChoiceField(
        choices=["Pending", "In Progress", "Done"],
        required=False,
    )
