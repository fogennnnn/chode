class EmptyListException(Exception):
    pass

class Node:
    def __init__(self, value, next=None):
        self._value = value
        self._next = next

    @property
    def value(self):
        return self._value

    @property
    def next(self):
        return self._next

    @next.setter
    def next(self, next_node):
        self._next = next_node

    @value.setter
    def value(self, value):
        self._value = value

class LinkedList:
    def __init__(self, values=None):
        self.head = None
        if values:
            for value in reversed(values):
                self.push(value)

    def __iter__(self):
        current = self.head
        while current:
            yield current.value
            current = current.next

    def __len__(self):
        count = 0
        current = self.head
        while current:
            count += 1
            current = current.next
        return count

    def head(self):
        if self.is_empty():
            raise EmptyListException("The list is empty.")
        return self.head

    def push(self, value):
        new_node = Node(value, self.head)
        self.head = new_node

    def pop(self):
        if self.is_empty():
            raise EmptyListException("The list is empty.")
        value = self.head.value
        self.head = self.head.next
        return value

    def reversed(self):
        previous = None
        current = self.head
        while current:
            next_node = current.next
            current.next = previous
            previous = current
            current = next_node
        self.head = previous
        return self

    def is_empty(self):
        return self.head is None


class LinkedList:
    def __init__(self, values=None):
        self.head = None
        if values:
            for value in reversed(values):
                self.push(value)

    def __iter__(self):
        current = self.head
        while current:
            yield current.value
            current = current.next

    def __len__(self):
        count = 0
        current = self.head
        while current:
            count += 1
            current = current.next
        return count

    def head(self):
        if self.is_empty():
            raise EmptyListException("The list is empty.")
        return self.head

    def push(self, value):
        new_node = Node(value, self.head)
        self.head = new_node

    def pop(self):
        if self.is_empty():
            raise EmptyListException("The list is empty.")
        value = self.head.value
        self.head = self.head.next
        return value

    def reversed(self):
        return list(reversed(list(self)))

    def is_empty(self):
        return self.head is None
