def best_hands(hands):
        # Parse and rank hands
    ranked_hands = [(hand, rank_hand(hand)) for hand in hands]
    
    # Find the highest ranked hand(s)
    max_rank = max(ranked_hands, key=lambda x: x[1])[1]
    winners = [hand for hand, rank in ranked_hands if rank == max_rank]
    
    return winners

def rank_hand(hand):
    # Placeholder for ranking logic
    
    # Convert face cards to numerical values
    face_values = {'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14}
    ranks = sorted([face_values.get(card[0], int(card[0])) for card in hand.split()], reverse=True)
    suits = [card[1] for card in hand.split()]

    # Check for flush
    flush = len(set(suits)) == 1

    # Check for straight
    straight = (max(ranks) - min(ranks) == 4) and len(set(ranks)) == 5
    ace_low_straight = set(ranks) == {14, 2, 3, 4, 5}

    # Check for various hand types
    count = Counter(ranks)
    kind_counts = sorted(count.values(), reverse=True)

    if straight and flush:
        return 9 if ranks[0] == 14 else 8  # Royal flush or straight flush
    elif kind_counts == [4, 1]:
        return 7  # Four of a kind
    elif kind_counts == [3, 2]:
        return 6  # Full house
    elif flush:
        return 5  # Flush
    elif straight or ace_low_straight:
        return 4  # Straight
    elif kind_counts == [3, 1, 1]:
        return 3  # Three of a kind
    elif kind_counts == [2, 2, 1]:
        return 2  # Two pair
    elif kind_counts == [2, 1, 1, 1]:
        return 1  # One pair
    else:
        return 0  # High card
