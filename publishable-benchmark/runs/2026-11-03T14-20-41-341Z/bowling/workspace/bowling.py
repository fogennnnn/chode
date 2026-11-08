class BowlingGame:
    def __init__(self):
        self.rolls = []

    def roll(self, pins):
        if pins < 0 or pins > 10:
            raise ValueError('Invalid pin count')
        self.rolls.append(pins)

    def score(self):
        return sum(self.rolls)
