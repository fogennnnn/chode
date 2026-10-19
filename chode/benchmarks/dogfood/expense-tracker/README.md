# Known failing expense benchmark

Portable Chode-generated baseline, not a finished example. Run `node acceptance.cjs` here. Expected: basic add/list/summary pass, five validation/CSV/corrupt-storage checks fail (impossible dates, malformed amounts, missing categories, safe CSV and corrupt storage), exit 1. Tests use disposable temporary data.

Repair through Chode:

```sh
node ../../../chode.js ai --free --check acceptance.cjs "Repair expense.cjs until acceptance.cjs passes. Explicitly declare create/overwrite expense.cjs in the plan if replacing it. Preserve acceptance.cjs unchanged. Verify actual behavior before claiming completion."
```

Also run `node --check expense.cjs`. The acceptance digest is protected during a run; some assertion failures omit child stderr. A background job launch is not evidence of passing a test.
