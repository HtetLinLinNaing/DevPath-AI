---
name: digest-formatter
description: Use when the user wants to format HackerNews API JSON data using Node.js.
---

# Digest Formatting Instructions

1. Ensure the Node.js script uses standard native `fetch()` to pull from the HackerNews API.
2. Write JavaScript logic to strip away all link tracking parameters from the JSON response.
3. Group the remaining stories by keyword relevance (e.g., AI, Web Development, Security) using array methods like `.filter()` and `.reduce()`.
4. Output exactly 5 clean headlines into a formatted Markdown string.
