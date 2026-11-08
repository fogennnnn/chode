def can_chain(dominoes):
    """
    Given a list of dominoes (tuples of two integers), return a chain where:
    - Adjacent dominoes match (right end of one equals left end of next)
    - First and last dominoes also match (forms a cycle)
    - All dominoes are used exactly once (can be flipped)
    Returns None if no valid chain exists.
    """
    if not dominoes:
        return []
    
    n = len(dominoes)
    used = [False] * n
    
    def backtrack(chain, last_val):
        if len(chain) == n:
            # Check if chain forms a cycle
            if chain[0][0] == last_val:
                return chain
            return None
        
        for i in range(n):
            if not used[i]:
                a, b = dominoes[i]
                # Try both orientations
                for left, right in [(a, b), (b, a)]:
                    if left == last_val:
                        used[i] = True
                        chain.append((left, right))
                        result = backtrack(chain, right)
                        if result is not None:
                            return result
                        chain.pop()
                        used[i] = False
        return None
    
    # Try each domino as starting point
    for i in range(n):
        a, b = dominoes[i]
        for left, right in [(a, b), (b, a)]:
            used[i] = True
            chain = [(left, right)]
            result = backtrack(chain, right)
            if result is not None:
                return result
            used[i] = False
    
    return None
