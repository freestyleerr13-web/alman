# Saanjh Beauty Store

Static storefront plus a Node.js/Express checkout API. Razorpay Standard Checkout runs with **test credentials only**. The browser submits product IDs, quantities and checkout details; the server calculates every price, creates the Razorpay order, verifies signed payment results and receives signed webhooks. Card numbers, CVVs, UPI PINs and netbanking credentials are handled by Razorpay and are never posted to this store.

## Folder structure

```text
.
├── .env.example
├── package.json
├── public/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── checkout.html
│   ├── checkout.js
│   ├── result.html
│   ├── result.js
│   ├── admin.html
│   ├── admin.js
│   ├── shipping.html
│   ├── returns.html
│   ├── privacy.html
│   ├── terms.html
│   ├── contact.html
│   └── images/
├── server/
│   ├── server.js
│   ├── catalog.js
│   ├── validation.js
│   ├── database.js
│   └── schema.sql
└── tests/
    └── validation.test.js
```

## Run locally

Requirements: Node.js 20 or newer and npm.

1. Copy `.env.example` to `.env`. Fill in Razorpay **test-mode** key ID (`rzp_test_...`), test key secret, webhook secret, and a long unique `ADMIN_PASSWORD`. Never put these values in any file under `public/`.
2. Install dependencies: `npm install`
3. Start the local server: `npm start`
4. Open `http://localhost:3000`. SQLite is created automatically at `data/saanjh.sqlite`.
5. Run validation tests with `npm test`.

### Security Demo

The storefront header's **Sign in** button and footer's **Security demo** link open a front-end-only classroom walkthrough. It demonstrates local PBKDF2 password hashing, a browser-local lockout counter, an in-memory inactivity session, and safe review rendering with `textContent`. Demo account hashes and lockout state are stored in `localStorage`; this can be edited or bypassed by the user and is not authentication or brute-force protection for a real service. Use fake credentials only.

Free shipping is currently configured for all orders. The server catalog and its prices are maintained in `server/catalog.js`; update this and the storefront's product display together when changing products/prices.

### Razorpay test setup

In the Razorpay dashboard's **test mode**, copy the test key ID and key secret into `.env`. Create a webhook pointing to `https://YOUR_PUBLIC_HOST/api/webhooks/razorpay`, select `payment.captured` and `payment.failed`, and copy its webhook secret into `RAZORPAY_WEBHOOK_SECRET`. A local server needs an HTTPS tunnel for Razorpay webhooks. Do not publish live credentials. Startup deliberately refuses a key ID not beginning `rzp_test_`; remove that guard only as a separately reviewed production change after Razorpay business verification.

The checkout loads the default Razorpay Standard Checkout methods (UPI, cards, netbanking and wallets). Availability of a method can depend on the Razorpay account and test configuration.

### Confirmation email

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_FROM` to send payment confirmation email. SMTP credentials remain server-side. Without SMTP, the server reports that email is not configured and payment/orders still work; configure and test email before accepting real customers.

### Admin

Visit `http://localhost:3000/admin.html` and authenticate with username `admin` and the `ADMIN_PASSWORD` from `.env`. The page lists up to 200 recent orders. Unpaid/COD orders can be cancelled. A captured online order can be fully refunded through Razorpay; a refund whose gateway result is uncertain is held in `processing` so an operator checks Razorpay before retrying (avoids issuing a duplicate refund).

## Database

`server/schema.sql` uses portable `VARCHAR`, `TEXT`, `INTEGER`, `CHECK`, unique constraints and standard indexes; it is applied automatically on startup. SQLite is the default, stored in `data/saanjh.sqlite`. For PostgreSQL, set `DATABASE_URL` to a PostgreSQL connection string; the same schema is applied at startup. Set `PGSSL=disable` only for a local PostgreSQL instance. Production PostgreSQL should use TLS and a managed database with backups.

Orders snapshot each item name, variant, price and quantity as JSON, alongside customer/address fields, amounts, status, gateway IDs, and lifecycle timestamps. Only the receipt's random UUID is used to retrieve a minimal customer-free summary.

## Deploy

### Vercel full-stack deployment

The Vercel configuration runs the Express app as a Node function and serves the storefront from `public/`; this is not a static-only deployment. Set the Vercel framework preset to **Other** with no build command. Configure a hosted PostgreSQL `DATABASE_URL` (Vercel function filesystems are ephemeral and cannot persist SQLite orders). Set `NODE_ENV=production`, `APP_ORIGIN` to the exact HTTPS deployment domain, `ADMIN_PASSWORD`, test-only `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and SMTP values in Vercel Project Settings → Environment Variables. Do not add secrets to Git or `vercel.json`. Keep the test-key guard enabled until Razorpay business verification is complete.

In the Razorpay test dashboard, configure `/api/webhooks/razorpay` on the deployed HTTPS domain and select `payment.captured` and `payment.failed`. Replace the `.example` support addresses in policy/contact pages with real monitored business addresses before launch. Confirm checkout, webhook retries, email, admin actions and database backup/restore on the deployed environment. Application logs never contain payment secrets or gateway request/response bodies.

For other Node hosts, configure production HTTPS and `APP_ORIGIN`, use hosted PostgreSQL or persistent storage for SQLite, set server secrets in the host's secret manager, and follow the same Razorpay test/webhook setup.

## Test checklist

Automated checks: `npm test` covers server-side field/catalog validation, totals, payment HMAC verification, raw-body webhook signatures and idempotency fingerprints.

Manual Razorpay test-mode checklist (complete with the test credentials and test instruments shown by Razorpay in its dashboard/docs):

- [ ] Successful UPI payment: order is paid, amount matches server catalog, success page displays order number, item summary and 3–7 business day estimate, cart clears, confirmation email arrives.
- [ ] Successful card payment through Razorpay Checkout: same paid/receipt/email results; confirm this site never receives card data in its network requests.
- [ ] Failed payment: checkout shows a failure state, cart remains, Retry checkout is available, and the order does not become paid.
- [ ] Close/dismiss the Razorpay popup: cart remains and retry is available; a later captured webhook still marks the order paid.
- [ ] Tamper with `razorpay_signature`: `/api/payments/verify` rejects it and the order is not marked paid.
- [ ] Webhook retry: deliver the same valid `payment.captured` webhook multiple times; order remains paid and confirmation email is claimed only once.
- [ ] Double-click the payment button: only one active order/payment setup is used and the button disables while the request is working.
- [ ] Submit altered price/unknown product, invalid phone/state/PIN and malformed quantities to `/api/orders`: server rejects invalid input and ignores/rejects client-supplied prices.
- [ ] Test COD: order is recorded as `cod`, receipt is shown, and cart clears.
- [ ] Admin: unauthenticated access is rejected; cancel an unpaid order and issue a test-mode refund for a captured test payment.
