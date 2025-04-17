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
        <!-- 修改基本信息样式为单行显示 -->
        <div class="basic-info-table">
          <span class="info-item"><strong>实体：</strong>{{ previewForm.entity }}</span>
          <span class="info-item"><strong>定位信息：</strong>{{ previewForm.locationInfo }}</span>
          <span class="info-item constraint-info" :title="Array.isArray(previewForm.constraint) ? previewForm.constraint.join('\n') : (previewForm.constraint || '-')"><strong>约束条件：</strong>{{ Array.isArray(previewForm.constraint) ? previewForm.constraint.join(', ') : (previewForm.constraint || '-') }}</span>
          <span class="info-item"><strong>传输控制操作：</strong>{{ Array.isArray(previewForm.transferControl) ? previewForm.transferControl.join(', ') : (previewForm.transferControl || '-') }}</span>
          <span class="info-item"><strong>状态：</strong>{{ previewForm.status }}</span>
        </div>
        <!-- 添加元数据信息显示 -->
        <div v-if="previewForm.metadata" class="metadata-section">
          <div class="metadata-items">
            <!-- 所有元数据项在一行显示 -->
            <div class="metadata-item">数据名称: <strong>{{ getMetadataValue('dataName') || previewForm.entity }}</strong></div>
            <div class="metadata-item">来源单位: <strong>{{ getMetadataValue('sourceUnit') || '数据部' }}</strong></div>
            <div class="metadata-item">联系人: <strong>{{ getMetadataValue('contactPerson') || '未指定' }}</strong></div>
            <div class="metadata-item">联系电话: <strong>{{ getMetadataValue('contactPhone') || '未提供' }}</strong></div>
            <div class="metadata-item">更新时间: <strong>{{ getCurrentDateTime() }}</strong></div>
          </div>
        </div>
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
  metadata: {
    dataName: '',
    sourceUnit: '',
    contactPerson: '',
    contactPhone: ''
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
const handleEdit = async (row) => {
  console.log('开始编辑对象:', row)
  
  try {
    // 先从API获取最新的对象信息
    const objectId = row.id
    let objectToEdit = null
    
    if (objectId) {
      // 尝试从后端获取最新数据
      const apiResponse = await dataObjectService.fetchDataObjectById(objectId)
      
      if (apiResponse) {
        console.log('从API获取到对象数据:', apiResponse)
        
        // 正确提取数据对象
        // 如果返回的是带有code和data结构的API响应
        if (apiResponse.code !== undefined && apiResponse.data) {
          objectToEdit = apiResponse.data
          console.log('从API响应中提取的数据对象:', objectToEdit)
        } else {
          // 如果直接返回了数据对象
          objectToEdit = apiResponse
        }
      } else {
        console.warn('未能从API获取对象数据，将使用表格提供的数据')
        objectToEdit = { ...row } // 使用深拷贝避免引用问题
      }
    } else {
      objectToEdit = { ...row }
    }
    
    // 记录编辑的索引位置
    editingIndex.value = tableData.value.findIndex(item => dataObjectService.compareIds(item.id, objectId))
    
    // 确保对象存在
    if (!objectToEdit) {
      console.error('无法获取要编辑的对象数据')
      ElMessage.error('获取对象详情失败，请稍后再试')
      return
    }
    
    // 从对象中提取实体数据（如果存在）
    let entityData = objectToEdit
    
    // 处理可能嵌套在dataContent中的实体数据
    if (objectToEdit.dataContent) {
      try {
        const parsedContent = JSON.parse(objectToEdit.dataContent)
        if (parsedContent && typeof parsedContent === 'object') {
          console.log('从dataContent解析的实体数据:', parsedContent)
          
          // 合并dataContent中的关键字段到主对象
          if (parsedContent.entity) entityData.entity = parsedContent.entity
          if (parsedContent.status) entityData.status = parsedContent.status
          if (parsedContent.feedback) entityData.feedback = parsedContent.feedback
        }
      } catch (e) {
        console.warn('解析dataContent失败:', e)
      }
    }
    
    // 处理定位信息格式
    let locationParts = ['', '']
    
    // 尝试从locationInfoJson解析位置信息
    if (objectToEdit.locationInfoJson) {
      try {
        const locationInfo = JSON.parse(objectToEdit.locationInfoJson)
        console.log('解析的位置信息:', locationInfo)
        
        if (locationInfo && locationInfo.locations && locationInfo.locations.length > 0) {
          const location = locationInfo.locations[0]
          locationParts = [
            `${location.startRow || ''}-${location.endRow || ''}`,
            `${location.startColumn || ''}-${location.endColumn || ''}`
          ]
        }
      } catch (e) {
        console.warn('解析locationInfoJson失败:', e)
      }
    } else if (objectToEdit.locationInfo) {
      // 处理已经格式化的位置信息
      if (typeof objectToEdit.locationInfo === 'string') {
        // 从格式如"(表1, 0-4, 0-4)"中提取行列信息
        const matches = objectToEdit.locationInfo.match(/\((.*?),\s*(.*?),\s*(.*?)\)/)
        if (matches && matches.length > 3) {
          locationParts = [matches[2].trim(), matches[3].trim()]
        }
      } else if (typeof objectToEdit.locationInfo === 'object' && objectToEdit.locationInfo.row && objectToEdit.locationInfo.col) {
        locationParts = [objectToEdit.locationInfo.row, objectToEdit.locationInfo.col]
      }
    }
    
    // 设置编辑表单数据
    editForm.id = objectToEdit.id || objectToEdit.numericId || ''
    editForm.entity = entityData.entity || objectToEdit.name || ''
    editForm.locationInfo = {
      row: locationParts[0],
      col: locationParts[1]
    }
    
    // 提取元数据
    editForm.metadata = {
      dataName: '',
      sourceUnit: '',
      contactPerson: '',
      contactPhone: ''
    }
    
    // 如果对象有元数据，使用它
    if (objectToEdit.metadata && typeof objectToEdit.metadata === 'object') {
      editForm.metadata = { ...editForm.metadata, ...objectToEdit.metadata }
    } else if (objectToEdit.metadataJson) {
      // 尝试从metadataJson解析元数据
      try {
        const metadataObj = JSON.parse(objectToEdit.metadataJson)
        if (metadataObj) {
          editForm.metadata = { ...editForm.metadata, ...metadataObj }
        }
      } catch (e) {
        console.warn('解析metadataJson失败:', e)
      }
    }
    
    // 如果没有设置数据名称，使用实体名称
    if (!editForm.metadata.dataName) {
      editForm.metadata.dataName = editForm.entity
    }
    
    // 处理约束条件
    // 尝试从constraintSetJson解析约束条件
    let constraints = []
    if (objectToEdit.constraintSetJson) {
      try {
        const constraintData = JSON.parse(objectToEdit.constraintSetJson)
        console.log('解析的约束条件:', constraintData)
        
        if (constraintData && constraintData.constraints && constraintData.constraints.length > 0) {
          const constraint = constraintData.constraints[0]
          
          // 设置各约束字段
          editForm.formatConstraint = constraint.formatConstraint || ''
          editForm.accessConstraint = constraint.accessConstraint || ''
          editForm.pathConstraint = constraint.pathConstraint || ''
          editForm.regionConstraint = constraint.regionConstraint || ''
          editForm.shareConstraint = constraint.shareConstraint || ''
          
          // 构建约束条件数组
          constraints = [
            constraint.formatConstraint ? `格式约束:${constraint.formatConstraint}` : null,
            constraint.accessConstraint ? `访问权限:${constraint.accessConstraint}` : null,
            constraint.pathConstraint ? `传输路径约束:${constraint.pathConstraint}` : null,
            constraint.regionConstraint ? `地域性约束:${constraint.regionConstraint}` : null,
            constraint.shareConstraint ? `共享约束:${constraint.shareConstraint}` : null
          ].filter(Boolean) // 过滤掉null值
        }
      } catch (e) {
        console.warn('解析constraintSetJson失败:', e)
      }
    }
    
    // 如果从JSON解析出约束条件，则使用它们；否则尝试使用原有约束条件
    if (constraints.length > 0) {
      editForm.constraint = constraints
    } else {
      // 使用辅助函数确保约束条件是数组
      editForm.constraint = ensureArray(objectToEdit.constraint)
      
      // 如果没有明确的各约束字段值，尝试从约束数组中解析
      if ((!editForm.formatConstraint || !editForm.accessConstraint || !editForm.pathConstraint || 
          !editForm.regionConstraint || !editForm.shareConstraint) && editForm.constraint.length > 0) {
        // 这里可以添加解析约束数组的逻辑
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
    }
    
    // 处理传输控制操作
    let transferControls = []
    if (objectToEdit.propagationControlJson) {
      try {
        const propagationData = JSON.parse(objectToEdit.propagationControlJson)
        console.log('解析的传播控制数据:', propagationData)
        
        if (propagationData && propagationData.operations) {
          const ops = propagationData.operations
          
          // 根据operations构建传输控制数组
          if (ops.read) transferControls.push('可读')
          if (ops.modify) transferControls.push('可修改')
          if (ops.destroy) transferControls.push('可销毁')
          if (ops.share) transferControls.push('可共享')
          if (ops.delegate) transferControls.push('可委托')
        }
      } catch (e) {
        console.warn('解析propagationControlJson失败:', e)
      }
    } else if (objectToEdit.propagationControl) {
      // 直接使用propagationControl对象
      const pc = objectToEdit.propagationControl
      if (pc.canRead) transferControls.push('可读')
      if (pc.canModify) transferControls.push('可修改')
      if (pc.canDestroy) transferControls.push('可销毁')
      if (pc.canShare) transferControls.push('可共享')
      if (pc.canDelegate) transferControls.push('可委托')
    }
    
    // 如果从JSON解析出传输控制，则使用它们；否则尝试使用原有传输控制
    if (transferControls.length > 0) {
      editForm.transferControl = transferControls
    } else {
      // 传输控制
      editForm.transferControl = ensureArray(objectToEdit.transferControl)
    }
    
    // 处理审计信息和状态
    if (objectToEdit.auditInfo && typeof objectToEdit.auditInfo === 'object') {
      // 直接使用对象中的信息
      editForm.auditInfo = '已有审计记录'
    } else {
      editForm.auditInfo = objectToEdit.auditInfo || ''
    }
    
    // 设置状态和反馈
    editForm.status = entityData.status || objectToEdit.status || ''
    editForm.feedback = entityData.feedback || objectToEdit.feedback || ''
    
    // 保存Excel数据
    editForm.excelData = objectToEdit.excelData // 保留原有的Excel文件数据
    
    console.log('打开编辑对话框，设置表单数据:', editForm)
    // 显示编辑弹窗
    editDialogVisible.value = true
    console.log('editDialogVisible已设置为:', editDialogVisible.value)
  } catch (error) {
    console.error('编辑对象时出错:', error)
    ElMessage.error('获取对象详情失败: ' + error.message)
  }
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
  editForm.metadata = {
    dataName: '',
    sourceUnit: '',
    contactPerson: '',
    contactPhone: ''
  }
  editForm.constraint = []
  editForm.transferControl = []
  editForm.auditInfo = ''
  editForm.status = ''
  editForm.feedback = ''
  editForm.excelData = null
  
  editingIndex.value = -1
}

// 保存编辑的对象
const saveEditObject = async (updatedObject) => {
  // 检查是否为离线模式上传（如果有excelData但没有通过API上传）
  const isOfflineMode = updatedObject.offlineMode === true
  const objectId = updatedObject.id
  console.log('保存编辑对象，ID:', objectId)

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
  
  // 准备元数据JSON
  let metadataJson = null
  if (updatedObject.metadata) {
    metadataJson = JSON.stringify(updatedObject.metadata)
  }
  
  const displayObject = {
    ...updatedObject,
    locationInfo: `(${entityName}, ${updatedObject.locationInfo.row}, ${updatedObject.locationInfo.col})`,
    metadataJson: metadataJson // 添加元数据JSON字符串
  }
  
  try {
    // 使用API更新数据对象
    let updated = false
    
    if (!isOfflineMode) {
      // 尝试通过API更新
      updated = await dataObjectService.updateDataObjectViaApi(objectId, displayObject)
    } else {
      // 离线模式仅更新本地数据
      updated = dataObjectService.updateDataObject(displayObject)
    }
    
    if (updated) {
      console.log('保存编辑后的对象:', displayObject)
      
      // 根据是否为离线模式显示不同的提示
      if (isOfflineMode) {
        ElMessage({
          message: `已离线保存对 ${entityName} 的编辑，但数据未同步到服务器`,
          type: 'warning',
          duration: 5000
        })
      } else {
        ElMessage.success(`已保存对 ${entityName} 的编辑`)
      }
      
      // 刷新数据列表
      refreshData()
    } else {
      ElMessage.error(`编辑失败：未找到ID为 ${objectId} 的对象或API请求失败`)
    }
  } catch (error) {
    console.error('保存编辑时出错:', error)
    ElMessage.error('保存编辑失败，请稍后再试')
  }
}

// 删除对象
const handleDelete = (row) => {
  const objectId = row.id;
  console.log('删除对象，ID:', objectId);
  
  ElMessageBox.confirm(`确定要删除"${row.entity}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      // 尝试通过API删除
      const result = await dataObjectService.deleteDataObjectViaApi(objectId)
      
      if (result) {
        ElMessage.success(`已删除: ${row.entity}`)
      } else {
        // API删除失败，尝试本地删除
        const localDeleted = dataObjectService.deleteDataObject(objectId)
        
        if (localDeleted) {
          ElMessage({
            message: `API删除失败，已在本地删除: ${row.entity}`,
            type: 'warning',
            duration: 5000
          })
        } else {
          ElMessage.error(`删除失败: ${row.entity}`)
        }
      }
      
      // 刷新数据
      refreshData()
    } catch (error) {
      console.error('删除对象时出错:', error)
      ElMessage.error('删除对象失败，请稍后再试')
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

// 保存创建的对象
const saveCreateObject = async (newObject) => {
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
  
  // 准备元数据JSON
  let metadataJson = null
  if (newObject.metadata) {
    metadataJson = JSON.stringify(newObject.metadata)
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
    excelData: newObject.excelData,
    metadata: newObject.metadata,
    metadataJson: metadataJson // 添加元数据JSON字符串
  }
  
  try {
    let result = null
    
    if (!isOfflineMode) {
      // 使用API创建数字对象
      result = await dataObjectService.addDataObjectViaApi(displayObject)
      
      if (result.success) {
        console.log('成功通过API创建数字对象:', result.object)
        ElMessage.success(`已创建数字对象: ${entityName}`)
      } else {
        console.error('API创建数字对象失败:', result.message)
        
        // API失败时尝试本地创建
        const addedObject = dataObjectService.addDataObject(displayObject)
        console.log('改为本地创建数字对象:', addedObject)
        
        ElMessage({
          message: `API创建失败，已在本地创建数字对象: ${entityName}`,
          type: 'warning',
          duration: 5000
        })
      }
    } else {
      // 离线模式只在本地添加
      const addedObject = dataObjectService.addDataObject(displayObject)
      console.log('本地创建数字对象:', addedObject)
      
      ElMessage({
        message: `已在本地创建数字对象: ${entityName}，但未同步到服务器`,
        type: 'warning',
        duration: 5000
      })
    }
    
    // 刷新数据列表
    refreshData()
    
    // 重置创建表单
    resetCreateForm()
    
    // 关闭创建对话框
    createDialogVisible.value = false
  } catch (error) {
    console.error('创建对象时发生错误:', error)
    ElMessage.error('创建对象失败，请稍后再试')
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
  status: '',
  metadata: null // 添加元数据字段
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
  
  // 解析元数据JSON - 增强版
  previewForm.metadata = null
  
  // 检查数据的各种可能位置，提取元数据
  const extractMetadata = () => {
    // 直接检查row中的metadataJson字段
    if (row.metadataJson) {
      console.log('从row.metadataJson提取元数据')
      try {
        processMetadataString(row.metadataJson)
        if (previewForm.metadata) return true
      } catch (e) {
        console.warn('解析row.metadataJson失败:', e)
      }
    }
    
    // 检查dataContent字段中的metadataJson
    if (row.dataContent) {
      console.log('检查row.dataContent中的元数据')
      try {
        // 尝试解析dataContent
        const contentObj = typeof row.dataContent === 'string' ? 
          JSON.parse(row.dataContent) : row.dataContent
        
        if (contentObj && contentObj.metadataJson) {
          console.log('从row.dataContent.metadataJson提取元数据')
          processMetadataString(contentObj.metadataJson)
          if (previewForm.metadata) return true
        }
        
        // 直接从dataContent中提取元数据字段
        if (contentObj && (contentObj.dataName || contentObj.sourceUnit || 
            contentObj.contactPerson || contentObj.contactPhone)) {
          console.log('直接从dataContent中获取元数据字段')
          previewForm.metadata = {
            dataName: contentObj.dataName,
            sourceUnit: contentObj.sourceUnit,
            contactPerson: contentObj.contactPerson,
            contactPhone: contentObj.contactPhone
          }
          return true
        }
      } catch (e) {
        console.warn('解析dataContent失败:', e)
      }
    }
    
    // 最后尝试使用数据模拟（当服务器未返回元数据时使用）
    if (!previewForm.metadata) {
      // 为所有数据对象生成模拟元数据，不再限制为只有用户表
      console.log('使用通用模拟元数据')
      
      // 根据实体名称生成有针对性的模拟数据
      let entityName = row.entity || '未知实体'
      let sourceUnit = '数据部'
      let contactPerson = '王主任'
      
      // 根据实体名称定制一些元数据
      if (entityName.includes('用户')) {
        sourceUnit = '用户管理部'
      } else if (entityName.includes('订单')) {
        sourceUnit = '订单管理部'
        contactPerson = '李经理'
      } else if (entityName.includes('产品')) {
        sourceUnit = '产品部'
        contactPerson = '张总监'
      }
      
      previewForm.metadata = {
        dataName: entityName,
        sourceUnit: sourceUnit,
        contactPerson: contactPerson,
        contactPhone: "123-456789"
      }
      return true
    }
    
    return false
  }
  
  // 处理元数据字符串的函数
  const processMetadataString = (metadataString) => {
    if (!metadataString) return
    
    // 检查是否已经是对象
    if (typeof metadataString === 'object') {
      previewForm.metadata = metadataString
      return
    }
    
    // 修复JSON字符串中可能存在的常见问题
    let cleanString = metadataString
    // 修复结尾多余的]}问题
    if (cleanString.includes('"]}"') && !cleanString.endsWith('"}')) {
      cleanString = cleanString.replace('"]}"', '"}')
    }
    if (cleanString.includes('"]}",')) {
      cleanString = cleanString.replace('"]}",', '"}')
    }
    
    // 修复开头缺少{的问题
    if (!cleanString.startsWith('{') && cleanString.includes('":"')) {
      cleanString = '{' + cleanString
    }
    
    // 修复结尾缺少}的问题
    if (!cleanString.endsWith('}') && cleanString.includes('":"')) {
      cleanString = cleanString + '}'
    }
    
    try {
      // 尝试解析（可能需要多次解析）
      let parsed = cleanString
      let attempts = 0
      const maxAttempts = 3
      
      while (typeof parsed === 'string' && attempts < maxAttempts) {
        parsed = JSON.parse(parsed)
        console.log(`第${attempts + 1}次解析结果:`, parsed)
        attempts++
      }
      
      // 设置元数据
      if (typeof parsed === 'object') {
        previewForm.metadata = parsed
      }
    } catch (e) {
      console.warn('解析元数据字符串失败:', e, '原始字符串:', metadataString, '清理后:', cleanString)
    }
  }
  
  // 执行元数据提取
  const metadataExtracted = extractMetadata()
  console.log('元数据提取结果:', metadataExtracted, previewForm.metadata)
  
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

// 获取元数据字段值的辅助函数
const getMetadataValue = (fieldName) => {
  // 防止未定义
  if (!previewForm.metadata) return null
  
  // 直接检查顶级对象
  if (previewForm.metadata[fieldName]) {
    return previewForm.metadata[fieldName]
  }
  
  // 检查嵌套对象
  const checkNestedObject = (obj, field) => {
    // 不是对象，返回null
    if (typeof obj !== 'object' || obj === null) return null
    
    // 直接检查当前对象是否有该字段
    if (obj[field] !== undefined) return obj[field]
    
    // 递归检查所有属性
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const result = checkNestedObject(obj[key], field)
        if (result !== null) return result
      }
    }
    
    return null
  }
  
  // 尝试在嵌套对象中查找
  return checkNestedObject(previewForm.metadata, fieldName)
}

// 获取当前格式化的日期时间
const getCurrentDateTime = () => {
  const now = new Date()
  return now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
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
  background-color: transparent;
  border-bottom: none;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
  width: 100%;
}

/* 新的基本信息表格样式 */
.basic-info-table {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  gap: 20px;
  justify-content: center;
  margin-bottom: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 12px 15px;
  overflow-x: auto;
  white-space: nowrap;
}

.info-item {
  display: inline-block;
  padding: 0 10px;
  color: #333;
  font-size: 14px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.info-item strong {
  font-weight: bold;
  color: #606266;
  margin-right: 5px;
}

.constraint-info {
  max-width: 500px;
}

/* 元数据部分样式 */
.metadata-section {
  margin: 10px auto 5px;
  padding: 8px 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  width: 98%;
  max-width: 1200px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #eaeaea;
}

.metadata-items {
  display: flex;
  flex-wrap: nowrap; /* 防止换行 */
  justify-content: center;
  overflow-x: auto; /* 如果内容溢出，允许水平滚动 */
  padding-bottom: 3px; /* 为滚动条留出空间 */
  scrollbar-width: thin;
  -ms-overflow-style: none; /* IE and Edge */
}

.metadata-items::-webkit-scrollbar {
  height: 3px;
}

.metadata-items::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.metadata-item {
  padding: 4px 8px;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
  border: none;
  margin: 0 8px;
  white-space: nowrap; /* 防止内容自动换行 */
  flex-shrink: 0; /* 防止项目被压缩 */
  font-size: 13px;
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

/* 约束条件悬浮显示样式 */
.constraint-info {
  position: relative;
  cursor: help;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.constraint-info:hover {
  overflow: visible;
  white-space: normal;
  background-color: #f0f9ff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 10;
  transition: all 0.3s;
}
</style> 