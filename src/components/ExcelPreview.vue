<template>
  <div class="excel-preview-container">
    <div class="excel-preview-header">
      <h3>{{ title || '数据预览' }}</h3>
      
      <!-- 导入按钮 -->
      <div class="button_group" v-if="showImportButton">
        <a
          href="javascript:;"
          class="button_s my_file el-button button_s el-button--primary el-button--small"
        >
          <input type="file" class="my_input" @change="importExcel" id="upload" />导入
        </a>
      </div>
    </div>
    
    <div class="excel-content" v-loading="tableLoading">
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
      
      <!-- 表格组件 -->
      <div class="myTable" v-if="dataArr.length > 0">
        <el-table
          height="calc(100vh - 250px)"
          :data="dataArr"
          v-loading="tableLoading"
          border
          fit
          style="width: 100%"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column
            v-for="(col, index) in tableColumn"
            :key="index"
            :prop="col.prop"
            :label="col.label"
            align="center"
            show-overflow-tooltip
          ></el-table-column>
        </el-table>
      </div>
      
      <!-- 数据概要信息 -->
      <div class="data-summary" v-if="dataArr.length">
        <span>已加载 {{ dataArr.length }} 行数据，{{ tableColumn.length }} 列</span>
      </div>
      
      <!-- 空数据状态 -->
      <el-empty 
        v-if="!tableLoading && !dataArr.length" 
        description="暂无数据" 
        :image-size="120"
      ></el-empty>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'

export default {
  name: 'ExcelPreview',
  props: {
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
    // 是否显示导入按钮
    showImportButton: {
      type: Boolean,
      default: false
    },
    // 是否使用Web Worker进行解析（本实现中未使用）
    useWebWorker: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      dataArr: [], // 表格内容数据数组
      tableColumn: [], // 表格表头配置数组
      tableLoading: false, // 表格是否loading
      sheets: [], // 工作表列表
      activeSheet: '', // 当前激活的工作表
      workbook: null // Excel工作簿对象
    }
  },
  
  watch: {
    file: {
      handler(newFile) {
        if (newFile) {
          this.loadExcelFile(newFile)
        }
      },
      immediate: true
    }
  },
  
  methods: {
    /**
     * 导入表格
     */
    importExcel(e) {
      const files = e.target.files
      if (!files.length) {
        return
      } else if (!/\.(xls|xlsx)$/.test(files[0].name.toLowerCase())) {
        return ElMessage.error("上传格式不正确，请上传xls或者xlsx格式")
      }
      
      this.tableLoading = true
      
      const fileReader = new FileReader()
      fileReader.onload = ev => {
        try {
          const data = ev.target.result
          this.parseExcelData(data)
        } catch (e) {
          this.tableLoading = false
          ElMessage.error("读取失败: " + e.message)
          this.$emit('error', e)
        }
      }
      
      fileReader.readAsBinaryString(files[0])
      var input = document.getElementById("upload")
      input.value = ""
    },
    
    /**
     * 加载Excel文件
     */
    async loadExcelFile(file) {
      if (!file) return
      
      this.tableLoading = true
      
      try {
        if (file instanceof File) {
          // 如果是File对象，使用FileReader读取
          const fileReader = new FileReader()
          fileReader.onload = (e) => {
            try {
              const data = e.target.result
              this.parseExcelData(data)
            } catch (error) {
              this.tableLoading = false
              ElMessage.error("读取失败: " + error.message)
              this.$emit('error', error)
            }
          }
          fileReader.readAsBinaryString(file)
        } else if (typeof file === 'string') {
          // 字符串类型（可能是URL或二进制数据）
          if (file.startsWith('http')) {
            // 如果是URL，先下载
            const response = await fetch(file)
            const arrayBuffer = await response.arrayBuffer()
            this.parseExcelData(new Uint8Array(arrayBuffer), { type: 'array' })
          } else {
            // 假设是二进制字符串
            this.parseExcelData(file)
          }
        } else {
          this.tableLoading = false
          ElMessage.error("不支持的文件类型")
        }
      } catch (error) {
        this.tableLoading = false
        ElMessage.error("文件解析失败: " + error.message)
        this.$emit('error', error)
      }
    },
    
    /**
     * 解析Excel数据（核心方法）
     */
    parseExcelData(data, options = { type: 'binary' }) {
      try {
        // 解析Excel工作簿
        this.workbook = XLSX.read(data, options)
        
        // 获取所有工作表名称
        this.sheets = this.workbook.SheetNames
        
        if (this.sheets.length > 0) {
          // 选择第一个工作表
          this.activeSheet = this.sheets[0]
          this.processWorksheet(this.activeSheet)
        } else {
          this.tableLoading = false
          ElMessage.warning("Excel文件中没有工作表")
        }
      } catch (error) {
        console.error("解析Excel数据出错:", error)
        this.tableLoading = false
        ElMessage.error("解析Excel数据出错: " + error.message)
        this.$emit('error', error)
      }
    },
    
    /**
     * 处理工作表（简化版）
     */
    processWorksheet(sheetName) {
      if (!this.workbook || !sheetName) return
      
      try {
        const worksheet = this.workbook.Sheets[sheetName]
        
        // 将工作表转换为二维数组 (header:1 表示使用数组格式)
        const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (aoa.length === 0) {
          this.tableColumn = []
          this.dataArr = []
          this.tableLoading = false
          return
        }
        
        // 获取表头 (第一行)
        const headers = aoa[0]
        
        // 创建表格列 - 不再指定列宽，让表格自适应
        this.tableColumn = headers.map((header, index) => {
          return {
            prop: `col${index}`,
            label: header || `列${index+1}`
          }
        })
        
        // 创建表格数据
        this.dataArr = []
        for (let i = 1; i < aoa.length; i++) {
          const row = aoa[i]
          const rowData = {}
          
          for (let j = 0; j < this.tableColumn.length; j++) {
            // 确保每个单元格都有值
            rowData[this.tableColumn[j].prop] = j < row.length ? row[j] : ''
          }
          
          this.dataArr.push(rowData)
        }
        
        this.tableLoading = false
        
        // 发送数据加载完成事件
        this.$emit('data-loaded', {
          data: this.dataArr,
          headers: this.tableColumn,
          sheets: this.sheets
        })
      } catch (error) {
        console.error("处理工作表出错:", error)
        this.tableLoading = false
        ElMessage.error("处理工作表出错: " + error.message)
        this.$emit('error', error)
      }
    },
    
    /**
     * 切换工作表
     */
    handleSheetChange(sheetName) {
      this.tableLoading = true
      this.processWorksheet(sheetName)
    }
  }
}
</script>

<style lang="scss" scoped>
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sheets-selector {
  margin-bottom: 10px;
}

.sheet-label {
  font-size: 14px;
  color: #333;
  margin-right: 10px;
}

.data-summary {
  margin: 10px 0;
  color: #606266;
  font-size: 13px;
}

.myTable {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .el-table {
    flex: 1;
  }
}

/* 按钮样式 */
.button_group {
  .button_s {
    width: 78px;
    margin: 5px 10px 5px 5px;
  }
  .my_file {
    position: relative;
    .my_input {
      position: absolute;
      opacity: 0;
      width: 78px;
      height: 30px;
      top: 0;
      left: 0;
    }
  }
}
</style> 