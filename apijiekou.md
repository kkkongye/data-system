**1. 解密操作接口**

   **请求方式** ：POST

   **接口路径** ：/api/decrypt

   **请求参数** ：

  {

    "objectId": "数字对象ID",

    "token": "解密令牌"

  }

- **响应数据** ：

  {

    "code": 200,

    "message": "解密成功",

    "data": "解密后的内容"

  }

**2. 创建数字对象接口**

   **请求方式** ：POST

   **接口路径** ：/api/objects

   **请求参数** ：

  {

    "entity": "实体名称",

    locationInfo: {  // 注意这里是一个对象，而不是字符串

    row: '',

    col: ''

  },

    "constraint": ["访问权限"],  //多选

    "transferControl": ["可修改"],   //多选

    "excelData": "base64编码的Excel数据"

  }

   **响应数据** ：

  {

    "code": 200,

    "message": "创建成功",

    "data": {

    "id": 1001,

    "entity": "实体名称",

    “locationInfo”: {  // 注意这里是一个对象，而不是字符串

    row: '',

    col: ''

  },

    "constraint": ["访问权限"],

    "transferControl": ["可修改"],

    "auditInfo": "查看日志",

    "status": "待检验",

    "feedback": "",

    "excelData": null,

    "createTime": "2023-07-01 12:00:00",

    "updateTime": "2023-07-01 12:00:00"

    }

  }

 **错误响应** ：

  {

    "code": 400,

    "message": "缺少必要的参数: entity",

    "data": null

  }

**3.编辑数字对象接口**

   **请求方式** ：PUT

   **接口路径** ：/api/objects/:id

   **请求参数** ：

  {

    "entity": "实体名称",

“ locationInfo”: {  // 注意这里是一个对象，而不是字符串

    row: '',

    col: ''

  },

    "constraint": ["访问权限"],

    "transferControl": ["可修改"],

    "status": "状态",

    "feedback": "反馈意见",

    "excelData": "base64编码的Excel数据"

  }

- **响应数据** ：

  {

    "code": 200,

    "message": "更新成功",

    "data": {

    "id": 1001,

    "entity": "实体名称",

“locationInfo”: {  // 注意这里是一个对象，而不是字符串

    row: '',

    col: ''

  },

    "constraint": ["访问权限"],

    "transferControl": ["可修改"],

    "auditInfo": "查看日志",

    "status": "待检验",

    "feedback": "",

    "excelData": null,

    "createTime": "2023-07-01 12:00:00",

    "updateTime": "2023-07-03 09:45:22"

    }

  }

**4. 删除数字对象接口**

   **请求方式** ：DELETE

   **接口路径** ：/api/objects/:id

   **请求参数** ：无

   **响应数据** ：

  {

    "code": 200,

    "message": "删除成功",

    "data": {

    "id": 1001

    }

  }

**5. 更新数字对象状态接口 (治理方专用)**

   **请求方式** ：PUT

   **接口路径** ：/api/objects/:id/status

   **请求参数** ：

  {

    "status": "新状态",

    "feedback": "反馈意见"

  }

- **响应数据** ：

  {

    "code": 200,

    "message": "状态更新成功",

    "data": {

    "id": 1001,

    "entity": "实体名称",

    “locationInfo”: {  // 注意这里是一个对象，而不是字符串

    row: '',

    col: ''

  },

    "constraint": ["访问权限"],

    "transferControl": ["可修改"],

    "auditInfo": "查看日志",

    "status": "不合格",

    "feedback": "缺少约束条件",

    "excelData": null,

    "createTime": "2023-07-01 12:00:00",

    "updateTime": "2023-07-03 15:20:45"

    }

  }

**6. 获取数字对象列表**

   **请求方式** ：GET

   **接口路径** ：/api/objects

   **请求参数** ：

  ?status=待检验&keyword=关键词&constraint=访问权限&transferControl=可修改&sortBy=id&sortOrder=asc&page=1&pageSize=10&includeExcelData=false

- **响应数据** ：

  {

    "code": 200,

    "message": "获取成功",

    "data": {

    "total": 562,

    "list": [

    {

    "id": 1001,

    "entity": "实体名称",

    “locationInfo”: {  // 注意这里是一个对象，而不是字符串

    row: '',

    col: ''

    },

    "constraint": ["访问权限"],

    "transferControl": ["可修改"],

    "auditInfo": "查看日志",

    "status": "已合格",

    "feedback": "",

    "hasExcelData": true,

    "createTime": "2023-07-01 12:00:00",

    "updateTime": "2023-07-01 14:30:00"

    }

    ],

    "page": 1,

    "pageSize": 10

    }

  }

**（与上相似）7. 获取单个数字对象详情**

   **请求方式** ：GET

   **接口路径** ：/api/objects/:id

   **请求参数** ：无

   **响应数据** ：

  {

    "code": 200,

    "message": "获取成功",

    "data": {

    "id": 1001,

    "entity": "实体名称",

    “locationInfo”: {  // 注意这里是一个对象，而不是字符串

    row: '',

    col: ''

  },

    "constraint": ["访问权限"],

    "transferControl": ["可修改"],

    "auditInfo": "查看日志",

    "status": "已合格",

    "feedback": "",

    "excelData": null,

    "createTime": "2023-07-01 12:00:00",

    "updateTime": "2023-07-01 14:30:00"

    }

  }

**8. Excel文件上传接口**

   **请求方式** ：POST

   **接口路径** ：/api/objects/:id/excel

   **请求参数** ：Form数据，包含Excel文件

   **响应数据** ：

  {

    "code": 200,

    "message": "上传成功",

    "data": {

    "id": 1001,

    "entity": "实体名称",

    "excelData": "base64编码的Excel数据或文件URL"

    }

  }

**9. 获取Excel预览数据接口**

   **请求方式** ：GET

   **接口路径** ：/api/objects/:id/excel-preview

   **请求参数** ：无

   **响应数据** ：

  {

    "code": 200,

    "message": "获取成功",

    "data": {

    "id": 1001,

    "entity": "实体名称",

    "excelData": "base64编码的Excel数据",

    "sheets": ["Sheet1", "Sheet2"]

    }

  }

**10. 数据导出检验发送接口（数源方专用）**

   **请求方式** ：POST

   **接口路径** ：/api/objects/submit

   **请求参数** ：

  {

    "objectIds": [1001, 1002, 1003],  // 要提交检验的数字对象ID数组

  }

   **响应数据** ：

  {

    "code": 200,

    "message": "提交检验成功",

    "data": {

    "submissionId": "SUB1",  // 提交批次号

    "submittedCount": 2,               // 成功提交的对象数量

    "objects": [

    {

    "id": 1001,

    "entity": "实体名称1",

    “locationInfo”: {  // 注意这里是一个对象，而不是字符串

    row: '',

    col: ''

  },

    "constraint": ["访问权限", "共享约束"],

    "transferControl": ["可修改", "可读"],

    "auditInfo": "查看日志",

    "status": "待检验",

    "feedback": "",

    "hasExcelData": true,

    "createTime": "2023-07-01 12:00:00",

    "updateTime": "2023-07-01 14:30:00"

    },

    {

    "id": 1002,…

//省略        },

    ],

    "submissionTime": "2023-07-12 14:30:25" // 提交时间

    }

  }

**11. 批量下载数字对象接口**

   **请求方式** ：POST

   **接口路径** ：/api/objects/batch/download

   **请求参数** ：

  {

    "ids": [1001, 1002, 1003]

  }

- **响应数据** ：

  {

    "code": 200,

    "message": "批量下载请求已接受",

    "data": {

    "downloadUrl": "https://example.com/downloads/batch-123456.zip"

    }

  }

**12. 用户角色验证接口**

   **请求方式** ：GET

   **接口路径** ：/api/user/role

   **请求参数** ：无（依赖于用户会话/令牌）

   **响应数据** ：

  {

    "code": 200,

    "message": "获取成功",

    "data": {

    "role": "datasource"

    }

  }

**13. 用户登录接口**

   **请求方式** ：POST

   **接口路径** ：/api/login

   **请求参数** ：

  {

    "username": "用户名",

    "password": "密码",

    "role": "datasource"

  }

- **响应数据** ：

  {

    "code": 200,

    "message": "登录成功",

    "data": {

    "token": "认证令牌",

    "role": "datasource",

    "username": "用户名"

    }

  }

**错误代码说明**


200: 成功


400: 请求参数错误


401: 未授权/未登录


403: 权限不足


404: 资源不存在


500: 服务器内部错误
