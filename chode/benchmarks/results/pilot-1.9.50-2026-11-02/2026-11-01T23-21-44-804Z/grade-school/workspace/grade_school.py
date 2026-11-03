class School:
    def __init__(self):
        self._by_grade = {}
        self._added_students = []

    def add_student(self, name, grade):
        """Add a student to a grade.

        Returns True when the student was added, False when the student is
        already enrolled in the roster (a student may only appear once).
        """
        for students in self._by_grade.values():
            if name in students:
                return False
        self._by_grade.setdefault(grade, set()).add(name)
        self._added_students.append(name)
        return True

    def roster(self):
        """All students sorted by grade (1, 2, 3...) then name alphabetically."""
        result = []
        for grade in sorted(self._by_grade):
            for name in sorted(self._by_grade[grade]):
                result.append((name, grade))
        return result

    def grade(self, grade_number):
        """Students enrolled in a grade, sorted alphabetically."""
        return sorted(self._by_grade.get(grade_number, []))

    def added(self):
        """Names of students successfully added, in order of addition."""
        return list(self._added_students)
