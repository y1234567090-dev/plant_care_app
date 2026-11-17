
from database import connect_db
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
        print("\nNo plants found! Add plants first.")
        return

    today = date.today()

    print("\n========== WATERING REMINDERS ==========")

    for plant in records:

        name = plant[1]
        watering_days = plant[3]
        last_watered = plant[6]

        print("\nPlant:", name)

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

    print("\n========================================")



