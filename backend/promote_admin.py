
from mongodb import db

email = "member@example.com"

result = db.users.update_one(
    {"email": email},
    {"$set": {"role": "Admin"}}
)

if result.matched_count == 0:
    print("User not found. Check the email address.")
else:
    user = db.users.find_one(
        {"email": email},
        {"_id": 0, "email": 1, "role": 1}
    )
    print("Updated user:", user)
