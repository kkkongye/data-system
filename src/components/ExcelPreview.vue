<template>
    <div class="excel-preview-container">
      <div class="excel-preview-header">
        <h3>{{ title || '数据预览' }}</h3>
        <div class="excel-actions">
          <el-button size="small" type="primary" @click="$emit('close')" v-if="showClose">关闭预览</el-button>
        </div>
      </div>
      
      <div class="excel-content" v-loading="loading">
        <template v-if="!loading && tableData.length">
          <!-- 工作表切换 -->
          <div v-if="sheets.length > 0" class="sheets-selector">
            <span class="sheet-label">工作表：</span>
            <el-radio-group v-model="activeSheet" size="small" @change="handleSheetChange">
              <el-radio-button 
                v-for="sheet in sheets" 
                :key="sheet" 
                :label="sheet"
              >{{ sheet }}</el-radio-button>
            </el-radio-group>
          </div>
          
          <!-- 表格内容 -->
          <div class="excel-table-wrapper">
            <el-table
              :data="paginatedData"
              border
              stripe
              style="width: 100%"
              max-height="500"
              :cell-style="{ padding: '8px 4px' }"
            >
              <el-table-column
                v-for="(column, index) in columns"
                :key="index"
                :prop="column.prop"
                :label="column.label"
                :width="column.width || ''"
                align="center"
                show-overflow-tooltip
              />
            </el-table>
          </div>
          
          <!-- 分页 -->
          <div class="excel-pagination" v-if="showPagination && total > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </template>
        
        <!-- 空数据或错误状态 -->
        <el-empty v-else-if="!loading && !tableData.length" description="暂无数据" />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue'
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  
  const props = defineProps({
    // 文件对象或文件路径
    file: {
      type: [File, String, Object],
      default: null
    },
    // 预览标题
    title: {
      type: String,
      default: '数据预览'
    },
    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      default: true
    },
    // 是否显示分页
    showPagination: {
      type: Boolean,
      default: true
    },
    // 预设数据（如果不需要从文件读取）
    presetData: {
      type: Array,
      default: () => []
    },
    // 预设表头（如果不需要从文件读取）
    presetHeaders: {
      type: Array,
      default: () => []
    }
  })
  
  const emit = defineEmits(['close', 'data-loaded', 'error'])
  
  // 状态变量
  const loading = ref(false)
  const tableData = ref([])
  const columns = ref([])
  const sheets = ref([])
  const activeSheet = ref('')
  const currentPage = ref(1)
  const pageSize = ref(20)
  const workbook = ref(null)
  
  // 计算分页后的数据
  const paginatedData = computed(() => {
    if (!props.showPagination) return tableData.value
    
    const startIndex = (currentPage.value - 1) * pageSize.value
    return tableData.value.slice(startIndex, startIndex + pageSize.value)
  })
  
  // 表格总数据量
  const total = computed(() => tableData.value.length)
  
  // 监听文件变化
  watch(() => props.file, async (newFile) => {
    if (newFile) {
      await loadExcelFile(newFile)
    }
  }, { immediate: true })
  
  // 监听预设数据变化
  watch(() => props.presetData, (newData) => {
    if (newData && newData.length) {
      tableData.value = newData
      
      // 如果没有预设表头，从数据中提取表头
      if (!props.presetHeaders.length && newData.length > 0) {
        const firstRow = newData[0]
        columns.value = Object.keys(firstRow).map(key => ({
          prop: key,
          label: key
        }))
      }
      
      emit('data-loaded', { data: newData, headers: columns.value })
    }
  }, { immediate: true })
  
  // 加载Excel文件
  const loadExcelFile = async (file) => {
    if (!file) return
    
    loading.value = true
    console.log('加载Excel文件类型:', typeof file)
    
    try {
      // 根据文件类型选择不同的处理方法
      if (file instanceof File) {
        // 如果是File对象
        const arrayBuffer = await file.arrayBuffer()
        workbook.value = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
      } else if (typeof file === 'string') {
        if (file.startsWith('data:')) {
          // Base64数据
          const base64 = file.replace(/^data:.+;base64,/, '')
          workbook.value = XLSX.read(base64, { type: 'base64' })
        } else if (file.startsWith('http')) {
          // URL
          const response = await fetch(file)
          const arrayBuffer = await response.arrayBuffer()
          workbook.value = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
        } else {
          // 二进制字符串
          console.log('使用binary类型读取Excel')
          workbook.value = XLSX.read(file, { type: 'binary' })
        }
      } else {
        // 其他情况，尝试作为二进制字符串处理
        console.log('默认使用binary类型读取Excel')
        workbook.value = XLSX.read(file, { type: 'binary' })
      }
      
      if (!workbook.value) {
        throw new Error('Excel工作簿为空')
      }
      
      // 获取所有工作表名称
      sheets.value = workbook.value.SheetNames
      console.log('工作表列表:', sheets.value)
      
      // 选择第一个工作表
      if (sheets.value.length > 0) {
        activeSheet.value = sheets.value[0]
        loadSheetData(activeSheet.value)
      } else {
        throw new Error('Excel文件中没有工作表')
      }
      
      emit('data-loaded', { 
        data: tableData.value, 
        headers: columns.value,
        sheets: sheets.value
      })
    } catch (error) {
      console.error('Excel文件解析错误:', error)
      ElMessage.error('文件解析失败: ' + error.message)
      emit('error', '文件解析失败: ' + error.message)
      tableData.value = []
      columns.value = []
      sheets.value = []
    } finally {
      loading.value = false
    }
  }
  
  // 加载工作表数据
  const loadSheetData = (sheetName) => {
    if (!workbook.value || !sheetName) return
    
    try {
      const worksheet = workbook.value.Sheets[sheetName]
      
      if (!worksheet || !worksheet['!ref']) {
        console.error('工作表数据错误:', worksheet)
        throw new Error('工作表数据为空或格式错误')
      }
      
      const range = XLSX.utils.decode_range(worksheet['!ref'])
      console.log('工作表范围:', range)
      
      // 设置表格列
      const newColumns = []
      for (let c = range.s.c; c <= range.e.c; c++) {
        newColumns.push({
          prop: `col${c}`,
          label: getExcelColName(c)
        })
      }
      columns.value = newColumns
      
      // 获取所有单元格数据
      const newData = []
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
        newData.push(rowData)
      }
      
      console.log(`工作表 ${sheetName} 数据加载完成, 共 ${newData.length} 行`)
      tableData.value = newData
    } catch (error) {
      console.error('处理工作表数据出错:', error)
      ElMessage.error('处理工作表数据出错: ' + error.message)
      emit('error', '处理工作表数据出错: ' + error.message)
      tableData.value = []
    }
  }
  
  // 切换工作表
  const handleSheetChange = (sheetName) => {
    loadSheetData(sheetName)
  }
  
  // 分页方法
  const handleSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1
  }
  
  const handleCurrentChange = (page) => {
    currentPage.value = page
  }
  
  // 获取Excel列名
  const getExcelColName = (index) => {
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
  .excel-preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  
  .excel-preview-header {
    padding: 15px 20px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .excel-preview-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }
  
  .excel-content {
    flex: 1;
    padding: 20px;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
  
  .excel-table-wrapper {
    flex: 1;
    overflow: auto;
  }
  
  .excel-pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
  .sheets-selector {
    margin-bottom: 10px;
  }
  
  .sheet-label {
    font-size: 14px;
    color: #333;
    margin-right: 10px;
  }
  
  /* 响应式调整 */
  @media screen and (max-width: 768px) {
    .excel-preview-header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .excel-actions {
      margin-top: 10px;
      align-self: flex-end;
    }
  }
  </style>