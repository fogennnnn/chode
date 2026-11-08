class PhoneNumber:
    def __init__(self, number):
        original_str = str(number)

        # Check for letters first
        for char in original_str:
            if char.isalpha():
                raise ValueError("letters not permitted")

        # Check for invalid punctuations/symbols
        allowed = set('0123456789 ()-+.,')
        for char in original_str:
            if char.isdigit():
                continue
            if char.isspace():
                continue
            if char in '()-+.,':
                continue
            # anything else
            raise ValueError("punctuations not permitted")

        original = ''.join(char for char in original_str if char.isdigit())

        if len(original) < 10:
            raise ValueError('must not be fewer than 10 digits')
        elif len(original) > 11:
            raise ValueError('must not be greater than 11 digits')
        elif len(original) == 11 and original[0] != '1':
            raise ValueError('11 digits must start with 1')
        elif len(original) == 11:
            original = original[1:]

        if len(original) != 10:
            raise ValueError('must not be fewer than 10 digits')

        area_code = original[0:3]
        exchange_code = original[3:6]

        if area_code[0] == '0':
            raise ValueError('area code cannot start with zero')
        if area_code[0] == '1':
            raise ValueError('area code cannot start with one')
        if exchange_code[0] == '0':
            raise ValueError('exchange code cannot start with zero')
        if exchange_code[0] == '1':
            raise ValueError('exchange code cannot start with one')

        self.number = original
        self.area_code = area_code

    def pretty(self):
        return f'({self.area_code})-{self.number[3:6]}-{self.number[6:10]}'