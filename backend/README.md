# TaskNest API

## Install
```
npm install
```

## Run
```
npm start
```

Base URL: `http://localhost:4000/api`

### Endpoints

- List:
  - `GET /api/todos?page=1&limit=5&status=todo&from=2025-09-01&to=2025-09-30&search=abc`
  - Example:
    ```sh
    curl http://localhost:4000/api/todos
    ```
- Create:
  - `POST /api/todos` JSON: `{ "title": "New task" }`
  - Example:
    ```sh
    curl -X POST -H "Content-Type: application/json" -d '{"title":"Test"}' http://localhost:4000/api/todos
    ```
- Update:
  - `PATCH /api/todos/:id` JSON: `{ "status": "done" }`
  - Example:
    ```sh
    curl -X PATCH -H "Content-Type: application/json" -d '{"status":"done"}' http://localhost:4000/api/todos/t123
    ```
- Delete:
  - `DELETE /api/todos/:id`
  - Example:
    ```sh
    curl -X DELETE http://localhost:4000/api/todos/t123
    ```
- Stats:
  - `GET /api/todos/stats`
  - Example:
    ```sh
    curl http://localhost:4000/api/todos/stats
    ```
