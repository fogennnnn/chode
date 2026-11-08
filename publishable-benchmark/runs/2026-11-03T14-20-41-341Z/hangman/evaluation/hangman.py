# Game status categories
# Change the values as you see fit
STATUS_WIN = 'win'
STATUS_LOSE = 'lose'
STATUS_ONGOING = 'ongoing'


from rx.subject import Subject
from rx import operators as ops

class Hangman:
    def __init__(self, word):
        self.word = word
        self.remaining_guesses = 9
        self.status = STATUS_ONGOING
        self.guessed_letters = set()
        self.guess_stream = Subject()
        self.guess_stream.pipe(
            ops.distinct(),
            ops.map(lambda char: char not in self.word),
            ops.scan(lambda acc, x: acc - 1 if x else acc, self.remaining_guesses)
        ).subscribe(lambda x: setattr(self, 'remaining_guesses', x))

    def guess(self, char):
        if self.status != STATUS_ONGOING:
            raise ValueError("The game has already ended.")
        self.guess_stream.on_next(char)
        if self.remaining_guesses <= 0:
            self.status = STATUS_LOSE
        if all(letter in self.guessed_letters for letter in self.word):
            self.status = STATUS_WIN

    def get_masked_word(self):
        return ''.join([letter if letter in self.guessed_letters else '_' for letter in self.word])

    def get_status(self):
        return self.status
    def __init__(self, word):
        self.word = word
        self.remaining_guesses = 9
        self.status = STATUS_ONGOING
        self.guessed_letters = set()

    def guess(self, char):
        if self.status != STATUS_ONGOING:
            raise ValueError("The game has already ended.")
        self.guessed_letters.add(char)
        if char not in self.word:
            self.remaining_guesses -= 1
        if self.remaining_guesses <= 0:
            self.status = STATUS_LOSE
        if all(letter in self.guessed_letters for letter in self.word):
            self.status = STATUS_WIN

    def get_masked_word(self):
        return ''.join([letter if letter in self.guessed_letters else '_' for letter in self.word])

    def get_status(self):
        return self.status
        pass

    def get_masked_word(self):
        pass

    def get_status(self):
        pass
