# Home Expenses

A web application for calculating all the income and expenses made for the past year, based on bank statements.

This is a [Next.js](httpshttps://nextjs.org) project.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username_/home-expenses.git
   ```
2. Install NPM packages
   ```sh
   npm install --prefix frontend
   ```

### Running the Application

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `frontend/src/app/page.tsx`. The page auto-updates as you edit the file.

## Project Structure

The project is a monolithic Next.js application, with both the frontend and backend code located in the `frontend` directory.

```
financial-analyzer/
├── frontend/                   # Next.js application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── app/                # App Router pages and API routes
│   │   │   ├── api/            # API routes
│   │   │   └── (pages)/        # Page components
│   │   ├── components/         # React components
│   │   ├── lib/
│   │   │   └── server/         # Server-side logic (from old backend)
│   │   ├── services/           # Client-side API services
│   │   ├── types/              # TypeScript types
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
└── ...
```

## Tech Stack

*   [Next.js](https://nextjs.org/) - React framework for production
*   [React](https://reactjs.org/) - A JavaScript library for building user interfaces
*   [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at Any Scale
*   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
*   [PostgreSQL](https://www.postgresql.org/) - A powerful, open source object-relational database system

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
