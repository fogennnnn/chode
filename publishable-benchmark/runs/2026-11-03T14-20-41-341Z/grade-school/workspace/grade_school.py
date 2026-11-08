class School:
    def __init__(self):
        self._students_by_grade = {}
        self._added_results = []
        self._all_students = set()

    def add_student(self, name, grade):
        if name in self._all_students:
            self._added_results.append(False)
            return False
        if grade not in self._students_by_grade:
            self._students_by_grade[grade] = []
        if name in self._students_by_grade[grade]:
            self._added_results.append(False)
            return False
        self._students_by_grade[grade].append(name)
        self._all_students.add(name)
        self._added_results.append(True)
        return True

    def roster(self):
        result = []
        for grade_num in sorted(self._students_by_grade.keys()):
            for name in sorted(self._students_by_grade[grade_num]):
                result.append(name)
        return result

    def grade(self, grade_number):
        if grade_number not in self._students_by_grade:
            return []
        return sorted(self._students_by_grade[grade_number])

    def added(self):
        return self._added_results
