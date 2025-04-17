import { reactive, ref } from 'vue'
import axios from 'axios'

// 共享的数字对象数据
const sharedTableData = reactive([
  { id: 1, entity: '表01', locationInfo: '(表01, -, -)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可修改'], propagationControl: { canRead: false, canModify: true, canDestroy: false, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 2, entity: '表02', locationInfo: '(表02, 1-2, 3-6)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可修改'], propagationControl: { canRead: false, canModify: true, canDestroy: false, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件', excelData: null },
  { id: 3, entity: '表03', locationInfo: '(表03, 1-6, 12-50)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读'], propagationControl: { canRead: true, canModify: false, canDestroy: false, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 4, entity: '表04', locationInfo: '(表04, 3-7, 1-10)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可修改', '可销毁'], propagationControl: { canRead: true, canModify: true, canDestroy: true, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 5, entity: '表05', locationInfo: '(表05, 5-10, 8-15)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可读', '可修改'], propagationControl: { canRead: true, canModify: true, canDestroy: false, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '不合格', feedback: '违反传输路径约束', excelData: null },
  { id: 6, entity: '表06', locationInfo: '(表06, 2-8, 3-10)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可销毁'], propagationControl: { canRead: true, canModify: false, canDestroy: true, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 7, entity: '表07', locationInfo: '(表07, 1-5, 1-7)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读'], propagationControl: { canRead: true, canModify: false, canDestroy: false, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 8, entity: '表08', locationInfo: '(表08, 0-0, 0-0)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可修改', '可销毁'], propagationControl: { canRead: false, canModify: true, canDestroy: true, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '不合格', feedback: '访问权限不符合要求', excelData: null },
  { id: 9, entity: '表09', locationInfo: '(表09, 4-15, 2-12)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可修改'], propagationControl: { canRead: true, canModify: true, canDestroy: false, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 10, entity: '表10', locationInfo: '(表10, 7-10, 5-9)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可销毁'], propagationControl: { canRead: true, canModify: false, canDestroy: true, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 11, entity: '表11', locationInfo: '(表11, 0-1, 0-1)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可修改'], propagationControl: { canRead: false, canModify: true, canDestroy: false, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '不合格', feedback: '格式约束不符', excelData: null },
  { id: 12, entity: '表12', locationInfo: '(表12, 3-12, 4-8)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可修改', '可销毁'], propagationControl: { canRead: true, canModify: true, canDestroy: true, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 13, entity: '表13', locationInfo: '(表13, 5-15, 3-10)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读'], propagationControl: { canRead: true, canModify: false, canDestroy: false, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 14, entity: '表14', locationInfo: '(表14, 2-5, 6-10)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可修改', '可销毁'], propagationControl: { canRead: false, canModify: true, canDestroy: true, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '不合格', feedback: '共享约束违规', excelData: null },
  { id: 15, entity: '表15', locationInfo: '(表15, 1-10, 1-20)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可修改'], propagationControl: { canRead: true, canModify: true, canDestroy: false, canShare: false, canDelegate: false }, auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
])

// 监听数据变化的回调函数
const changeListeners = []

// 添加数据变化监听器
const addChangeListener = (callback) => {
  changeListeners.push(callback)
}

// 移除数据变化监听器
const removeChangeListener = (callback) => {
  const index = changeListeners.indexOf(callback)
  if (index !== -1) {
    changeListeners.splice(index, 1)
  }
}

// 通知所有监听器数据已变化
const notifyListeners = () => {
  changeListeners.forEach(callback => callback(sharedTableData))
}

// API URL
const API_URL = 'http://localhost:8080/api'

// 保存最后接收的API原始数据
let lastReceivedApiData = null

// 根据ID获取数字对象详情
const fetchDataObjectById = async (id) => {
  try {
    console.log('正在从后端获取数字对象详情，ID:', id)
    
    // 首先尝试从API获取
    let dataObject = null
    try {
      const response = await axios.get(`${API_URL}/objects/${id}`)
      console.log('获取到的数字对象详情响应:', response)
      
      // 检查响应状态
      if (response && response.data) {
        // 判断返回格式
        
        // 情况1: 标准格式 {code: 200, message: '', data: {...}}
        if (response.data.code === 200 && response.data.data) {
          dataObject = response.data.data
          console.log('使用标准格式响应中的data对象')
        }
        // 情况2: 直接返回带code和data结构的对象，但code不是200 {code: 1, data: {...}}
        else if (response.data.code !== undefined && response.data.data) {
          dataObject = response.data
          console.log('返回了带code和data结构的对象:', response.data.code)
        }
        // 情况3: 直接返回对象 {...}
        else if (response.data && !Array.isArray(response.data)) {
          dataObject = response.data
          console.log('API直接返回了数据对象')
        }
      }
    } catch (apiError) {
      console.error('API获取对象详情失败:', apiError)
      // API失败，继续尝试从本地数据获取
    }
    
    // 如果API获取失败，尝试从本地数据查找
    if (!dataObject) {
      console.log('从本地数据中查找对象ID:', id)
      dataObject = sharedTableData.find(item => compareIds(item.id, id))
      
      if (dataObject) {
        console.log('在本地数据中找到匹配对象')
        // 本地找到的数据已经是前端格式，直接返回
        return dataObject
      } else {
        console.warn('在本地数据中未找到ID为', id, '的对象')
        return null
      }
    }
    
    return dataObject
  } catch (error) {
    console.error('获取数字对象详情失败:', error)
    return null
  }
}

// 从后端获取数据对象列表
const fetchDataObjectsFromBackend = async () => {
  try {
    console.log('正在从后端获取数据对象列表...')
    const response = await axios.get(`${API_URL}/objects/list`)
    console.log('获取到的API响应:', response)
    
    // 保存原始响应数据
    lastReceivedApiData = response.data
    
    // 检查是否有响应数据
    if (response && response.data) {
      // 判断返回格式，兼容多种响应结构
      let dataArray = []
      
      // 情况1: 标准格式 {code: 200, message: '', data: [...]}
      if (response.data.code === 200 && Array.isArray(response.data.data)) {
        dataArray = response.data.data
        console.log('使用标准格式响应中的data数组')
      } 
      // 情况2: 直接返回数组 [...]
      else if (Array.isArray(response.data)) {
        dataArray = response.data
        console.log('API直接返回了数据数组')
      }
      // 情况3: 包含在data字段中 {data: [...]}
      else if (response.data.data && Array.isArray(response.data.data)) {
        dataArray = response.data.data
        console.log('从响应的data字段获取数据数组')
      }
      // 情况4: 其他未知格式，尝试寻找数组
      else {
        console.warn('无法识别API响应格式，尝试查找数组数据')
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            dataArray = response.data[key]
            console.log(`从字段 ${key} 获取到数据数组`)
            break
          }
        }
      }
      
      // 处理获取到的数据
      if (dataArray.length > 0) {
        // 清空当前数据
        sharedTableData.splice(0, sharedTableData.length)
        
        // 添加获取到的数据（经过适配处理）
        dataArray.forEach(item => {
          // 适配后端数据到前端格式
          const adaptedItem = adaptBackendData(item)
          sharedTableData.push(adaptedItem)
        })
        
        // 通知监听器
        notifyListeners()
        console.log('成功更新数据对象列表，共获取到', dataArray.length, '条记录')
        return sharedTableData
      } else {
        console.warn('从API获取的数据为空数组或未找到数组数据')
        return sharedTableData
      }
    } else {
      console.error('获取数据对象列表失败: API返回了空响应')
      return sharedTableData
    }
  } catch (error) {
    console.error('API请求错误:', error)
    // 提供更详细的错误信息
    const errorMessage = error.response 
      ? `状态码: ${error.response.status}, 消息: ${error.response.statusText || '无详细消息'}`
      : error.message || '网络错误'
    console.error(`详细错误信息: ${errorMessage}`)
    return sharedTableData
  }
}

// 获取最后接收的API数据
const getLastReceivedApiData = () => {
  return lastReceivedApiData
}

// 适配后端数据到前端格式
const adaptBackendData = (backendItem) => {
  if (!backendItem) {
    console.warn('收到空数据项，将创建默认对象')
    return createDefaultDataObject()
  }
  
  console.log('正在处理后端数据项:', backendItem)
  
  // 如果有 locationInfoJson 字段，打印日志以便调试
  if (backendItem.locationInfoJson) {
    console.log('发现 locationInfoJson 字段:', backendItem.locationInfoJson)
    try {
      const parsedLocation = JSON.parse(backendItem.locationInfoJson)
      console.log('解析后的位置信息对象:', parsedLocation)
    } catch (error) {
      console.error('位置信息JSON解析失败:', error)
    }
  }
  
  // 处理约束条件 - 从嵌套对象转换为字符串数组
  const constraintArray = extractConstraintArray(backendItem)
  
  // 处理传播控制操作 - 从布尔值属性转换为字符串数组
  const transferControlArray = extractTransferControlArray(backendItem)
  
  // 处理审计信息
  const auditInfo = extractAuditInfo(backendItem)
  
  // 处理位置信息
  const locationInfo = extractLocationInfo(backendItem)
  console.log('处理后的位置信息:', locationInfo)
  
  // 创建一个标准的前端对象结构
  const frontendItem = {
    id: getValidValue(backendItem.id, backendItem.numericId, 0),
    entity: extractEntityName(backendItem),
    locationInfo: locationInfo,
    constraint: constraintArray,
    transferControl: transferControlArray,
    auditInfo: auditInfo,
    status: extractStatus(backendItem),
    feedback: getValidValue(backendItem.feedback, ''),
    excelData: null
  }
  
  // 添加单独的约束条件字段
  const constraintData = extractConstraintData(backendItem)
  frontendItem.formatConstraint = constraintData.formatConstraint
  frontendItem.accessConstraint = constraintData.accessConstraint
  frontendItem.pathConstraint = constraintData.pathConstraint
  frontendItem.regionConstraint = constraintData.regionConstraint
  frontendItem.shareConstraint = constraintData.shareConstraint
  
  return frontendItem
}

// 提取实体名称
const extractEntityName = (backendItem) => {
  // 从dataEntity中提取实体名称
  if (backendItem.dataEntity && backendItem.dataEntity.entity) {
    return backendItem.dataEntity.entity
  }
  
  // 尝试从 dataContent 字段解析
  if (backendItem.dataContent) {
    try {
      const dataEntity = JSON.parse(backendItem.dataContent)
      if (dataEntity && dataEntity.entity) {
        return dataEntity.entity
      }
    } catch (error) {
      console.warn('解析 dataContent 失败:', error)
    }
  }
  
  // 如果包含 id 字段，使用"表xx"格式
  if (backendItem.id || backendItem.numericId) {
    const id = backendItem.id || backendItem.numericId
    // 如果id是数字且小于100，使用2位数格式（例如：表01、表02）
    if (typeof id === 'number' || !isNaN(Number(id))) {
      const numId = Number(id)
      if (numId < 100) {
        return `表${numId < 10 ? '0' + numId : numId}`
      }
    }
    return `表${id}`
  }
  
  // 如果没有dataEntity，尝试其他可能的字段
  return getValidValue(backendItem.entity, '未命名对象')
}

// 提取位置信息
const extractLocationInfo = (backendItem) => {
  // 如果已经是格式化的字符串，直接返回
  if (typeof backendItem.locationInfo === 'string') {
    return backendItem.locationInfo
  }
  
  // 如果有 locationInfoJson 字段（JSON 字符串格式）
  if (backendItem.locationInfoJson) {
    try {
      // 解析 JSON 字符串
      const locationInfoObj = JSON.parse(backendItem.locationInfoJson)
      const entity = extractEntityName(backendItem)
      
      // 如果有 locations 数组且不为空
      if (Array.isArray(locationInfoObj.locations) && locationInfoObj.locations.length > 0) {
        const location = locationInfoObj.locations[0]
        // 格式化行列信息
        const rowRange = location.startRow && location.endRow 
          ? `${location.startRow}-${location.endRow}`
          : '-'
        const colRange = location.startColumn && location.endColumn 
          ? `${location.startColumn}-${location.endColumn}`
          : '-'
        return `(${entity}, ${rowRange}, ${colRange})`
      }
    } catch (error) {
      console.error('解析 locationInfoJson 失败:', error, backendItem.locationInfoJson)
    }
  }
  
  // 如果是对象，尝试格式化
  if (backendItem.locationInfo && typeof backendItem.locationInfo === 'object') {
    const entity = extractEntityName(backendItem)
    
    // 如果有locations数组，使用第一个location
    if (Array.isArray(backendItem.locationInfo.locations) && backendItem.locationInfo.locations.length > 0) {
      const location = backendItem.locationInfo.locations[0]
      const rowRange = location.startRow && location.endRow 
        ? `${location.startRow}-${location.endRow}`
        : '-'
      const colRange = location.startColumn && location.endColumn 
        ? `${location.startColumn}-${location.endColumn}`
        : '-'
      return `(${entity}, ${rowRange}, ${colRange})`
    }
  }
  
  // 如果有dataEntity对象，使用其中的信息
  if (backendItem.dataEntity) {
    const entity = backendItem.dataEntity.entity || '默认表'
    return `(${entity}, -, -)`
  }
  
  return '(-, -, -)'
}

// 从后端数据中提取约束条件数组
const extractConstraintArray = (backendItem) => {
  const constraintArray = []
  
  // 处理1: 如果已经是字符串数组，直接使用
  if (Array.isArray(backendItem.constraint)) {
    return backendItem.constraint
  }
  
  // 处理2: 从constraintSet.constraints或constraintSet.selectedConstraint中提取
  if (backendItem.constraintSet) {
    // 优先使用selectedConstraint
    let constraint = backendItem.constraintSet.selectedConstraint
    
    // 如果没有selectedConstraint但有constraints数组，使用第一个
    if (!constraint && Array.isArray(backendItem.constraintSet.constraints) && 
        backendItem.constraintSet.constraints.length > 0) {
      constraint = backendItem.constraintSet.constraints[0]
    }
    
    // 从constraint对象中提取各项约束并格式化
    if (constraint) {
      if (constraint.formatConstraint) {
        constraintArray.push(`格式约束:${constraint.formatConstraint}`)
      }
      if (constraint.accessConstraint) {
        constraintArray.push(`访问权限:${constraint.accessConstraint}`)
      }
      if (constraint.pathConstraint) {
        constraintArray.push(`传输路径约束:${constraint.pathConstraint}`)
      }
      if (constraint.regionConstraint) {
        constraintArray.push(`地域性约束:${constraint.regionConstraint}`)
      }
      if (constraint.shareConstraint) {
        constraintArray.push(`共享约束:${constraint.shareConstraint}`)
      }
    }
  }
  
  return constraintArray
}

// 提取约束条件数据对象
const extractConstraintData = (backendItem) => {
  const result = {
    formatConstraint: '',
    accessConstraint: '',
    pathConstraint: '',
    regionConstraint: '',
    shareConstraint: ''
  }
  
  // 情况1: 如果前端已经有这些字段，优先使用
  if (backendItem.formatConstraint) result.formatConstraint = backendItem.formatConstraint
  if (backendItem.accessConstraint) result.accessConstraint = backendItem.accessConstraint
  if (backendItem.pathConstraint) result.pathConstraint = backendItem.pathConstraint
  if (backendItem.regionConstraint) result.regionConstraint = backendItem.regionConstraint
  if (backendItem.shareConstraint) result.shareConstraint = backendItem.shareConstraint
  
  // 情况2: 从constraintSet中提取
  if (backendItem.constraintSet) {
    // 优先使用selectedConstraint
    let constraint = backendItem.constraintSet.selectedConstraint
    
    // 如果没有selectedConstraint但有constraints数组，使用第一个
    if (!constraint && Array.isArray(backendItem.constraintSet.constraints) && 
        backendItem.constraintSet.constraints.length > 0) {
      constraint = backendItem.constraintSet.constraints[0]
    }
    
    // 从constraint对象中提取各项约束
    if (constraint) {
      if (constraint.formatConstraint) result.formatConstraint = constraint.formatConstraint
      if (constraint.accessConstraint) result.accessConstraint = constraint.accessConstraint
      if (constraint.pathConstraint) result.pathConstraint = constraint.pathConstraint
      if (constraint.regionConstraint) result.regionConstraint = constraint.regionConstraint
      if (constraint.shareConstraint) result.shareConstraint = constraint.shareConstraint
    }
  }
  
  // 情况3: 尝试从constraint数组中提取
  if (Array.isArray(backendItem.constraint) && backendItem.constraint.length > 0) {
    backendItem.constraint.forEach(item => {
      if (typeof item === 'string') {
        const parts = item.split(':')
        if (parts.length === 2) {
          const key = parts[0].trim()
          const value = parts[1].trim()
          
          if (key === '格式约束') result.formatConstraint = value
          else if (key === '访问权限') result.accessConstraint = value
          else if (key === '传输路径约束') result.pathConstraint = value
          else if (key === '地域性约束') result.regionConstraint = value
          else if (key === '共享约束') result.shareConstraint = value
        }
      }
    })
  }
  
  return result
}

// 从后端数据中提取传播控制操作数组
const extractTransferControlArray = (backendItem) => {
  const transferControlArray = []
  
  // 处理1: 如果已经是字符串数组，直接使用
  if (Array.isArray(backendItem.transferControl)) {
    return backendItem.transferControl
  }
  
  // 处理3: 处理propagationControlJson字段（JSON字符串格式）
  if (backendItem.propagationControlJson) {
    try {
      console.log('尝试解析propagationControlJson:', backendItem.propagationControlJson)
      // 解析JSON字符串
      const propagationControl = JSON.parse(backendItem.propagationControlJson)
      console.log('解析后的propagationControl对象:', propagationControl)
      
      // 从operations对象提取操作
      if (propagationControl && propagationControl.operations) {
        const ops = propagationControl.operations
        // 值为1表示对应操作可用
        if (ops.read === 1) transferControlArray.push('可读')
        if (ops.modify === 1) transferControlArray.push('可修改') 
        if (ops.share === 1) transferControlArray.push('可共享')
        if (ops.delegate === 1) transferControlArray.push('可委托')
        if (ops.destroy === 1) transferControlArray.push('可销毁')
      }
      
      // 如果解析出了传输控制操作，直接返回
      if (transferControlArray.length > 0) {
        console.log('从propagationControlJson提取的传输控制操作:', transferControlArray)
        return transferControlArray
      }
    } catch (error) {
      console.error('解析propagationControlJson失败:', error)
    }
  }
  
  // 处理2: 从propagationControl对象中提取
  if (backendItem.propagationControl) {
    const control = backendItem.propagationControl
    
    // 检查各个权限并添加到数组
    if (control.canRead === true) transferControlArray.push('可读')
    if (control.canModify === true) transferControlArray.push('可修改')
    if (control.canShare === true) transferControlArray.push('可共享')
    if (control.canDelegate === true) transferControlArray.push('可委托')
    if (control.canDestroy === true) transferControlArray.push('可销毁')
    
    // 如果有selectedOperations对象，也检查它
    if (control.selectedOperations) {
      if (control.selectedOperations.read === true) 
        !transferControlArray.includes('可读') && transferControlArray.push('可读')
      if (control.selectedOperations.modify === true) 
        !transferControlArray.includes('可修改') && transferControlArray.push('可修改')
      if (control.selectedOperations.share === true) 
        !transferControlArray.includes('可共享') && transferControlArray.push('可共享')
      if (control.selectedOperations.delegate === true) 
        !transferControlArray.includes('可委托') && transferControlArray.push('可委托')
      if (control.selectedOperations.destroy === true) 
        !transferControlArray.includes('可销毁') && transferControlArray.push('可销毁')
    }
  }
  
  return transferControlArray
}

// 提取审计信息
const extractAuditInfo = (backendItem) => {
  // 如果有auditInfo对象
  if (backendItem.auditInfo) {
    // 如果auditInfo是字符串，直接返回
    if (typeof backendItem.auditInfo === 'string') {
      return backendItem.auditInfo
    }
    
    // 如果auditInfo是对象，尝试构建有意义的信息
    if (typeof backendItem.auditInfo === 'object') {
      // 如果有具体的审计信息字段，可以构建更详细的提示
      if (backendItem.auditInfo.loggingEnabled === true) {
        return '启用日志记录'
      }
      
      // 返回对象的字符串表示
      return '审计信息可用' 
    }
  }
  
  // 默认返回
  return '查看日志'
}

// 提取状态信息
const extractStatus = (backendItem) => {
  // 优先从dataEntity中获取
  if (backendItem.dataEntity && backendItem.dataEntity.status) {
    return backendItem.dataEntity.status
  }
  
  // 其次尝试直接获取status字段
  return getValidValue(backendItem.status, '待检验')
}

// 获取有效值，如果第一个值无效则使用后备值
const getValidValue = (value, ...fallbacks) => {
  if (value !== undefined && value !== null) {
    return value
  }
  
  // 遍历所有后备值，返回第一个有效的
  for (const fallback of fallbacks) {
    if (fallback !== undefined && fallback !== null) {
      return fallback
    }
  }
  
  // 如果都没有有效值，返回空字符串
  return ''
}

// 确保数组格式
const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return [...value]
  }
  return value ? [value] : []
}

// 创建默认数据对象
const createDefaultDataObject = () => {
  return {
    id: 0,
    entity: '未命名对象',
    locationInfo: '(-, -, -)',
    constraint: [],
    transferControl: ['可读', '可修改', '可销毁', '可共享', '可委托'],
    propagationControl: {
      canRead: true,
      canModify: true,
      canDestroy: true,
      canShare: true,
      canDelegate: true
    },
    auditInfo: '查看日志',
    status: '待检验',
    feedback: '',
    excelData: null,
    formatConstraint: '',
    accessConstraint: '',
    pathConstraint: '',
    regionConstraint: '',
    shareConstraint: ''
  }
}

// 通过API添加数字对象
const addDataObjectViaApi = async (dataObject) => {
  try {
    console.log('正在通过API添加数字对象，数据:', dataObject)
    const response = await axios.post(`${API_URL}/objects`, dataObject)
    console.log('添加数字对象API响应:', response)
    
    // 检查响应状态
    if (response && response.data) {
      // 判断返回格式
      if (response.data.code === 200) {
        console.log('数字对象添加成功')
        
        // 如果响应中包含了对象ID，使用响应返回的ID
        let createdObject = dataObject
        if (response.data.data && response.data.data.id) {
          createdObject.id = response.data.data.id
        }
        
        // 同时更新本地数据
        addDataObject(createdObject)
        
        return {
          success: true,
          object: createdObject
        }
      }
    }
    
    return {
      success: false,
      message: '添加失败'
    }
  } catch (error) {
    console.error('通过API添加数字对象失败:', error)
    return {
      success: false,
      message: error.message || '添加失败'
    }
  }
}

// 添加新的数字对象
const addDataObject = (newObject) => {
  // 确保对象有唯一ID
  const newId = sharedTableData.length > 0 
    ? Math.max(...sharedTableData.map(item => item.id)) + 1 
    : 1
  
  const objectToAdd = {
    id: newId,
    ...newObject,
    auditInfo: newObject.auditInfo || '查看日志',
    status: newObject.status || '待检验',
    feedback: newObject.feedback || ''
  }
  
  // 添加到数组
  sharedTableData.unshift(objectToAdd)
  
  // 通知监听器
  notifyListeners()
  
  return objectToAdd
}

// 通过API更新数字对象
const updateDataObjectViaApi = async (id, dataObject) => {
  try {
    console.log('正在通过API更新数字对象，ID:', id, '数据:', dataObject)
    const response = await axios.put(`${API_URL}/objects/${id}`, dataObject)
    console.log('更新数字对象API响应:', response)
    
    // 检查响应状态
    if (response && response.data) {
      // 判断返回格式
      if (response.data.code === 200) {
        console.log('数字对象更新成功')
        
        // 同时更新本地数据
        updateDataObject(dataObject)
        
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('通过API更新数字对象失败:', error)
    return false
  }
}

// 更新数字对象
const updateDataObject = (updatedObject) => {
  const index = sharedTableData.findIndex(item => item.id === updatedObject.id)
  
  if (index !== -1) {
    // 保留原始对象中没被更新的字段
    const originalObject = sharedTableData[index]
    sharedTableData[index] = {
      ...originalObject,
      ...updatedObject
    }
    
    // 通知监听器
    notifyListeners()
    
    return true
  }
  
  return false
}

// 通过API删除数字对象
const deleteDataObjectViaApi = async (id) => {
  try {
    console.log('正在通过API删除数字对象，ID:', id)
    const response = await axios.delete(`${API_URL}/${id}`)
    console.log('删除数字对象API响应:', response)
    
    // 检查响应状态
    if (response && response.data) {
      // 判断返回格式
      if (response.data.code === 200) {
        console.log('数字对象删除成功')
        
        // 同时更新本地数据
        deleteDataObject(id)
        
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('通过API删除数字对象失败:', error)
    return false
  }
}

// 删除数字对象
const deleteDataObject = (id) => {
  const index = sharedTableData.findIndex(item => item.id === id)
  
  if (index !== -1) {
    sharedTableData.splice(index, 1)
    
    // 通知监听器
    notifyListeners()
    
    return true
  }
  
  return false
}

// 更新对象状态
const updateObjectStatus = (id, status, feedback = '') => {
  const index = sharedTableData.findIndex(item => item.id === id)
  
  if (index !== -1) {
    sharedTableData[index].status = status
    
    // 如果是已合格或待检验状态，清空反馈意见
    if (status === '已合格' || status === '待检验') {
      sharedTableData[index].feedback = ''
    } else {
      sharedTableData[index].feedback = feedback
    }
    
    // 通知监听器
    notifyListeners()
    
    return true
  }
  
  return false
}

// 获取所有数字对象
const getAllDataObjects = () => {
  return sharedTableData
}

export default {
  addDataObject,
  updateDataObject,
  deleteDataObject,
  updateObjectStatus,
  getAllDataObjects,
  addChangeListener,
  removeChangeListener,
  fetchDataObjectsFromBackend,
  getLastReceivedApiData,
  fetchDataObjectById,
  updateDataObjectViaApi,
  addDataObjectViaApi,
  deleteDataObjectViaApi
} 