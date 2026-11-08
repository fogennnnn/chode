import re

class PhoneNumber:
    def __init__(self, number):
        
        class PhoneNumber:
            def __init__(self, number):
                self.number = self._validate_and_clean(number)
            
            def _validate_and_clean(self, number):
                # Remove all non-digit characters except the leading '1'
                digits = re.sub(r'[^\d]', '', number)
                
                # Handle country code
                if len(digits) == 11 and digits.startswith('1'):
                    digits = digits[1:]
                
                # Validate length
                if len(digits) != 10:
                    raise ValueError("must be 10 digits")
                
                # Validate area code and exchange code
                if digits[0] == '0' or digits[0] == '1':
                    raise ValueError("area code cannot start with zero or one")
                if digits[3] == '0' or digits[3] == '1':
                    raise ValueError("exchange code cannot start with zero or one")
                
                return digits

    def __init__(self, number):
        self.number = self._validate_and_clean(number)
    
    def _validate_and_clean(self, number):
        # Remove all non-digit characters except the leading '1'
        digits = re.sub(r'[^\d]', '', number)
        
        # Handle country code
        if len(digits) == 11 and digits.startswith('1'):
            digits = digits[1:]
        
        # Validate length
        if len(digits) != 10:
            raise ValueError("must be 10 digits")
        
        # Validate area code and exchange code
        if digits[0] == '0' or digits[0] == '1':
            raise ValueError("area code cannot start with zero or one")
        if digits[3] == '0' or digits[3] == '1':
            raise ValueError("exchange code cannot start with zero or one")
        
        return digits
