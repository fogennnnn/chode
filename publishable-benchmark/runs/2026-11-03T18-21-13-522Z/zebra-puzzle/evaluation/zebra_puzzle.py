from itertools import permutations

def solve_puzzle():
    """Solve the Zebra Puzzle and return (water_drinker, zebra_owner)."""
    # Houses are indexed 0-4 (first to fifth)
    # Each permutation represents an ordering of values across the 5 houses
    
    nationalities = ['Englishman', 'Spaniard', 'Ukrainian', 'Norwegian', 'Japanese']
    colors = ['red', 'green', 'ivory', 'yellow', 'blue']
    pets = ['dog', 'snail', 'fox', 'horse', 'zebra']
    drinks = ['coffee', 'tea', 'milk', 'orange_juice', 'water']
    hobbies = ['dancing', 'painter', 'reading', 'football', 'chess']
    
    # Try all permutations for each category
    for nat_perm in permutations(nationalities):
        # Constraint 10: Norwegian lives in the first house
        if nat_perm[0] != 'Norwegian':
            continue
        
        for color_perm in permutations(colors):
            # Constraint 2: Englishman lives in the red house
            if nat_perm.index('Englishman') != color_perm.index('red'):
                continue
            # Constraint 6: Green house is immediately to the right of ivory house
            if color_perm.index('green') != color_perm.index('ivory') + 1:
                continue
            # Constraint 15: Norwegian lives next to the blue house
            if abs(nat_perm.index('Norwegian') - color_perm.index('blue')) != 1:
                continue
            
            for drink_perm in permutations(drinks):
                # Constraint 4: Person in green house drinks coffee
                if color_perm.index('green') != drink_perm.index('coffee'):
                    continue
                # Constraint 5: Ukrainian drinks tea
                if nat_perm.index('Ukrainian') != drink_perm.index('tea'):
                    continue
                # Constraint 9: Person in middle house drinks milk
                if drink_perm[2] != 'milk':
                    continue
                
                for hobby_perm in permutations(hobbies):
                    # Constraint 7: Snail owner likes dancing
                    # (need pet_perm for this)
                    # Constraint 8: Person in yellow house is a painter
                    if color_perm.index('yellow') != hobby_perm.index('painter'):
                        continue
                    # Constraint 13: Person who plays football drinks orange juice
                    if hobby_perm.index('football') != drink_perm.index('orange_juice'):
                        continue
                    # Constraint 14: Japanese person plays chess
                    if nat_perm.index('Japanese') != hobby_perm.index('chess'):
                        continue
                    
                    for pet_perm in permutations(pets):
                        # Constraint 3: Spaniard owns the dog
                        if nat_perm.index('Spaniard') != pet_perm.index('dog'):
                            continue
                        # Constraint 7: Snail owner likes to go dancing
                        if pet_perm.index('snail') != hobby_perm.index('dancing'):
                            continue
                        # Constraint 11: Person who enjoys reading lives next to person with fox
                        if abs(hobby_perm.index('reading') - pet_perm.index('fox')) != 1:
                            continue
                        # Constraint 12: Painter's house is next to house with horse
                        if abs(hobby_perm.index('painter') - pet_perm.index('horse')) != 1:
                            continue
                        
                        # Found the solution!
                        water_drinker = nat_perm[drink_perm.index('water')]
                        zebra_owner = nat_perm[pet_perm.index('zebra')]
                        return (water_drinker, zebra_owner)
    
    return None

def drinks_water():
    result = solve_puzzle()
    return result[0] if result else None

def owns_zebra():
    result = solve_puzzle()
    return result[1] if result else None
