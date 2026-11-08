def can_chain(dominoes):
    if not dominoes:
        return []

    # Try all permutations with backtracking (domino set small)
    n = len(dominoes)
    used = [False] * n

    def backtrack(chain, current_end):
        if len(chain) == n:
            # Check if ends match
            if chain[0][0] == current_end:
                return list(chain)
            return None

        for i in range(n):
            if used[i]:
                continue
            d = dominoes[i]
            a, b = d
            if not chain:
                # Try placing domino in both orientations
                # Try (a,b)
                used[i] = True
                chain.append((a, b))
                res = backtrack(chain, b)
                if res is not None:
                    return res
                chain.pop()
                used[i] = False

                # Try (b,a)
                used[i] = True
                chain.append((b, a))
                res = backtrack(chain, a)
                if res is not None:
                    return res
                chain.pop()
                used[i] = False
            else:
                # Must match current_end
                if a == current_end:
                    used[i] = True
                    chain.append((a, b))
                    res = backtrack(chain, b)
                    if res is not None:
                        return res
                    chain.pop()
                    used[i] = False
                elif b == current_end:
                    used[i] = True
                    chain.append((b, a))
                    res = backtrack(chain, a)
                    if res is not None:
                        return res
                    chain.pop()
                    used[i] = False
        return None

    result = backtrack([], None)
    if result is None:
        return None
    return result
