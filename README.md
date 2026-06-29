---

## Prerequisites

> Install these tools before proceeding.

| Tool | Version | How to install |
| :--- | :---: | :--- |
| Node.js | `20.x +` | [nodejs.org](https://nodejs.org) |
| npm | `10.x +` | Bundled with Node.js |
| Angular CLI | `20.x` | `npm install -g @angular/cli` |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
ng serve -o

# 3. Open in browser
# http://localhost:4200
```

---

## Environments

| | Development | UAT | Production |
| :--- | :---: | :---: | :---: |
| **Config key** | `development` | `uat` | `production` |
| **Environment file** | `environment.ts` | `environment.uat.ts` | `environment.prod.ts` |
| **API base URL** | `http://localhost:5000` | `https://uat-api.projectrelay.adticorp.com` | `https://api.projectrelay.adticorp.com` |
| **Optimised** | ❌ | ✅ | ✅ |
| **Source maps** | ✅ | ✅ | ❌ |
| **Output hashing** | ❌ | ✅ | ✅ |

> To change the API URL for a target, edit `apiBaseUrl` in the corresponding file under `src/environments/`.

---

## Running the Application

| Goal | Command | URL |
| :--- | :--- | :---: |
| Development server | `npm start` | `http://localhost:4200` |
| Dev server → UAT API | `npm run start:uat` | `http://localhost:4200` |
| Dev build with watch | `npm run watch` | — |

---

## Building the Application

| Target | Command | Output |
| :--- | :--- | :--- |
| Development | `npm run build:development` | `dist/relay-web/` |
| UAT | `ng build --configuration uat --base-href /ProjectRelay_WEB/` | `dist/relay-web/` |
| Production | `ng build --configuration production --base-href /ProjectRelay_WEB/` | `dist/relay-web/` |

<details>
<summary><strong>What does each build include?</strong></summary>

<br/>

| Feature | Development | UAT | Production |
| :--- | :---: | :---: | :---: |
| Minification | ❌ | ✅ | ✅ |
| Tree-shaking | ❌ | ✅ | ✅ |
| Output hashing | ❌ | ✅ | ✅ |
| Source maps | ✅ | ✅ | ❌ |
| Font inlining | ❌ | ❌ | ❌ |

</details>

---

## Deployment (Static SPA + .NET API)

This app is a **pure client-side SPA** — no Node.js server required. The backend is a separate .NET API.  
After any build, copy the contents of `dist/relay-web/` to your static file host.

| Host | What to do |
| :--- | :--- |
| **IIS** | Point site root to `dist/relay-web/`. Add a URL Rewrite rule to redirect all 404s to `index.html` (required for Angular client-side routing) |
| **Azure Static Web Apps** | Deploy `dist/relay-web/` — routing is handled automatically |
| **Azure Blob / CDN** | Upload `dist/relay-web/` contents, configure custom 404 → `index.html` |
| **Nginx** | `root /var/www/relay-web;` with `try_files $uri $uri/ /index.html;` |

> **IIS URL Rewrite rule** — add this to `web.config` inside `dist/relay-web/`:
> ```xml
> <configuration>
>   <system.webServer>
>     <rewrite>
>       <rules>
>         <rule name="Angular SPA" stopProcessing="true">
>           <match url=".*" />
>           <conditions logicalGrouping="MatchAll">
>             <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
>             <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
>           </conditions>
>           <action type="Rewrite" url="/index.html" />
>         </rule>
>       </rules>
>     </rewrite>
>   </system.webServer>
> </configuration>
> ```

---

## Testing

| Command | Description |
| :--- | :--- |
| `npm test` | Run all unit tests (Karma + Jasmine) |
| `ng test --watch=false` | Single test run, no browser watch |
| `ng test --code-coverage` | Run tests and generate coverage report |

---

## Project Structure

| Folder | Responsibility |
| :--- | :--- |
| `src/app/core/` | Guards, interceptors, and services — auth, cache, error, API, storage |
| `src/app/features/` | Lazy-loaded pages — `auth`, `dashboard`, `reports`, `admin` |
| `src/app/layout/` | Shell component and role-aware sidebar |
| `src/app/models/` | Shared interfaces and enums (`Role`, `AppUser`) |
| `src/app/shared/` | Reusable components (`forbidden`, `not-found`) and pipes |
| `src/app/store/` | Signal-based UI state — sidebar collapse, loading counter |
| `src/environments/` | Per-target environment configuration files |

---

## Role-Based Access

| Route | Admin | Manager | User | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/reports` | ✅ | ✅ | ❌ | ❌ |
| `/admin` | ✅ | ❌ | ❌ | ❌ |

> Access is enforced by `authGuard` (authentication check) and `roleGuard` (role check) on each route. The sidebar automatically hides links the current user cannot access.

---

## All npm Scripts

| Script | Description |
| :--- | :--- |
| `npm start` | Dev server — development environment |
| `npm run start:uat` | Dev server — UAT API |
| `npm run build` | Build — production (default) |
| `npm run build:development` | Build — development (no optimisation, source maps on) |
| `npm run build:uat` | Build — UAT (optimised + source maps, UAT env) |
| `npm run build:prod` | Build — production (fully optimised, prod env) |
| `npm run watch` | Development build with file watching |
| `npm test` | Run unit tests |