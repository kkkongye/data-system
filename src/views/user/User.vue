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
                <el-button type="primary" plain @click="showDecryptDialog">解密</el-button>
                <el-button type="primary">下载数字对象</el-button>
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
                @selection-change="handleSelectionChange"
                border
                height="100%"
                fit
                :row-style="{ height: '45px' }"
                :header-row-style="{ height: '45px' }"
              >
                <el-table-column type="selection" width="55" align="center" fixed />
                <el-table-column prop="id" label="ID" width="70" align="center" fixed />
                <el-table-column prop="entity" label="实体" width="120" align="center">
                  <template #default="scope">
                    <el-link type="primary" @click="previewEntity(scope.row)">{{ scope.row.entity }}</el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="locationInfo" label="定位信息" width="140" align="center" />
                <el-table-column prop="constraint" label="约束条件" width="160" align="center" />
                <el-table-column prop="transferControl" label="传输控制操作" width="160" align="center" />
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
                v-if="isDecrypted"
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
    width="600px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    draggable
    class="edit-dialog"
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

  <!-- 解密对话框 -->
  <el-dialog
    v-model="decryptDialogVisible"
    title="解密"
    width="400px"
    append-to-body
    destroy-on-close
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
      </div>
    </div>
    
    <!-- 工作表切换 -->
    <div v-if="excelSheets.length > 0" class="sheets-selector">
      <span class="sheet-label">工作表：</span>
      <el-radio-group v-model="activeSheet" size="small" @change="changeSheet">
        <el-radio-button 
          v-for="sheet in excelSheets" 
          :key="sheet" 
          :label="sheet"
        >{{ sheet }}</el-radio-button>
      </el-radio-group>
    </div>
    
    <div class="excel-preview">
      <el-table
        v-if="excelTableData.length > 0"
        :data="excelTableData"
        style="width: 100%"
        border
        stripe
        v-loading="isExcelLoading"
        max-height="600px"
        :cell-style="{ padding: '6px 8px' }"
        :header-cell-style="{ backgroundColor: '#f5f7fa', color: '#606266', fontWeight: 'bold', textAlign: 'center' }"
      >
        <!-- 行号列 -->
        <el-table-column 
          type="index" 
          label="行号" 
          width="60" 
          fixed="left"
          align="center"
          :index="(index) => index + 1"
        />
        <!-- 数据列 -->
        <el-table-column 
          v-for="(column, index) in excelTableColumns" 
          :key="index"
          :prop="column.prop"
          :label="getExcelColName(index)"
          min-width="120"
          align="center"
          show-overflow-tooltip
        />
      </el-table>
      <div v-else-if="isExcelLoading" class="loading-message">
        <div>正在加载Excel数据...</div>
      </div>
      <div v-else class="no-data-message">
        <el-icon :size="48"><Document /></el-icon>
        <div>暂无数据</div>
        <div class="no-data-hint">该数字对象没有可用的Excel数据</div>
      </div>
    </div>
    <div class="preview-note">
      提示：此处显示原始Excel数据，包括表头行和所有列
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="previewDialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, ArrowDown, Search, Lock, Document } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

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

// 表格数据
const tableData = ref([
  { id: 1, entity: '表1', locationInfo: '(表1, -, -)', constraint: '访问权限', transferControl: '可修改', auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 2, entity: '表2', locationInfo: '(表2, 1-2, 3-6)', constraint: '', transferControl: '可修改', auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件', excelData: null },
  { id: 3, entity: '表3', locationInfo: '(表3, 1-6, 12-50)', constraint: '访问权限', transferControl: '可读', auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 4, entity: '表4', locationInfo: '(表4, 1-6, 21-52)', constraint: '', transferControl: '可修改', auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件', excelData: null },
  { id: 5, entity: '表5', locationInfo: '(表5, 1-4, 31-56)', constraint: '', transferControl: '可读', auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件', excelData: null },
  { id: 6, entity: '表6', locationInfo: '(表6, 11-12, 1-6)', constraint: '访问权限', transferControl: '可读', auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 7, entity: '表7', locationInfo: '(表7, -, -)', constraint: '共享约束', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 8, entity: '表8', locationInfo: '(表, -, -)', constraint: '开放约束', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 9, entity: '表9', locationInfo: '(表9, 1-4, 61-70)', constraint: '访问权限', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 10, entity: '表10', locationInfo: '(表10, -, -)', constraint: '访问权限', transferControl: '可修改', auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 11, entity: '表11', locationInfo: '(表11, 14-16, 1-7)', constraint: '开放约束', transferControl: '可读', auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 12, entity: '表12', locationInfo: '(表12, 1-6, 12-14)', constraint: '开放约束', transferControl: '可销毁', auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null }
])

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
  transferControl: ''
})

// Excel表格数据
const excelTableColumns = ref([])
const excelTableData = ref([])
const isExcelLoading = ref(false)
const excelSheets = ref([]) // 存储工作表名称
const activeSheet = ref('') // 当前激活的工作表
const currentWorkbook = ref(null) // 当前工作簿对象

// 预览实体
const previewEntity = (row) => {
  console.log('预览实体：', row)
  
  // 设置预览表单数据
  previewForm.id = row.id
  previewForm.entity = row.entity
  previewForm.locationInfo = row.locationInfo
  previewForm.constraint = row.constraint
  previewForm.transferControl = row.transferControl
  
  // 清空当前Excel数据
  excelTableData.value = []
  excelTableColumns.value = []
  excelSheets.value = []
  currentWorkbook.value = null
  isExcelLoading.value = false
  
  // 显示预览对话框
  previewDialogVisible.value = true
  
  // 如果已有保存的Excel数据，直接加载
  if (row.excelData) {
    isExcelLoading.value = true
    
    try {
      // 解析Excel数据
      const workbook = XLSX.read(row.excelData, { type: 'binary' })
      
      // 保存当前工作簿对象
      currentWorkbook.value = workbook
      
      // 获取所有工作表名称
      const sheetNames = workbook.SheetNames
      excelSheets.value = sheetNames
      
      // 选择第一个工作表
      if (sheetNames.length > 0) {
        activeSheet.value = sheetNames[0]
        
        // 获取第一个工作表
        const worksheet = workbook.Sheets[sheetNames[0]]
        
        // 处理并显示工作表数据
        processWorksheet(worksheet)
      }
      
      isExcelLoading.value = false
      
      if (excelTableData.value.length === 0) {
        ElMessage.warning('Excel文件中没有数据')
      }
    } catch (error) {
      console.error('解析Excel文件时出错:', error)
      ElMessage.error('无法解析Excel文件，请确保文件格式正确')
      isExcelLoading.value = false
    }
  }
}

// 切换工作表
const changeSheet = (sheetName) => {
  if (!currentWorkbook.value || !sheetName) return
  
  isExcelLoading.value = true
  
  // 获取选中的工作表
  const worksheet = currentWorkbook.value.Sheets[sheetName]
  
  // 处理并显示工作表数据
  processWorksheet(worksheet)
  
  isExcelLoading.value = false
}

// 处理单个工作表数据
const processWorksheet = (worksheet) => {
  try {
    // 获取工作表范围
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    
    // 设置表格列
    const columns = []
    
    // 创建表头
    for (let c = 0; c <= range.e.c; c++) {
      columns.push({
        prop: `col${c}`,
        label: getExcelColName(c)
      })
    }
    excelTableColumns.value = columns
    
    // 获取所有单元格数据，包括表头行
    const tableData = []
    for (let r = range.s.r; r <= range.e.r; r++) {
      const rowData = {}
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c })
        const cell = worksheet[cellAddress]
        
        // 格式化单元格数据
        let cellValue = ''
        if (cell) {
          // 特殊处理日期类型
          if (cell.t === 'd') {
            cellValue = cell.w || new Date(cell.v).toLocaleDateString()
          } else {
            cellValue = XLSX.utils.format_cell(cell)
          }
        }
        
        rowData[`col${c}`] = cellValue
      }
      tableData.push(rowData)
    }
    
    excelTableData.value = tableData
  } catch (error) {
    console.error('处理工作表数据出错:', error)
    ElMessage.error('处理工作表数据时出错')
    excelTableData.value = []
  }
}

// 获取Excel列名
const getExcelColName = (index) => {
  // 转换列索引为Excel列名（A, B, C, ... Z, AA, AB, ...）
  let colName = ''
  let n = index
  
  while (n >= 0) {
    colName = String.fromCharCode(65 + (n % 26)) + colName
    n = Math.floor(n / 26) - 1
  }
  
  return colName
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 表格样式优化 */
:deep(.el-table) {
  width: 100% !important;
  height: 100% !important;
}

:deep(.el-table__header),
:deep(.el-table__body),
:deep(.el-table__footer) {
  width: 100% !important;
  table-layout: fixed !important;
  display: table !important;
}

:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table__footer-wrapper) {
  width: 100% !important;
}

:deep(.el-table__cell) {
  text-align: center;
  padding: 8px 0;
  box-sizing: border-box;
}

:deep(.el-table .el-table__cell .cell) {
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  width: 100%;
  display: inline-block;
}

:deep(.el-table .el-table__cell:last-child .cell) {
  padding-right: 5px;
}

:deep(.el-table__row) {
  height: 45px !important;
}

:deep(.el-table__header tr) {
  height: 45px !important;
}

:deep(.el-table__header th.el-table__cell) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
  padding: 8px 0;
  text-align: center;
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
  height: 32px;
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

/* 数据锁定占位符样式 */
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

/* 全局对话框样式 - 放在样式的最底部以确保最高优先级 */
:deep(.el-overlay) {
  overflow: hidden;
}

:deep(.decrypt-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.decrypt-dialog .el-dialog) {
  margin: 0 auto !important;
  position: relative !important;
  top: 0 !important;
  transform: none !important;
  max-width: 90%;
}

:deep(.edit-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.edit-dialog .el-dialog) {
  margin: 0 auto !important;
  position: relative !important;
  top: 0 !important;
  transform: none !important;
  max-width: 90%;
}

/* 确保对话框居中显示 */
:deep(.el-dialog) {
  margin: 0 auto !important;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  max-width: 90%;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  cursor: move;
  font-weight: bold;
}

:deep(.el-dialog__body) {
  padding: 30px 20px;
}

:deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
  text-align: center;
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

.excel-preview {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 15px;
}

.preview-note {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-top: 10px;
}

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
}

.no-data-hint {
  font-size: 12px;
  margin-top: 5px;
  color: #c0c4cc;
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
}

/* 工作表切换相关样式 */
.sheets-selector {
  margin-bottom: 10px;
}

.sheet-label {
  font-size: 14px;
  color: #333;
  margin-right: 10px;
}
</style> 