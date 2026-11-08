# GrillMaster POS - Images Directory

Place local product and branding images in this directory.

Recommended structure:
- `images/products/`: Burger, sides, and drink photos (e.g., `cheeseburger.jpg`, `fries.jpg`, `shake.jpg`)
- `images/logo.png`: Custom shop branding logo

Note: Currently, the HTML pages use high-definition fast-food placeholder image URLs from Unsplash with automatic SVG/placeholder fallbacks (`onerror`). You can replace the `src="..."` attributes with local images from this folder at any time (e.g. `src="images/products/cheeseburger.jpg"`).
