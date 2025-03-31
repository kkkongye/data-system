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
            <span class="user-role">使用方</span>
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
            <!-- <div class="status-filter">
              <el-button 
                :class="['status-btn', { active: currentStatus === '' }]" 
                @click="setStatus('')"
              >全部数字对象</el-button>

            </div> -->
            
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
                <el-button type="primary" plain>解密</el-button>
                <el-button type="primary">下载数字对象</el-button>
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
  gap: 20px;
}
</style> 