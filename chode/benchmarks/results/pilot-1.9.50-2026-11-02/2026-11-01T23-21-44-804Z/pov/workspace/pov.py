from json import dumps


class Tree:
    def __init__(self, label, children=None):
        self.label = label
        self.children = children if children is not None else []

    def __dict__(self):
        return {self.label: [c.__dict__() for c in sorted(self.children)]}

    def __str__(self, indent=None):
        return dumps(self.__dict__(), indent=indent)

    def __lt__(self, other):
        return self.label < other.label

    def __eq__(self, other):
        return self.__dict__() == other.__dict__()

    def from_pov(self, from_node):
        # Index every node by label and remember each node's original parent.
        nodes = {}
        parents = {}

        def index(node, parent):
            nodes[node.label] = node
            parents[node.label] = parent.label if parent is not None else None
            for child in node.children:
                index(child, node)

        index(self, None)

        if from_node not in nodes:
            raise ValueError("unknown node: {!r}".format(from_node))

        # Re-root: a node's children are all its original neighbours
        # (original children plus original parent) except the node we came from.
        def build(label, parent_label):
            node = nodes[label]
            children = []
            for child in node.children:
                if child.label != parent_label:
                    children.append(build(child.label, label))
            parent = parents[label]
            if parent is not None and parent != parent_label:
                children.append(build(parent, label))
            children.sort()
            return Tree(label, children)

        return build(from_node, None)

    def path_to(self, from_node, to_node):
        tree = self.from_pov(from_node)

        def find(node, target, path):
            if node.label == target:
                return path + [node.label]
            for child in node.children:
                found = find(child, target, path + [node.label])
                if found is not None:
                    return found
            return None

        return find(tree, to_node, [])
