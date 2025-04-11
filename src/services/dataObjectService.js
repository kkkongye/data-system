import { reactive, ref } from 'vue'

// 共享的数字对象数据
const sharedTableData = reactive([
  { id: 1, entity: '表01', locationInfo: '(表01, -, -)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可修改'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 2, entity: '表02', locationInfo: '(表02, 1-2, 3-6)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可修改'], auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件', excelData: null },
  { id: 3, entity: '表03', locationInfo: '(表03, 1-6, 12-50)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 4, entity: '表04', locationInfo: '(表04, 3-7, 1-10)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可修改', '可销毁'], auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 5, entity: '表05', locationInfo: '(表05, 5-10, 8-15)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可读', '可修改'], auditInfo: '查看日志', status: '不合格', feedback: '违反传输路径约束', excelData: null },
  { id: 6, entity: '表06', locationInfo: '(表06, 2-8, 3-10)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可销毁'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 7, entity: '表07', locationInfo: '(表07, 1-5, 1-7)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读'], auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 8, entity: '表08', locationInfo: '(表08, 0-0, 0-0)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可修改', '可销毁'], auditInfo: '查看日志', status: '不合格', feedback: '访问权限不符合要求', excelData: null },
  { id: 9, entity: '表09', locationInfo: '(表09, 4-15, 2-12)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可修改'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 10, entity: '表10', locationInfo: '(表10, 7-10, 5-9)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可销毁'], auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 11, entity: '表11', locationInfo: '(表11, 0-1, 0-1)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可修改'], auditInfo: '查看日志', status: '不合格', feedback: '格式约束不符', excelData: null },
  { id: 12, entity: '表12', locationInfo: '(表12, 3-12, 4-8)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可修改', '可销毁'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 13, entity: '表13', locationInfo: '(表13, 5-15, 3-10)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读'], auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 14, entity: '表14', locationInfo: '(表14, 2-5, 6-10)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可修改', '可销毁'], auditInfo: '查看日志', status: '不合格', feedback: '共享约束违规', excelData: null },
  { id: 15, entity: '表15', locationInfo: '(表15, 1-10, 1-20)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读', '可修改'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
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
  removeChangeListener
} 