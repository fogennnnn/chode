class School:
    def __init__(self):
        self._added_results = []
        self._student_to_grade = {}
        self._students_by_grade = {}

    def add_student(self, name, grade):
        if name in self._student_to_grade:
            self._added_results.append(False)
            return False
        self._student_to_grade[name] = grade
        if grade not in self._students_by_grade:
            self._students_by_grade[grade] = []
        self._students_by_grade[grade].append(name)
        self._students_by_grade[grade].sort()
        self._added_results.append(True)
        return True

    def roster(self):
        result = []
        for grade_num in sorted(self._students_by_grade.keys()):
            result.extend(self._students_by_grade[grade_num])
        return result

    def grade(self, grade_number):
        if grade_number not in self._students_by_grade:
            return []
        return list(self._students_by_grade[grade_number])

    def added(self):
        return self._added_results
