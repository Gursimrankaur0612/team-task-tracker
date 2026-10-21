
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv(
    "MONGODB_DB_NAME",
    "team_task_tracker",
)

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI is missing. Check backend/.env"
    )

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,
)

db = client[MONGODB_DB_NAME]


def check_mongodb():
    client.admin.command("ping")
    return True
