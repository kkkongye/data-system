<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2>Excel表格预览测试页面</h2>
      <p>您可以使用此页面测试Excel文件上传和解析功能</p>
    </div>

    <div class="dashboard-content">
      <!-- 操作区 -->
      <div class="operation-area">
        <div class="button_group">
          <a
            href="javascript:;"
            class="button_s my_file el-button button_s el-button--primary el-button--small"
          >
            <input type="file" class="my_input" @change="importExcel" id="upload" />导入Excel
          </a>
        </div>
        
        <div class="current-file" v-if="currentFileName">
          当前文件: <strong>{{ currentFileName }}</strong>
        </div>
      </div>

      <!-- Excel预览组件 -->
      <div class="excel-preview-wrapper">
        <ExcelPreview
          :file="excelFile"
          :title="'Excel数据预览'"
          :use-web-worker="false"
          @data-loaded="handleExcelDataLoaded"
          @error="handleExcelError"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ExcelPreview from '@/components/ExcelPreview.vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'Dashboard',
  components: {
    ExcelPreview
  },
  data() {
    return {
      excelFile: null,
      currentFileName: '',
      excelData: []
    }
  },
  methods: {
    /**
     * 导入Excel文件
     */
    importExcel(e) {
      const files = e.target.files
      if (!files.length) {
        return
      } else if (!/\.(xls|xlsx)$/.test(files[0].name.toLowerCase())) {
        return ElMessage.error("上传格式不正确，请上传xls或者xlsx格式")
      }

      this.currentFileName = files[0].name
      this.excelFile = files[0]
      
      // 清空input，以便可以重复上传同一文件
      e.target.value = ''
    },

    /**
     * 处理Excel数据加载完成事件
     */
    handleExcelDataLoaded(result) {
      console.log('Excel数据加载完成:', result)
      this.excelData = result.data
      ElMessage.success(`成功加载 ${result.data.length} 行数据`)
    },

    /**
     * 处理Excel加载错误事件
     */
    handleExcelError(error) {
      console.error('Excel加载错误:', error)
      ElMessage.error('加载Excel数据出错: ' + error)
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  
  .dashboard-header {
    margin-bottom: 20px;
    
    h2 {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    p {
      color: #666;
      font-size: 14px;
    }
  }
  
  .dashboard-content {
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    .operation-area {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      
      .current-file {
        margin-left: 20px;
        font-size: 14px;
        color: #333;
      }
    }
    
    .excel-preview-wrapper {
      flex: 1;
      min-height: 500px;
      display: flex;
      overflow: hidden;
      
      :deep(.excel-preview-container) {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    }
  }
}

// 按钮样式
.button_group {
  .button_s {
    width: 120px;
    margin: 5px 10px 5px 5px;
  }
  .my_file {
    position: relative;
    .my_input {
      position: absolute;
      opacity: 0;
      width: 120px;
      height: 30px;
      top: 0;
      left: 0;
    }
  }
}
</style> 