<template>
  <div class="datasource-container">
    <!-- 头部导航 -->
    <div class="header">
      <div class="title">个人可信数据空间</div>
      <div class="user-info">
        <el-icon class="setting-icon"><Setting /></el-icon>
        <el-dropdown trigger="click">
          <div class="user-dropdown">
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar>
            <span class="user-role">数源方</span>
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
                  placeholder="请输入ID/实体/约束条件/传输控制操作"
                  class="search-input"
                >
                  <template #suffix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
              <div class="action-buttons">
                <el-button type="primary" plain>导出检验</el-button>
                <el-button type="primary" @click="showCreateDialog">新建数字对象</el-button>
              </div>
            </div>
            
            <!-- 数据表格 -->
            <div class="table-container">
              <el-table
                :data="filteredTableData"
                style="width: 100%"
                @selection-change="handleSelectionChange"
                @sort-change="handleSortChange"
                :cell-style="{ padding: '8px 0', textAlign: 'center' }"
                :header-cell-style="{ padding: '10px 0', background: '#f5f7fa', color: '#606266', fontWeight: 'bold', textAlign: 'center' }"
                border
                height="100%"
                fit
              >
                <el-table-column 
                  type="selection" 
                  width="50" 
                  align="center"
                  :selectable="(row) => row.status !== '已合格'"
                />
                <el-table-column 
                  prop="id" 
                  label="ID" 
                  width="70" 
                  align="center"
                  sortable
                />
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
                    <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            
            <!-- 分页 -->
            <div class="pagination-area">
              <span class="total-text">共{{ totalCount }}条信息</span>
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 30, 50]"
                layout="total, sizes, prev, pager, next"
                :total="totalCount"
                @size-change="handleSizeChange"
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
    width="40%"
    :close-on-click-modal="false"
    draggable
    class="custom-dialog"
  >
    <el-form :model="editForm" label-width="120px" ref="editFormRef" :rules="formRules">
      <el-form-item label="实体：" prop="entity">
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleEditFileChange"
          >
            <el-button type="primary" plain>点击上传</el-button>
          </el-upload>
          <span v-if="editForm.entity">已选择"{{ editForm.entity }}"</span>
        </div>
      </el-form-item>
      <el-form-item label="定位信息：" prop="locationInfo" style="margin-bottom: 22px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-input v-model="editForm.locationInfo.row" placeholder="例：0-4" style="width: 150px;"></el-input>
          <span>行</span>
          <el-input v-model="editForm.locationInfo.col" placeholder="例：0-4" style="width: 150px;"></el-input>
          <span>列</span>
        </div>
      </el-form-item>
      <el-form-item label="约束条件：" prop="constraint">
        <el-select v-model="editForm.constraint" placeholder="请选择约束条件" style="width: 100%">
          <el-option label="访问权限" value="访问权限"></el-option>
          <el-option label="共享约束" value="共享约束"></el-option>
          <el-option label="开放约束" value="开放约束"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="传输控制操作：" prop="transferControl">
        <el-select v-model="editForm.transferControl" placeholder="请选择传输控制操作" style="width: 100%">
          <el-option label="可读" value="可读"></el-option>
          <el-option label="可修改" value="可修改"></el-option>
          <el-option label="可销毁" value="可销毁"></el-option>
        </el-select>
      </el-form-item>
      <!-- 仅在状态不是"已合格"时显示反馈意见 -->
      <el-form-item label="反馈意见：" prop="feedback" v-if="editForm.status !== '已合格'">
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

  <!-- 新建对象弹窗 -->
  <el-dialog
    v-model="createDialogVisible"
    title="新建数字对象"
    width="40%"
    :close-on-click-modal="false"
    draggable
    class="custom-dialog"
  >
    <el-form :model="createForm" label-width="120px" ref="createFormRef" :rules="formRules">
      <el-form-item label="实体：" prop="entity">
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
          >
            <el-button type="primary" plain>点击上传</el-button>
          </el-upload>
          <span v-if="createForm.entity">已选择"{{ createForm.entity }}"</span>
        </div>
      </el-form-item>
      <el-form-item label="定位信息：" prop="locationInfo" style="margin-bottom: 22px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-input v-model="createForm.locationInfo.row" placeholder="例：0-4" style="width: 150px;"></el-input>
          <span>行</span>
          <el-input v-model="createForm.locationInfo.col" placeholder="例：0-4" style="width: 150px;"></el-input>
          <span>列</span>
        </div>
      </el-form-item>
      <el-form-item label="约束条件：" prop="constraint">
        <el-select v-model="createForm.constraint" placeholder="请选择约束条件" style="width: 100%">
          <el-option label="访问权限" value="访问权限"></el-option>
          <el-option label="共享约束" value="共享约束"></el-option>
          <el-option label="开放约束" value="开放约束"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="传输控制操作：" prop="transferControl">
        <el-select v-model="createForm.transferControl" placeholder="请选择传输控制操作" style="width: 100%">
          <el-option label="可读" value="可读"></el-option>
          <el-option label="可修改" value="可修改"></el-option>
          <el-option label="可销毁" value="可销毁"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelCreate">取消</el-button>
        <el-button type="primary" @click="saveCreate">确定</el-button>
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
  { id: 8, entity: '表8', locationInfo: '(表8, -, -)', constraint: '开放约束', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '' },
  { id: 9, entity: '表9', locationInfo: '(表9, 1-4, 61-70)', constraint: '访问权限', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '' },
  { id: 10, entity: '表10', locationInfo: '(表10, -, -)', constraint: '访问权限', transferControl: '可修改', auditInfo: '查看日志', status: '已合格', feedback: '' },
  { id: 11, entity: '表11', locationInfo: '(表11, 14-16, 1-7)', constraint: '开放约束', transferControl: '可读', auditInfo: '查看日志', status: '待检验', feedback: '' },
  { id: 12, entity: '表12', locationInfo: '(表12, 1-6, 12-14)', constraint: '开放约束', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '' }
])

// 排序状态
const sortState = reactive({
  prop: '',
  order: ''
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
      item.id.toString().includes(keyword) || 
      item.entity.toLowerCase().includes(keyword) || 
      item.constraint.toLowerCase().includes(keyword) || 
      item.transferControl.toLowerCase().includes(keyword)
    )
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
  
  // 处理定位信息格式
  let locationParts = ['', '']
  if (row.locationInfo) {
    // 从格式如"(表1, 0-4, 0-4)"中提取行列信息
    const matches = row.locationInfo.match(/\((.*?),\s*(.*?),\s*(.*?)\)/)
    if (matches && matches.length > 3) {
      locationParts = [matches[2].trim(), matches[3].trim()]
    }
  }
  
  // 设置编辑表单数据
  editForm.id = row.id
  editForm.entity = row.entity
  editForm.locationInfo.row = locationParts[0]
  editForm.locationInfo.col = locationParts[1]
  editForm.constraint = row.constraint
  editForm.transferControl = row.transferControl
  editForm.auditInfo = row.auditInfo
  editForm.status = row.status
  editForm.feedback = row.feedback
  
  editDialogVisible.value = true
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
  editForm.constraint = ''
  editForm.transferControl = ''
  editForm.auditInfo = ''
  editForm.status = ''
  editForm.feedback = ''
  
  editingIndex.value = -1
}

// 保存编辑
const saveEdit = () => {
  // 如果状态为"已合格"，清空反馈意见
  if (editForm.status === '已合格') {
    editForm.feedback = ''
  }
  
  // 构建更新后的对象
  const entityName = editForm.entity
  const updatedObject = {
    id: editForm.id,
    entity: entityName,
    locationInfo: `(${entityName}, ${editForm.locationInfo.row}, ${editForm.locationInfo.col})`,
    constraint: editForm.constraint || '',
    transferControl: editForm.transferControl || '',
    auditInfo: editForm.auditInfo,
    status: editForm.status,
    feedback: editForm.feedback
  }
  
  // 更新表格数据
  if (editingIndex.value > -1) {
    tableData.value[editingIndex.value] = updatedObject
  }
  
  ElMessage.success(`已保存对 ${entityName} 的编辑`)
  editDialogVisible.value = false
}

// 删除对象
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除"${row.entity}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // 找到要删除的数据索引
    const index = tableData.value.findIndex(item => item.id === row.id)
    // 从数组中删除该元素
    if (index !== -1) {
      tableData.value.splice(index, 1)
      ElMessage.success(`已删除: ${row.entity}`)
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
  createForm.constraint = ''
  createForm.transferControl = ''
  createForm.classificationValue = ''
  
  createDialogVisible.value = true
}

// 创建表单数据
const createForm = reactive({
  entity: '',
  locationInfo: {
    row: '',
    col: ''
  },
  constraint: '',
  transferControl: '',
  classificationValue: ''
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
  if (file) {
    createForm.entity = file.name
    ElMessage.success(`已选择"${file.name}"`)
  }
}

// 取消新建
const cancelCreate = () => {
  createDialogVisible.value = false
}

// 保存新建
const saveCreate = () => {
  // 直接检查定位信息
  if (!createForm.locationInfo.row || !createForm.locationInfo.col) {
    ElMessage.warning('请输入完整的定位信息（行和列）')
    return
  }
  
  createFormRef.value.validate((valid) => {
    if (valid) {
      // 创建新对象
      const newId = tableData.value.length > 0 ? Math.max(...tableData.value.map(item => item.id)) + 1 : 1
      const entityName = createForm.entity || '未上传'
      const newObject = {
        id: newId,
        entity: entityName,
        locationInfo: `(${entityName}, ${createForm.locationInfo.row}, ${createForm.locationInfo.col})`,
        constraint: createForm.constraint || '',
        transferControl: createForm.transferControl || '',
        auditInfo: '查看日志',
        status: '待检验',
        feedback: ''
      }
      
      // 添加到表格数据
      tableData.value.unshift(newObject)
      
      ElMessage.success(`成功新建数字对象`)
      createDialogVisible.value = false
    } else {
      return false
    }
  })
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

// 处理编辑文件变更
const handleEditFileChange = (file) => {
  if (file) {
    editForm.entity = file.name
    ElMessage.success(`已选择"${file.name}"`)
  }
}

// 处理每页显示数量变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
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
  background-color: #f6ffed;
  color: #52c41a;
}

.status-error {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.status-pending {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

/* 分页区域 */
.pagination-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
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

:deep(.custom-dialog) {
  margin-top: 15vh !important;
}
</style> 