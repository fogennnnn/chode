#!/usr/bin/env python3
# Chode State Generator — Python deterministic state-ID generator
# State-ID = sha256(Parent_ID | Role | Payload)[0:12]
# Cross-runtime parity with tools/chode-state.cjs
import sys
import hashlib

def main():
    if len(sys.argv) < 4:
        print('Usage: python tools/chode-state.py <parentId> <role> "<payload>"', file=sys.stderr)
        sys.exit(1)

    parent_id = sys.argv[1]
    role = sys.argv[2]
    payload = ' '.join(sys.argv[3:])

    input_str = f'{parent_id}|{role}|{payload}'
    state_id = hashlib.sha256(input_str.encode('utf-8')).hexdigest()[:12]

    print(state_id)

if __name__ == '__main__':
    main()
