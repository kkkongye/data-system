<template>
  <div class="datasource-container">
    <!-- 头部导航 -->
    <div class="header">
      <div class="title">数据要素流转系统</div>
      <div class="user-info">
        <el-icon class="setting-icon"><Setting /></el-icon>
        <el-dropdown trigger="click">
          <div class="user-dropdown">
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar>
            <span class="user-role">治理方</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
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
                <el-button type="primary" plain>导出检验</el-button>
                <el-button type="primary">新建数字对象</el-button>
              </div>
            </div>
            
            <!-- 数据表格 -->
            <div class="table-container">
              <el-table
                :data="filteredTableData"
                style="width: 100%"
                @selection-change="handleSelectionChange"
                :cell-style="{ padding: '8px 0', textAlign: 'center' }"
                :header-cell-style="{ padding: '10px 0', background: '#f5f7fa', color: '#606266', fontWeight: 'bold', textAlign: 'center' }"
                border
                height="100%"
                fit
              >
                <el-table-column type="selection" width="50" align="center" />
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="entity" label="实体" width="100" align="center">
                  <template #default="scope">
                    <el-link type="primary">{{ scope.row.entity }}</el-link>
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
                <el-table-column v-if="!isQualifiedStatus" prop="feedback" label="反馈意见" min-width="160" align="center">
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
              <span class="total-text">共{{ totalCount }}条信息</span>
              <el-pagination
                v-model:current-page="currentPage"
                layout="prev, pager, next"
                :total="totalCount"
                :page-size="pageSize"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
  
  <!-- 编辑对象弹窗 -->
  <el-dialog
    v-model="editDialogVisible"
    title="编辑数字对象"
    width="50%"
    :close-on-click-modal="false"
  >
    <el-form :model="editForm" label-width="100px" ref="editFormRef">
      <el-form-item label="实体" prop="entity">
        <el-input v-model="editForm.entity" placeholder="请输入实体"></el-input>
      </el-form-item>
      <el-form-item label="定位信息" prop="locationInfo">
        <el-input v-model="editForm.locationInfo" placeholder="请输入定位信息"></el-input>
      </el-form-item>
      <el-form-item label="约束条件" prop="constraint">
        <el-input v-model="editForm.constraint" placeholder="请输入约束条件"></el-input>
      </el-form-item>
      <el-form-item label="传输控制操作" prop="transferControl">
        <el-input v-model="editForm.transferControl" placeholder="请输入传输控制操作"></el-input>
      </el-form-item>
      <!-- <el-form-item label="状态" prop="status">
        <el-select v-model="editForm.status" placeholder="请选择状态">
          <el-option label="待检验" value="待检验"></el-option>
          <el-option label="已合格" value="已合格"></el-option>
          <el-option label="不合格" value="不合格"></el-option>
        </el-select>
      </el-form-item> -->
      <!-- 仅在状态不是"已合格"时显示反馈意见 -->
      <el-form-item label="反馈意见" prop="feedback" v-if="editForm.status !== '已合格'">
        <el-input
          v-model="editForm.feedback"
          type="textarea"
          :rows="3"
          placeholder="请输入反馈意见"
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="saveEdit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, ArrowDown, Search } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref('objectList')
const currentStatus = ref('') // 默认显示全部数字对象
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(562)
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

// 表格数据
const tableData = ref([
  { id: 1, entity: '表1', locationInfo: '(表1, -, -)', constraint: '访问权限', transferControl: '可修改', auditInfo: '查看日志', status: '已合格', feedback: '' },
  { id: 2, entity: '表2', locationInfo: '(表2, 1-2, 3-6)', constraint: '', transferControl: '可修改', auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件' },
  { id: 3, entity: '表3', locationInfo: '(表3, 1-6, 12-50)', constraint: '访问权限', transferControl: '可读', auditInfo: '查看日志', status: '已合格', feedback: '' },
  { id: 4, entity: '表4', locationInfo: '(表4, 1-6, 21-52)', constraint: '', transferControl: '可修改', auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件' },
  { id: 5, entity: '表5', locationInfo: '(表5, 1-4, 31-56)', constraint: '', transferControl: '可读', auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件' },
  { id: 6, entity: '表6', locationInfo: '(表6, 11-12, 1-6)', constraint: '访问权限', transferControl: '可读', auditInfo: '查看日志', status: '已合格', feedback: '' },
  { id: 7, entity: '表7', locationInfo: '(表7, -, -)', constraint: '共享约束', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '' },
  { id: 8, entity: '表8', locationInfo: '(表, -, -)', constraint: '开放约束', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '' },
  { id: 9, entity: '表9', locationInfo: '(表9, 1-4, 61-70)', constraint: '访问权限', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '' },
  { id: 10, entity: '表10', locationInfo: '(表10, -, -)', constraint: '访问权限', transferControl: '可修改', auditInfo: '查看日志', status: '已合格', feedback: '' },
  { id: 11, entity: '表11', locationInfo: '(表11, 14-16, 1-7)', constraint: '开放约束', transferControl: '可读', auditInfo: '查看日志', status: '待检验', feedback: '' },
  { id: 12, entity: '表12', locationInfo: '(表12, 1-6, 12-14)', constraint: '开放约束', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '' }
])

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

  return result
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
  const index = tableData.value.findIndex(item => item.id === row.id)
  if (index > -1) {
    // 如果是已合格状态，清空反馈意见
    if (newStatus === '已合格') {
      tableData.value[index].feedback = ''
      tableData.value[index].status = newStatus
      ElMessage.success(`${row.entity} 已更新为"已合格"状态`)
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
        tableData.value[index].status = newStatus
        tableData.value[index].feedback = value
        ElMessage.success(`${row.entity} 已更新为"不合格"状态`)
      }).catch(() => {
        ElMessage.info('已取消状态更新')
      })
    }
  }
}

// 退出登录
const logout = () => {
  localStorage.removeItem('role')
  router.push('/login')
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

/* 头部样式 */
.header {
  height: 60px;
  width: 100%;
  background-color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
  box-sizing: border-box;
  z-index: 10;
}

.title {
  font-size: 25px;
  font-weight: bold;
  color: #1890ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.setting-icon {
  font-size: 18px;
  cursor: pointer;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-role {
  font-size: 14px;
  color: #333;
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
  margin-bottom: 20px;
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
  margin-bottom: 16px;
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
  height: calc(100vh - 240px);
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
  background-color: #e6f7ff;
  color: #1890ff;
}

/* 分页区域 */
.pagination-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
</style> 