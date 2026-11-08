NODE, EDGE, ATTR = range(3)


class Node:
    def __init__(self, name, attrs=None):
        if attrs is None:
            attrs = {}
        self.name = name
        self.attrs = attrs

    def __eq__(self, other):
        if not isinstance(other, Node):
            return NotImplemented
        return self.name == other.name and self.attrs == other.attrs

    def __repr__(self):
        return f"Node({self.name!r}, {self.attrs!r})"


class Edge:
    def __init__(self, src, dst, attrs=None):
        if attrs is None:
            attrs = {}
        self.src = src
        self.dst = dst
        self.attrs = attrs

    def __eq__(self, other):
        if not isinstance(other, Edge):
            return NotImplemented
        return (self.src == other.src and
                self.dst == other.dst and
                self.attrs == other.attrs)

    def __repr__(self):
        return f"Edge({self.src!r}, {self.dst!r}, {self.attrs!r})"


class Graph:
    def __init__(self, data=None):
        if data is None:
            data = []
        if not isinstance(data, list):
            raise TypeError("Graph data malformed")
        self.nodes = []
        self.edges = []
        self.attrs = {}
        for item in data:
            if not isinstance(item, (list, tuple)) or len(item) == 0:
                raise TypeError("Graph item incomplete")
            item_type = item[0]
            if item_type == ATTR:
                if len(item) != 3:
                    if len(item) == 1:
                        raise TypeError("Graph item incomplete")
                    raise ValueError("Attribute is malformed")
                _, key, value = item
                self.attrs[key] = value
            elif item_type == NODE:
                if len(item) != 3:
                    if len(item) < 3:
                        raise TypeError("Graph item incomplete")
                    raise ValueError("Node is malformed")
                _, name, attrs = item
                self.nodes.append(Node(name, attrs))
            elif item_type == EDGE:
                if len(item) != 4:
                    if len(item) < 4:
                        raise ValueError("Edge is malformed")
                    raise ValueError("Edge is malformed")
                _, src, dst, attrs = item
                self.edges.append(Edge(src, dst, attrs))
            else:
                raise ValueError("Unknown item")
