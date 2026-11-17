from database import create_table
from plant import add_plant, view_plants, delete_plant, update_health, search_plant
from watering import water_plant, check_schedule

create_table()

while True:

    print("\n================================")
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

    choice = input("\nEnter your choice: ")

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
        print("Invalid choice! Please try again.")