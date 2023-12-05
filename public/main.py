import json
import random
import time

def apply_discount(menu_item):
    indirim = menu_item.get("indirim", "0")
    old_price = int(menu_item["oldPrice"])
    product_price = int(menu_item["productPrice"])
    
    if indirim.isdigit():
        indirim = int(indirim)
        if indirim > 0:
            random_number = random.randint(-indirim, indirim)
            multiple_of_10 = round(random_number / 10) * 10
            
            menu_item["productPrice"] = str(product_price + multiple_of_10)
    return menu_item

def main():
    # Step 1: Read data from "menu.json"
    with open("menu.json", "r") as file:
        data_dict = json.load(file)

    kafe_menu = data_dict["kafeMenu"]

    # Randomly choose one item from the kafeMenu list
    selected_item = random.choice(kafe_menu)
    apply_discount(selected_item)

    # Step 4: Update the data dictionary
    with open("menu.json", "w") as file:
        json.dump(data_dict, file, indent=4)

        

if __name__ == "__main__":
    while True:
        main()
        time.sleep(5)

