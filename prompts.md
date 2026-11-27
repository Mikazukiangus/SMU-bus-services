# Prompt History

All instruction prompts given during the development of **SG BusStop**.

---

## Prompt 1 — Initial Application

> 1. build me a singapore based bus application that input bus stop code for quick access and favorites functionality.
> 2. i will establish an api connection later

---

## Prompt 2 — LTA DataMall v3 Serverless API

> 1. add a server less connection that pulls from LTA data mall using the following endpoints.:
>
> ```
> # Next buses at a stop (v3, the current version; refreshes every 20 seconds):
> https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121
> # To ask about one service only, add &ServiceNo=7
>
> # Every request needs the header:  AccountKey: <LTA_ACCOUNT_KEY>
> ```
>
> 2. store this in/api at project root level (not the src file)
> 3. include a /health.ts and /busarrival.ts within the same subfolder
> 4. do not hardcode any key, I will input them manually.

---

## Prompt 3 — Vercel Build Dependency Fix

> fix the errors below:
> (Vercel `npm install` ERESOLVE conflict between `esbuild@^0.25.0` and `vite@8.4.0` peerOptional `esbuild@^0.27.0 || ^0.28.0`)

---

## Prompt 4 — Redeployment Error Check

> there are still errors:
> (Vercel re-ran on previous commit `42e4c4f` before pushing updated `package.json`)

---

## Prompt 5 — Prompt Logging & GitHub Push

> store all instruction prompts into a prompts.md file and push to GitHub every time there is new instructions.

---

## Prompt 6 — Vercel Build Error Check (Same Commit 42e4c4f)

> fix these errors:
> (Vercel re-ran on commit `42e4c4f` with `esbuild@^0.25.0` still in GitHub `main`)

