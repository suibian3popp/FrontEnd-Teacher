好的，没问题。根据目前前端页面的展示内容，我为你整理了一份详细的后端接口文档（API Doumentation）。

这份文档描述了前端需要哪些接口、接口的功能、请求方式以及返回的数据格式。你可以将它直接交给后端开发人员作为参考。

---

## **智慧教学支持平台 - 教师中心 API 文档**

### 1. 通用接口

#### 1.1 获取用户信息

此接口用于获取当前登录的教师信息，并在顶部导航栏显示。

-   **Endpoint**: `/api/user/profile`
-   **Method**: `GET`
-   **Description**: 获取当前登录教师的基本信息。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": {
        "isLoggedIn": true,
        "username": "张老师",
        "userId": "t001"
      }
    }
    ```
-   **Error Response (Not Logged In)**:
    ```json
    {
      "code": 401,
      "message": "用户未登录",
      "data": {
        "isLoggedIn": false
      }
    }
    ```

#### 1.2 获取教师的班级列表

此接口用于获取侧边栏“班级管理”下的动态子菜单。

-   **Endpoint**: `/api/teacher/classes`
-   **Method**: `GET`
-   **Description**: 获取该教师所管理的所有班级列表。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": [
        { "id": "c001", "name": "软件工程2101" },
        { "id": "c002", "name": "计算机2102" },
        { "id": "c003", "name": "人工智能2103" }
      ]
    }
    ```

---

### 2. 首页 (Dashboard)

#### 2.1 获取首页统计数据

此接口用于获取首页顶部的四张数据卡片。

-   **Endpoint**: `/api/dashboard/stats`
-   **Method**: `GET`
-   **Description**: 获取课程、学生、待办、资源的总数量。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": {
        "courseCount": 8,
        "studentCount": 152,
        "taskCount": 6,
        "resourceCount": 24
      }
    }
    ```

#### 2.2 获取近期课程列表

-   **Endpoint**: `/api/dashboard/recent-courses`
-   **Method**: `GET`
-   **Query Params**: `limit=3` (获取几条)
-   **Description**: 获取最近的几门课程。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": [
        { "id": 1, "name": "《软件工程》 - 第三章 需求分析" },
        { "id": 2, "name": "《计算机网络》 - 第五章 传输层" },
        { "id": 3, "name": "《操作系统》 - 第四章 存储管理" }
      ]
    }
    ```

#### 2.3 获取待办事项列表

-   **Endpoint**: `/api/dashboard/tasks`
-   **Method**: `GET`
-   **Query Params**: `limit=3`
-   **Description**: 获取最紧急的几条待办事项。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": [
        { "id": 1, "title": "批改《软件工程》期中测试卷" },
        { "id": 2, "title": "审核“计算机2101班”的课程项目申请" },
        { "id": 3, "title": "上传《计算机网络》第六章课件" }
      ]
    }
    ```

#### 2.4 获取活跃学生列表

-   **Endpoint**: `/api/dashboard/active-students`
-   **Method**: `GET`
-   **Query Params**: `limit=4`
-   **Description**: 按学习进度降序获取最活跃的学生。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": [
        { "name": "王晓明", "class": "软件工程2101", "progress": 95 },
        { "name": "李静", "class": "计算机2102", "progress": 92 },
        { "name": "陈伟", "class": "软件工程2101", "progress": 88 },
        { "name": "赵琳", "class": "人工智能2103", "progress": 85 }
      ]
    }
    ```

---

### 3. 学情分析 (Analytics)

#### 3.1 获取学情分析统计数据

-   **Endpoint**: `/api/analytics/stats`
-   **Method**: `GET`
-   **Description**: 获取学情分析页面的四张数据卡片。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": {
        "classCount": 3,
        "courseCount": 8,
        "studentCount": 152,
        "homeworkFinishedCount": 1280
      }
    }
    ```

#### 3.2 获取作业完成率对比数据 (柱状图)

-   **Endpoint**: `/api/analytics/homework-completion`
-   **Method**: `GET`
-   **Description**: 获取各班级的作业平均完成率。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": [
        { "className": "软件2101", "rate": 92 },
        { "className": "计算机2102", "rate": 85 },
        { "className": "人工智能2103", "rate": 88 }
      ]
    }
    ```

#### 3.3 获取考试得分率分布数据 (扇形图)

-   **Endpoint**: `/api/analytics/score-distribution`
-   **Method**: `GET`
-   **Description**: 获取所有学生在最近一次考试中的得分率分布情况。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": [
        { "name": "优秀 (90-100)", "value": 25 },
        { "name": "良好 (80-89)", "value": 45 },
        { "name": "中等 (70-79)", "value": 20 },
        { "name": "及格 (60-69)", "value": 8 },
        { "name": "不及格 (<60)", "value": 2 }
      ]
    }
    ```

#### 3.4 获取学生学习情况列表

-   **Endpoint**: `/api/analytics/student-status`
-   **Method**: `GET`
-   **Query Params**:
    -   `page=1` (页码)
    -   `pageSize=10` (每页数量)
    -   `classId=c001` (可选，按班级筛选)
    -   `keyword=张三` (可选，按姓名搜索)
-   **Description**: 获取详细的学生学习情况，支持分页和筛选。
-   **Success Response (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "成功",
      "data": {
        "total": 152,
        "list": [
          { "name": "王晓明", "courseCompletion": 95, "homeworkSubmission": 100, "lastSeen": "2024-07-28 10:30" },
          { "name": "李静", "courseCompletion": 92, "homeworkSubmission": 95, "lastSeen": "2024-07-28 09:15" },
          { "name": "陈伟", "courseCompletion": 88, "homeworkSubmission": 90, "lastSeen": "2024-07-27 20:05" }
        ]
      }
    }
    ```