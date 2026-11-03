"""Solution to the Zebra Puzzle.

Solves Einstein's riddle using constraint backtracking and exposes the two
requested answers:

* which resident drinks water
* who owns the zebra
"""

from __future__ import annotations

COLORS = ["red", "green", "ivory", "yellow", "blue"]
NATIONALITIES = ["Englishman", "Spaniard", "Ukrainian", "Japanese", "Norwegian"]
PETS = ["dog", "snails", "fox", "horse", "zebra"]
DRINKS = ["coffee", "tea", "milk", "orange juice", "water"]
HOBBIES = ["dancing", "painting", "reading", "football", "chess"]

CATEGORIES = [COLORS, NATIONALITIES, PETS, DRINKS, HOBBIES]
HOUSE_COUNT = 5
FIRST = 0
MIDDLE = 2


def _house_of(assignment, category, value):
    for house in range(HOUSE_COUNT):
        if assignment.get((house, category)) == value:
            return house
    return None


def _value_at(assignment, house, category):
    return assignment.get((house, category))


def _consistent(assignment):
    """Check every clue whose referenced houses are all assigned."""

    def house_of_category_value(category, value):
        return _house_of(assignment, category, value)

    def drink_at(house):
        return _value_at(assignment, house, DRINKS)

    def hobby_at(house):
        return _value_at(assignment, house, HOBBIES)

    # 2. The Englishman lives in the red house.
    h_eng = house_of_category_value(NATIONALITIES, "Englishman")
    h_red = house_of_category_value(COLORS, "red")
    if h_eng is not None and h_red is not None and h_eng != h_red:
        return False

    # 3. The Spaniard owns the dog.
    h_sp = house_of_category_value(NATIONALITIES, "Spaniard")
    h_dog = house_of_category_value(PETS, "dog")
    if h_sp is not None and h_dog is not None and h_sp != h_dog:
        return False

    # 4. The person in the green house drinks coffee.
    h_green = house_of_category_value(COLORS, "green")
    if h_green is not None and drink_at(h_green) is not None and drink_at(h_green) != "coffee":
        return False

    # 5. The Ukrainian drinks tea.
    h_ukr = house_of_category_value(NATIONALITIES, "Ukrainian")
    if h_ukr is not None and drink_at(h_ukr) is not None and drink_at(h_ukr) != "tea":
        return False

    # 6. The green house is immediately to the right of the ivory house.
    h_ivory = house_of_category_value(COLORS, "ivory")
    if h_green is not None and h_ivory is not None and h_green != h_ivory + 1:
        return False

    # 7. The snail owner likes to go dancing.
    h_snail = house_of_category_value(PETS, "snails")
    if h_snail is not None and hobby_at(h_snail) is not None and hobby_at(h_snail) != "dancing":
        return False

    # 8. The person in the yellow house is a painter.
    h_yellow = house_of_category_value(COLORS, "yellow")
    if h_yellow is not None and hobby_at(h_yellow) is not None and hobby_at(h_yellow) != "painting":
        return False

    # 9. The person in the middle house drinks milk.
    if drink_at(MIDDLE) is not None and drink_at(MIDDLE) != "milk":
        return False

    # 10. The Norwegian lives in the first house.
    h_nor = house_of_category_value(NATIONALITIES, "Norwegian")
    if h_nor is not None and h_nor != FIRST:
        return False

    # 11. Reading lives next to the fox.
    h_read = house_of_category_value(HOBBIES, "reading")
    h_fox = house_of_category_value(PETS, "fox")
    if h_read is not None and h_fox is not None and abs(h_read - h_fox) != 1:
        return False

    # 12. The painter's house is next to the house with the horse.
    h_paint = house_of_category_value(HOBBIES, "painting")
    h_horse = house_of_category_value(PETS, "horse")
    if h_paint is not None and h_horse is not None and abs(h_paint - h_horse) != 1:
        return False

    # 13. The person who plays football drinks orange juice.
    h_football = house_of_category_value(HOBBIES, "football")
    if h_football is not None and drink_at(h_football) is not None and drink_at(h_football) != "orange juice":
        return False

    # 14. The Japanese person plays chess.
    h_jpn = house_of_category_value(NATIONALITIES, "Japanese")
    if h_jpn is not None and hobby_at(h_jpn) is not None and hobby_at(h_jpn) != "chess":
        return False

    # 15. The Norwegian lives next to the blue house.
    h_blue = house_of_category_value(COLORS, "blue")
    if h_nor is not None and h_blue is not None and abs(h_nor - h_blue) != 1:
        return False

    return True


def _solve():
    """Backtracking search over (house, category) slots."""
    # Slot order: assign the most constraining anchors first.
    slots = []
    for house in range(HOUSE_COUNT):
        for category in (NATIONALITIES, COLORS, DRINKS, PETS, HOBBIES):
            slots.append((house, category))

    assignment = {}
    used = {tuple(cat): set() for cat in CATEGORIES}

    def backtrack(index):
        if index == len(slots):
            return dict(assignment)
        house, category = slots[index]
        for value in category:
            if value in used[tuple(category)]:
                continue
            assignment[(house, category)] = value
            used[tuple(category)].add(value)
            if _consistent(assignment):
                result = backtrack(index + 1)
                if result is not None:
                    return result
            used[tuple(category)].discard(value)
            del assignment[(house, category)]
        return None

    return backtrack(0)


_SOLUTION = _solve()


def _nationality_for(predicate):
    for house in range(HOUSE_COUNT):
        if predicate(_SOLUTION, house):
            return _SOLUTION[(house, NATIONALITIES)]
    return None


def drinks_water():
    """Return the nationality of the resident who drinks water."""
    return _nationality_for(lambda sol, house: sol[(house, DRINKS)] == "water")


def owns_zebra():
    """Return the nationality of the resident who owns the zebra."""
    return _nationality_for(lambda sol, house: sol[(house, PETS)] == "zebra")


def solution():
    """Return (water drinker, zebra owner) as nationalities."""
    return drinks_water(), owns_zebra()


if __name__ == "__main__":
    print("Drinks water:", drinks_water())
    print("Owns zebra:", owns_zebra())
