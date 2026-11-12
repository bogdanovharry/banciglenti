# Customer accounts

A shopper can register, log in, keep their details, invoice data, addresses and
machines, and see the orders they placed while logged in. Guest checkout is
unchanged.

## Decisions

- **A collection of its own (`accounts`)**, not a login on `customers`.
  `customers` is the workshop's record, keyed by e-mail and created from checkout.
  Until an address is verified, anyone can register an e-mail that is not theirs;
  attaching that registration to an existing customer would hand a stranger the
  customer's orders. An account has only what it was created with and the orders
  placed while it was logged in (`orders.account`). **Never match on e-mail.**
- **Own cookie, `sm_account`**, not `payload-token`, so a staff member who tries
  the shop does not lose their admin session. The login is Payload's (hashed
  password, lock after 8 failures for 15 minutes, a session id in the token).
- **Payload's REST is closed for accounts** (create/update refused, read is staff
  only). Everything goes through `/api/account/*`, which re-reads the session on
  the server — the id to change is never taken from the request.
- Registration, login, password change and deletion are rate limited per address;
  every write route checks `Origin` and only takes JSON.
- Deleting a profile keeps its orders (`orders.account_id` is `ON DELETE SET NULL`).
- Password: 10 to 128 characters.

## Not done yet (needs e-mail, which neither shop has: no RESEND_API_KEY / EMAIL_FROM)

- E-mail verification, "forgot password", and claiming orders made before the
  account existed. Until then a forgotten password is reset by staff, and the
  account page says it shows orders made while logged in.
- Bulgaria only: moving profiles over from the old shop. The other markets start clean.

## Rolling out

`src/migrations/20261112_150000_accounts.ts` is additive only (new tables, one
nullable column on `orders`). **Apply it to a database before deploying the code
that reads `orders.account_id`**: Payload selects every column, so an order query
fails until the column exists. The old code ignores the new tables, so applying it
first is safe.
