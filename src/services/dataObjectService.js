import { reactive, ref } from 'vue'

// 共享的数字对象数据
const sharedTableData = reactive([
  { id: 1, entity: '表1', locationInfo: '(表1, -, -)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可修改'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 2, entity: '表2', locationInfo: '(表2, 1-2, 3-6)', constraint: ['格式约束:jpg', '访问权限:只允许管理方获取', '传输路径约束:面对面', '地域性约束:外网', '共享约束:不允许共享'], formatConstraint: 'jpg', accessConstraint: '只允许管理方获取', pathConstraint: '面对面', regionConstraint: '外网', shareConstraint: '不允许共享', transferControl: ['可修改'], auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件', excelData: null },
  { id: 3, entity: '表3', locationInfo: '(表3, 1-6, 12-50)', constraint: ['格式约束:xlsx', '访问权限:全部允许', '传输路径约束:点对点', '地域性约束:内网', '共享约束:允许共享'], formatConstraint: 'xlsx', accessConstraint: '全部允许', pathConstraint: '点对点', regionConstraint: '内网', shareConstraint: '允许共享', transferControl: ['可读'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
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