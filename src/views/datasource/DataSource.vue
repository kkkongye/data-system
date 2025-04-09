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
                    <el-link type="primary" @click="previewEntity(scope.row)">{{ scope.row.entity }}</el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="locationInfo" label="定位信息" min-width="150" align="center" />
                <el-table-column prop="constraint" label="约束条件" min-width="160" align="center">
                  <template #default="scope">
                    <div class="plain-text-container">
                      <template v-if="scope.row.constraint && scope.row.constraint.length">
                        {{ scope.row.constraint.join('；') }}
                      </template>
                      <template v-else>-</template>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="transferControl" label="传输控制操作" min-width="160" align="center">
                  <template #default="scope">
                    <div class="plain-text-container">
                      <template v-if="scope.row.transferControl && scope.row.transferControl.length">
                        {{ scope.row.transferControl.join('；') }}
                      </template>
                      <template v-else>-</template>
                    </div>
                  </template>
                </el-table-column>
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
            accept=".xlsx,.xls"
          >
            <el-button type="primary" plain>
              <el-icon style="margin-right: 4px;"><Document /></el-icon>上传Excel表格
            </el-button>
          </el-upload>
          <span v-if="editForm.entity">已选择"{{ editForm.entity }}"</span>
          <span v-else class="upload-tip">请上传Excel表格文件</span>
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
        <el-select v-model="editForm.constraint" placeholder="请选择约束条件" style="width: 100%" class="custom-select" multiple allow-create filterable default-first-option>
          <el-option label="访问权限" value="访问权限"></el-option>
          <el-option label="共享约束" value="共享约束"></el-option>
          <el-option label="开放约束" value="开放约束"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="传输控制操作：" prop="transferControl">
        <el-select v-model="editForm.transferControl" placeholder="请选择传输控制操作" style="width: 100%" class="custom-select" multiple allow-create filterable default-first-option>
          <el-option label="可读" value="可读"></el-option>
          <el-option label="可修改" value="可修改"></el-option>
          <el-option label="可销毁" value="可销毁"></el-option>
        </el-select>
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
            accept=".xlsx,.xls"
          >
            <el-button type="primary" plain>
              <el-icon style="margin-right: 4px;"><Document /></el-icon>上传Excel表格
            </el-button>
          </el-upload>
          <span v-if="createForm.entity">已选择"{{ createForm.entity }}"</span>
          <span v-else class="upload-tip">请上传Excel表格文件</span>
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
        <el-select v-model="createForm.constraint" placeholder="请选择约束条件" style="width: 100%" class="custom-select" multiple allow-create filterable default-first-option>
          <el-option label="访问权限" value="访问权限"></el-option>
          <el-option label="共享约束" value="共享约束"></el-option>
          <el-option label="开放约束" value="开放约束"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="传输控制操作：" prop="transferControl">
        <el-select v-model="createForm.transferControl" placeholder="请选择传输控制操作" style="width: 100%" class="custom-select" multiple allow-create filterable default-first-option>
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
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, ArrowDown, Search, Document } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import ExcelPreview from '@/components/sourse/ExcelPreview.vue'

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
  constraint: [],
  transferControl: [],
  auditInfo: '',
  status: '',
  feedback: '',
  excelData: null // 新增保存Excel文件数据
})
const editingIndex = ref(-1)

// 表格数据
const tableData = ref([
  { id: 1, entity: '表1', locationInfo: '(表1, -, -)', constraint: ['访问权限'], transferControl: ['可修改'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 2, entity: '表2', locationInfo: '(表2, 1-2, 3-6)', constraint: [], transferControl: ['可修改'], auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件', excelData: null },
  { id: 3, entity: '表3', locationInfo: '(表3, 1-6, 12-50)', constraint: ['访问权限'], transferControl: ['可读'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 4, entity: '表4', locationInfo: '(表4, 1-6, 21-52)', constraint: [], transferControl: ['可修改'], auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件', excelData: null },
  { id: 5, entity: '表5', locationInfo: '(表5, 1-4, 31-56)', constraint: [], transferControl: ['可读'], auditInfo: '查看日志', status: '不合格', feedback: '缺少约束条件', excelData: null },
  { id: 6, entity: '表6', locationInfo: '(表6, 11-12, 1-6)', constraint: ['访问权限'], transferControl: ['可读'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 7, entity: '表7', locationInfo: '(表7, -, -)', constraint: ['共享约束'], transferControl: ['可销毁'], auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 8, entity: '表8', locationInfo: '(表8, -, -)', constraint: ['开放约束'], transferControl: ['可销毁'], auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 9, entity: '表9', locationInfo: '(表9, 1-4, 61-70)', constraint: ['访问权限'], transferControl: ['可销毁'], auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 10, entity: '表10', locationInfo: '(表10, -, -)', constraint: ['访问权限'], transferControl: ['可修改'], auditInfo: '查看日志', status: '已合格', feedback: '', excelData: null },
  { id: 11, entity: '表11', locationInfo: '(表11, 14-16, 1-7)', constraint: ['开放约束'], transferControl: ['可读'], auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null },
  { id: 12, entity: '表12', locationInfo: '(表12, 1-6, 12-14)', constraint: ['开放约束'], transferControl: ['可销毁'], auditInfo: '查看日志', status: '待检验', feedback: '', excelData: null }
])

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
  
  // 使用辅助函数确保约束条件和传输控制是数组
  editForm.constraint = ensureArray(row.constraint)
  editForm.transferControl = ensureArray(row.transferControl)
  
  editForm.auditInfo = row.auditInfo
  editForm.status = row.status
  editForm.feedback = row.feedback
  
  editForm.excelData = row.excelData // 保留原有的Excel文件数据
  
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
  editForm.constraint = []
  editForm.transferControl = []
  editForm.auditInfo = ''
  editForm.status = ''
  editForm.feedback = ''
  editForm.excelData = null
  
  editingIndex.value = -1
}

// 保存编辑
const saveEdit = () => {
  // 构建更新后的对象
  const entityName = editForm.entity
  const updatedObject = {
    id: editForm.id,
    entity: entityName,
    locationInfo: `(${entityName}, ${editForm.locationInfo.row}, ${editForm.locationInfo.col})`,
    constraint: ensureArray(editForm.constraint),
    transferControl: ensureArray(editForm.transferControl),
    auditInfo: editForm.auditInfo,
    status: editForm.status,
    feedback: editForm.feedback, // 保留原有反馈意见
    // 如果上传了新的Excel文件，使用新的数据，否则保留原来的
    excelData: editForm.excelData || tableData.value[editingIndex.value].excelData
  }
  
  // 更新表格数据
  if (editingIndex.value > -1) {
    tableData.value[editingIndex.value] = updatedObject
  }
  
  ElMessage.success(`已保存对 ${entityName} 的编辑`)
  editDialogVisible.value = false
  
  // 重置表单
  editForm.excelData = null
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
  createForm.constraint = []
  createForm.transferControl = []
  createForm.classificationValue = ''
  createForm.excelData = null // 新增保存Excel文件数据
  
  createDialogVisible.value = true
}

// 创建表单数据
const createForm = reactive({
  entity: '',
  locationInfo: {
    row: '',
    col: ''
  },
  constraint: [],
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
  
  // 检查是否已上传Excel文件
  if (!createForm.excelData) {
    ElMessage.warning('请上传Excel表格文件')
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
        constraint: ensureArray(createForm.constraint),
        transferControl: ensureArray(createForm.transferControl),
        auditInfo: '查看日志',
        status: '待检验',
        feedback: '',
        excelData: createForm.excelData // 保存Excel文件数据
      }
      
      // 添加到表格数据
      tableData.value.unshift(newObject)
      
      ElMessage.success(`成功新建数字对象，可点击实体名称预览Excel内容`)
      createDialogVisible.value = false
      
      // 重置表单
      createForm.excelData = null
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
  editForm.entity = fileNameWithoutExt;
  
  // 读取并保存Excel文件内容
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // 保存文件的二进制数据
      editForm.excelData = e.target.result;
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

// 处理每页显示数量变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
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

// 添加生成测试数据的方法
const generateTestExcelData = (rows = 5000) => {
  // 创建一个新的工作簿
  const workbook = XLSX.utils.book_new()
  
  // 创建测试数据 - 大表格，以测试性能
  const data = []
  const headers = ['ID', '姓名', '年龄', '性别', '城市', '职业', '收入', '电话', '邮箱', '备注',
                  '属性1', '属性2', '属性3', '属性4', '属性5', '属性6', '属性7', '属性8', '属性9', '属性10']
  
  // 添加表头
  data.push(headers)
  
  // 生成指定行数的测试数据
  for (let i = 1; i <= rows; i++) {
    const row = [
      i, // ID
      `测试用户${i}`, // 姓名
      Math.floor(Math.random() * 50) + 18, // 年龄
      Math.random() > 0.5 ? '男' : '女', // 性别
      ['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random() * 5)], // 城市
      ['工程师', '教师', '医生', '销售', '设计师'][Math.floor(Math.random() * 5)], // 职业
      Math.floor(Math.random() * 10000) + 5000, // 收入
      `1${Math.floor(Math.random() * 9000000000) + 1000000000}`, // 电话
      `user${i}@example.com`, // 邮箱
      `这是第${i}条测试数据`, // 备注
      `属性值1-${i}`,
      `属性值2-${i}`,
      `属性值3-${i}`,
      `属性值4-${i}`,
      `属性值5-${i}`,
      `属性值6-${i}`,
      `属性值7-${i}`,
      `属性值8-${i}`,
      `属性值9-${i}`,
      `属性值10-${i}`
    ]
    data.push(row)
    
    // 添加进度提示
    if (i % 1000 === 0) {
      console.log(`生成测试数据: ${i}/${rows} 行`)
    }
  }
  
  console.log(`完成生成 ${rows} 行测试数据`)
  
  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  
  // 添加第二个工作表（小数据量）
  const smallData = [
    ['ID', '名称', '数量', '单价', '总价'],
    [1, '产品A', 10, 100, 1000],
    [2, '产品B', 20, 50, 1000],
    [3, '产品C', 30, 30, 900]
  ]
  const smallSheet = XLSX.utils.aoa_to_sheet(smallData)
  
  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '大数据表')
  XLSX.utils.book_append_sheet(workbook, smallSheet, '小数据表')
  
  // 转为二进制字符串
  return XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' })
}

// 修改previewEntity方法
const previewEntity = (row) => {
  // 设置预览表单数据
  previewForm.id = row.id
  previewForm.entity = row.entity
  previewForm.locationInfo = row.locationInfo
  previewForm.constraint = ensureArray(row.constraint)
  previewForm.transferControl = ensureArray(row.transferControl)
  previewForm.status = row.status
  
  // 显示预览对话框（先显示再加载数据，这样用户体验更好）
  previewDialogVisible.value = true
  
  // 设置Excel文件数据
  ElMessage.info('正在准备Excel数据，请稍候...')
  isExcelLoading.value = true
  
  // 使用setTimeout避免UI阻塞
  setTimeout(() => {
    try {
      if (row.excelData) {
        currentExcelFile.value = row.excelData
      } else {
        // 使用模拟数据进行测试
        const dataRows = 5000 // 可以调整此值来测试不同数据量
        console.time('生成Excel测试数据')
        currentExcelFile.value = generateTestExcelData(dataRows)
        console.timeEnd('生成Excel测试数据')
      }
    } catch (error) {
      console.error('生成Excel数据出错:', error)
      ElMessage.error(`生成Excel数据出错: ${error.message}`)
      isExcelLoading.value = false
    }
  }, 100)
}

// 添加新的处理方法
const handleExcelDataLoaded = (data) => {
  console.log('Excel数据加载完成:', data)
  // 可以在这里处理加载完的数据，例如根据定位信息高亮显示特定单元格
  const { headers, data: tableData, sheets } = data
  
  // 存储Excel表格数据，以便后续可能的操作
  excelTableColumns.value = headers || []
  excelTableData.value = tableData || []
  excelSheets.value = sheets || []
  
  isExcelLoading.value = false
  ElMessage.success(`已成功加载 ${tableData?.length || 0} 行数据`)
}

const handleExcelError = (error) => {
  console.error('Excel加载错误:', error)
  isExcelLoading.value = false
  ElMessage.error(`加载Excel时出错: ${error}`)
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

/* 纯文本样式 */
.plain-text-container {
  color: #333;
  text-align: center;
  line-height: 1.5;
  padding: 2px 0;
}

/* 标签样式 */
.constraint-tag {
  margin: 2px;
  max-width: 90%;
  white-space: normal;
  display: inline-block;
}

.transfer-tag {
  margin: 2px;
  max-width: 90%;
  white-space: normal;
  display: inline-block;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-height: 24px;
}

/* 自定义选择控件样式 */
:deep(.custom-select) {
  width: 100%;
}

:deep(.custom-select .el-select__tags) {
  max-width: 100%;
  overflow: hidden;
  flex-wrap: wrap;
}

:deep(.custom-select .el-tag) {
  margin: 2px 4px;
  max-width: calc(100% - 8px);
  display: flex;
  align-items: center;
}

:deep(.custom-select .el-select__input) {
  margin: 2px 0;
}

:deep(.el-select-dropdown__item) {
  padding: 0 10px;
  height: 34px;
  line-height: 34px;
}

/* 上传提示样式 */
.upload-tip {
  color: #909399;
  font-size: 14px;
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