# noahfarrar.com

Personal website and portfolio built with Next.js 16, React 19, and Tailwind CSS 4.

## Pages

- **Home** — ID card with links to writings and experiments, touch-friendly row scrubber with haptic feedback
- **The Bridge** — Long-form writing page with scrollspy table of contents
- **Portfolio** — Project showcase
- **404** — Custom not-found page

## Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) 4
- [Framer Motion](https://motion.dev) for animations
- [Geist](https://vercel.com/font) typeface (sans + mono)
- MDX for blog content via `next-mdx-remote`
- [web-haptics](https://github.com/nicepkg/web-haptics) for tactile feedback on mobile

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
