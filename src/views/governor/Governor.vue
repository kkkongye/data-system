<template>
  <div class="datasource-container">
    <!-- 头部导航 -->
    <AppHeader role-name="治理方" @logout="logout" />
    
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 标签页 -->
      <div class="content-card">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="数字对象列表" name="objectList">
            
            <!-- 状态筛选按钮 -->
            <div class="status-filter">
              <el-button 
                :class="['status-btn', { active: currentStatus === '' }]" 
                @click="setStatus('')"
              >全部数字对象</el-button>
              <el-button 
                :class="['status-btn', { active: currentStatus === '待检验' }]" 
                @click="setStatus('待检验')"
              >待检验</el-button>
              <el-button 
                :class="['status-btn', { active: currentStatus === '已合格' }]" 
                @click="setStatus('已合格')"
              >已合格</el-button>
              <el-button 
                :class="['status-btn', { active: currentStatus === '不合格' }]" 
                @click="setStatus('不合格')"
              >不合格</el-button>
            </div>
            
            <!-- 搜索和操作区 -->
            <div class="action-bar">
              <div class="search-area">
                <el-input
                  v-model="searchKeyword"
                  placeholder="输入/约束对象/传输控制操作"
                  class="search-input"
                >
                  <template #suffix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
              <div class="action-buttons">
                <el-button type="primary" plain @click="showDecryptDialog">解密</el-button>
                <!-- <el-button type="primary">导出检验</el-button> -->
              </div>
            </div>
            
            <!-- 数据表格 -->
            <div class="table-container">
              <div v-if="!isDecrypted" class="data-locked-placeholder">
                <el-icon class="locked-icon"><Lock /></el-icon>
                <p>数据已加密，请点击"解密"按钮进行解密操作</p>
              </div>
              <el-table
                v-else
                :data="filteredTableData"
                style="width: 100%"
                :cell-style="{ padding: '8px 0', textAlign: 'center' }"
                :header-cell-style="{ padding: '10px 0', background: '#f5f7fa', color: '#606266', fontWeight: 'bold', textAlign: 'center' }"
                border
                height="100%"
                fit
              >
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="entity" label="实体" width="100" align="center">
                  <template #default="scope">
                    <el-link type="primary" @click="previewEntity(scope.row)">{{ scope.row.entity }}</el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="locationInfo" label="定位信息" min-width="150" align="center" />
                <el-table-column prop="constraint" label="约束条件" width="130" align="center" />
                <el-table-column prop="transferControl" label="传输控制操作" width="130" align="center" />
                <el-table-column prop="auditInfo" label="审计控制信息" width="130" align="center">
                  <template #default="scope">
                    <el-link type="primary">{{ scope.row.auditInfo }}</el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                  <template #default="scope">
                    <span :class="['status-tag', getStatusClass(scope.row.status)]">
                      {{ scope.row.status }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!isQualifiedStatus && currentStatus !== '待检验'" prop="feedback" label="反馈意见" min-width="160" align="center">
                  <template #default="scope">
                    <span>{{ scope.row.feedback }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" align="center">
                  <template #default="scope">
                    <div class="status-buttons">
                      <el-button type="success" size="small" plain :disabled="scope.row.status === '已合格'" @click="updateStatus(scope.row, '已合格')">正确</el-button>
                      <el-button type="danger" size="small" plain :disabled="scope.row.status === '不合格'" @click="updateStatus(scope.row, '不合格')">错误</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            
            <!-- 分页 -->
            <div class="pagination-area">
              <CommonPagination
                v-if="isDecrypted"
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total-count="totalCount"
                :disabled="!isDecrypted"
                background
                @size-change="handleSizeChange"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
  
  <!-- 解密对话框 -->
  <el-dialog
    v-model="decryptDialogVisible"
    title="解密"
    width="30%"
    :close-on-click-modal="false"
    :show-close="true"
    draggable
    class="decrypt-dialog"
  >
    <el-form :model="decryptForm" label-width="120px" ref="decryptFormRef" :rules="decryptFormRules">
      <el-form-item label="数字对象ID:" prop="objectId">
        <el-input v-model="decryptForm.objectId" placeholder="请输入ID"></el-input>
      </el-form-item>
      <el-form-item label="token:" prop="token">
        <el-input v-model="decryptForm.token" placeholder="请输入token"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="decryptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDecrypt">确定</el-button>
      </span>
    </template>
  </el-dialog>

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
        <div>约束条件：<strong>{{ previewForm.constraint }}</strong></div>
        <div>传输控制操作：<strong>{{ previewForm.transferControl }}</strong></div>
        <div>状态：<strong>{{ previewForm.status }}</strong></div>
      </div>
    </div>
    
    <!-- 使用数源方的ExcelPreview组件 -->
    <ExcelPreview 
      :file="excelBinaryData"
      :title="`${previewForm.entity}的Excel数据`"
      @data-loaded="handleExcelDataLoaded"
      @error="handleExcelError"
    />
    
    <template #footer v-if="excelBinaryData">
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
import { Search, Lock, Document } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import ExcelPreview from '@/components/ExcelPreview.vue'
import AppHeader from '@/components/AppHeader.vue'
import CommonPagination from '@/components/CommonPagination.vue'
import dataObjectService from '@/services/dataObjectService'

const router = useRouter()
const activeTab = ref('objectList')
const currentStatus = ref('') // 默认显示全部数字对象
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const isDecrypted = ref(false)
const selectedRows = ref([])

// 添加计算属性判断是否为已合格状态
const isQualifiedStatus = computed(() => currentStatus.value === '已合格')

const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  id: '',
  entity: '',
  locationInfo: '',
  constraint: '',
  transferControl: '',
  auditInfo: '',
  status: '',
  feedback: ''
})
const editingIndex = ref(-1)

// 表格数据 - 从共享服务获取
const tableData = ref(dataObjectService.getAllDataObjects())

// 监听共享服务数据变化
onMounted(() => {
  // 添加数据变化监听器
  dataObjectService.addChangeListener((newData) => {
    console.log('治理方收到数据变化:', newData)
    // 无需手动更新tableData，因为是响应式引用
  })
})

// 计算实际数据量
const totalCount = computed(() => {
  let result = tableData.value
  if (currentStatus.value) {
    result = result.filter(item => item.status === currentStatus.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      (item.constraint && item.constraint.toLowerCase().includes(keyword)) || 
      item.entity.toLowerCase().includes(keyword) || 
      item.transferControl.toLowerCase().includes(keyword)
    )
  }
  
  return result.length
})

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
    result = result.filter(item => 
      (item.constraint && item.constraint.toLowerCase().includes(keyword)) || 
      item.entity.toLowerCase().includes(keyword) || 
      item.transferControl.toLowerCase().includes(keyword)
    )
  }

  // 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return result.slice(startIndex, endIndex)
})

// 设置当前状态
const setStatus = (status) => {
  currentStatus.value = status
}

// 处理表格选择变更
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 获取状态对应的样式类名
const getStatusClass = (status) => {
  switch (status) {
    case '已合格': return 'status-success'
    case '不合格': return 'status-error'
    case '待检验': return 'status-pending'
    default: return ''
  }
}

// 编辑对象
const handleEdit = (row) => {
  editingIndex.value = tableData.value.findIndex(item => item.id === row.id)
  
  // 深拷贝行数据到编辑表单
  Object.keys(editForm).forEach(key => {
    editForm[key] = row[key]
  })
  
  editDialogVisible.value = true
}

// 取消编辑
const cancelEdit = () => {
  editDialogVisible.value = false
  // 重置表单
  Object.keys(editForm).forEach(key => {
    editForm[key] = ''
  })
  editingIndex.value = -1
}

// 保存编辑
const saveEdit = () => {
  // 如果状态为"已合格"，清空反馈意见
  if (editForm.status === '已合格') {
    editForm.feedback = ''
  }

  // 更新表格数据
  if (editingIndex.value > -1) {
    tableData.value[editingIndex.value] = { ...editForm }
  }
  
  ElMessage.success(`已保存对 ${editForm.entity} 的编辑`)
  editDialogVisible.value = false
}

// 删除对象
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除"${row.entity}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    ElMessage.success(`已删除: ${row.entity}`)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 更新数字对象状态
const updateStatus = (row, newStatus) => {
  // 查找数据行索引
  if (newStatus === '已合格' || newStatus === '待检验') {
    // 如果是已合格状态或待检验状态，直接更新
    dataObjectService.updateObjectStatus(row.id, newStatus)
    ElMessage.success(`${row.entity} 已更新为"${newStatus}"状态`)
  } 
  // 如果是不合格状态，弹出对话框要求输入反馈意见
  else if (newStatus === '不合格') {
    ElMessageBox.prompt('请输入不合格的反馈意见', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: row.feedback || '',
      customClass: 'feedback-dialog',
      inputType: 'textarea',
      inputPlaceholder: '请详细描述不合格的原因...',
      inputValidator: (value) => {
        return value.trim() !== '' || '反馈意见不能为空'
      }
    }).then(({ value }) => {
      dataObjectService.updateObjectStatus(row.id, newStatus, value)
      ElMessage.success(`${row.entity} 已更新为"不合格"状态`)
    }).catch(() => {
      ElMessage.info('已取消状态更新')
    })
  }
}

// 退出登录
const logout = () => {
  localStorage.removeItem('role')
  router.push('/login')
}

// 处理每页显示数量变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

// 解密状态和表单
const decryptDialogVisible = ref(false)
const decryptFormRef = ref(null)
const decryptForm = reactive({
  objectId: '',
  token: ''
})
const decryptFormRules = {
  objectId: [{ required: true, message: '请输入数字对象ID', trigger: 'blur' }],
  token: [{ required: true, message: '请输入token', trigger: 'blur' }]
}

// 显示解密对话框
const showDecryptDialog = () => {
  decryptDialogVisible.value = true
}

// 处理解密操作
const handleDecrypt = () => {
  decryptFormRef.value.validate((valid) => {
    if (valid) {
      // 这里可以添加实际的解密验证逻辑
      // 模拟验证成功
      isDecrypted.value = true
      decryptDialogVisible.value = false
      ElMessage.success('解密成功')
    } else {
      ElMessage.error('请填写完整的解密信息')
      return false
    }
  })
}

// Excel预览相关
const previewDialogVisible = ref(false)
const previewForm = reactive({
  id: '',
  entity: '',
  locationInfo: '',
  constraint: '',
  transferControl: '',
  status: ''
})

// 存储当前预览的Excel二进制数据
const excelBinaryData = ref(null)

// 处理Excel数据加载完成事件
const handleExcelDataLoaded = (data) => {
  console.log('Excel数据加载完成:', data)
}

// 处理Excel加载错误事件
const handleExcelError = (error) => {
  console.error('Excel加载错误:', error)
  ElMessage.error('加载Excel数据时出错: ' + error)
}

// 预览实体
const previewEntity = (row) => {
  console.log('预览实体：', row)
  
  // 设置预览表单数据
  previewForm.id = row.id
  previewForm.entity = row.entity
  previewForm.locationInfo = row.locationInfo
  previewForm.constraint = row.constraint
  previewForm.transferControl = row.transferControl
  previewForm.status = row.status
  
  // 清空当前Excel数据
  excelBinaryData.value = row.excelData || null
  
  // 显示预览对话框
  previewDialogVisible.value = true
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
  margin-bottom: 20px;
  height: 32px;
  position: relative;
  z-index: 1;
}

.total-text {
  font-size: 14px;
  color: #8c8c8c;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 按钮组样式 */
.status-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* 自定义禁用按钮样式 */
.status-buttons :deep(.el-button--success.is-disabled) {
  color: #67c23a !important;
  background-color: #c2e7b0 !important;
  border-color: #c2e7b0 !important;
}

.status-buttons :deep(.el-button--danger.is-disabled) {
  color: #f56c6c !important;
  background-color: #fab6b6 !important;
  border-color: #fab6b6 !important;
}

/* 确保禁用状态下鼠标悬停样式保持一致 */
.status-buttons :deep(.el-button--success.is-disabled:hover),
.status-buttons :deep(.el-button--success.is-disabled:focus) {
  color: #67c23a !important;
  background-color: #c2e7b0 !important;
  border-color: #c2e7b0 !important;
}

.status-buttons :deep(.el-button--danger.is-disabled:hover),
.status-buttons :deep(.el-button--danger.is-disabled:focus) {
  color: #f56c6c !important;
  background-color: #fab6b6 !important;
  border-color: #fab6b6 !important;
}

/* 自定义反馈意见弹窗样式 */
:deep(.feedback-dialog) {
  width: 500px !important;
}

:deep(.feedback-dialog .el-message-box__input) {
  padding-top: 8px;
}

:deep(.feedback-dialog .el-textarea__inner) {
  min-height: 120px !important;
  font-size: 14px;
}

:deep(.feedback-dialog .el-message-box__header) {
  padding-bottom: 15px;
}

:deep(.feedback-dialog .el-message-box__content) {
  padding: 20px;
}

/* 数据锁定占位样式 */
.data-locked-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  padding: 40px 0;
}

.locked-icon {
  font-size: 60px;
  color: #909399;
  margin-bottom: 20px;
}

.data-locked-placeholder p {
  font-size: 16px;
  color: #606266;
  text-align: center;
  line-height: 1.6;
  max-width: 80%;
}

/* 解密对话框样式 */
:deep(.el-overlay) {
  overflow: hidden;
}

:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0 !important;
  transition: all 0.3s ease-in-out;
  max-height: 90vh;
  max-width: 95vw;
}

:deep(.el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  position: fixed;
}

:deep(.el-dialog__header) {
  padding: 20px;
  margin-right: 0;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  cursor: move;
}

:deep(.el-dialog__headerbtn) {
  top: 18px;
}

:deep(.el-dialog__title) {
  font-weight: bold;
  font-size: 18px;
}

:deep(.el-dialog__body) {
  padding: 30px 20px;
}

:deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
  text-align: center;
}

:deep(.el-button--primary) {
  min-width: 90px;
}

/* 弹出对话框定位优化 */
:deep(.decrypt-dialog),
:deep(.edit-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.decrypt-dialog .el-dialog),
:deep(.edit-dialog .el-dialog) {
  margin-top: 0 !important;
}

/* 确保解密对话框在小屏幕上也显示适当大小 */
@media screen and (max-width: 768px) {
  :deep(.decrypt-dialog .el-dialog) {
    width: 90% !important;
  }
  
  :deep(.edit-dialog .el-dialog) {
    width: 95% !important;
  }
}

/* 确保弹窗在出现时有平滑的动画效果 */
:deep(.el-dialog-fade-enter-from),
:deep(.el-dialog-fade-leave-to) {
  opacity: 0;
  transform: translate(-50%, -40%);
}

:deep(.el-dialog-fade-enter-active),
:deep(.el-dialog-fade-leave-active) {
  transition: all 0.3s ease-out;
}

/* 添加预览相关的样式 */
.preview-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.preview-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 14px;
  margin-top: 10px;
}

.preview-info > div {
  flex: 1;
  min-width: 200px;
}

/* 保留对话框样式但移除与Excel预览相关的样式 */
</style> 