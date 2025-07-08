我将为您生成项目的接口文档。首先，我需要检查项目中的控制器类来提取API接口信息。
Search files...
让我继续查找更多的控制器类以获取完整的API接口信息：
Read file: teacher-service/src/main/java/org/example/teacherservice/controller/AssignmentController.java
Read file: teacher-service/src/main/java/org/example/teacherservice/controller/ChapterResourceController.java
Read file: teacher-service/src/main/java/org/example/teacherservice/controller/ResourcesController.java
Search files...
根据搜索到的信息，我已经了解了项目中的主要API接口。下面我将为您生成完整的API接口文档：

# 教师管理系统API接口文档

## 一、认证模块 API (teacher-auth)

### 1. 用户登录
- **URL**: `/auth/login`
- **方法**: POST
- **描述**: 用户登录接口，验证用户身份并返回JWT令牌
- **请求参数**:
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```
- **响应结果**:
  ```json
  {
    "token": "JWT令牌",
    "user": {
      "userId": 用户ID,
      "username": "用户名",
      "realName": "真实姓名",
      "userType": "用户类型",
      "departmentId": 部门ID,
      "departmentName": "部门名称"
    }
  }
  ```

### 2. 用户注册
- **URL**: `/auth/register`
- **方法**: POST
- **描述**: 创建新用户账号
- **请求参数**:
  ```json
  {
    "username": "用户名",
    "password": "密码",
    "realName": "真实姓名",
    "userType": "用户类型",
    "departmentId": 部门ID
  }
  ```
- **响应结果**: 返回创建的用户信息

### 3. 获取所有用户
- **URL**: `/auth`
- **方法**: GET
- **描述**: 获取系统中所有用户的列表
- **响应结果**: 用户列表数组

### 4. 获取用户详情
- **URL**: `/auth/{userId}`
- **方法**: GET
- **描述**: 根据用户ID获取用户详细信息
- **路径参数**: userId - 用户ID
- **响应结果**: 用户详细信息对象

### 5. 更新用户信息
- **URL**: `/auth/{userId}`
- **方法**: PUT
- **描述**: 更新用户信息
- **路径参数**: userId - 要更新的用户ID
- **请求参数**: 用户信息对象
- **响应结果**: 更新后的用户信息

### 6. 删除用户
- **URL**: `/auth/{userId}`
- **方法**: DELETE
- **描述**: 删除指定用户
- **路径参数**: userId - 要删除的用户ID
- **响应结果**: 204 No Content

### 7. 按部门查询用户
- **URL**: `/auth/department/{departmentId}`
- **方法**: GET
- **描述**: 根据部门ID查询用户列表
- **路径参数**: departmentId - 部门ID
- **响应结果**: 该部门下的用户列表

### 8. 按用户类型查询用户
- **URL**: `/auth/type/{userType}`
- **方法**: GET
- **描述**: 根据用户类型查询用户列表
- **路径参数**: userType - 用户类型(teacher/ta/department_admin)
- **响应结果**: 该类型的用户列表

### 9. 重置用户密码
- **URL**: `/auth/{userId}/reset-password`
- **方法**: POST
- **描述**: 重置指定用户的密码
- **路径参数**: userId - 用户ID
- **请求参数**: newPassword - 新密码
- **响应结果**: 200 OK

## 二、作业管理 API (teacher-service)

### 1. 测试接口
- **URL**: `/service/assignment/a`
- **方法**: GET
- **描述**: 测试接口，检测JWT认证和用户信息提取功能
- **响应结果**: 布尔值true

## 三、章节资源 API (teacher-service)

### 1. 查询章节可关联资源列表
- **URL**: `/api/chapter-resource/list-resource/{chapterId}`
- **方法**: GET
- **描述**: 获取可以关联到指定章节的资源列表
- **路径参数**: chapterId - 章节ID
- **请求参数**:
  - page - 页码，默认1
  - pageSize - 每页记录数，默认10
- **响应结果**: R包装的分页资源列表

### 2. 关联资源到章节
- **URL**: `/api/chapter-resource/associate`
- **方法**: POST
- **描述**: 将资源关联到章节
- **请求参数**:
  ```json
  {
    "chapterId": "章节ID",
    "resourceId": "资源ID",
    "displayOrder": "显示顺序"
  }
  ```
- **响应结果**: R包装的关联结果

### 3. 查询章节已关联资源
- **URL**: `/api/chapter-resource/list-associated`
- **方法**: GET
- **描述**: 获取指定章节已关联的资源列表
- **请求参数**: chapterId - 章节ID
- **响应结果**: R包装的关联资源列表

### 4. 解除章节与资源关联
- **URL**: `/api/chapter-resource/disassociate`
- **方法**: DELETE
- **描述**: 解除章节与资源的关联
- **请求参数**: id - 关联ID
- **响应结果**: R包装的解除关联结果

## 四、资源管理 API (teacher-service)

### 1. 查询资源列表
- **URL**: `/api/resource/list/{ownerId}`
- **方法**: GET
- **描述**: 获取指定用户的资源列表，支持分页和筛选
- **路径参数**: ownerId - 资源所有者ID
- **请求参数**: ResourcesQueryDTO对象(page, pageSize, name等)
- **响应结果**: R包装的分页资源列表

### 2. 上传资源
- **URL**: `/api/resource/upload`
- **方法**: POST
- **描述**: 上传新资源
- **请求参数**:
  - ownerId - 资源所有者ID
  - file - 上传的文件
  - type - 资源类型
  - difficulty - 难度等级
  - permission - 权限设置
- **响应结果**: R包装的上传结果

### 3. 下载资源
- **URL**: `/api/resource/download/{resourceId}`
- **方法**: GET
- **描述**: 下载指定资源
- **路径参数**: resourceId - 资源ID
- **响应结果**: 文件流

### 4. 资源预览
- **URL**: `/api/resource/preview/{resourceId}`
- **方法**: GET
- **描述**: 生成资源预览链接
- **路径参数**: resourceId - 资源ID
- **响应结果**: R包装的预览信息，包含预览URL、文件名和文件类型

### 5. 删除资源
- **URL**: `/api/resource/delete/{resourceId}`
- **方法**: DELETE
- **描述**: 删除指定资源
- **路径参数**: resourceId - 资源ID
- **响应结果**: R包装的删除结果

## 五、试卷管理服务 (teacher-service)

### 1. 试卷评分接口
- **URL**: 未实现
- **方法**: POST
- **描述**: 批改试卷
- **请求参数**: ExamGrade对象(包含submissionId, graderId, score, feedback)
- **响应结果**: 未实现

## 六、作业评分服务 (teacher-service)

### 1. 批改作业
- **URL**: 未实现
- **方法**: POST
- **描述**: 批改或更新作业成绩
- **请求参数**: AssignmentGradeDTO对象(submissionId, graderId, score, comment)
- **响应结果**: 未实现

## 七、通用响应格式

所有API接口均使用统一的响应格式进行封装：

```json
{
  "code": 状态码,
  "message": "结果信息",
  "data": 返回数据(可选)
}
```

- 成功响应: code=200, message="成功"
- 失败响应: code=500, message="失败"

## 八、异常处理

系统对异常进行了统一处理，主要包括：

1. 业务异常(BusinessException): 返回对应错误码和错误信息
2. 参数校验异常(MethodArgumentNotValidException): 返回参数错误信息
3. 系统异常(Exception): 返回系统繁忙提示

注：部分API接口尚未完全实现，接口文档基于当前代码状态生成，未来可能会有变更。