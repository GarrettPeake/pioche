<div>
  <p align="center">
    <a href="https://github.com/GarrettPeake/pioche" title="View Project Source">
      <img width="375" src="https://github.com/GarrettPeake/pioche/blob/master/readme_logo.png" />
    </a>
  </p>
 
  <div align="center">
    <p>**PIOCHE IS IN ALPHA AND SHOULD NOT BE USED IN PRODUCTION**</p>
    <p>TypeScript first framework for <a href='https://workers.cloudflare.com'>Cloudflare Workers</a> enabling ⚡lightning⚡ fast development and execution</p>
  </div>

  <a href="https://www.npmjs.com/package/pioche">
    <img src="https://badgen.net/npm/v/pioche?color=blue" alt="npm version">
  </a>
</div>

Note: To use Durable Objects and Websockets features of Pioche, you need a Cloudflare account with [Durable Objects access](https://developers.cloudflare.com/workers/learning/using-durable-objects/#using-durable-objects-1)

## ⭐ Features
 - [x] Short development time
 - [x] Decorator-based path-to-regexp router
 - [x] Middleware support
 - [x] Simplified, more powerful API for D/O Storage and KV  
 - [x] Simplified Worker -> D/O interaction
 - [x] WebSocket handling
 - [x] Minimized invokations and compute time  
## 🔋 Tree Shakeable Batteries Available in [pioche-extras](https://github.com/GarrettPeake/pioche-extras)

See the installation section of [pioche-extras](https://github.com/GarrettPeake/pioche-extras) for prebuilt OAuth, log streaming, and middleware to use in your project

## 💾 Installation

To get started use [pioche-scripts](https://github.com/GarrettPeake/pioche-scripts)
```
npx pioche-scripts create <AppName>
```
This will setup an minimal project with a single TypeScript file: helloworld.ts  
We can then make changes to functionality and run
```js
npm run build // Generate wrangler.toml and program entry point
npm run dev // Deploy to Cloudflare with remote debugging session
npm run serve // Run locally, debug locally
npm run deploy // Deploy to Cloudflare
```
After `npm run deploy` you should see `<AppName>.workers.dev` gives `Hello, World!`

## 📕 Background and why Pioche Exists

Cloudflare (CF) workers platform has 3 major offerings:

1. **Workers**: A serverless javascript environment for short lived code. There can be many of the same worker script executing globally at the same time

2. **Durable Objects (D/O)**: A serverless javascript environment for long lived code or code which requires transactional storage. There can only be one of a D/O script globally at the same time.

3. **Workers KV (KV)**: A non-transactional distributed key-value store

Workers are web-facing, D/Os are Workers-facing, KV Workers and D/O-facing.  
**Problem**: There is a cumbersome dispatch process to call a D/O from a worker.

D/Os have an in-memory key value store (D/O storage)  
**Problem**: This store has very similar capabilities but use a separate API from KV. 

CPU time is charged per GB-sec, storage operations are charged per kB transferred, and Workers and D/Os are charged per invokation.  
**Problem**: We want to only use D/Os when necessary and minimize CPU time and invokations.  

**Problem**: There is no routing functionality

These 4 issues alone greatly increase upstart development time and complexity because orchestrating routing between services and resource management while minimizing cost is a huge task that developers shouldn't need to handle.

## People

Pioche was created by [Garrett Peake](https://github.com/GarrettPeake)

## License
 [MIT](https://github.com/GarrettPeake/pioche/blob/master/LICENSE)