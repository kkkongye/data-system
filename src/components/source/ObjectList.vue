<template>
  <div class="object-list-container">
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
          v-model="searchValue"
          placeholder="搜索实体名、约束条件、传输控制操作"
          class="search-input"
          @input="handleSearchInput"
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="action-buttons">
        <el-button type="primary" plain @click="$emit('export')">导出检验</el-button>
        <el-button type="primary" @click="$emit('create')">新建数字对象</el-button>
      </div>
    </div>
    
    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        :cell-style="{ padding: '8px 4px', textAlign: 'center' }"
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
          width="300" 
          align="center"
          sortable
        >
          <template #default="scope">
            <div class="id-cell">{{ scope.row.id }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="entity" label="实体" width="120" align="center">
          <template #default="scope">
            <el-link type="primary" @click="handlePreview(scope.row)">{{ scope.row.entity }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="locationInfo" label="定位信息" min-width="120" align="center" />
        <el-table-column prop="constraint" label="约束条件" min-width="300" align="center">
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
        <el-table-column prop="transferControl" label="传输控制操作" min-width="250" align="center">
          <template #default="scope">
            <div class="control-container">
              <!-- 优先使用transferControl数组 -->
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
              <!-- 如果没有transferControl，尝试使用propagationControl对象 -->
              <template v-else-if="scope.row.propagationControl">
                <el-tag
                  v-if="scope.row.propagationControl.canRead"
                  size="small"
                  type="primary"
                  effect="plain"
                  class="control-tag"
                >
                  可读
                </el-tag>
                <el-tag
                  v-if="scope.row.propagationControl.canModify"
                  size="small"
                  type="primary"
                  effect="plain"
                  class="control-tag"
                >
                  可修改
                </el-tag>
                <el-tag
                  v-if="scope.row.propagationControl.canShare"
                  size="small"
                  type="primary"
                  effect="plain"
                  class="control-tag"
                >
                  可共享
                </el-tag>
                <el-tag
                  v-if="scope.row.propagationControl.canDelegate"
                  size="small"
                  type="primary"
                  effect="plain"
                  class="control-tag"
                >
                  可委托
                </el-tag>
                <el-tag
                  v-if="scope.row.propagationControl.canDestroy"
                  size="small"
                  type="primary"
                  effect="plain"
                  class="control-tag"
                >
                  可销毁
                </el-tag>
              </template>
              <template v-else>-</template>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="auditInfo" label="审计控制信息" width="140" align="center">
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
        <el-table-column v-if="!isQualifiedStatus" prop="feedback" label="反馈意见" min-width="150" align="center">
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
      <CommonPagination
        v-model:current-page="currentPageValue"
        v-model:page-size="pageSizeValue"
        :total-count="totalCount"
        :page-sizes="[5, 10, 20, 30, 50]"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import CommonPagination from '@/components/CommonPagination.vue'

const props = defineProps({
  // 表格数据
  data: {
    type: Array,
    default: () => []
  },
  // 当前状态筛选
  currentStatus: {
    type: String,
    default: ''
  },
  // 搜索关键词
  searchKeyword: {
    type: String,
    default: ''
  },
  // 当前页
  currentPage: {
    type: Number,
    default: 1
  },
  // 每页大小
  pageSize: {
    type: Number,
    default: 5
  },
  // 总数据量
  totalCount: {
    type: Number,
    default: 0
  },
  // 是否为已合格状态
  isQualifiedStatus: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:currentStatus', 
  'update:searchKeyword', 
  'update:currentPage', 
  'update:pageSize',
  'selection-change',
  'sort-change',
  'edit',
  'delete',
  'preview',
  'create',
  'export'
])

// 内部状态
const searchValue = ref(props.searchKeyword)
const currentPageValue = ref(props.currentPage)
const pageSizeValue = ref(props.pageSize || 5)
const selectedRows = ref([])

// 组件内计算属性和方法
const tableData = computed(() => {
  if (!props.data) return []
  
  // 在组件内部进行分页
  const startIndex = (props.currentPage - 1) * props.pageSize
  const endIndex = startIndex + props.pageSize
  
  // 确保不超出数组范围
  return props.data.slice(startIndex, Math.min(endIndex, props.data.length))
})

// 监听props变化
watch(() => props.searchKeyword, (newVal) => {
  searchValue.value = newVal
})

watch(() => props.currentPage, (newVal) => {
  currentPageValue.value = newVal
})

watch(() => props.pageSize, (newVal) => {
  pageSizeValue.value = newVal
})

// 监听内部状态变化，向外发出事件
watch(searchValue, (newVal) => {
  emit('update:searchKeyword', newVal)
})

watch(currentPageValue, (newVal) => {
  emit('update:currentPage', newVal)
})

watch(pageSizeValue, (newVal) => {
  emit('update:pageSize', newVal)
})

// 处理状态筛选
const setStatus = (status) => {
  emit('update:currentStatus', status)
}

// 处理搜索输入
const handleSearchInput = (value) => {
  emit('update:searchKeyword', value)
}

// 处理表格选择变更
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
  emit('selection-change', rows)
}

// 处理编辑
const handleEdit = (row) => {
  emit('edit', row)
}

// 处理删除
const handleDelete = (row) => {
  emit('delete', row)
}

// 处理预览
const handlePreview = (row) => {
  emit('preview', row)
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSizeValue.value = size
  emit('update:pageSize', size)
}

// 处理当前页变化
const handleCurrentChange = (page) => {
  currentPageValue.value = page
  emit('update:currentPage', page)
}

// 处理排序变化
const handleSortChange = (column) => {
  emit('sort-change', column)
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

// 解析元数据JSON
const parseMetadataJson = (jsonString) => {
  console.log('开始解析metadataJson:', jsonString)
  try {
    if (!jsonString) {
      console.log('metadataJson为空')
      return {}
    }
    
    let metadata = {}
    
    // 处理不同格式的metadataJson
    if (typeof jsonString === 'string') {
      console.log('metadataJson是字符串类型')
      
      try {
        // 1. 尝试直接解析标准JSON
        metadata = JSON.parse(jsonString)
        console.log('成功解析标准JSON字符串')
      } catch (parseError) {
        console.warn('标准JSON解析失败，尝试处理转义字符:', parseError)
        
        // 2. 处理各种转义的情况
        let processedString = jsonString
        
        // 处理可能的反斜杠转义
        if (jsonString.includes('\\')) {
          try {
            // 尝试处理双重转义的JSON字符串 
            processedString = jsonString.replace(/\\"/g, '"')
            metadata = JSON.parse(processedString)
            console.log('成功解析处理转义后的JSON字符串 (步骤1)')
          } catch (error) {
            console.warn('处理转义后解析失败 (步骤1):', error)
            
            try {
              // 尝试删除开头和结尾的引号，并处理转义
              if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
                processedString = jsonString.substring(1, jsonString.length - 1).replace(/\\"/g, '"')
                metadata = JSON.parse(processedString)
                console.log('成功解析处理转义后的JSON字符串 (步骤2)')
              }
            } catch (error2) {
              console.warn('处理转义后解析失败 (步骤2):', error2)
              
              try {
                // 尝试将双反斜杠替换为单反斜杠
                processedString = jsonString.replace(/\\\\/g, '\\')
                metadata = JSON.parse(processedString)
                console.log('成功解析处理转义后的JSON字符串 (步骤3)')
              } catch (error3) {
                console.warn('处理转义后解析失败 (步骤3):', error3)
              }
            }
          }
        }
        
        // 3. 如果以上都失败，尝试正则表达式提取关键字段
        if (Object.keys(metadata).length === 0) {
          console.log('尝试使用正则表达式提取关键字段')
          
          // 匹配各种可能的格式，应对各种转义情况
          const patterns = [
            /resourceSummary[\\]*"*:[\\]*"*([^"\\,}]+)/,
            /resourceSummary=([^,}]+)/,
            /resourceSummary[\\]*":([^",}]+)/
          ]
          
          const fieldPatterns = [
            /fieldClassification[\\]*"*:[\\]*"*([^"\\,}]+)/,
            /fieldClassification=([^,}]+)/,
            /fieldClassification[\\]*":([^",}]+)/
          ]
          
          for (const pattern of patterns) {
            const match = jsonString.match(pattern)
            if (match && match[1]) {
              metadata.resourceSummary = match[1].trim()
              console.log('通过正则提取到resourceSummary:', metadata.resourceSummary)
              break
            }
          }
          
          for (const pattern of fieldPatterns) {
            const match = jsonString.match(pattern)
            if (match && match[1]) {
              metadata.fieldClassification = match[1].trim()
              console.log('通过正则提取到fieldClassification:', metadata.fieldClassification)
              break
            }
          }
        }
      }
    } else if (typeof jsonString === 'object') {
      console.log('metadataJson是对象类型')
      metadata = jsonString
    }
    
    const result = {
      dataName: metadata.dataName || '',
      sourceUnit: metadata.sourceUnit || '',
      contactPerson: metadata.contactPerson || '',
      contactPhone: metadata.contactPhone || '',
      resourceSummary: metadata.resourceSummary || '',
      fieldClassification: metadata.fieldClassification || ''
    }
    
    console.log('最终解析的元数据:', result)
    return result
  } catch (error) {
    console.error('解析元数据JSON失败:', error)
    return {}
  }
}
</script>

<style scoped>
.object-list-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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
  flex: 1;
}

/* 状态标签样式 */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
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

/* 纯文本样式 */
.plain-text-container {
  color: #333;
  text-align: center;
  line-height: 1.5;
  padding: 2px 0;
}

/* 约束条件列样式 */
.constraint-container {
  text-align: left;
  padding: 4px 8px;
}

.constraint-row {
  display: flex;
  margin-bottom: 8px;
  gap: 20px;
}

.constraint-item-pair {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 5px;
}

:deep(.constraint-prefix) {
  font-weight: bold;
  color: #303133;
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

/* ID列样式 */
.id-cell {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  max-width: 300px;
  width: 100%;
  padding: 0 8px;
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  word-break: break-all;
}
</style> 