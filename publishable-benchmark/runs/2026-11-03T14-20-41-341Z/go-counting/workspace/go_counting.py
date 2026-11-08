
WHITE = 'W'
BLACK = 'B'
NONE = ''

class Board:
    WHITE = 'W'
    BLACK = 'B'
    NONE = ''

    def __init__(self, board):
        self.board = board
        self.height = len(board)
        self.width = len(board[0]) if self.height > 0 else 0

    def territory(self, x, y):
        if not self._is_valid(x, y):
            raise ValueError("Invalid coordinate")

        # Placeholder for territory calculation logic
        return NONE, set()
        """Find the owner and the territories given a coordinate on
           the board

        Args:
            x (int): Column on the board
            y (int): Row on the board

        Returns:
            (str, set): A tuple, the first element being the owner
                        of that area.  One of "W", "B", "".  The
                        second being a set of coordinates, representing
                        the owner's territories.
        """
        self.board = board
        self.height = len(board)
        self.width = len(board[0]) if self.height > 0 else 0

    def territories(self):
        """Find the owners and the territories of the whole board

        Args:
            none

        Returns:
            dict(str, set): A dictionary whose key being the owner
                        , i.e. "W", "B", "".  The value being a set
                        of coordinates owned by the owner.
        """
        self.board = board
        self.height = len(board)
        self.width = len(board[0]) if self.height > 0 else 0
