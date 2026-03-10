<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**Earnable Backend** is a NestJS-powered API that takes a URL, scrapes the page content, and analyzes it for **monetization readiness**.

For a given URL, the system produces a structured analysis covering:

- **Overview**: Key content areas, primary topics, content type, intent, credibility, authority, and monetization readiness.
- **Revenue Gaps**: Missing or weak CTAs, product recommendations, comparisons, positioning for specific segments, and benefit-driven language.
- **Additional Criteria**: Niche authority, practicality, specificity, audience alignment, and relatability.
- **Recommendations**: Concrete, actionable suggestions to move the creator from current state to desired state.
- **Content Opportunities**: New content topics, angles, and formats that build on what already performs well.
- **Product Category Recommendations**: Categories of products or services that fit the audience; affiliate specifics can be layered on top.

The backend is designed so that the frontend can optionally request numerical scores and percentages that can be turned into charts, or simply consume everything as text.

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: TypeScript
- **Database**: PostgreSQL (via TypeORM)
- **Cache / Queues**: Redis / BullMQ
- **AI / LLM**: OpenAI
- **HTTP Client**: Axios

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create a `.env` file (or update the existing one) with:

- **Server**
  - `PORT`
- **Database**
  - `DATABASE_HOST`
  - `DATABASE_PORT`
  - `DATABASE_USER`
  - `DATABASE_PASSWORD`
  - `DATABASE_NAME`
- **Redis**
  - `REDIS_HOST`
  - `REDIS_PORT`
- **Auth**
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `JWT_ACCESS_EXPIRES`
  - `JWT_REFRESH_EXPIRES`
- **External APIs**
  - `OPENAI_API_KEY`
  - `FIRECRAWL_API_KEY`

Never commit real secrets to version control.

### 3. Run the project

```bash
# development
pnpm run start

# watch mode (spins up Docker services if configured)
pnpm run start:dev

# production mode (after building)
pnpm run build
pnpm run start:prod
```

### 4. Run tests

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

## High-Level API Overview

The backend exposes endpoints (via REST) that enable:

- **User authentication**
  - Sign up, sign in, and JWT-based access/refresh tokens.
- **URL-based content analysis**
  - Accept a URL.
  - Scrape the page content.
  - Run the content through the Earnable analysis pipeline.
  - Return a structured JSON response aligned with:
    - Overview
    - Revenue Gaps
    - Additional Criteria
    - Recommendations
    - Content Opportunities
    - Product Category Recommendations

As the product evolves, more detailed endpoint documentation can be added using Swagger (already available via `@nestjs/swagger`).

## Development Notes

- Core services and controllers should include **concise, high-signal comments** that explain:
  - Intent of the class/service.
  - Assumptions about inputs.
  - Any non-obvious trade-offs or workflows.
- Avoid comments that simply restate what the code already makes obvious.

## Contributing

Contributions are welcome. Please read the [CONTRIBUTING.md](./CONTRIBUTING.md) guide for:

- Local development setup.
- Code style and linting rules.
- Testing expectations.
- How to open effective pull requests.

## License

This project is licensed under the [MIT License](./LICENSE).
