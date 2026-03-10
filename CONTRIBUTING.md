## How to Contribute

Thank you for your interest in contributing to **Earnable Backend**. This project powers the content monetization analysis engine for Earnable — taking a URL, scraping the page, and returning structured insights about monetization readiness and content opportunities.

Contributions are welcome in the form of bug fixes, new features, documentation improvements, or test coverage.

### Prerequisites

- **Node.js** (LTS recommended)
- **pnpm** (used as the package manager)
- **PostgreSQL** and **Redis** running locally (or accessible remotely)
- An **OpenAI API key** and **Firecrawl API key** (for content analysis and scraping)

### Getting the Project Running Locally

1. **Fork** the repository to your own GitHub account.
2. **Clone** your fork locally:

```bash
git clone <your-fork-url>
cd earnable-backend
```

1. **Install dependencies**:

```bash
pnpm install
```

1. **Create your environment file**:

- Copy `.env` (or `.env.example` if available) and update the values to match your local setup:
  - Database: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
  - Redis: `REDIS_HOST`, `REDIS_PORT`
  - Auth: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`
  - AI / scraping: `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`

1. **Run the development server**:

```bash
pnpm run start:dev
```

By default the API will be available on the port configured in `PORT` (see `.env`).

### Branching & Commit Guidelines

- **Create a feature branch** from `main` (or the default branch):

```bash
git checkout -b feature/content-analysis-api
```

- **Keep commits focused**. Each commit should represent a single logical change.
- **Write descriptive commit messages** that explain the intent and impact of the change.

### Code Style & Linting

- This project uses **ESLint** and **Prettier**.
- Before opening a pull request, run:

```bash
pnpm run lint
pnpm run test
```

- Ensure there are **no lint errors** and that **tests pass**.

### Comments & Documentation

- Prefer **meaningful comments** that explain intent, assumptions, and non-obvious decisions rather than restating what the code does.
- When adding new services, controllers, or complex functions, include brief JSDoc-style comments that describe:
  - The purpose of the class/function.
  - Important parameters.
  - What is returned.

### Adding or Updating Features

When working on new features — especially around content analysis — aim to:

- Preserve existing API contracts unless there is a compelling reason to change them.
- Keep the **core analysis pipeline** (scraping → AI evaluation → scoring → response mapping) well-structured and easy to follow.
- Add or update unit tests for the behavior you modify.

### Tests

- Unit tests live alongside the source files with the `.spec.ts` suffix.
- To run tests:

```bash
pnpm run test
```

For coverage:

```bash
pnpm run test:cov
```

### Opening a Pull Request

Before opening a PR:

1. Ensure your branch is up to date with the latest `main`.
2. Confirm:
   - `pnpm run lint` passes.
   - `pnpm run test` passes.
3. Open a pull request with:
   - A clear **title**.
   - A **summary** of the problem and solution.
   - Any **screenshots** or **sample responses** that help reviewers understand changes (especially for content analysis output).

### Questions

If you are unsure about anything:

- Open a **draft pull request** to start a discussion, or
- Create an **issue** describing the problem and your proposed solution.

We appreciate your contributions to making Earnable more useful for creators and operators.
