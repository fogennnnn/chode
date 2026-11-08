NODE, EDGE, ATTR = range(3)


class Node:
    def __init__(self, name, attrs):
        self.name = name
        self.attrs = attrs

    def __eq__(self, other):
        if not isinstance(other, Node):
            return False
        return self.name == other.name and self.attrs == other.attrs


class Edge:
    def __init__(self, src, dst, attrs):
        self.src = src
        self.dst = dst
        self.attrs = attrs

    def __eq__(self, other):
        if not isinstance(other, Edge):
            return False
        return self.src == other.src and self.dst == other.dst and self.attrs == other.attrs


class Graph:
    def __init__(self, data=None):
        self.nodes = []
        self.edges = []
        self.attrs = {}
        if data is None:
            return
        if not isinstance(data, (list, tuple)):
            raise TypeError("Graph data malformed")
        for item in data:
            if not isinstance(item, (list, tuple)) or len(item) == 0:
                raise TypeError("Graph item incomplete")
            if len(item) == 1:
                raise TypeError("Graph item incomplete")
            kind = item[0]
            if kind not in (NODE, EDGE, ATTR):
                raise ValueError("Unknown item")
            if kind == ATTR:
                if len(item) != 3:
                    raise ValueError("Attribute is malformed")
                _, key, value = item
                self.attrs[key] = value
            elif kind == NODE:
                if len(item) != 3:
                    raise ValueError("Node is malformed")
                _, name, attrs = item
                self.nodes.append(Node(name, attrs))
            elif kind == EDGE:
                if len(item) != 4:
                    raise ValueError("Edge is malformed")
                _, src, dst, attrs = item
                self.edges.append(Edge(src, dst, attrs))
