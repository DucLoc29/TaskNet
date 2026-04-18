# TaskNet

TaskNet là một ứng dụng quản lý công việc hiện đại được xây dựng bằng React và Node.js. Ứng dụng cho phép người dùng tạo, chỉnh sửa và theo dõi các công việc của mình một cách hiệu quả.

## Thành viên thực hiện

- Nguyễn Đức Lộc 

## Demo

- Frontend (Vercel): https://task-net-mu.vercel.app/
- Backend (Render): https://tasknet.onrender.com  

## Tính năng chính

### Đăng nhập
- Đăng nhập bằng tài khoản Google
- Bảo mật với JWT token
- Mỗi người dùng chỉ thấy công việc của riêng mình

### Quản lý công việc
- Tạo, chỉnh sửa, xóa công việc
- Theo dõi trạng thái: Todo → Doing → Done
- Đặt ngày hết hạn cho công việc
- Tìm kiếm và lọc công việc theo trạng thái, ngày tháng, từ khóa

### Xem lịch
- Xem công việc dưới dạng bảng
- Xem công việc trên lịch tháng
- Sắp xếp thông minh: Trạng thái → Ngày hết hạn → Tên công việc

### Thống kê
- Thống kê công việc hôm nay, tuần này, tháng này
- Thanh tiến độ trực quan
- Phân tích hoàn thành công việc

## Công nghệ sử dụng

### Frontend
- React 18
- Tailwind CSS
- Axios
- Context API

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Passport.js (Google OAuth)
- JWT

## Cài đặt và chạy

### 1. Cài đặt Backend
```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục backend:
```
MONGODB_URI=mongodb://localhost:27017/tasknet
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:5173
PORT=4000
```

### 2. Cài đặt Frontend
```bash
cd frontend
npm install
```

Tạo file `.env` trong thư mục frontend:
```
VITE_API=http://localhost:4000/api
```

### 3. Chạy ứng dụng
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Truy cập: http://localhost:5173

## Cấu trúc dự án

```
tasknet/
├── backend/
│   ├── models/          # Schema MongoDB
│   ├── routes/          # API routes
│   ├── middlewares/     # Middleware xác thực
│   └── index.js         # Server chính
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Context API
│   │   └── App.jsx      # App chính
│   └── package.json
└── README.md
```

## Sử dụng

1. **Đăng nhập** bằng tài khoản Google
2. **Tạo công việc** mới với tiêu đề, trạng thái và ngày hết hạn
3. **Chuyển đổi** giữa chế độ xem bảng và lịch
4. **Theo dõi** tiến độ qua bảng thống kê
5. **Tìm kiếm** và lọc công việc theo nhu cầu

## API Endpoints

- `GET /api/tasks` - Lấy danh sách công việc
- `POST /api/tasks` - Tạo công việc mới
- `PATCH /api/tasks/:id` - Cập nhật công việc
- `DELETE /api/tasks/:id` - Xóa công việc
- `GET /api/tasks/stats` - Lấy thống kê
- `GET /api/auth/google` - Đăng nhập Google
- `GET /api/auth/me` - Thông tin người dùng

## Lưu ý

- Cần có tài khoản Google để đăng nhập
- MongoDB phải được cài đặt và chạy
- Cần cấu hình Google OAuth trong Google Cloud Console
