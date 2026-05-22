# Contributing

Thanks for considering a contribution.

## Development

```sh
npm test
npm run check
npm run pack:check
```

The package is dependency-free and build-free. Keep changes small and avoid adding runtime
dependencies unless they remove meaningful maintenance burden.

## Pull Requests

- Include tests for behavior changes.
- Keep public API changes explicit in the README.
- Do not commit secrets, analytics credentials, bot tokens, or local deployment files.
- Run tests and package checks before opening a pull request.

## Release Notes

User-facing changes should be added to `CHANGELOG.md`.
