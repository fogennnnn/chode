class InputCell:
    def __init__(self, initial_value):
        self._value = initial_value
        self._dependents = []
        self.callbacks = []
        self._firing_callbacks = False
        self._callbacks_to_remove = set()

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, new_value):
        if self._value == new_value:
            return
        old_value = self._value
        self._value = new_value
        self._propagate()

    def _propagate(self):
        # Get all cells that need updating in topological order
        visited = set()
        to_visit = []
        # Start with dependents
        for dep in self._dependents:
            if dep not in visited:
                to_visit.append(dep)
        
        # BFS to get all transitive dependents
        order = []
        # Track in-degree for topological sort
        in_degree = {}
        all_cells = set()
        
        # Find all affected cells
        queue = list(self._dependents)
        all_cells.update(self._dependents)
        i = 0
        while i < len(queue):
            cell = queue[i]
            i += 1
            for dep in getattr(cell, '_dependents', []):
                if dep not in all_cells:
                    all_cells.add(dep)
                    queue.append(dep)
        
        # Compute in-degrees (number of dependencies that are in all_cells)
        for cell in all_cells:
            in_degree[cell] = 0
            for inp in getattr(cell, '_inputs', []):
                if inp in all_cells:
                    in_degree[cell] += 1
        
        # Start with cells that have in-degree 0 (only depend on cells outside affected set or direct dependents)
        from collections import deque
        start = deque()
        for cell in all_cells:
            if in_degree.get(cell, 0) == 0:
                start.append(cell)
        
        # If no cells have in-degree 0, it means there are cycles? But problem states DAG-like structure
        # Just process in BFS order from dependents
        if not start:
            start = deque(queue)
        
        # Topological sort
        result = []
        while start:
            if len(start) > 1:
                pass  # any order is fine as long as dependencies processed first
            cell = start.popleft()
            result.append(cell)
            for dep in getattr(cell, '_dependents', []):
                if dep in all_cells:
                    in_degree[dep] -= 1
                    if in_degree[dep] == 0:
                        start.append(dep)
        
        # Update cells in order
        for cell in result:
            if isinstance(cell, ComputeCell):
                cell._update()

    def add_callback(self, callback):
        if callback not in self.callbacks:
            self.callbacks.append(callback)

    def remove_callback(self, callback):
        if self._firing_callbacks:
            self._callbacks_to_remove.add(callback)
        else:
            if callback in self.callbacks:
                self.callbacks.remove(callback)


class ComputeCell:
    def __init__(self, inputs, compute_function):
        self._inputs = inputs
        self._compute_function = compute_function
        self._value = None
        self._dependents = []
        self.callbacks = []
        self._firing_callbacks = False
        self._callbacks_to_remove = set()
        # Register this cell as dependent on inputs
        for inp in inputs:
            inp._dependents.append(self)
        # Compute initial value
        self._update()

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, new_value):
        # Compute cells are not settable
        raise Exception

    def _update(self):
        # Compute new value
        input_values = [inp.value for inp in self._inputs]
        new_value = self._compute_function(input_values)
        if new_value != self._value:
            old_value = self._value
            self._value = new_value
            # Fire callbacks if value changed
            self._fire_callbacks(new_value)
            # Propagate to dependents
            self._propagate()
        else:
            self._value = new_value
            # Even if value same, still need to propagate? Tests say callbacks only fire if changed
            # But structure might need propagation - let us check
            self._propagate()

    def _fire_callbacks(self, value):
        self._firing_callbacks = True
        # Make a copy of callbacks to iterate over
        callbacks_to_call = []
        for cb in self.callbacks:
            if cb not in self._callbacks_to_remove:
                callbacks_to_call.append(cb)
        for cb in callbacks_to_call:
            cb(value)
        self._firing_callbacks = False
        # Remove callbacks that were marked for removal
        for cb in self._callbacks_to_remove:
            if cb in self.callbacks:
                self.callbacks.remove(cb)
        self._callbacks_to_remove.clear()

    def _propagate(self):
        visited = set()
        queue = list(self._dependents)
        all_cells = set()
        all_cells.update(self._dependents)
        i = 0
        while i < len(queue):
            cell = queue[i]
            i += 1
            for dep in getattr(cell, '_dependents', []):
                if dep not in all_cells:
                    all_cells.add(dep)
                    queue.append(dep)
        
        in_degree = {}
        for cell in all_cells:
            in_degree[cell] = 0
            for inp in getattr(cell, '_inputs', []):
                if inp in all_cells:
                    in_degree[cell] += 1
        
        from collections import deque
        start = deque()
        for cell in all_cells:
            if in_degree.get(cell, 0) == 0:
                start.append(cell)
        if not start:
            start = deque(queue)
        
        result = []
        in_degree_copy = dict(in_degree)
        while start:
            cell = start.popleft()
            result.append(cell)
            for dep in getattr(cell, '_dependents', []):
                if dep in all_cells:
                    in_degree_copy[dep] -= 1
                    if in_degree_copy[dep] == 0:
                        start.append(dep)
        
        for cell in result:
            if isinstance(cell, ComputeCell):
                cell._update()

    def add_callback(self, callback):
        if callback not in self.callbacks:
            self.callbacks.append(callback)

    def remove_callback(self, callback):
        if self._firing_callbacks:
            self._callbacks_to_remove.add(callback)
        else:
            if callback in self.callbacks:
                self.callbacks.remove(callback)
