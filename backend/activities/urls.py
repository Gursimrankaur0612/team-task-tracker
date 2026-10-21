from django.urls import path
from . import views

urlpatterns = [
    path("team/<str:team_id>/", views.team_activities, name="team-activities"),
]