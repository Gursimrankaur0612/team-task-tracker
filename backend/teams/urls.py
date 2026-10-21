
from django.urls import path
from . import views

urlpatterns = [
    path("", views.team_list_create, name="team-list-create"),
    path(
        "<str:team_id>/invite/",
        views.invite_member,
        name="invite-member",
    ),
]
