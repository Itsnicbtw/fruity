# Fruity pixel-reference storefront

This revision is tuned against the approved 1024×1536 merch-directory and product-page reference images.

## Routes

- `/` Home
- `/about` About
- `/account` Account coming soon
- `/merch` Merch directory
- `/merch/hoodies`
- `/merch/t-shirts`
- `/merch/caps`
- `/merch/accessories`
- `/product/:slug`
- `/admin`

Products start empty in `data/products.json`.

## Admin login comes from `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
ADMIN_USERNAME=your-admin-name
ADMIN_PASSWORD=use-a-long-random-password
SESSION_SECRET=use-at-least-32-random-characters
PORT=3000
NODE_ENV=development
```

Then:

```bash
npm install
npm start
```

The browser never contains the admin password. `/admin` authenticates against the server-side `.env` credentials and receives an HTTP-only session cookie. All About edits, logo uploads, product creation, and product deletion require that authenticated session.

In production, set `NODE_ENV=production` and serve behind HTTPS so the session cookie is secure.

## Dynamic content

The admin About editor writes `data/site.json`. Home reads the same About fields, so editing About also changes the home story section.

The logo uploader replaces the text `frt.` placeholder across the live site.

## Reference fidelity

The merch directory and product detail layouts use the same 1024px canvas proportions, two-tier header, campaign hero, category dimensions, five-column product row, purchase controls, description split, and orange-fruit footer geometry as the approved screenshots. At widths above 1024px the design is centered in a 1024px canvas; below that it becomes responsive.
