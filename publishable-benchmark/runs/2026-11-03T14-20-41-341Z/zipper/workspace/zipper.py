class Zipper:
    def __init__(self, focus, path=None):
        self.focus = focus
        self.path = path if path is not None else []

    @staticmethod
    def from_tree(tree):
        return Zipper(tree, [])

    def value(self):
        return self.focus['value']

    def set_value(self, value):
        new_focus = dict(self.focus)
        new_focus['value'] = value
        return Zipper(new_focus, self.path)

    def left(self):
        if self.focus.get('left') is None:
            return None
        crumb = (self.focus, 'left', self.focus.get('right'))
        new_focus = self.focus['left']
        return Zipper(new_focus, self.path + [crumb])

    def set_left(self, subtree):
        new_focus = dict(self.focus)
        new_focus['left'] = subtree
        return Zipper(new_focus, self.path)

    def right(self):
        if self.focus.get('right') is None:
            return None
        crumb = (self.focus, 'right', self.focus.get('left'))
        new_focus = self.focus['right']
        return Zipper(new_focus, self.path + [crumb])

    def set_right(self, subtree):
        new_focus = dict(self.focus)
        new_focus['right'] = subtree
        return Zipper(new_focus, self.path)

    def up(self):
        if not self.path:
            return None
        parent, direction, sibling = self.path[-1]
        new_path = self.path[:-1]
        if direction == 'left':
            new_parent = dict(parent)
            new_parent['left'] = self.focus
            new_parent['right'] = sibling
        else:
            new_parent = dict(parent)
            new_parent['right'] = self.focus
            new_parent['left'] = sibling
        return Zipper(new_parent, new_path)

    def to_tree(self):
        z = self
        while z.path:
            z = z.up()
            if z is None:
                break
        if z is None:
            return self.focus
        return z.focus
