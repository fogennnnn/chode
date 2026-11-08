def best_hands(hands):
    
    # Define card ranks and suits
    ranks = '23456789TJQKA'
    suits = 'SHDC'

    # Helper function to convert hand string to list of tuples (rank, suit)
    def parse_hand(hand):
        return [(card[0], card[1]) for card in hand.split()]

    # Helper function to get rank value
    def get_rank_value(rank):
        return ranks.index(rank)

    # Parse all hands
    parsed_hands = [parse_hand(hand) for hand in hands]

    # Sort hands by highest card
    sorted_hands = sorted(parsed_hands, key=lambda hand: max(get_rank_value(card[0]) for card in hand), reverse=True)

    # Return the best hand(s)
    max_value = max(get_rank_value(card[0]) for card in sorted_hands[0])
    best_hands_list = [hand for hand in parsed_hands if max(get_rank_value(card[0]) for card in hand) == max_value]

    # Convert back to original format
    return [' '.join(''.join(card) for card in hand) for hand in best_hands_list]

