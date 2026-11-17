export interface PythonSourceFile {
  filename: string;
  role: string;
  content: string;
}

export const PYTHON_SOURCE_FILES: PythonSourceFile[] = [
  {
    filename: 'main.py',
    role: 'CLI menu entry point',
    content: `from database import create_table
from plant import add_plant, view_plants, delete_plant, update_health, search_plant
from watering import water_plant, check_schedule

create_table()

while True:

    print("\\n================================")
    print("       🌱 PLANT CARE TRACKER")
    print("================================")

    print("1. Add New Plant")
    print("2. View All Plants")
    print("3. Water a Plant")
    print("4. Check Watering Schedule")
    print("5. Delete Plant")
    print("6. Update Plant Health")
    print("7. Search Plant")
    print("8. Exit")

    choice = input("\\nEnter your choice: ")

    if choice == "1":
        add_plant()

    elif choice == "2":
        view_plants()

    elif choice == "3":
        water_plant()

    elif choice == "4":
        check_schedule()

    elif choice == "5":
        delete_plant()

    elif choice == "6":
        update_health()

    elif choice == "7":
        search_plant()

    elif choice == "8":
        print("Thank you for using Plant Care Tracker!")
        break

    else:
        print("Invalid choice! Please try again.")`,
  },
  {
    filename: 'database.py',
    role: 'SQLite connection and table schema',
    content: `import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "plants.db"

def connect_db():
    """Open the Plant Care Tracker database."""
    return sqlite3.connect(DB_PATH)


def create_table():
    """Create the plants table if it does not already exist."""
    connection = connect_db()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS plants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                plant_type TEXT,
                watering_days INTEGER,
                sunlight TEXT,
                health TEXT DEFAULT 'Healthy',
                last_watered TEXT
            )
        """)
        connection.commit()
    finally:
        connection.close()


if __name__ == "__main__":
    create_table()
    print("Database ready:", DB_PATH)`,
  },
  {
    filename: 'plant.py',
    role: 'CRUD operations for plant records',
    content: `from database import connect_db


# 1. ADD NEW PLANT
def add_plant():
    connection = connect_db()
    cursor = connection.cursor()

    print("\\n--- Add New Plant ---")

    name = input("Enter plant name: ")
    plant_type = input("Enter plant type: ")

    try:
        watering_days = int(input("Watering interval (days): "))
        if watering_days <= 0:
            print("Watering days must be greater than zero.")
            connection.close()
            return
    except ValueError:
        print("Please enter a valid number.")
        connection.close()
        return

    sunlight = input("Enter sunlight requirement: ")

    cursor.execute("""
        INSERT INTO plants
        (name, plant_type, watering_days, sunlight, health)
        VALUES (?, ?, ?, ?, ?)
    """, (name, plant_type, watering_days, sunlight, "Healthy"))

    connection.commit()

    print("Plant added successfully!")
    print("Your Plant ID is:", cursor.lastrowid)

    connection.close()


# 2. VIEW ALL PLANTS
def view_plants():
    connection = connect_db()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM plants")
    plants = cursor.fetchall()

    print("\\n--- Your Plants ---")

    if not plants:
        print("No plants found.")
    else:
        for plant in plants:
            print("\\n----------------------")
            print("Plant ID:", plant[0])
            print("Name:", plant[1])
            print("Type:", plant[2])
            print("Watering Days:", plant[3])
            print("Sunlight:", plant[4])
            print("Health:", plant[5])
            print("Last Watered:", plant[6])

    connection.close()


# 3. UPDATE PLANT HEALTH
def update_health():
    connection = connect_db()
    cursor = connection.cursor()

    print("\\n--- Update Plant Health ---")

    cursor.execute("SELECT id, name FROM plants")
    plants = cursor.fetchall()

    if not plants:
        print("No plants available.")
        connection.close()
        return

    print("\\nAvailable Plants:")
    for plant in plants:
        print("ID:", plant[0], "| Name:", plant[1])

    try:
        plant_id = int(input("\\nEnter Plant ID: "))
    except ValueError:
        print("Please enter a valid Plant ID.")
        connection.close()
        return

    cursor.execute(
        "SELECT id FROM plants WHERE id = ?",
        (plant_id,)
    )

    plant = cursor.fetchone()

    if plant is None:
        print("Plant ID not found!")
        connection.close()
        return

    print("\\nSelect Plant Health:")
    print("1. Healthy")
    print("2. Need Attention")
    print("3. Unhealthy")

    choice = input("Enter your choice: ")

    health_options = {
        "1": "Healthy",
        "2": "Need Attention",
        "3": "Unhealthy"
    }

    if choice not in health_options:
        print("Invalid choice!")
        connection.close()
        return

    health = health_options[choice]

    cursor.execute(
        "UPDATE plants SET health = ? WHERE id = ?",
        (health, plant_id)
    )

    connection.commit()

    print("Plant health updated successfully!")
    print("New Health:", health)

    connection.close()


# 4. DELETE PLANT
def delete_plant():
    connection = connect_db()
    cursor = connection.cursor()

    print("\\n--- Delete Plant ---")

    cursor.execute("SELECT id, name FROM plants")
    plants = cursor.fetchall()

    if not plants:
        print("No plants available to delete.")
        connection.close()
        return

    print("\\nAvailable Plants:")
    for plant in plants:
        print("ID:", plant[0], "| Name:", plant[1])

    try:
        plant_id = int(input("\\nEnter Plant ID to delete: "))
    except ValueError:
        print("Please enter a valid Plant ID.")
        connection.close()
        return

    cursor.execute(
        "SELECT name FROM plants WHERE id = ?",
        (plant_id,)
    )

    plant = cursor.fetchone()

    if plant is None:
        print("Plant ID not found!")
        connection.close()
        return

    cursor.execute(
        "DELETE FROM plants WHERE id = ?",
        (plant_id,)
    )

    connection.commit()

    print(plant[0], "deleted successfully!")

    connection.close()


# Compatibility with older function name
def update_plant_health():
    update_health()

# 5. SEARCH PLANT
def search_plant():
    connection = connect_db()
    cursor = connection.cursor()

    print("\\n--- Search Plant ---")

    try:
        plant_id = int(input("Enter Plant ID: "))
    except ValueError:
        print("Please enter a valid Plant ID.")
        connection.close()
        return

    cursor.execute(
        "SELECT * FROM plants WHERE id = ?",
        (plant_id,)
    )

    plant = cursor.fetchone()

    if plant is None:
        print("Plant ID not found!")
    else:
        print("\\nPlant Found!")
        print("Plant ID:", plant[0])
        print("Name:", plant[1])
        print("Type:", plant[2])
        print("Watering Days:", plant[3])
        print("Sunlight:", plant[4])
        print("Health:", plant[5])
        print("Last Watered:", plant[6])

    connection.close()`,
  },
  {
    filename: 'watering.py',
    role: 'Watering updates & schedule checks',
    content: `from database import connect_db
from datetime import date, timedelta


def water_plant():
    plant_id = input("Enter plant ID: ")

    connection = connect_db()
    cursor = connection.cursor()

    cursor.execute(
        "UPDATE plants SET last_watered = ? WHERE id = ?",
        (date.today().isoformat(), plant_id)
    )

    connection.commit()

    if cursor.rowcount > 0:
        print("Plant watered successfully!")
    else:
        print("Plant ID not found.")

    connection.close()


def check_schedule():
    connection = connect_db()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM plants")
    records = cursor.fetchall()

    connection.close()

    if not records:
        print("\\nNo plants found! Add plants first.")
        return

    today = date.today()

    print("\\n========== WATERING REMINDERS ==========")

    for plant in records:

        name = plant[1]
        watering_days = plant[3]
        last_watered = plant[6]

        print("\\nPlant:", name)

        if not last_watered or not watering_days:
            print("Watering information missing.")
            continue

        try:
            last_date = date.fromisoformat(
                str(last_watered)[:10]
            )

            next_date = last_date + timedelta(
                days=int(watering_days)
            )

            days_left = (next_date - today).days

            print("Last Watered:", last_date)
            print("Next Watering:", next_date)

            if days_left < 0:
                print("Status: OVERDUE!")
                print("Overdue by:", abs(days_left), "days")

            elif days_left == 0:
                print("Status: WATER TODAY!")

            else:
                print("Status: Not due yet.")
                print("Days remaining:", days_left)

        except (ValueError, TypeError):
            print("Invalid watering information.")

    print("\\n========================================")`,
  },
  {
    filename: 'azure_backup.py',
    role: 'Local Azurite Blob Storage backup',
    content: `import base64
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

        print("\\nDatabase backup successful!")
        print("Backup file:", database_path.name)
        print("Storage: Local Azurite Blob Storage")

        blob_service.close()

    except Exception as error:
        print("\\nBackup failed!")
        print("Error:", repr(error))


if __name__ == "__main__":
    backup_database()`,
  },
  {
    filename: 'azurebackup.py',
    role: 'Cloud Azure Blob Storage timestamped backup',
    content: `import os
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
    backup_database()`,
  },
  {
    filename: 'check_python.py',
    role: 'Environment check script',
    content: `import sys

print("Python is working")
print(sys.executable)`,
  },
  {
    filename: 'requirements.txt',
    role: 'Dependency notes',
    content: `# No external packages required for the local version.`,
  },
];
