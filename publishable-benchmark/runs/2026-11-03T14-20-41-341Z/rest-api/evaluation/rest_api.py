import json


class RestAPI:
    def __init__(self, database=None):
        if database is None:
            database = {"users": []}
        self.database = database
        # Normalize into dict
        self.users = {}
        for user in self.database.get("users", []):
            name = user["name"]
            self.users[name] = {
                "name": name,
                "owes": dict(user.get("owes", {})),
                "owed_by": dict(user.get("owed_by", {})),
                "balance": float(user.get("balance", 0.0)),
            }

    def _recalculate_balance(self, name):
        user = self.users[name]
        total_owed_by = sum(user["owed_by"].values())
        total_owes = sum(user["owes"].values())
        user["balance"] = float(total_owed_by) - float(total_owes)

    def _user_to_dict(self, name):
        user = self.users[name]
        self._recalculate_balance(name)
        return {
            "name": user["name"],
            "owes": dict(user["owes"]),
            "owed_by": dict(user["owed_by"]),
            "balance": float(user["balance"]),
        }

    def get(self, url, payload=None):
        if url == "/users":
            if payload is None:
                # Return all users sorted by name
                result = [self._user_to_dict(name) for name in sorted(self.users.keys())]
                return json.dumps({"users": result})
            else:
                data = json.loads(payload)
                requested = data.get("users", [])
                result = [self._user_to_dict(name) for name in sorted(requested)]
                return json.dumps({"users": result})
        return json.dumps({})

    def post(self, url, payload=None):
        if url == "/add":
            data = json.loads(payload)
            name = data["user"]
            if name not in self.users:
                self.users[name] = {
                    "name": name,
                    "owes": {},
                    "owed_by": {},
                    "balance": 0.0,
                }
            return json.dumps(self._user_to_dict(name))
        elif url == "/iou":
            data = json.loads(payload)
            lender = data["lender"]
            borrower = data["borrower"]
            amount = float(data["amount"])
            # Process IOU with netting as per tests
            self._process_iou(lender, borrower, amount)
            # Return updated users sorted by name
            result = [self._user_to_dict(name) for name in sorted([lender, borrower])]
            return json.dumps({"users": result})
        return json.dumps({})

    def _process_iou(self, lender, borrower, amount):
        # If borrower owes lender, we net it
        if borrower in self.users[lender]["owes"] and self.users[lender]["owes"][borrower] > 0:
            borrower_owes_lender = self.users[lender]["owes"][borrower]
            if amount < borrower_owes_lender:
                # Reduce what borrower owes lender
                self.users[lender]["owes"][borrower] = borrower_owes_lender - amount
                self.users[borrower]["owed_by"][lender] = borrower_owes_lender - amount
                self._recalculate_balance(lender)
                self._recalculate_balance(borrower)
                return
            elif amount == borrower_owes_lender:
                # They cancel out
                del self.users[lender]["owes"][borrower]
                del self.users[borrower]["owed_by"][lender]
                self._recalculate_balance(lender)
                self._recalculate_balance(borrower)
                return
            else:
                # amount > borrower_owes_lender, cancel existing debt and lender becomes borrower of remainder
                del self.users[lender]["owes"][borrower]
                del self.users[borrower]["owed_by"][lender]
                remainder = amount - borrower_owes_lender
                # Now lender owes borrower remainder
                self.users[borrower]["owes"][lender] = self.users[borrower]["owes"].get(lender, 0.0) + remainder
                self.users[lender]["owed_by"][borrower] = self.users[lender]["owed_by"].get(borrower, 0.0) + remainder
                self._recalculate_balance(lender)
                self._recalculate_balance(borrower)
                return
        # Otherwise, lender lends to borrower (borrower owes lender)
        self.users[borrower]["owes"][lender] = self.users[borrower]["owes"].get(lender, 0.0) + amount
        self.users[lender]["owed_by"][borrower] = self.users[lender]["owed_by"].get(borrower, 0.0) + amount
        self._recalculate_balance(lender)
        self._recalculate_balance(borrower)
