class ConnectGame:
    def __init__(self, board):
        # Parse the board - each line has cells separated by spaces
        lines = board.strip().split('\n')
        self.grid = []
        for line in lines:
            # Remove leading spaces and split by space to get cells
            cells = line.strip().split(' ')
            self.grid.append(cells)
        self.rows = len(self.grid)
        self.cols = len(self.grid[0]) if self.grid else 0

    def get_winner(self):
        if not self.grid or not self.grid[0]:
            return ''
        
        # Check if X wins (left to right)
        if self._has_path('X'):
            return 'X'
        
        # Check if O wins (top to bottom)
        if self._has_path('O'):
            return 'O'
        
        return ''

    def _has_path(self, player):
        """Check if player has a connecting path using BFS."""
        if player == 'X':
            # X connects left edge to right edge
            # Start from all X cells in leftmost column
            starts = [(r, 0) for r in range(self.rows) if self._cell(r, 0) == 'X']
            target_col = self.cols - 1
        else:
            # O connects top edge to bottom edge
            # Start from all O cells in top row
            starts = [(0, c) for c in range(self.cols) if self._cell(0, c) == 'O']
            target_row = self.rows - 1
        
        if not starts:
            return False
        
        visited = set(starts)
        queue = list(starts)
        
        while queue:
            r, c = queue.pop(0)
            
            # Check if we reached the target
            if player == 'X' and c == target_col:
                return True
            if player == 'O' and r == target_row:
                return True
            
            # Explore neighbors (hexagonal adjacency)
            for nr, nc in self._neighbors(r, c):
                if (nr, nc) not in visited and self._cell(nr, nc) == player:
                    visited.add((nr, nc))
                    queue.append((nr, nc))
        
        return False

    def _cell(self, r, c):
        """Safely get cell value."""
        if 0 <= r < self.rows and 0 <= c < len(self.grid[r]):
            return self.grid[r][c]
        return '.'

    def _neighbors(self, r, c):
        """Get hexagonal neighbors for position (r, c)."""
        # In hex grid with offset rows, neighbors are:
        neighbors = [
            (r - 1, c), (r - 1, c + 1),  # upper left, upper right
            (r, c - 1), (r, c + 1),       # left, right
            (r + 1, c - 1), (r + 1, c),   # lower left, lower right
        ]
        return neighbors
