---
name: react-frontend-expert
description: Hướng dẫn Agent viết React 19 + Vite + Tailwind cho ClassManager — quản lý auth 4 role, data table điểm thi đua, dashboard biểu đồ và dynamic form.
---

# Mục tiêu
Đảm bảo Frontend ClassManager viết đúng chuẩn TypeScript, không dùng `any`, phân quyền UI theo role rõ ràng, xử lý loading/error state đầy đủ và nhất quán với API contract trong SRS.

---

## Quy trình Thực hiện (Instructions)

### 1. Kiểm tra Ngữ cảnh & Cấu trúc Dự án
- Mọi file React đặt trong `frontend/src/`
- Đọc `docs/srs/classmanager_srs_full.md` phần API Endpoints trước khi viết service call
- Kiểm tra `vite.config.ts` xem proxy `/api` đã trỏ về `http://localhost:8080` chưa

**Cấu trúc Thư mục chuẩn:**
Các file Frontend mới phải được tổ chức đúng thư mục quy định tại `frontend/src/`:
- `components/`: Chứa các component UI dùng chung (`common/`) hoặc theo module (ví dụ: `dashboard/`, `points/`).
- `pages/`: Các trang lớn ánh xạ trực tiếp từ router.
- `types/`: Nơi định nghĩa các Type/Interface TypeScript dùng chung cho các đối tượng API.
- `services/`: Các service xử lý gọi API Axios tập trung.
- `stores/`: Chứa các Zustand Store quản lý state toàn cục.
- `context/`: Nơi chứa React Context cho các state cục bộ hoặc session.
- `utils/`: Chứa các hàm tiện ích (`dateUtils`, `constants`).

**Quy trình viết một Feature mới ở Frontend (Frontend Feature Flow):**
Khi phát triển một tính năng giao diện mới, tuân thủ đúng trình tự sau:
1. **Types**: Định nghĩa API Response/Request interfaces trong `src/types/`.
2. **Service**: Viết service gọi API sử dụng `axiosInstance` tập trung trong `src/services/`.
3. **Zustand Store**: Tạo hoặc cập nhật Zustand store trong `src/stores/` (ví dụ: `useAuthStore`, `useClassStore`) nếu state cần chia sẻ toàn cục.
4. **UI Components & Pages**: Xây dựng component giao diện trong `src/components/` và ghép trang trong `src/pages/`. Tuân thủ bộ quy tắc thiết kế tối giản trong `minimalist-ui`.
5. **Route Guard**: Cấu hình phân quyền Route thông qua `ProtectedRoute` tại `App.tsx` (nếu trang yêu cầu đăng nhập/role cụ thể).

### 2. Quản lý Kiểu dữ liệu (TypeScript Strict)
- KHÔNG dùng `any` — mọi data từ API phải có `interface` hoặc `type`
- Định nghĩa types trong `src/types/` theo từng domain:

```typescript
// src/types/student.ts
export interface Student {
  id: number
  fullName: string
  googleEmail: string | null
  phoneNumber: string | null
  groupName: string
  role: 'STUDENT' | 'GROUP_LEADER'
  currentPoint: number
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
}

// src/types/pointLog.ts
export interface PointLog {
  id: number
  pointValue: number       // dương = thưởng, âm = phạt
  reason: string
  changedBy: string
  weekStartDate: string    // ISO date
  createdAt: string        // ISO datetime
}

// src/types/api.ts — Error response thống nhất từ BE
export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  details: { field: string; message: string }[]
  path: string
}
```

### 3. ENV & Cấu hình

**Quy tắc bắt buộc:**
- KHÔNG hardcode URL, API key trong code
- Mọi biến môi trường Frontend dùng prefix `VITE_` để Vite expose ra client
- File `.env.local` KHÔNG được commit lên Git — chỉ commit `.env.example`


**Cách đọc ENV trong code:**
```typescript
// ✅ ĐÚNG
const apiBase = import.meta.env.VITE_API_BASE_URL
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

// ❌ SAI — hardcode
const apiBase = 'http://localhost:8080'
```

**`vite.config.ts` — proxy dev để tránh CORS khi local:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

**Khi deploy lên Vercel:**
- Set `VITE_API_BASE_URL=https://your-backend.koyeb.app` trong Vercel Dashboard → Settings → Environment Variables
- Set `VITE_GOOGLE_CLIENT_ID` đúng với Google Cloud Console

### 4. Cấu hình Gọi API & Zustand Store
- Dùng **Zustand** để quản lý trạng thái toàn cục (Auth, UI states).
- Tập trung toàn bộ API call trong `src/services/` — KHÔNG gọi axios trực tiếp trong component.

```typescript
// src/stores/useAuthStore.ts
import { create } from 'zustand'
import { User } from '../types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  setUser: (user: User | null, token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setUser: (user, token) => set({ user, accessToken: token }),
  logout: () => set({ user: null, accessToken: null }),
}))
```

```typescript
// src/services/axiosInstance.ts
import axios from 'axios'
import { useAuthStore } from '../stores/useAuthStore'

const instance = axios.create({ baseURL: '/api/v1' })

// Request interceptor: tự động gắn Bearer token lấy từ Zustand store
instance.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: tự động refresh khi 401
instance.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await authService.refresh()
      return instance(err.config)
    }
    return Promise.reject(err)
  }
)
```

### 5. Phân quyền UI theo Role & Route Guard
- Sử dụng Zustand Store (`useAuthStore`) để kiểm tra quyền truy cập của người dùng.
- Tạo `ProtectedRoute` component kiểm tra role trước khi render.

```typescript
// src/components/common/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { Role } from '../../types/auth'

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const user = useAuthStore(state => state.user)
  
  if (!user) return <Navigate to="/login" />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />
  return <Outlet />
}

// Dùng trong router (App.tsx)
<Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/students" element={<StudentListPage />} />
</Route>
```

### 6. Đồng bộ Màu sắc (Tailwind & Shadcn) & Data Table
- **Cấu hình Màu sắc Tối giản**: Để đồng bộ giao diện Minimalist UI, khai báo bảng màu pastel trong [frontend/src/index.css](file:///d:/Data/Personal/JOBS/ME/class-manager/frontend/src/index.css) (CSS Variables) và cấu hình **Shadcn / Tailwind** trong `tailwind.config.js`:
  ```css
  /* src/index.css */
  :root {
    --background: 0 0% 100%;       /* Pure White #FFFFFF */
    --foreground: 20 5% 7%;        /* Charcoal #111111 */
    --card: 0 0% 98%;              /* Warm Bone #F9F9F8 */
    --border: 0 0% 92%;            /* Light Gray #EAEAEA */
    
    --pale-green: 108 20% 94%;     /* #EDF3EC */
    --pale-green-text: 125 32% 30%;/* #346538 */
    --pale-blue: 202 96% 94%;      /* #E1F3FE */
    --pale-blue-text: 204 67% 37%; /* #1F6C9F */
    --pale-yellow: 45 78% 92%;     /* #FBF3DB */
    --pale-yellow-text: 41 100% 29%;/* #956400 */
    --pale-red: 353 73% 96%;       /* #FDEBEC */
    --pale-red-text: 1 55% 40%;    /* #9F2F2D */
  }
  ```
  ```javascript
  // tailwind.config.js
  module.exports = {
    theme: {
      extend: {
        colors: {
          border: "hsl(var(--border))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          card: "hsl(var(--card))",
          pale: {
            green: { DEFAULT: "hsl(var(--pale-green))", text: "hsl(var(--pale-green-text))" },
            blue: { DEFAULT: "hsl(var(--pale-blue))", text: "hsl(var(--pale-blue-text))" },
            yellow: { DEFAULT: "hsl(var(--pale-yellow))", text: "hsl(var(--pale-yellow-text))" },
            red: { DEFAULT: "hsl(var(--pale-red))", text: "hsl(var(--pale-red-text))" }
          }
        }
      }
    }
  }
  ```
- **TanStack Table**: Luôn có Skeleton loading state khi fetch dữ liệu (không dùng spinner).
- **Badge Màu**: Phải dùng các màu semantic pastel đã cấu hình:

```typescript
// src/components/common/PointBadge.tsx
const getPointColor = (point: number, basePoint: number) => {
  const ratio = point / basePoint
  if (ratio >= 0.9) return 'bg-pale-green text-pale-green-text'    // Tốt
  if (ratio >= 0.65) return 'bg-pale-blue text-pale-blue-text'    // Khá
  if (ratio >= 0.5) return 'bg-pale-yellow text-pale-yellow-text' // Trung bình
  return 'bg-pale-red text-pale-red-text'                         // At-risk / Yếu
}
```

### 7. Dashboard Chart
- Dùng Recharts cho biểu đồ điểm tuần
- Chart phải responsive, có tooltip tiếng Việt, legend rõ ràng

```typescript
// Tooltip tiếng Việt
const CustomTooltip = ({ active, payload, label }) => {
  if (!active) return null
  return (
    <div className="bg-white border rounded p-2 shadow text-sm">
      <p className="font-medium">Tuần {label}</p>
      <p>Điểm TB: <span className="font-bold">{payload[0]?.value}</span></p>
    </div>
  )
}
```

### 8. Dynamic Form (Lý lịch Học sinh)
- Render form fields từ `form_template.structure` (JSONB từ BE)
- Hỗ trợ đủ các type: `text`, `number`, `boolean`, `select`, `date`, `textarea`
- Dùng React Hook Form + Zod validation

```typescript
// Render field động theo type từ BE
const renderField = (field: FormField) => {
  switch (field.type) {
    case 'text': return <input type="text" {...register(field.fieldName)} />
    case 'boolean': return <input type="checkbox" {...register(field.fieldName)} />
    case 'select': return (
      <select {...register(field.fieldName)}>
        {field.options?.map(opt => <option key={opt}>{opt}</option>)}
      </select>
    )
    // ... các type khác
  }
}
```

### 9. Loading & Error State (Bắt buộc)
- Mọi data fetch phải có 3 state: loading / success / error
- Dùng Skeleton thay vì spinner cho table và card
- Error message dùng `message` từ ApiError response của BE

```typescript
if (isLoading) return <TableSkeleton rows={10} />
if (error) return <ErrorMessage message={error.message} />
return <DataTable data={students} />
```

---

## Quy trình Kiểm tra (Verification Workflow)

Sau mỗi lần tạo hoặc sửa component:

```bash
# Bước 1: Di chuyển vào frontend
cd frontend

# Bước 2: Kiểm tra TypeScript và lint
npm run lint
npx tsc --noEmit

# Bước 3: Kích hoạt Integrated Browser để render thử
# Bước 4: Chỉ tạo Artifact Walkthrough khi không có lỗi TypeScript
```

---

## Anti-patterns Cần Tránh

```
❌ Dùng `any` cho data từ API
❌ Gọi axios/fetch trực tiếp trong component — phải qua services/
❌ Hardcode role check bằng string thô ("TEACHER") — dùng enum/type
❌ Không có loading state khi fetch data
❌ Không có error handling khi API thất bại
❌ Expose access token trong localStorage — dùng memory + HttpOnly cookie
❌ Hardcode URL, API key trong code — luôn dùng import.meta.env.VITE_*
❌ Commit file .env.local lên Git — chỉ commit .env.example
❌ Dùng // TODO, placeholder — viết đầy đủ
❌ Dùng màu tùy tiện cho badge — chỉ dùng bộ màu semantic đã định nghĩa
❌ Gọi API trong useEffect mà không cleanup (memory leak)
```