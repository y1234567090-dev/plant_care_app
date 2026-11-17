import os
from datetime import datetime, timezone
from pathlib import Path

from azure.storage.blob import BlobServiceClient
from database import DB_PATH

CONTAINER_NAME = "plant-care-backups"


def backup_database():
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    if not connection_string:
        print("AZURE_STORAGE_CONNECTION_STRING is not set.")
        return

    database_path = Path(DB_PATH)
    if not database_path.is_file():
        print("Database file not found:", database_path)
        return

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    blob_name = f"plants-{timestamp}.db"

    try:
        with BlobServiceClient.from_connection_string(connection_string) as service:
            container = service.get_container_client(CONTAINER_NAME)
            blob = container.get_blob_client(blob_name)

            with database_path.open("rb") as file:
                blob.upload_blob(file, overwrite=False)

            print("Azure backup uploaded successfully:", blob_name)

    except Exception as error:
        print("Backup failed:", type(error).__name__, str(error))


if __name__ == "__main__":
    backup_database()