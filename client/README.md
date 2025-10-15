# Ciyatake web client

This application is built with Vite and React and now ships with a front-end API layer that mirrors the production backend contract. All screens fetch their data through these services, and when a real backend is not available they automatically fall back to the existing JSON fixtures so the UI continues to work.

## Environment variables

Configure API behaviour with the following Vite env variables (create a `.env` file in the `client` folder or export them in your shell):

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | Base URL for all REST calls. Point this to your Express server once it’s ready. |
| `VITE_USE_API_MOCKS` | `false` | When set to `true`, failed network calls automatically fall back to local mock data so the UI keeps working. Leave it `false` to surface real API errors while testing the backend. |

## Project commands

```bash
# start the dev server
npm run dev

# build for production
npm run build

# run lint checks
npm run lint
```

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information. (Note: this can impact Vite dev & build performance.)

## ESLint

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
