class ConnectGame:
    def __init__(self, board_str):
        self.board = []
        for line in board_str.splitlines():
            tokens = []
            i = 0
            while i < len(line):
                ch = line[i]
                if ch == 'X' or ch == 'O' or ch == '.':
                    tokens.append(ch)
                    i += 1
                    continue
                i += 1
            if tokens:
                self.board.append(tokens)
        self.height = len(self.board)
        self.width = len(self.board[0]) if self.height > 0 else 0

    def get_winner(self):
        if self._player_wins('X'):
            return 'X'
        if self._player_wins('O'):
            return 'O'
        return ''

    def _player_wins(self, player):
        if player == 'X':
            if self.width == 0:
                return False
            visited = set()
            stack = []
            for r in range(self.height):
                if self.board[r][0] == player:
                    if (r, 0) not in visited:
                        visited.add((r, 0))
                        stack.append((r, 0))
            while stack:
                cur_r, cur_c = stack.pop()
                if cur_c == self.width - 1:
                    return True
                for nr, nc in self._neighbors(cur_r, cur_c):
                    if 0 <= nr < self.height and 0 <= nc < self.width:
                        if (nr, nc) not in visited and self.board[nr][nc] == player:
                            visited.add((nr, nc))
                            stack.append((nr, nc))
            return False
        elif player == 'O':
            if self.height == 0:
                return False
            visited = set()
            stack = []
            for c in range(self.width):
                if self.board[0][c] == player:
                    if (0, c) not in visited:
                        visited.add((0, c))
                        stack.append((0, c))
            while stack:
                cur_r, cur_c = stack.pop()
                if cur_r == self.height - 1:
                    return True
                for nr, nc in self._neighbors(cur_r, cur_c):
                    if 0 <= nr < self.height and 0 <= nc < self.width:
                        if (nr, nc) not in visited and self.board[nr][nc] == player:
                            visited.add((nr, nc))
                            stack.append((nr, nc))
            return False
        return False

    def _neighbors(self, r, c):
        return [
            (r - 1, c),
            (r - 1, c + 1),
            (r, c - 1),
            (r, c + 1),
            (r + 1, c - 1),
            (r + 1, c),
        ]
