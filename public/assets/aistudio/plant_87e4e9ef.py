from database import connect_db


# 1. ADD NEW PLANT
def add_plant():
    connection = connect_db()
    cursor = connection.cursor()

    print("\n--- Add New Plant ---")

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

    print("\n--- Your Plants ---")

    if not plants:
        print("No plants found.")
    else:
        for plant in plants:
            print("\n----------------------")
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

    print("\n--- Update Plant Health ---")

    cursor.execute("SELECT id, name FROM plants")
    plants = cursor.fetchall()

    if not plants:
        print("No plants available.")
        connection.close()
        return

    print("\nAvailable Plants:")
    for plant in plants:
        print("ID:", plant[0], "| Name:", plant[1])

    try:
        plant_id = int(input("\nEnter Plant ID: "))
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

    print("\nSelect Plant Health:")
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

    print("\n--- Delete Plant ---")

    cursor.execute("SELECT id, name FROM plants")
    plants = cursor.fetchall()

    if not plants:
        print("No plants available to delete.")
        connection.close()
        return

    print("\nAvailable Plants:")
    for plant in plants:
        print("ID:", plant[0], "| Name:", plant[1])

    try:
        plant_id = int(input("\nEnter Plant ID to delete: "))
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

    print("\n--- Search Plant ---")

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
        print("\nPlant Found!")
        print("Plant ID:", plant[0])
        print("Name:", plant[1])
        print("Type:", plant[2])
        print("Watering Days:", plant[3])
        print("Sunlight:", plant[4])
        print("Health:", plant[5])
        print("Last Watered:", plant[6])

    connection.close()