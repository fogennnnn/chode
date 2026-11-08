def measure(bucket_one, bucket_two, goal, start_bucket):
    """
    Measure exactly 'goal' liters using two buckets.
    
    :param bucket_one: Size of bucket one
    :param bucket_two: Size of bucket two
    :param goal: Desired number of liters
    :param start_bucket: Which bucket to fill first - 'one' or 'two'
    :return: Tuple of (num_actions, goal_bucket, other_bucket)
    """
    # Check impossible cases
    if goal > bucket_one and goal > bucket_two:
        raise ValueError("Goal larger than both buckets")
    
    # Check if goal is possible at all (must be divisible in some cases, but generally need GCD)
    from math import gcd
    if goal % gcd(bucket_one, bucket_two) != 0 and goal != bucket_one and goal != bucket_two:
        # But easier to just try - if not reachable, will raise
        pass
    
    # Track visited states (amount in bucket1, amount in bucket2)
    # Starting state depends on which bucket we fill first
    if start_bucket == "one":
        start_state = (bucket_one, 0)  # fill bucket one first
        start_bucket_empty_forbidden = (0, bucket_two)  # cannot end in this state
    elif start_bucket == "two":
        start_state = (0, bucket_two)  # fill bucket two first
        start_bucket_empty_forbidden = (bucket_one, 0)  # cannot end in this state
    else:
        raise ValueError("start_bucket must be 'one' or 'two'")
    
    # BFS
    # (b1, b2, actions)
    from collections import deque
    visited = set([start_state])
    queue = deque([(start_state[0], start_state[1], 1)])  # 1 action for initial fill
    
    while queue:
        b1, b2, actions = queue.popleft()
        
        # Check if goal reached
        if b1 == goal:
            return (actions, "one", b2)
        if b2 == goal:
            return (actions, "two", b1)
        
        # Try all possible actions
        # Action types: fill, empty, pour
        
        # 1. Fill bucket one
        if b1 < bucket_one:
            new_state = (bucket_one, b2)
            # Check forbidden state
            if new_state == start_bucket_empty_forbidden:
                pass  # forbidden
            elif new_state not in visited:
                visited.add(new_state)
                queue.append((new_state[0], new_state[1], actions + 1))
        
        # 2. Fill bucket two
        if b2 < bucket_two:
            new_state = (b1, bucket_two)
            if new_state == start_bucket_empty_forbidden:
                pass  # forbidden
            elif new_state not in visited:
                visited.add(new_state)
                queue.append((new_state[0], new_state[1], actions + 1))
        
        # 3. Empty bucket one
        if b1 > 0:
            new_state = (0, b2)
            if new_state == start_bucket_empty_forbidden:
                pass  # forbidden
            elif new_state not in visited:
                visited.add(new_state)
                queue.append((new_state[0], new_state[1], actions + 1))
        
        # 4. Empty bucket two
        if b2 > 0:
            new_state = (b1, 0)
            if new_state == start_bucket_empty_forbidden:
                pass  # forbidden
            elif new_state not in visited:
                visited.add(new_state)
                queue.append((new_state[0], new_state[1], actions + 1))
        
        # 5. Pour bucket one into bucket two
        if b1 > 0 and b2 < bucket_two:
            pour_amount = min(b1, bucket_two - b2)
            new_b1 = b1 - pour_amount
            new_b2 = b2 + pour_amount
            new_state = (new_b1, new_b2)
            if new_state == start_bucket_empty_forbidden:
                pass  # forbidden
            elif new_state not in visited:
                visited.add(new_state)
                queue.append((new_b1, new_b2, actions + 1))
        
        # 6. Pour bucket two into bucket one
        if b2 > 0 and b1 < bucket_one:
            pour_amount = min(b2, bucket_one - b1)
            new_b1 = b1 + pour_amount
            new_b2 = b2 - pour_amount
            new_state = (new_b1, new_b2)
            if new_state == start_bucket_empty_forbidden:
                pass  # forbidden
            elif new_state not in visited:
                visited.add(new_state)
                queue.append((new_b1, new_b2, actions + 1))
    
    raise ValueError("Not possible to reach the goal")
