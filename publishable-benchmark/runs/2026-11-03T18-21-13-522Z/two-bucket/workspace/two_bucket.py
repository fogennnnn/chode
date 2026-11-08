def measure(bucket_one_size, bucket_two_size, goal, start_bucket):
    # Check if goal is impossible
    if goal > bucket_one_size and goal > bucket_two_size:
        raise ValueError("Goal larger than both buckets")
    
    # Check if goal is reachable using GCD
    def gcd(a, b):
        while b:
            a, b = b, a % b
        return a
    
    if goal % gcd(bucket_one_size, bucket_two_size) != 0:
        raise ValueError("Goal not reachable")
    
    # BFS to find minimum actions
    from collections import deque
    
    # Determine starting bucket
    if start_bucket == "one":
        start_state = (bucket_one_size, 0)
        start_bucket_idx = 0
    else:
        start_state = (0, bucket_two_size)
        start_bucket_idx = 1
    
    # Check if we already reached the goal
    if start_state[0] == goal:
        return (1, "one", start_state[1])
    if start_state[1] == goal:
        return (1, "two", start_state[0])
    
    # BFS queue: (bucket_one_amount, bucket_two_amount, actions)
    queue = deque([(start_state[0], start_state[1], 1)])
    visited = {start_state}
    
    # The forbidden state: starting bucket empty, other bucket full
    if start_bucket == "one":
        forbidden = (0, bucket_two_size)
    else:
        forbidden = (bucket_one_size, 0)
    
    while queue:
        b1, b2, actions = queue.popleft()
        
        # Generate all possible next states
        next_states = []
        
        # 1. Fill bucket one
        next_states.append((bucket_one_size, b2))
        
        # 2. Fill bucket two
        next_states.append((b1, bucket_two_size))
        
        # 3. Empty bucket one
        next_states.append((0, b2))
        
        # 4. Empty bucket two
        next_states.append((b1, 0))
        
        # 5. Pour bucket one into bucket two
        pour_amount = min(b1, bucket_two_size - b2)
        next_states.append((b1 - pour_amount, b2 + pour_amount))
        
        # 6. Pour bucket two into bucket one
        pour_amount = min(b2, bucket_one_size - b1)
        next_states.append((b1 + pour_amount, b2 - pour_amount))
        
        for next_b1, next_b2 in next_states:
            # Skip forbidden state
            if (next_b1, next_b2) == forbidden:
                continue
            
            # Skip already visited
            if (next_b1, next_b2) in visited:
                continue
            
            visited.add((next_b1, next_b2))
            new_actions = actions + 1
            
            # Check if goal reached
            if next_b1 == goal:
                return (new_actions, "one", next_b2)
            if next_b2 == goal:
                return (new_actions, "two", next_b1)
            
            queue.append((next_b1, next_b2, new_actions))
    
    raise ValueError("Goal not reachable")
