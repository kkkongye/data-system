<template>
  <div class="datasource-container">
    <!-- 头部导航 -->
    <AppHeader role-name="数源方" @logout="logout" />
    
    <!-- API错误提示 -->
    <div v-if="apiErrorVisible" class="api-error-alert">
      <el-alert
        title="接口连接错误"
        type="warning"
        description="无法连接到后端API服务，可能原因: 1.后端服务未启动 2.跨域(CORS)限制 3.网络连接问题"
        show-icon
        :closable="true"
        @close="apiErrorVisible = false"
      >
        <template #default>
          <div class="api-error-content">
            <p>可能的解决方案:</p>
            <ol>
              <li>确保后端服务在 http://localhost:8080 正常运行</li>
              <li>在后端Controller类上添加 <code>@CrossOrigin(origins = "*")</code> 注解启用CORS</li>
              <li>检查网络连接和防火墙设置</li>
            </ol>
            <div class="api-error-actions">
              <el-button size="small" @click="apiErrorVisible = false">知道了</el-button>
              <el-button size="small" type="primary" @click="refreshData">重试连接</el-button>
            </div>
          </div>
        </template>
      </el-alert>
    </div>
    
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 标签页 -->
      <div class="content-card">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="数字对象列表" name="objectList">
            <!-- 在ObjectList上方添加刷新按钮 -->
            <div class="refresh-container">
              <el-button type="primary" plain icon="RefreshRight" @click="refreshData">刷新数据</el-button>
              <el-popover
                placement="bottom"
                width="400"
                trigger="click"
                v-if="showDebugTools"
              >
                <template #reference>
                  <el-button type="info" plain>显示原始数据</el-button>
                </template>
                <template #default>
                  <div class="debug-data-container">
                    <div class="debug-header">
                      <span>后端返回的原始数据示例</span>
                      <el-button type="text" @click="copyDebugData">复制</el-button>
                    </div>
                    
                    <!-- 添加位置信息专区 -->
                    <div v-if="extractLocationInfo(lastReceivedApiData)" class="debug-location-info">
                      <h4>位置信息详情：</h4>
                      <pre style="max-height: 150px; overflow: auto; font-size: 12px;">{{ extractLocationInfo(lastReceivedApiData) }}</pre>
                    </div>
                    
                    <pre style="max-height: 300px; overflow: auto; font-size: 12px;">{{ prettifyJson(lastReceivedApiData) }}</pre>
                  </div>
                </template>
              </el-popover>
            </div>
            
            <!-- 使用ObjectList组件代替原有的列表内容 -->
            <ObjectList 
              :data="filteredTableData"
              v-model:current-status="currentStatus"
              v-model:search-keyword="searchKeyword"
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total-count="totalCount"
              :is-qualified-status="isQualifiedStatus"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
              @edit="handleEdit"
              @delete="handleDelete"
              @preview="previewEntity"
              @create="showCreateDialog"
              @export="handleExport"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
  
  <!-- 编辑对象弹窗 -->
  <EditObjectDialogNew
    v-model:visible="editDialogVisible"
    :title="'编辑数字对象'"
    v-model:modelValue="editForm"
    @save="saveEditObject"
    @cancel="cancelEdit"
    @navigate-home="navigateToHome"
  />

  <!-- 新建对象弹窗 -->
  <CreateObjectDialog
    v-model:visible="createDialogVisible"
    :title="'新建数字对象'"
    v-model:modelValue="createForm"
    @save="saveCreateObject"
    @cancel="cancelCreate"
  />

  <!-- Excel预览对话框 -->
  <el-dialog
    v-model="previewDialogVisible"
    :title="`预览Excel - ${previewForm.entity}`"
    width="90%"
    :close-on-click-modal="false"
    draggable
    class="custom-dialog"
    top="5vh"
  >
    <div class="preview-header">
      <div class="preview-info">
        <div>实体：<strong>{{ previewForm.entity }}</strong></div>
        <div>定位信息：<strong>{{ previewForm.locationInfo }}</strong></div>
        <div>约束条件：<strong>{{ previewForm.constraint.join('；') || '-' }}</strong></div>
        <div>传输控制操作：<strong>{{ previewForm.transferControl.join('；') || '-' }}</strong></div>
        <div>状态：<strong>{{ previewForm.status }}</strong></div>
      </div>
    </div>
    
    <ExcelPreview
      :file="currentExcelFile"
      :title="previewForm.entity"
      :use-web-worker="true"
      :max-visible-columns="30"
      @data-loaded="handleExcelDataLoaded"
      @error="handleExcelError"
    />
    
    <template #footer v-if="currentExcelFile">
      <span class="dialog-footer">
        <el-button @click="previewDialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>


</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Document, RefreshRight } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import ExcelPreview from '@/components/ExcelPreview.vue'
import EditObjectDialogNew from '@/components/source/EditObjectDialogNew.vue'
import CreateObjectDialog from '@/components/source/CreateObjectDialog.vue'
import ObjectList from '@/components/source/ObjectList.vue'
import AppHeader from '@/components/AppHeader.vue'
import CommonPagination from '@/components/CommonPagination.vue'
import dataObjectService from '@/services/dataObjectService'

const router = useRouter()
const activeTab = ref('objectList')
const currentStatus = ref('') // 默认显示全部数字对象
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const selectedRows = ref([])

// 添加计算属性判断是否为已合格状态
const isQualifiedStatus = computed(() => currentStatus.value === '已合格')

const editDialogVisible = ref(false)
const createDialogVisible = ref(false) // 新建对话框可见性
const editFormRef = ref(null)
const createFormRef = ref(null) // 新建表单引用
const editForm = reactive({
  id: '',
  entity: '',
  locationInfo: {
    row: '',
    col: ''
  },
  constraint: [],
  transferControl: [],
  auditInfo: '',
  status: '',
  feedback: '',
  excelData: null // 新增保存Excel文件数据
})
const editingIndex = ref(-1)

// 表格数据 - 从共享服务获取
const tableData = ref(dataObjectService.getAllDataObjects())

// 排序状态
const sortState = reactive({
  prop: '',
  order: ''
})

// 确保数据是数组格式
const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return [...value]
  }
  return value ? [value] : []
}

// 根据状态和搜索条件过滤数据
const filteredTableData = computed(() => {
  let result = tableData.value

  // 状态过滤
  if (currentStatus.value) {
    result = result.filter(item => item.status === currentStatus.value)
  }

  // 关键字搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => {
      // 检查ID和实体
      if (item.id.toString().includes(keyword) || 
          item.entity.toLowerCase().includes(keyword)) {
        return true
      }
      
      // 确保约束条件是数组并检查
      const constraints = ensureArray(item.constraint)
      if (constraints.some(c => c && c.toLowerCase().includes(keyword))) {
        return true
      }
      
      // 确保传输控制操作是数组并检查
      const transferControls = ensureArray(item.transferControl)
      if (transferControls.some(t => t && t.toLowerCase().includes(keyword))) {
        return true
      }
      
      return false
    })
  }

  // 排序
  if (sortState.prop === 'id') {
    if (sortState.order === 'ascending') {
      result = [...result].sort((a, b) => a.id - b.id)
    } else if (sortState.order === 'descending') {
      result = [...result].sort((a, b) => b.id - a.id)
    }
  }

  // 更新总数据量
  totalCount.value = result.length

  // 分页计算已经由ObjectList组件处理
  return result
})

// 处理表格选择变更
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 编辑对象
const handleEdit = (row) => {
  editingIndex.value = tableData.value.findIndex(item => item.id === row.id)
  
  // 处理定位信息格式
  let locationParts = ['', '']
  if (row.locationInfo) {
    if (typeof row.locationInfo === 'string') {
      // 从格式如"(表1, 0-4, 0-4)"中提取行列信息
      const matches = row.locationInfo.match(/\((.*?),\s*(.*?),\s*(.*?)\)/)
      if (matches && matches.length > 3) {
        locationParts = [matches[2].trim(), matches[3].trim()]
      }
    } else if (typeof row.locationInfo === 'object' && row.locationInfo.row && row.locationInfo.col) {
      locationParts = [row.locationInfo.row, row.locationInfo.col]
    }
  }
  
  // 设置编辑表单数据
  editForm.id = row.id
  editForm.entity = row.entity
  editForm.locationInfo = {
    row: locationParts[0],
    col: locationParts[1]
  }
  
  // 设置约束条件
  // 使用辅助函数确保约束条件和传输控制是数组
  editForm.constraint = ensureArray(row.constraint)
  
  // 设置各约束字段
  editForm.formatConstraint = row.formatConstraint || ''
  editForm.accessConstraint = row.accessConstraint || ''
  editForm.pathConstraint = row.pathConstraint || ''
  editForm.regionConstraint = row.regionConstraint || ''
  editForm.shareConstraint = row.shareConstraint || ''
  
  // 如果没有明确的各约束字段值，尝试从约束数组中解析
  if ((!editForm.formatConstraint || !editForm.accessConstraint || !editForm.pathConstraint || 
      !editForm.regionConstraint || !editForm.shareConstraint) && editForm.constraint.length > 0) {
    
    editForm.constraint.forEach(item => {
      if (typeof item === 'string') {
        const parts = item.split(':')
        if (parts.length === 2) {
          const type = parts[0].trim()
          const value = parts[1].trim()
          
          if (type === '格式约束') editForm.formatConstraint = value
          else if (type === '访问权限') editForm.accessConstraint = value
          else if (type === '传输路径约束') editForm.pathConstraint = value
          else if (type === '地域性约束') editForm.regionConstraint = value
          else if (type === '共享约束') editForm.shareConstraint = value
        }
      }
    })
  }
  
  editForm.transferControl = ensureArray(row.transferControl)
  editForm.auditInfo = row.auditInfo || ''
  editForm.status = row.status || ''
  editForm.feedback = row.feedback || ''
  
  editForm.excelData = row.excelData // 保留原有的Excel文件数据
  
  console.log('打开编辑对话框，设置表单数据:', editForm)
  editDialogVisible.value = true
  console.log('editDialogVisible已设置为:', editDialogVisible.value)
}

// 取消编辑
const cancelEdit = () => {
  editDialogVisible.value = false
  // 重置表单
  editForm.id = ''
  editForm.entity = ''
  editForm.locationInfo = {
    row: '',
    col: ''
  }
  editForm.constraint = []
  editForm.transferControl = []
  editForm.auditInfo = ''
  editForm.status = ''
  editForm.feedback = ''
  editForm.excelData = null
  
  editingIndex.value = -1
}

// 保存编辑
const saveEditObject = (updatedObject) => {
  // 检查是否为离线模式上传（如果有excelData但没有通过API上传）
  const isOfflineMode = updatedObject.offlineMode === true

  // 如果没有传输控制操作，设置默认值
  if (!updatedObject.transferControl || updatedObject.transferControl.length === 0) {
    updatedObject.transferControl = ['可读', '可修改', '可销毁', '可共享', '可委托']
  }
  
  // 如果没有propagationControl对象，根据transferControl创建
  if (!updatedObject.propagationControl) {
    updatedObject.propagationControl = {
      canRead: updatedObject.transferControl.includes('可读'),
      canModify: updatedObject.transferControl.includes('可修改'),
      canDestroy: updatedObject.transferControl.includes('可销毁'),
      canShare: updatedObject.transferControl.includes('可共享'),
      canDelegate: updatedObject.transferControl.includes('可委托')
    }
  }

  // 处理定位信息为字符串格式
  const entityName = updatedObject.entity
  const displayObject = {
    ...updatedObject,
    locationInfo: `(${entityName}, ${updatedObject.locationInfo.row}, ${updatedObject.locationInfo.col})`,
  }
  
  // 使用服务更新数据对象
  const updated = dataObjectService.updateDataObject(displayObject)
  
  if (updated) {
    console.log('保存编辑后的对象:', displayObject)
    
    // 根据是否为离线模式显示不同的提示
    if (isOfflineMode) {
      ElMessage({
        message: `已离线保存对 ${entityName} 的编辑，但Excel文件未上传到服务器`,
        type: 'warning',
        duration: 5000
      })
    } else {
      ElMessage.success(`已保存对 ${entityName} 的编辑`)
    }
    
    // 刷新数据列表
    refreshData()
  } else {
    ElMessage.error(`编辑失败：未找到ID为 ${updatedObject.id} 的对象`)
  }
}

// 删除对象
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除"${row.entity}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // 使用服务删除数据对象
    const deleted = dataObjectService.deleteDataObject(row.id)
    
    if (deleted) {
      ElMessage.success(`已删除: ${row.entity}`)
    } else {
      ElMessage.error(`删除失败：未找到ID为 ${row.id} 的对象`)
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 退出登录
const logout = () => {
  localStorage.removeItem('role')
  router.push('/login')
}

// 显示创建对象对话框
const showCreateDialog = () => {
  // 重置表单数据
  createForm.entity = ''
  createForm.locationInfo = {
    row: '',
    col: ''
  }
  createForm.constraint = []
  // 重置约束条件字段
  createForm.formatConstraint = ''
  createForm.accessConstraint = ''
  createForm.pathConstraint = ''
  createForm.regionConstraint = ''
  createForm.shareConstraint = ''
  createForm.transferControl = []
  createForm.classificationValue = ''
  createForm.excelData = null // 新增保存Excel文件数据
  
  console.log('打开新建对话框')
  createDialogVisible.value = true
  console.log('createDialogVisible已设置为:', createDialogVisible.value)
}

// 创建表单数据
const createForm = reactive({
  entity: '',
  locationInfo: {
    row: '',
    col: ''
  },
  constraint: [],
  formatConstraint: '',
  accessConstraint: '',
  pathConstraint: '',
  regionConstraint: '',
  shareConstraint: '',
  transferControl: [],
  classificationValue: '',
  excelData: null // 新增保存Excel文件数据
})

// 表单校验规则
const formRules = {
  locationInfo: [
    { 
      validator: (rule, value, callback) => {
        if (createForm.locationInfo.row && createForm.locationInfo.col) {
          callback()
        } else {
          callback(new Error('请输入行和列'))
        }
      },
      trigger: 'blur'
    }
  ]
}

// 处理文件变更
const handleFileChange = (file) => {
  // 验证文件类型
  const isExcel = file.raw.type === 'application/vnd.ms-excel' || 
                 file.raw.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (!isExcel) {
    ElMessage.warning('请上传Excel格式的文件（.xls或.xlsx）');
    return false;
  }
  
  // 设置实体名称为文件名（不带扩展名）
  const fileName = file.name;
  const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  createForm.entity = fileNameWithoutExt;
  
  // 读取并保存Excel文件内容
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // 保存文件的二进制数据
      createForm.excelData = e.target.result;
      ElMessage.success(`已选择Excel表格"${fileName}"`);
    } catch (error) {
      console.error('读取Excel文件失败:', error);
      ElMessage.error('读取Excel文件失败');
    }
  };
  reader.onerror = () => {
    ElMessage.error('读取文件失败');
  };
  reader.readAsBinaryString(file.raw);
}

// 保存新建
const saveCreateObject = (newObject) => {
  // 检查是否为离线模式上传（如果有excelData但没有通过API上传）
  const isOfflineMode = newObject.offlineMode === true
  
  const entityName = newObject.entity || '未上传'
  
  // 如果没有传输控制操作，设置默认值
  if (!newObject.transferControl || newObject.transferControl.length === 0) {
    newObject.transferControl = ['可读', '可修改', '可销毁', '可共享', '可委托']
  }
  
  // 如果没有propagationControl对象，根据transferControl创建
  if (!newObject.propagationControl) {
    newObject.propagationControl = {
      canRead: newObject.transferControl.includes('可读'),
      canModify: newObject.transferControl.includes('可修改'),
      canDestroy: newObject.transferControl.includes('可销毁'),
      canShare: newObject.transferControl.includes('可共享'),
      canDelegate: newObject.transferControl.includes('可委托')
    }
  }
  
  // 准备新对象
  const displayObject = {
    entity: entityName,
    locationInfo: `(${entityName}, ${newObject.locationInfo.row}, ${newObject.locationInfo.col})`,
    constraint: newObject.constraint,
    formatConstraint: newObject.formatConstraint,
    accessConstraint: newObject.accessConstraint,
    pathConstraint: newObject.pathConstraint,
    regionConstraint: newObject.regionConstraint,
    shareConstraint: newObject.shareConstraint,
    transferControl: newObject.transferControl,
    propagationControl: newObject.propagationControl,
    excelData: newObject.excelData
  }
  
  // 使用服务添加数据对象
  const addedObject = dataObjectService.addDataObject(displayObject)
  
  console.log('成功创建数字对象:', addedObject)
  
  // 根据是否为离线模式显示不同的提示
  if (isOfflineMode) {
    ElMessage({
      message: `已在本地创建数字对象，可点击实体名称预览Excel内容，但Excel文件未上传到服务器`,
      type: 'warning',
      duration: 5000
    })
  } else {
    ElMessage.success(`成功新建数字对象，可点击实体名称预览Excel内容`)
  }
}

// 取消新建
const cancelCreate = () => {
  // 对话框会自动关闭，不需要额外处理
}

// 处理排序变化
const handleSortChange = (column) => {
  if (column.prop) {
    sortState.prop = column.prop
    sortState.order = column.order
  } else {
    sortState.prop = ''
    sortState.order = ''
  }
}

// Excel预览相关
const previewDialogVisible = ref(false)
const previewForm = reactive({
  id: '',
  entity: '',
  locationInfo: '',
  constraint: [],
  transferControl: [],
  status: ''
})

// Excel表格数据
const excelTableColumns = ref([])
const excelTableData = ref([])
const isExcelLoading = ref(false)
const excelSheets = ref([]) // 存储工作表名称
const activeSheet = ref('') // 当前激活的工作表
const currentWorkbook = ref(null) // 当前工作簿对象

// 在script setup部分添加新的变量和方法
const currentExcelFile = ref(null)

// 修改previewEntity方法
const previewEntity = (row) => {
  console.log('预览实体数据:', row)
  
  // 设置预览表单数据
  previewForm.id = row.id
  previewForm.entity = row.entity
  previewForm.locationInfo = row.locationInfo
  previewForm.constraint = ensureArray(row.constraint)
  previewForm.transferControl = ensureArray(row.transferControl)
  previewForm.status = row.status
  
  // 清空当前Excel数据
  currentExcelFile.value = null
  excelTableData.value = []
  excelTableColumns.value = []
  excelSheets.value = []
  
  // 显示预览对话框
  previewDialogVisible.value = true
  
  // 检查是否有实际的Excel数据
  if (row.excelData) {
    console.log('有Excel数据，开始加载')
    ElMessage.info('正在准备Excel数据，请稍候...')
    isExcelLoading.value = true
    
    // 使用setTimeout避免UI阻塞
    setTimeout(() => {
      try {
        currentExcelFile.value = row.excelData
      } catch (error) {
        console.error('加载Excel数据出错:', error)
        ElMessage.error(`加载Excel数据出错: ${error.message}`)
        isExcelLoading.value = false
        currentExcelFile.value = null
      }
    }, 100)
  } else {
    console.log('没有Excel数据，显示空状态')
    currentExcelFile.value = null
    isExcelLoading.value = false
  }
}

// 添加新的处理方法
const handleExcelDataLoaded = (data) => {
  console.log('Excel数据加载完成:', data)
  
  // 检查是否为真实上传的Excel文件
  const isUserUploadedFile = tableData.value.some(row => 
    row.id === previewForm.id && row.excelData && row.excelData === currentExcelFile.value);
  
  // 只有当不是用户上传的文件时才禁用数据显示
  if (!isUserUploadedFile) {
    console.warn('检测到非用户上传的Excel数据，已屏蔽');
    excelTableColumns.value = [];
    excelTableData.value = [];
    excelSheets.value = [];
    isExcelLoading.value = false;
    currentExcelFile.value = null;
    return;
  }
  
  // 可以在这里处理加载完的数据，例如根据定位信息高亮显示特定单元格
  const { headers, data: excelRows, sheets } = data;
  
  // 存储Excel表格数据，以便后续可能的操作
  excelTableColumns.value = headers || [];
  excelTableData.value = excelRows || [];
  excelSheets.value = sheets || [];
  
  isExcelLoading.value = false;
  
  if (excelRows && excelRows.length) {
    ElMessage.success(`已成功加载 ${excelRows.length} 行数据`);
  } else {
    console.warn('加载的Excel数据为空');
  }
}

const handleExcelError = (error) => {
  console.error('Excel加载错误:', error)
  isExcelLoading.value = false
  ElMessage.error(`加载Excel时出错: ${error}`)
}

// 处理导出功能
const handleExport = () => {
  ElMessage.success('导出功能待实现')
}

// 清除所有测试数据
const clearAllTestData = () => {
  console.log('清除所有测试数据')
  // 确保所有表格行的excelData为null
  tableData.value.forEach(row => {
    row.excelData = null
  })
  
  // 清空当前Excel文件和相关数据
  currentExcelFile.value = null
  excelTableData.value = []
  excelTableColumns.value = []
  excelSheets.value = []
}

// 在组件挂载后执行清理
onMounted(() => {
  clearAllTestData()
  // 添加数据变化监听器
  dataObjectService.addChangeListener((newData) => {
    console.log('数据源方收到数据变化:', newData)
    // 无需手动更新tableData，因为是响应式引用
  })
  
  // 从后端API加载数据
  loadDataFromBackend()
})

// 添加新的变量和方法
const apiErrorVisible = ref(false)

// 添加调试相关功能
const showDebugTools = ref(true) // 设置为true显示调试工具
const lastReceivedApiData = ref(null)

// 复制调试数据到剪贴板
const copyDebugData = () => {
  const jsonStr = JSON.stringify(lastReceivedApiData.value, null, 2)
  navigator.clipboard.writeText(jsonStr)
    .then(() => {
      ElMessage.success('已复制到剪贴板')
    })
    .catch(err => {
      ElMessage.error('复制失败: ' + err)
      console.error('复制失败:', err)
    })
}

// 格式化JSON
const prettifyJson = (json) => {
  if (!json) return '暂无数据'
  try {
    return JSON.stringify(json, null, 2)
  } catch (e) {
    return '无法格式化: ' + e.message
  }
}

// 从后端加载数据
const loadDataFromBackend = async () => {
  try {
    console.log('开始从后端加载数据...')
    ElMessage.info('正在从后端加载数据...')
    await dataObjectService.fetchDataObjectsFromBackend()
    
    // 获取最后接收的API数据
    lastReceivedApiData.value = dataObjectService.getLastReceivedApiData()
    
    console.log('后端数据加载完成')
    ElMessage.success('数据加载成功')
    
    // 成功后隐藏错误提示
    apiErrorVisible.value = false
  } catch (error) {
    console.error('从后端加载数据失败:', error)
    
    // 判断是否为跨域错误
    const isCORSError = error.message && (
      error.message.includes('NetworkError') || 
      error.message.includes('Network Error') ||
      error.message.includes('CORS') || 
      error.message.includes('cross-origin')
    )
    
    if (isCORSError) {
      ElMessage.error('跨域请求失败，请确保后端已开启CORS支持')
      apiErrorVisible.value = true
    } else {
      ElMessage.warning('从后端加载数据失败，已切换到本地模拟数据')
      apiErrorVisible.value = true
    }
    
    // 如果当前没有数据，则使用模拟数据
    if (tableData.value.length === 0) {
      console.log('使用本地模拟数据')
    }
  }
}

// 添加刷新数据的方法
// 添加loadTableData作为refreshData的别名
const loadTableData = () => {
  // 调用refreshData作为实际实现
  refreshData()
}

const refreshData = async () => {
  try {
    ElMessage.info('正在从后端刷新数据...')
    await dataObjectService.fetchDataObjectsFromBackend()
    
    // 获取最后接收的API数据
    lastReceivedApiData.value = dataObjectService.getLastReceivedApiData()
    
    ElMessage.success('数据刷新成功')
    
    // 成功后隐藏错误提示
    apiErrorVisible.value = false
  } catch (error) {
    console.error('刷新数据失败:', error)
    
    // 判断是否为跨域错误
    const isCORSError = error.message && (
      error.message.includes('NetworkError') || 
      error.message.includes('Network Error') ||
      error.message.includes('CORS') || 
      error.message.includes('cross-origin')
    )
    
    if (isCORSError) {
      ElMessage.error('跨域请求失败，请确保后端已开启CORS支持并且服务正常运行')
      apiErrorVisible.value = true
    } else if (error.response && error.response.status) {
      // 处理HTTP错误
      ElMessage.error(`请求服务器失败: ${error.response.status} ${error.response.statusText || ''}`)
      apiErrorVisible.value = true
    } else {
      ElMessage.error('刷新数据失败，请检查后端服务是否正常运行')
      apiErrorVisible.value = true
    }
  }
}

// 处理每页显示数量变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

// 添加新的位置信息提取方法
const extractLocationInfo = (data) => {
  if (!data) return null
  
  // 如果是数组，处理第一个元素
  if (Array.isArray(data)) {
    if (data.length === 0) return null
    return extractLocationInfo(data[0])
  }
  
  // 处理 locationInfo 字段（已格式化的字符串）
  if (data.locationInfo && typeof data.locationInfo === 'string') {
    try {
      const matches = data.locationInfo.match(/\((.*?),\s*(.*?),\s*(.*?)\)/)
      if (matches && matches.length > 3) {
        const [_, entity, row, col] = matches
        return `实体: ${entity}, 行: ${row}, 列: ${col}`
      }
    } catch (e) {
      console.error('解析locationInfo字符串失败:', e)
    }
  }
  
  // 处理 locationInfoJson 字段（JSON字符串）
  if (data.locationInfoJson) {
    try {
      const locationObj = JSON.parse(data.locationInfoJson)
      if (locationObj && locationObj.locations && locationObj.locations.length > 0) {
        const location = locationObj.locations[0]
        return `工作表: ${location.sheet || '-'}, 行范围: ${location.startRow || '-'}-${location.endRow || '-'}, 列范围: ${location.startColumn || '-'}-${location.endColumn || '-'}`
      }
    } catch (e) {
      console.error('解析locationInfoJson失败:', e)
    }
  }
  
  return null
}

// 导航到主页
const navigateToHome = () => {
  console.log('导航回主页')
  // 重置当前状态
  currentStatus.value = ''
  searchKeyword.value = ''
  currentPage.value = 1
  
  // 如果使用的是选项卡，可以切换到主选项卡
  activeTab.value = 'objectList'
  
  // 刷新数据
  refreshData()
  
  // 显示成功消息
  ElMessage.success('已成功保存编辑并返回主页')
}
</script>

<style scoped>
.datasource-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 主内容区域样式 */
.main-content {
  flex: 1;
  padding: 16px;
  background-color: #ffffff;
  overflow: auto;
  box-sizing: border-box;
}

.content-card {
  background-color: #ffffff;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  height: calc(100vh - 92px);
  width: 100%;
  box-sizing: border-box;
  overflow: auto;
}

/* 状态筛选按钮区域 */
.status-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.status-btn {
  border: none;
}

.status-btn.active {
  background-color: #1890ff;
  color: #ffffff;
}

/* 搜索和操作区域 */
.action-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.search-input {
  width: 300px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 表格容器区域 */
.table-container {
  margin-bottom: 16px;
  height: calc(100vh - 340px);
  overflow: hidden;
}

/* 状态标签样式 */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* 移除按钮点击后的黑色边框 */
.el-button:focus {
  outline: none !important;
  box-shadow: none !important;
}

.status-success {
  background-color: #e1f3d8;
  color: #67c23a;
}

.status-error {
  background-color: #fde2e2;
  color: #f56c6c;
}

.status-pending {
  background-color: #f4f4f5;
  color: #909399;
}

/* 分页区域 */
.pagination-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  margin-bottom: 20px; /* 增加底部边距 */
  height: 32px;
  position: relative; /* 确保定位上下文 */
  z-index: 1; /* 提高层级 */
}

.total-text {
  font-size: 14px;
  color: #8c8c8c;
}

/* 预览对话框样式 */
.custom-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: calc(90vh - 100px);
  max-height: calc(90vh - 100px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 15px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.preview-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
}

.preview-info div {
  font-size: 14px;
  color: #333;
}

.excel-preview-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
}

:deep(.excel-preview-container) {
  flex: 1;
  width: 100%;
  height: 100%;
}

/* 创建数字对象弹窗 */
.create-dialog .upload-region {
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  padding: 20px;
  text-align: center;
  margin-top: 10px;
}

.create-dialog .upload-icon {
  font-size: 32px;
  color: #c0c4cc;
  margin-bottom: 8px;
}

.create-dialog .upload-text {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.create-dialog .upload-tip {
  color: #909399;
  font-size: 12px;
}

/* 数据锁定状态占位符 */
.data-locked-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.locked-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.data-locked-placeholder p {
  color: #606266;
  font-size: 16px;
}

/* 纯文本样式 */
.plain-text-container {
  color: #333;
  text-align: center;
  line-height: 1.5;
  padding: 2px 0;
}

/* 刷新按钮容器 */
.refresh-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

/* API错误提示样式 */
.api-error-alert {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 10px;
  z-index: 1000;
}

.api-error-content {
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.api-error-content p {
  margin-bottom: 10px;
}

.api-error-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 调试工具样式 */
.debug-data-container {
  background-color: #f8f8f8;
  border-radius: 4px;
  padding: 10px;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
  color: #606266;
}

.debug-header span {
  font-size: 14px;
}

.debug-location-info {
  background-color: #e6f7ff;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  border-left: 3px solid #1890ff;
}

.debug-location-info h4 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #1890ff;
  font-size: 14px;
}

.debug-location-info pre {
  background-color: #f0f9ff;
  color: #1890ff;
  border: 1px solid #b3e0ff;
}

pre {
  background-color: #2d2d2d;
  color: #e6e6e6;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style> 