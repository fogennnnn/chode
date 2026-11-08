import json


class RestAPI:
    def __init__(self, database=None):
        self.database = database if database is not None else {"users": []}
        # Normalize users into a dict keyed by name for easy lookup
        self.users = {}
        if "users" in self.database:
            for user in self.database["users"]:
                name = user["name"]
                self.users[name] = {
                    "name": name,
                    "owes": dict(user.get("owes", {})),
                    "owed_by": dict(user.get("owed_by", {})),
                    "balance": float(user.get("balance", 0.0)),
                }

    def _user_to_dict(self, user):
        return {
            "name": user["name"],
            "owes": user["owes"],
            "owed_by": user["owed_by"],
            "balance": float(user["balance"]),
        }

    def _recalculate_balance(self, user):
        total_owed_by = sum(user["owed_by"].values())
        total_owes = sum(user["owes"].values())
        user["balance"] = float(total_owed_by - total_owes)

    def get(self, url, payload=None):
        if url == "/users":
            if payload is None:
                # Return all users sorted by name
                result = []
                for name in sorted(self.users.keys()):
                    result.append(self._user_to_dict(self.users[name]))
                return json.dumps({"users": result})
            else:
                data = json.loads(payload) if payload is not None else {}
                user_names = data.get("users", [])
                result = []
                for name in sorted(user_names):
                    if name in self.users:
                        result.append(self._user_to_dict(self.users[name]))
                return json.dumps({"users": result})
        return json.dumps({})

    def post(self, url, payload=None):
        if url == "/add":
            data = json.loads(payload) if payload is not None else {}
            name = data["user"]
            if name not in self.users:
                self.users[name] = {
                    "name": name,
                    "owes": {},
                    "owed_by": {},
                    "balance": 0.0,
                }
            return json.dumps(self._user_to_dict(self.users[name]))
        elif url == "/iou":
            data = json.loads(payload) if payload is not None else {}
            lender = data["lender"]
            borrower = data["borrower"]
            amount = float(data["amount"])
            # Ensure both users exist
            if lender not in self.users:
                self.users[lender] = {"name": lender, "owes": {}, "owed_by": {}, "balance": 0.0}
            if borrower not in self.users:
                self.users[borrower] = {"name": borrower, "owes": {}, "owed_by": {}, "balance": 0.0}
            # Process IOU: lender gives money to borrower
            # Check if borrower owes lender (borrower.owes has lender)
            borrower_owes_lender = self.users[borrower]["owes"].get(lender, 0.0)
            if borrower_owes_lender > 0:
                if amount < borrower_owes_lender:
                    # Reduce borrower's debt to lender
                    new_amount = borrower_owes_lender - amount
                    self.users[borrower]["owes"][lender] = new_amount
                    self.users[lender]["owed_by"][borrower] = new_amount
                    # Remove if zero
                    if self.users[borrower]["owes"][lender] == 0:
                        del self.users[borrower]["owes"][lender]
                    if self.users[lender]["owed_by"].get(borrower) == 0:
                        if borrower in self.users[lender]["owed_by"]:
                            del self.users[lender]["owed_by"][borrower]
                elif amount == borrower_owes_lender:
                    # Cancel out completely
                    if lender in self.users[borrower]["owes"]:
                        del self.users[borrower]["owes"][lender]
                    if borrower in self.users[lender]["owed_by"]:
                        del self.users[lender]["owed_by"][borrower]
                else:  # amount > borrower_owes_lender
                    # Pay off borrower's debt to lender, remainder flips
                    remainder = amount - borrower_owes_lender
                    if lender in self.users[borrower]["owes"]:
                        del self.users[borrower]["owes"][lender]
                    if borrower in self.users[lender]["owed_by"]:
                        del self.users[lender]["owed_by"][borrower]
                    # Now lender is owed by borrower for remainder
                    self.users[lender]["owed_by"][borrower] = remainder
                    self.users[borrower]["owes"][lender] = remainder
            else:
                # No existing debt from borrower to lender, or lender owes borrower
                lender_owes_borrower = self.users[lender]["owes"].get(borrower, 0.0)
                if lender_owes_borrower > 0:
                    if amount < lender_owes_borrower:
                        new_amount = lender_owes_borrower - amount
                        self.users[lender]["owes"][borrower] = new_amount
                        self.users[borrower]["owed_by"][lender] = new_amount
                        if self.users[lender]["owes"][borrower] == 0:
                            del self.users[lender]["owes"][borrower]
                        if self.users[borrower]["owed_by"].get(lender) == 0:
                            if lender in self.users[borrower]["owed_by"]:
                                del self.users[borrower]["owed_by"][lender]
                    elif amount == lender_owes_borrower:
                        if borrower in self.users[lender]["owes"]:
                            del self.users[lender]["owes"][borrower]
                        if lender in self.users[borrower]["owed_by"]:
                            del self.users[borrower]["owed_by"][lender]
                    else:  # amount > lender_owes_borrower
                        remainder = amount - lender_owes_borrower
                        if borrower in self.users[lender]["owes"]:
                            del self.users[lender]["owes"][borrower]
                        if lender in self.users[borrower]["owed_by"]:
                            del self.users[borrower]["owed_by"][lender]
                        # Now lender is owed by borrower
                        self.users[lender]["owed_by"][borrower] = remainder
                        self.users[borrower]["owes"][lender] = remainder
                else:
                    # No existing debt between them, lender lends to borrower
                    # lender is owed by borrower
                    self.users[lender]["owed_by"][borrower] = self.users[lender]["owed_by"].get(borrower, 0.0) + amount
                    self.users[borrower]["owes"][lender] = self.users[borrower]["owes"].get(lender, 0.0) + amount
            # Recalculate balances
            self._recalculate_balance(self.users[lender])
            self._recalculate_balance(self.users[borrower])
            result = []
            for name in sorted([lender, borrower]):
                result.append(self._user_to_dict(self.users[name]))
            return json.dumps({"users": result})
        return json.dumps({})
