<template>
  <!-- 审核报告弹窗 -->
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="审核报告"
    width="70%"
    :close-on-click-modal="false"
    :show-close="true"
    draggable
    class="report-dialog"
    top="5vh"
  >
    <template #header>
      <div class="dialog-header">
        <h3>审核报告</h3>
        <p class="upload-prompt">上传TXT格式报告文件</p>
      </div>
    </template>
    
    // ... existing code ...
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import reportService from '../services/reportService'

// 使用v-model绑定对话框可见性，同时添加currentEntityType属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentEntityType: {
    type: String,
    default: ''  // 默认为空，表示未指定实体类型
  }
})

const emit = defineEmits(['update:visible'])

// 内部状态
const reportContent = ref('')
const reportLoading = ref(false)
const fileInput = ref(null)
const selectedFileName = ref('')

// 处理对话框关闭
const closeDialog = () => {
  emit('update:visible', false)
  
  // 延迟清除报告内容，提供更好的用户体验
  setTimeout(() => {
    reportContent.value = ''
    selectedFileName.value = ''
  }, 300)
}

// 格式化TXT内容 - 处理换行符并高亮显示某些内容
const formattedReportContent = computed(() => {
  if (!reportContent.value) return ''
  
  // 替换换行符为HTML换行
  let formatted = reportContent.value
    .replace(/\n/g, '<br>')
    .replace(/\r/g, '')
  
  // 高亮错误相关的文本
  formatted = formatted
    .replace(/错误/g, '<span class="highlight-error">错误</span>')
    .replace(/失败/g, '<span class="highlight-error">失败</span>')
    .replace(/不合格/g, '<span class="highlight-error">不合格</span>')
    .replace(/问题/g, '<span class="highlight-warning">问题</span>')
  
  // 高亮成功相关的文本
  formatted = formatted
    .replace(/成功/g, '<span class="highlight-success">成功</span>')
    .replace(/通过/g, '<span class="highlight-success">通过</span>')
    .replace(/合格/g, '<span class="highlight-success">合格</span>')
  
  // 美化分隔线
  formatted = formatted
    .replace(/-{3,}/g, '<hr class="separator">')
    .replace(/={3,}/g, '<div class="strong-separator"></div>')
  
  // 高亮标题行
  formatted = formatted
    .replace(/^(.+?)(?=<br>)/g, '<h3 class="report-title">$1</h3>')
    .replace(/<br>(.+?)(?=<br>)/g, '<br><h4 class="report-subtitle">$1</h4>')
  
  return formatted
})

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value.click()
}

// 处理文件变更
const handleFileChange = (event) => {
  const file = event.target ? event.target.files[0] : event.file
  
  if (!file) {
    ElMessage.warning('未选择文件')
    return
  }
  
  // 验证文件类型
  if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
    ElMessage.error('请选择.txt格式的文件')
    return
  }
  
  // 更新已选文件名
  selectedFileName.value = file.name
  
  // 显示加载状态
  reportLoading.value = true
  
  // 读取文件内容
  const reader = new FileReader()
  
  reader.onload = (e) => {
    reportContent.value = e.target.result
    reportLoading.value = false
  }
  
  reader.onerror = () => {
    ElMessage.error('读取文件失败')
    reportLoading.value = false
  }
  
  reader.readAsText(file)
}

// 根据实体类型加载初始报告数据
const loadInitialReport = async () => {
  try {
    reportLoading.value = true
    
    // 根据实体类型选择不同的报告接口
    let data = ''
    if (props.currentEntityType === '销售订单') {
      selectedFileName.value = '销售订单报告.txt'
      data = await reportService.getSalesOrderReport()
    } else {
      // 默认加载库存管理报告
      selectedFileName.value = '库存管理报告.txt'
      data = await reportService.getDataIssuesReport()
    }
    
    reportContent.value = data
  } catch (error) {
    console.error('加载初始报告失败:', error)
    ElMessage.error('加载系统报告失败')
  } finally {
    reportLoading.value = false
  }
}

// 监听对话框可见性，在打开时加载默认报告，在关闭时重置状态
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 如果是打开状态，且没有内容，则加载默认报告
    if (!reportContent.value) {
      loadInitialReport()
    }
  } else {
    // 如果是关闭状态，延迟清除内容，确保关闭动画完成
    setTimeout(() => {
      reportContent.value = ''
      selectedFileName.value = ''
    }, 300)
  }
})

// 组件挂载时尝试加载初始报告内容
onMounted(() => {
  if (props.visible && !reportContent.value) {
    loadInitialReport()
  }
})
</script>

// ... existing code ... 