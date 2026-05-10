import os
import random
import time
from datetime import datetime

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load .env file into environment variables
load_dotenv()

# --- AWS setup from env ---
dynamodb = boto3.resource(
    "dynamodb",
    region_name=os.getenv("APP_AWS_REGION"),
)

table = dynamodb.Table(os.getenv("CONVERSATIONS_DYNAMODB_TABLE_NAME"))


# --- generate fake conversation ---
def generate_random_conversation():
    first_names = ["Morgan", "Alex", "Jamie", "Taylor", "Jordan", "Casey", "Riley"]
    last_names = ["Davis", "Smith", "Johnson", "Brown", "Wilson", "Martinez", "Anderson"]

    notes = [
        "Requested support for login issues.",
        "Asked about billing discrepancy.",
        "Needs help resetting password.",
        "Inquired about account verification.",
        "Reported app crashing on login."
    ]

    messages = [
        "I still can’t log into my account.",
        "Why was I charged twice?",
        "I never received a verification email.",
        "The app keeps crashing when I open it.",
        "Can you reset my password for me?"
    ]

    first = random.choice(first_names)
    last = random.choice(last_names)

    unique_id = f"{int(time.time() * 1000)}-{random.randint(10000, 99999)}"
    phone_number = f"+1-215-555-{unique_id[-4:]}"

    now = datetime.utcnow().isoformat()

    return {
        "conversationId": phone_number,
        "clientName": f"{first} {last}",
        "conversationMethod": "Text",
        "phoneNumber": phone_number,
        "aiAutoResponseToggle": random.random() > 0.5,
        "conversationNotes": random.choice(notes),
        "newMessage": True,
        "mostRecentMessage": random.choice(messages),
        "lastMessageTimeStamp": now,
        "timeStamp": now,
    }


# --- write to DynamoDB ---
def put_conversation(conversation):
    try:
        item = {
            "conversationId": conversation["conversationId"],
            "timeStamp": datetime.utcnow().isoformat(),
            "clientName": conversation["clientName"],
            "conversationMethod": conversation["conversationMethod"],
            "phoneNumber": conversation["phoneNumber"],
            "aiAutoResponseToggle": conversation["aiAutoResponseToggle"],
            "conversationNotes": conversation["conversationNotes"],
            "newMessage": conversation["newMessage"],
            "mostRecentMessage": conversation["mostRecentMessage"],
            "lastMessageTimeStamp": conversation["lastMessageTimeStamp"],
        }

        response = table.put_item(Item=item)
        return response

    except ClientError as error:
        print("DynamoDB error:", error)
        raise


# --- main ---
def handler():
    try:
        convo = generate_random_conversation()
        result = put_conversation(convo)

        return {
            "success": True,
            "newConversationRecord": result
        }

    except Exception as error:
        return {
            "error": "Failed to write item",
            "details": str(error)
        }


if __name__ == "__main__":
    print(handler())