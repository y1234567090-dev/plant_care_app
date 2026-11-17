import sqlite3
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
    print("Database ready:", DB_PATH)
