from rest_framework import serializers


class ActivitySerializer(serializers.Serializer):
    id = serializers.CharField()
    task_id = serializers.CharField()
    team_id = serializers.CharField()
    user_id = serializers.CharField()
    user_name = serializers.CharField()
    action = serializers.CharField()
    details = serializers.CharField()
    created_at = serializers.DateTimeField()