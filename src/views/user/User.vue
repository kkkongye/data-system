<template>
  <div class="datasource-container">
    <!-- 头部导航 -->
    <AppHeader role-name="使用方" @logout="logout" />
    
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 标签页 -->
      <div class="content-card">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="数字对象列表" name="objectList">
            

            
            <!-- 搜索和操作区 -->
            <div class="action-bar">
              <div class="search-area">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索实体名、约束条件、传输控制操作"
                  class="search-input"
                >
                  <template #suffix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
              <div class="action-buttons">
                <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleDownload">下载数字对象</el-button>
                <el-button type="primary" plain @click="showDecryptDialog">解密</el-button>

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
                <el-table-column prop="id" label="ID" width="400" align="center" fixed>
                  <template #default="scope">
                    <div class="id-cell">{{ scope.row.id }}</div>
                  </template>
                </el-table-column>
                <el-table-column prop="entity" label="实体" width="120" align="center">
                  <template #default="scope">
                    <el-link type="primary" @click="previewEntity(scope.row)">{{ scope.row.entity }}</el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="locationInfo" label="定位信息" min-width="150" align="center" />
                <el-table-column prop="constraint" label="约束条件" min-width="250" align="center">
                  <template #default="scope">
                    <div class="constraint-container">
                      <template v-if="scope.row.constraint && scope.row.constraint.length">
                        <div 
                          v-for="(_, rowIndex) in Math.ceil((Array.isArray(scope.row.constraint) ? scope.row.constraint : [scope.row.constraint]).length / 2)" 
                          :key="rowIndex"
                          class="constraint-row"
                        >
                          <!-- 第一项 -->
                          <div class="constraint-item-pair">
                            <span v-if="(Array.isArray(scope.row.constraint) ? scope.row.constraint : [scope.row.constraint])[rowIndex * 2]" 
                                  v-html="formatConstraintText((Array.isArray(scope.row.constraint) ? scope.row.constraint : [scope.row.constraint])[rowIndex * 2])"></span>
                          </div>
                          
                          <!-- 第二项 -->
                          <div class="constraint-item-pair">
                            <span v-if="(Array.isArray(scope.row.constraint) ? scope.row.constraint : [scope.row.constraint])[rowIndex * 2 + 1]" 
                                  v-html="formatConstraintText((Array.isArray(scope.row.constraint) ? scope.row.constraint : [scope.row.constraint])[rowIndex * 2 + 1])"></span>
                          </div>
                        </div>
                      </template>
                      <template v-else>-</template>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="transferControl" label="传输控制操作" min-width="180" align="center">
                  <template #default="scope">
                    <div class="control-container">
                      <template v-if="scope.row.transferControl && scope.row.transferControl.length">
                        <el-tag
                          v-for="(item, index) in (Array.isArray(scope.row.transferControl) ? scope.row.transferControl : [scope.row.transferControl])"
                          :key="index"
                          size="small"
                          type="primary"
                          effect="plain"
                          class="control-tag"
                        >
                          {{ item }}
                        </el-tag>
                      </template>
                      <template v-else>-</template>
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
                :page-sizes="[5, 10, 20]"
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
        <!-- 修改基本信息样式为单行显示 -->
        <div class="basic-info-table">
          <span class="info-item"><strong>实体：</strong>{{ previewForm.entity }}</span>
          <span class="info-item"><strong>定位信息：</strong>{{ previewForm.locationInfo }}</span>
          <span class="info-item constraint-info" :title="Array.isArray(previewForm.constraint) ? previewForm.constraint.join(', ') : previewForm.constraint"><strong>约束条件：</strong>{{ Array.isArray(previewForm.constraint) ? previewForm.constraint.join(', ') : previewForm.constraint }}</span>
          <span class="info-item"><strong>传输控制操作：</strong>{{ Array.isArray(previewForm.transferControl) ? previewForm.transferControl.join(', ') : previewForm.transferControl }}</span>
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
import { ensureArray, advancedSearch } from '@/utils/searchUtils';

const router = useRouter()
const activeTab = ref('objectList')
const currentStatus = ref('') // 默认显示全部数字对象
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(5) // 改为默认显示5条
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
    console.log('使用方收到数据变化:', newData)
    // 无需手动更新tableData，因为是响应式引用
  })
})

// 计算实际数据量
const totalCount = computed(() => {
  let result = tableData.value;
  if (currentStatus.value) {
    result = result.filter(item => item.status === currentStatus.value);
  }
  
  if (searchKeyword.value) {
    result = advancedSearch(result, searchKeyword.value);
  }
  
  return result.length;
});

// 根据状态和搜索条件过滤数据
const filteredTableData = computed(() => {
  let result = tableData.value;

  // 状态过滤
  if (currentStatus.value) {
    result = result.filter(item => item.status === currentStatus.value);
  }

  // 关键字搜索
  if (searchKeyword.value) {
    result = advancedSearch(result, searchKeyword.value);
  }

  // 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return result.slice(startIndex, endIndex);
});

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
  transferControl: '',
  metadata: null
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
  
  // 解析元数据
  previewForm.metadata = null
  
  // 提取元数据
  extractMetadata(row)
  
  // 清空当前Excel数据
  excelBinaryData.value = row.excelData || null
  
  // 显示预览对话框
  previewDialogVisible.value = true
}

// 提取元数据
const extractMetadata = (row) => {
  // 检查数据的各种可能位置
  if (row.metadataJson) {
    try {
      processMetadataString(row.metadataJson)
      if (previewForm.metadata) return true
    } catch (e) {
      console.warn('解析元数据JSON失败:', e)
    }
  }
  
  // 最后使用模拟数据
  if (!previewForm.metadata) {
    // 生成模拟元数据
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
  
  try {
    // 尝试解析
    const parsed = JSON.parse(metadataString)
    // 设置元数据
    if (typeof parsed === 'object') {
      previewForm.metadata = parsed
    }
  } catch (e) {
    console.warn('解析元数据字符串失败:', e)
  }
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

// 格式化约束条件文本
const formatConstraintText = (text) => {
  if (!text) return text
  
  // 如果包含冒号，分离前缀和内容
  if (text.includes(':')) {
    const parts = text.split(':')
    return `<span class="constraint-prefix">${parts[0]}:</span>${parts[1]}`
  }
  
  return text
}

// 处理下载数字对象
const handleDownload = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要下载的数字对象');
    return;
  }

  // 对每个选中的对象进行处理
  selectedRows.value.forEach(row => {
    if (row.excelData) {
      // 如果有Excel数据，直接下载
      downloadExcelFile(row);
    } else {
      // 如果没有Excel数据，提示用户先点击实体名预览
      ElMessage.info(`${row.entity} 没有可下载的数据，请先点击实体名进行预览`);
    }
  });
}

// 下载Excel文件
const downloadExcelFile = (row) => {
  try {
    // 创建Blob对象
    const blob = new Blob([row.excelData], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${row.entity}.xlsx`;
    
    // 添加到文档并触发点击
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    ElMessage.success(`${row.entity} 已下载`);
  } catch (error) {
    console.error('下载文件时出错:', error);
    ElMessage.error(`下载 ${row.entity} 时出错: ${error.message}`);
  }
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

/* 确保ID单元格不被全局样式覆盖 */
:deep(.el-table .el-table__cell .id-cell) {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: break-all;
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
  margin-bottom: 15px;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
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

.constraint-info {
  max-width: 500px;
}

.info-item strong {
  font-weight: bold;
  color: #606266;
  margin-right: 5px;
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

/* ID单元格样式 */
.id-cell {
  width: 100%;
  overflow: visible;
  white-space: normal;
  word-break: break-all;
  padding: 2px 5px;
  text-align: left;
  text-align: center;
}

/* 约束条件相关样式 */
.constraint-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}

.constraint-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.constraint-item-pair {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.constraint-prefix) {
  font-weight: bold !important;
  color: #303133 !important;
  margin-right: 4px !important;
}

/* 传输控制操作样式 */
.control-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  padding: 4px;
}

.control-tag {
  margin: 2px;
}
</style> 