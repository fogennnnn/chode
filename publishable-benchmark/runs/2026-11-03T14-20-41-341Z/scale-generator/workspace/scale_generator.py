class Scale:
    def __init__(self, tonic):
        self.scale = self.CHROMATIC_SHARPS if self.tonic in self.SHARP_KEYS else self.CHROMATIC_FLATS
        self.scale = [note for note in self.scale if note[0] == self.tonic[0]]
        if not self.scale:
            self.scale = self.CHROMATIC_FLATS if self.tonic in self.FLAT_KEYS else self.CHROMATIC_SHARPS
        self.scale = [note for note in self.scale if note[0] == self.tonic[0]]
        self.scale = self.scale[0] + self.scale[1:]

    def chromatic(self):
        index = self.scale.index(self.tonic)
        return self.scale[index:] + self.scale[:index]
        self.scale = self.CHROMATIC_SHARPS if self.tonic in self.SHARP_KEYS else self.CHROMATIC_FLATS
        self.scale = [note for note in self.scale if note[0] == self.tonic[0]]
        if not self.scale:
            self.scale = self.CHROMATIC_FLATS if self.tonic in self.FLAT_KEYS else self.CHROMATIC_SHARPS
        self.scale = [note for note in self.scale if note[0] == self.tonic[0]]
        self.scale = self.scale[0] + self.scale[1:]

    def interval(self, intervals):
        self.scale = self.CHROMATIC_SHARPS if self.tonic in self.SHARP_KEYS else self.CHROMATIC_FLATS
        self.scale = [note for note in self.scale if note[0] == self.tonic[0]]
        if not self.scale:
            self.scale = self.CHROMATIC_FLATS if self.tonic in self.FLAT_KEYS else self.CHROMATIC_SHARPS
        self.scale = [note for note in self.scale if note[0] == self.tonic[0]]
        self.scale = self.scale[0] + self.scale[1:]
