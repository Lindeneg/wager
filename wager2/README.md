TODO:

- Table column spacing/alignment. It looks not good, especially the `game-history` table.
- Everything clickable should have a mouse pointer.
- Errors. We need to display errors nicely, we got some zod information back we can display.
- Implement tests. Units and e2e. Look at postman stuff.

NEW FEATURES:

- Show "best game" in the player card on the overview section. Best game, is just the game
they have won the most money in.
- Have a stat page:
- Game overview. How many rounds for a given game and how much money wagered? Also, which
player has won the most. Maybe in a table-like view.
- Head-to-Head breakdown between two players for a speciifc game or a range of specific games.
- Graph showing the evolution of each players winnings/losses in a multi-colored line plot.



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
