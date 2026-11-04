# Medint tests (dev only)

Scenario tests that load the real app (`../source/*.js`, `../source/index.html`) with the website's data (`../public/data`)
in a simulated browser, in **website mode** (fake `/api/*` endpoints and NetHunt answers — nothing real is called or changed).

    cd tests
    npm install      # once
    npm test         # all tests;   node run.js t53 t62   for some

Each test prints what it checked and ends with `errors 0` when nothing broke. Failed ones leave a `tNN.log`.
This folder is not served by the website and has no effect on it.

    node run.js --bundle   # the same tests against the built bundle in ../public (run this before every deploy)
