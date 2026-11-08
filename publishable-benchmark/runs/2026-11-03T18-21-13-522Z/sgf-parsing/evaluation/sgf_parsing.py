class SgfTree:
    def __init__(self, properties=None, children=None):
        self.properties = properties or {}
        self.children = children or []

    def __eq__(self, other):
        if not isinstance(other, SgfTree):
            return False
        if self.properties.keys() != other.properties.keys():
            return False
        for key, value in self.properties.items():
            if other.properties[key] != value:
                return False
        if len(self.children) != len(other.children):
            return False
        for child, other_child in zip(self.children, other.children):
            if child != other_child:
                return False
        return True

    def __ne__(self, other):
        return not self == other


def parse(input_string):
    if not input_string:
        raise ValueError("tree missing")
    
    parser = SgfParser(input_string)
    return parser.parse()


class SgfParser:
    def __init__(self, text):
        self.text = text
        self.pos = 0
    
    def parse(self):
        self.skip_whitespace()
        if self.pos >= len(self.text):
            raise ValueError("tree missing")
        if self.text[self.pos] != '(':
            raise ValueError("tree missing")
        
        tree = self.parse_tree()
        self.skip_whitespace()
        if self.pos < len(self.text):
            raise ValueError("tree missing")
        return tree
    
    def parse_tree(self):
        self.consume('(')
        self.skip_whitespace()
        
        if self.pos >= len(self.text) or self.text[self.pos] != ';':
            raise ValueError("tree with no nodes")
        
        node = self.parse_node()
        
        children = []
        self.skip_whitespace()
        while self.pos < len(self.text) and self.text[self.pos] == '(':
            children.append(self.parse_tree())
            self.skip_whitespace()
        
        node.children = children
        return node
    
    def parse_node(self):
        self.consume(';')
        properties = {}
        
        while self.pos < len(self.text):
            self.skip_whitespace()
            if self.pos >= len(self.text):
                break
            ch = self.text[self.pos]
            if ch in '();[':
                if ch == '[':
                    raise ValueError("properties without delimiter")
                break
            
            key = self.parse_property_key()
            values = self.parse_property_values()
            properties[key] = values
        
        return SgfTree(properties=properties, children=[])
    
    def parse_property_key(self):
        start = self.pos
        while self.pos < len(self.text) and self.text[self.pos].isalpha():
            self.pos += 1
        
        key = self.text[start:self.pos]
        if not key:
            raise ValueError("properties without delimiter")
        if not key.isupper():
            raise ValueError("property must be in uppercase")
        
        return key
    
    def parse_property_values(self):
        values = []
        while self.pos < len(self.text) and self.text[self.pos] == '[':
            values.append(self.parse_property_value())
        
        if not values:
            raise ValueError("properties without delimiter")
        
        return values
    
    def parse_property_value(self):
        self.consume('[')
        value_chars = []
        
        while self.pos < len(self.text):
            ch = self.text[self.pos]
            if ch == '\\':
                self.pos += 1
                if self.pos >= len(self.text):
                    raise ValueError("properties without delimiter")
                next_ch = self.text[self.pos]
                if next_ch == '\n':
                    # Escaped newline is removed
                    self.pos += 1
                elif next_ch.isspace():
                    # Any whitespace char after \ follows the rules
                    # If it's \t, convert to space; other whitespace becomes space
                    # But \n was handled above
                    if next_ch == '\t':
                        value_chars.append(' ')
                    else:
                        value_chars.append(' ')
                    self.pos += 1
                else:
                    # Any non-whitespace character after \ is inserted as-is
                    value_chars.append(next_ch)
                    self.pos += 1
            elif ch == ']':
                self.pos += 1
                break
            elif ch == '\t':
                value_chars.append(' ')
                self.pos += 1
            elif ch == '\n':
                # Newline not escaped remains as newline
                value_chars.append(ch)
                self.pos += 1
            elif ch.isspace() and ch != '\n':
                value_chars.append(' ')
                self.pos += 1
            else:
                value_chars.append(ch)
                self.pos += 1
        
        return ''.join(value_chars)
    
    def skip_whitespace(self):
        while self.pos < len(self.text) and self.text[self.pos] in ' \t\n\r':
            self.pos += 1
    
    def consume(self, expected):
        if self.pos >= len(self.text) or self.text[self.pos] != expected:
            raise ValueError("tree missing")
        self.pos += 1
