
import base64
from pathlib import Path

from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import ResourceExistsError

from database import DB_PATH


# Azurite default storage credentials
ACCOUNT_NAME = "devstoreaccount1"

ACCOUNT_KEY = (
    "Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw=="
)

BLOB_URL = "http://127.0.0.1:10000/devstoreaccount1"

CONTAINER_NAME = "plant-care-backups"


def backup_database():

    try:
        # Validate the account key
        base64.b64decode(ACCOUNT_KEY, validate=True)

        # Connect to local Azurite Blob Storage
        blob_service = BlobServiceClient(
            account_url=BLOB_URL,
            credential=ACCOUNT_KEY
        )

        print("Connected to Azurite successfully!")

        # Create or access backup container
        container = blob_service.get_container_client(
            CONTAINER_NAME
        )

        try:
            container.create_container()
            print("Backup container created!")

        except ResourceExistsError:
            print("Backup container already exists!")

        # Check database file
        database_path = Path(DB_PATH)

        if not database_path.exists():
            print("Error: plants.db not found!")
            return

        # Upload database backup
        blob = container.get_blob_client(
            database_path.name
        )

        with open(database_path, "rb") as file:
            blob.upload_blob(file, overwrite=True)

        print("\nDatabase backup successful!")
        print("Backup file:", database_path.name)
        print("Storage: Local Azurite Blob Storage")

        blob_service.close()

    except Exception as error:
        print("\nBackup failed!")
        print("Error:", repr(error))


if __name__ == "__main__":
    backup_database()

