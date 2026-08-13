# FEDMED — CONTEXT 4: FRONTEND
# Paste with CONTEXT_1_CORE.md when working on: frontend/

---

## BUILD TOOL: VITE (NOT Create React App — CRA is deprecated)

### frontend/vite.config.js
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## API CLIENT — src/api/client.js

```javascript
import axios from 'axios';

// VITE env vars use import.meta.env.VITE_* — NEVER process.env.REACT_APP_*
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — log errors, re-reject for component handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getStatus = () => apiClient.get('/status');
export const getMetrics = () => apiClient.get('/metrics');
export const startTraining = () => apiClient.post('/start-training');
export const getModelInfo = () => apiClient.get('/model-info');
```

---

## APP ROUTING — src/App.jsx

- React Router v6
- Routes: `/` → Dashboard, `/clients` → Clients, `/results` → Results
- Navbar always visible on all routes
- No global state library — use React `useState` + `useEffect` per page

---

## PAGES

### Dashboard.jsx
- Two `LineChart` (Recharts) side by side
  - Left: accuracy over rounds — x=round, y=accuracy, yDomain=[0,1]
  - Right: loss over rounds — x=round, y=loss
- Poll `GET /api/v1/metrics` every 3000ms via `setInterval` in `useEffect`
- Clear interval on component unmount (cleanup function in useEffect)
- Above charts: 4 `MetricCard` components showing: current accuracy, current loss, rounds completed, total clients
- If rounds array is empty: show "Waiting for training to start..."
- Show loading spinner while first fetch is pending
- Show error message if API call fails

### Clients.jsx
- 3 `ClientCard` components in responsive grid
- Each card shows: Hospital name (Hospital 1 / Hospital 2 / Hospital 3), `StatusBadge`, last known local accuracy
- Derive status from latest metrics:
  - total_rounds_completed === NUM_ROUNDS → "completed"
  - total_rounds_completed > 0 → "training"
  - else → "idle"
- Client accuracy = `client_accuracies[index]` from latest round
- Poll metrics every 5000ms for live status updates
- Clear interval on unmount

### Results.jsx
- Show full content only when `total_rounds_completed === NUM_ROUNDS`
- Show "Training not completed yet" with progress indicator if not done
- Final global accuracy and loss as large `MetricCard` components
- `BarChart` (Recharts) comparing each hospital's final local accuracy vs global accuracy
- Chart bars: Hospital 1, Hospital 2, Hospital 3, Global — grouped
- All values from last round in metrics

---

## COMPONENTS

### MetricCard.jsx
```jsx
// Props:
//   title: string — card label
//   value: string | number — large displayed value
//   subtitle: string — smaller text below value
//   color: string — Tailwind text color class e.g. "text-blue-600"
// Renders: rounded-xl shadow-sm border border-gray-100 p-6
// Value displayed large (text-3xl font-bold)
```

### StatusBadge.jsx
```jsx
// Props:
//   status: "idle" | "training" | "completed"
// idle      → gray badge:   bg-gray-100 text-gray-600
// training  → yellow badge: bg-yellow-100 text-yellow-700
// completed → green badge:  bg-green-100 text-green-700
// Renders as inline pill: rounded-full px-3 py-1 text-sm font-medium
```

### TrainingChart.jsx
```jsx
// Props:
//   data: array — array of round metric objects
//   dataKey: string — key to plot on y-axis e.g. "accuracy" or "loss"
//   title: string — chart heading
//   color: string — hex or Tailwind-compatible color for line
//   yDomain: array — e.g. [0, 1] for accuracy, ['auto','auto'] for loss
// Wraps Recharts LineChart with:
//   ResponsiveContainer width="100%" height={250}
//   CartesianGrid strokeDasharray="3 3"
//   XAxis dataKey="round" label "Round"
//   YAxis domain={yDomain}
//   Tooltip
//   Line type="monotone" dot={false} strokeWidth={2}
```

### ClientCard.jsx
```jsx
// Props:
//   hospitalName: string e.g. "Hospital 1"
//   status: "idle" | "training" | "completed"
//   accuracy: number | null — last known local accuracy, null if not started
// Renders: rounded-xl shadow-sm border border-gray-100 p-6
// Shows hospital icon, name, StatusBadge, accuracy value
// Accuracy formatted as percentage: (0.852 → "85.2%")
// Shows "—" if accuracy is null
```

### Navbar.jsx
- Left: "FedMed" logo text (font-bold text-blue-600)
- Center/right: NavLinks to Dashboard, Clients, Results (React Router v6 NavLink)
- Active link: underline indicator via NavLink className callback
- Far right: training status badge — polls `GET /api/v1/status` every 5000ms
- Clear interval on unmount

---

## STYLING RULES

- TailwindCSS only — no inline styles except dynamic values (e.g. conditional colors)
- Color palette:
  - Primary: `blue-600`
  - Success / completed: `green-500`
  - Warning / training: `yellow-400`
  - Idle / neutral: `gray-400`
  - Error: `red-500`
- All cards: `rounded-xl shadow-sm border border-gray-100 p-6`
- Font: Tailwind default system font stack
- Responsive grids: `grid-cols-1` mobile, `grid-cols-2` md, `grid-cols-3` lg (where applicable)
- Loading state: centered spinner on all data-fetching components while first load pending
- Error state: red error message with retry button on all data-fetching components

---

## FRONTEND DOCKERFILE — frontend/Dockerfile (multi-stage)

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage — serve built files via nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### frontend/nginx.conf
```nginx
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## PACKAGE.JSON — frontend/package.json (key dependencies)
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "recharts": "^2.0.0",
    "axios": "^1.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## FRONTEND RULES
- Functional components only — no class components
- Every async component has loading state, error state, and data state
- `setInterval` always cleaned up in `useEffect` return function
- Use `import.meta.env.VITE_*` for environment variables — never `process.env`
- No direct file system or API calls outside `src/api/client.js`
- Axios interceptor handles global error logging — components handle display
