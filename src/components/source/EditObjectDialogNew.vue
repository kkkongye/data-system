<!-- 编辑对象对话框组件 -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="40%"
    :close-on-click-modal="false"
    draggable
    class="custom-dialog"
    @closed="handleDialogClosed"
  >
    <el-form :model="form" label-width="120px" ref="formRef" :rules="formRules">
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
          <span v-if="form.entity">已选择"{{ form.entity }}"</span>
          <span v-else class="upload-tip">请上传Excel表格文件</span>
        </div>
      </el-form-item>
      <el-form-item label="定位信息：" prop="locationInfo" style="margin-bottom: 22px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-input v-model="form.locationInfo.row" placeholder="例：0-4" style="width: 150px;"></el-input>
          <span>行</span>
          <el-input v-model="form.locationInfo.col" placeholder="例：0-4" style="width: 150px;"></el-input>
          <span>列</span>
        </div>
      </el-form-item>
      <el-form-item label="约束条件：" prop="constraint">
        <div class="constraint-section">
          <div class="constraint-item">
            <label>格式约束：</label>
            <div class="custom-select-wrapper">
              <el-select v-model="form.formatConstraint" placeholder="请选择格式" class="custom-select-component">
                <el-option label="jpg" value="jpg"></el-option>
                <el-option label="xlsx" value="xlsx"></el-option>
              </el-select>
              <div v-if="form.formatConstraint" class="selected-value">{{ form.formatConstraint }}</div>
            </div>
          </div>
          
          <div class="constraint-item">
            <label>访问权限：</label>
            <div class="custom-select-wrapper">
              <el-select v-model="form.accessConstraint" placeholder="请选择访问权限" class="custom-select-component">
                <el-option label="只允许管理方获取" value="只允许管理方获取"></el-option>
                <el-option label="全部允许" value="全部允许"></el-option>
              </el-select>
              <div v-if="form.accessConstraint" class="selected-value">{{ form.accessConstraint }}</div>
            </div>
          </div>
          
          <div class="constraint-item">
            <label>传输路径约束：</label>
            <div class="custom-select-wrapper">
              <el-select v-model="form.pathConstraint" placeholder="请选择传输路径" class="custom-select-component">
                <el-option label="点对点" value="点对点"></el-option>
                <el-option label="面对面" value="面对面"></el-option>
              </el-select>
              <div v-if="form.pathConstraint" class="selected-value">{{ form.pathConstraint }}</div>
            </div>
          </div>
          
          <div class="constraint-item">
            <label>地域性约束：</label>
            <div class="custom-select-wrapper">
              <el-select v-model="form.regionConstraint" placeholder="请选择地域性约束" class="custom-select-component">
                <el-option label="内网" value="内网"></el-option>
                <el-option label="外网" value="外网"></el-option>
              </el-select>
              <div v-if="form.regionConstraint" class="selected-value">{{ form.regionConstraint }}</div>
            </div>
          </div>
          
          <div class="constraint-item">
            <label>共享约束：</label>
            <div class="custom-select-wrapper">
              <el-select v-model="form.shareConstraint" placeholder="请选择共享约束" class="custom-select-component">
                <el-option label="不允许共享" value="不允许共享"></el-option>
                <el-option label="允许共享" value="允许共享"></el-option>
              </el-select>
              <div v-if="form.shareConstraint" class="selected-value">{{ form.shareConstraint }}</div>
            </div>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="传输控制操作：" prop="transferControl">
        <div class="custom-multi-select-wrapper">
          <el-select 
            v-model="form.transferControl" 
            placeholder="请选择传输控制操作" 
            multiple
            class="custom-multi-select"
          >
            <el-option label="可读" value="可读"></el-option>
            <el-option label="可修改" value="可修改"></el-option>
            <el-option label="可销毁" value="可销毁"></el-option>
          </el-select>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, defineProps, defineEmits } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import excelUploadService from '@/services/excelUploadService'
import { API_URL, MOCK_ENABLED, AUTO_FALLBACK_TO_MOCK } from '@/services/apiConfig'

const props = defineProps({
  // 是否显示对话框
  visible: {
    type: Boolean,
    default: false
  },
  // 对话框标题
  title: {
    type: String,
    default: '编辑数字对象'
  },
  // 表单数据
  modelValue: {
    type: Object,
    default: () => ({
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
      excelData: null
    })
  }
})

// 添加离线模式状态
const offlineMode = ref(false)
const apiError = ref(null)

const emit = defineEmits(['update:visible', 'update:modelValue', 'save', 'cancel'])

// 表单引用
const formRef = ref(null)

// 对话框可见性状态
const dialogVisible = ref(false)

// 表单数据
const form = reactive({
  id: '',
  entity: '',
  locationInfo: {
    row: '',
    col: ''
  },
  constraint: [],
  formatConstraint: '',
  accessConstraint: '',
  pathConstraint: '',
  regionConstraint: '',
  shareConstraint: '',
  transferControl: [],
  auditInfo: '',
  status: '',
  feedback: '',
  excelData: null
})

// 表单校验规则
const formRules = {
  entity: [
    { required: true, message: '请输入实体名称', trigger: 'blur' }
  ],
  locationInfo: [
    { 
      validator: (rule, value, callback) => {
        if (form.locationInfo.row && form.locationInfo.col) {
          callback()
        } else {
          callback(new Error('请输入行和列'))
        }
      },
      trigger: 'blur'
    }
  ],
  constraint: [
    { type: 'array', trigger: 'change' }
  ],
  formatConstraint: [
    { required: true, message: '请选择格式约束', trigger: 'change' }
  ],
  accessConstraint: [
    { required: true, message: '请选择访问权限', trigger: 'change' }
  ],
  pathConstraint: [
    { required: true, message: '请选择传输路径约束', trigger: 'change' }
  ],
  regionConstraint: [
    { required: true, message: '请选择地域性约束', trigger: 'change' }
  ],
  shareConstraint: [
    { required: true, message: '请选择共享约束', trigger: 'change' }
  ],
  transferControl: [
    { type: 'array', trigger: 'change' }
  ]
}

// 监听visible属性变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  if (!newVal) return
  
  // 深拷贝对象，避免直接修改props
  form.id = newVal.id || ''
  form.entity = newVal.entity || ''
  form.auditInfo = newVal.auditInfo || ''
  form.status = newVal.status || ''
  form.feedback = newVal.feedback || ''
  
  if (newVal.locationInfo) {
    if (typeof newVal.locationInfo === 'object') {
      form.locationInfo.row = newVal.locationInfo.row || ''
      form.locationInfo.col = newVal.locationInfo.col || ''
    } else if (typeof newVal.locationInfo === 'string') {
      // 从格式如"(表1, 0-4, 0-4)"中提取行列信息
      const matches = newVal.locationInfo.match(/\((.*?),\s*(.*?),\s*(.*?)\)/)
      if (matches && matches.length > 3) {
        form.locationInfo.row = matches[2].trim()
        form.locationInfo.col = matches[3].trim()
      }
    }
  }
  
  // 设置约束条件数组
  form.constraint = Array.isArray(newVal.constraint) ? [...newVal.constraint] : (newVal.constraint ? [newVal.constraint] : [])
  
  // 设置各个约束条件字段
  if (newVal.formatConstraint) form.formatConstraint = newVal.formatConstraint
  if (newVal.accessConstraint) form.accessConstraint = newVal.accessConstraint
  if (newVal.pathConstraint) form.pathConstraint = newVal.pathConstraint
  if (newVal.regionConstraint) form.regionConstraint = newVal.regionConstraint
  if (newVal.shareConstraint) form.shareConstraint = newVal.shareConstraint
  
  // 如果没有明确的各约束字段值，尝试从约束数组中解析
  if ((!form.formatConstraint || !form.accessConstraint || !form.pathConstraint || 
      !form.regionConstraint || !form.shareConstraint) && form.constraint.length > 0) {
    
    form.constraint.forEach(item => {
      if (typeof item === 'string') {
        const parts = item.split(':')
        if (parts.length === 2) {
          const type = parts[0].trim()
          const value = parts[1].trim()
          
          if (type === '格式约束') form.formatConstraint = value
          else if (type === '访问权限') form.accessConstraint = value
          else if (type === '传输路径约束') form.pathConstraint = value
          else if (type === '地域性约束') form.regionConstraint = value
          else if (type === '共享约束') form.shareConstraint = value
        }
      }
    })
  }
  
  form.transferControl = Array.isArray(newVal.transferControl) ? [...newVal.transferControl] : (newVal.transferControl ? [newVal.transferControl] : [])
  form.excelData = newVal.excelData || null
}, { deep: true, immediate: true })

// 监听form变化，更新v-model
watch(form, (newVal) => {
  // 构建约束条件数组
  const constraintArray = []
  if (newVal.formatConstraint) constraintArray.push(`格式约束:${newVal.formatConstraint}`)
  if (newVal.accessConstraint) constraintArray.push(`访问权限:${newVal.accessConstraint}`)
  if (newVal.pathConstraint) constraintArray.push(`传输路径约束:${newVal.pathConstraint}`)
  if (newVal.regionConstraint) constraintArray.push(`地域性约束:${newVal.regionConstraint}`)
  if (newVal.shareConstraint) constraintArray.push(`共享约束:${newVal.shareConstraint}`)
  
  emit('update:modelValue', {
    id: newVal.id,
    entity: newVal.entity,
    locationInfo: {
      row: newVal.locationInfo.row,
      col: newVal.locationInfo.col
    },
    constraint: constraintArray,
    formatConstraint: newVal.formatConstraint,
    accessConstraint: newVal.accessConstraint,
    pathConstraint: newVal.pathConstraint,
    regionConstraint: newVal.regionConstraint,
    shareConstraint: newVal.shareConstraint,
    transferControl: newVal.transferControl,
    auditInfo: newVal.auditInfo,
    status: newVal.status,
    feedback: newVal.feedback,
    excelData: newVal.excelData,
    offlineMode: offlineMode.value
  })
}, { deep: true })

// 处理文件变更
const handleFileChange = async (file) => {
  // 验证文件类型
  const isExcel = file.raw.type === 'application/vnd.ms-excel' || 
                 file.raw.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (!isExcel) {
    ElMessage.warning('请上传Excel格式的文件（.xls或.xlsx）')
    return false
  }
  
  // 设置实体名称为文件名（不带扩展名）
  const fileName = file.name
  const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName
  form.entity = fileNameWithoutExt

  // 如果已经处于离线模式，直接读取本地文件而不尝试上传
  if (offlineMode.value || MOCK_ENABLED) {
    // 通知用户当前模式
    if (MOCK_ENABLED) {
      ElMessage.info('系统当前处于离线模式，Excel文件将保存在本地而非上传到服务器')
      // 自动设置为离线模式
      offlineMode.value = true
    } else {
      ElMessage.info('正在离线模式下处理Excel文件，仅进行本地预览...')
    }
    
    // 直接读取本地文件
    readLocalFile(file.raw)
    return
  }
  
  // 显示上传中提示
  ElMessage.info('正在上传Excel文件，请稍候...')
  
  try {
    // 尝试上传文件
    if (form.id) {
      // 如果是编辑模式且有ID，使用关联到特定对象的上传
      const uploadResult = await excelUploadService.uploadExcelFileWithObjectId(form.id, file.raw)
      handleUploadResult(uploadResult, fileName, file.raw)
    } else {
      // 否则使用普通上传
      const uploadResult = await excelUploadService.uploadExcelFile(file.raw)
      handleUploadResult(uploadResult, fileName, file.raw)
    }
  } catch (error) {
    console.error('Excel文件上传过程出错:', error)
    ElMessage.error('上传Excel文件过程中出错: ' + error.message)
    
    // 保存API错误信息
    apiError.value = error
    
    // 切换到离线模式并读取本地文件
    offlineMode.value = true
    ElMessage.info('已切换到离线模式，Excel文件仅在本地预览')
    readLocalFile(file.raw)
  }
}

// 处理上传结果
const handleUploadResult = (result, fileName, fileRaw) => {
  if (result.success) {
    // 上传成功
    if (result.data && result.data.isMock) {
      // 这是模拟的成功响应
      ElMessage.warning(`[离线模式] 服务器不可用，但文件 "${fileName}" 已在本地保存`)
      offlineMode.value = true
    } else {
      // 真实的成功响应
      ElMessage.success(`已成功上传Excel表格"${fileName}"`)
      offlineMode.value = false
    }
  } else {
    // 上传失败
    console.error('上传失败详情:', result.details)
    ElMessage.error(`上传失败: ${result.message}`)
    
    // 切换到离线模式
    offlineMode.value = true
    ElMessage.warning('已切换到离线模式，Excel文件将只保存在本地')
  }
  
  // 无论成功失败，都读取本地文件用于预览
  readLocalFile(fileRaw)
}

// 本地文件读取函数
const readLocalFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      form.excelData = e.target.result
      console.log('本地文件读取成功，数据长度:', e.target.result.length)
    } catch (error) {
      console.error('读取Excel文件失败:', error)
      ElMessage.warning('文件内容读取失败，但您仍可以填写其他表单内容')
    }
  }
  reader.onerror = (e) => {
    console.error('文件读取失败:', e)
    ElMessage.warning('文件读取失败')
  }
  reader.readAsBinaryString(file)
}

// 保存按钮处理
const handleSave = () => {
  // 验证约束条件
  if (!form.formatConstraint) {
    ElMessage.warning('请选择格式约束')
    return
  }
  
  if (!form.accessConstraint) {
    ElMessage.warning('请选择访问权限')
    return
  }
  
  if (!form.pathConstraint) {
    ElMessage.warning('请选择传输路径约束')
    return
  }
  
  if (!form.regionConstraint) {
    ElMessage.warning('请选择地域性约束')
    return
  }
  
  if (!form.shareConstraint) {
    ElMessage.warning('请选择共享约束')
    return
  }

  formRef.value.validate((valid) => {
    if (valid) {
      // 构建约束条件数组
      const constraintArray = []
      if (form.formatConstraint) constraintArray.push(`格式约束:${form.formatConstraint}`)
      if (form.accessConstraint) constraintArray.push(`访问权限:${form.accessConstraint}`)
      if (form.pathConstraint) constraintArray.push(`传输路径约束:${form.pathConstraint}`)
      if (form.regionConstraint) constraintArray.push(`地域性约束:${form.regionConstraint}`)
      if (form.shareConstraint) constraintArray.push(`共享约束:${form.shareConstraint}`)
      
      // 构建更新后的对象
      const entityName = form.entity
      const updatedObject = {
        id: form.id,
        entity: entityName,
        locationInfo: {
          row: form.locationInfo.row,
          col: form.locationInfo.col
        },
        constraint: constraintArray,
        formatConstraint: form.formatConstraint,
        accessConstraint: form.accessConstraint,
        pathConstraint: form.pathConstraint,
        regionConstraint: form.regionConstraint,
        shareConstraint: form.shareConstraint,
        transferControl: form.transferControl,
        auditInfo: form.auditInfo,
        status: form.status,
        feedback: form.feedback,
        excelData: form.excelData,
        offlineMode: offlineMode.value
      }
      
      // 如果处于离线模式，添加警告
      if (offlineMode.value && form.excelData) {
        ElMessage.warning('您正在离线模式下保存，Excel文件将只保存在本地，未上传到服务器')
      }
      
      // 发送保存事件
      emit('save', updatedObject)
      dialogVisible.value = false
    } else {
      // 显示验证错误
      ElMessage.warning('请填写必填字段')
      return false
    }
  })
}

// 取消按钮处理
const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

// 对话框关闭处理
const handleDialogClosed = () => {
  // 重置表单验证
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  // 重置离线模式状态
  offlineMode.value = false
  apiError.value = null
}
</script>

<style scoped>
/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.custom-dialog) {
  margin-top: 15vh !important;
}

/* 自定义选择控件样式 */
.custom-select-wrapper {
  position: relative;
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.custom-select-component {
  width: 100%;
  min-width: 180px; /* 确保选择框足够宽 */
}

/* 选中值显示 */
.selected-value {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  padding-left: 12px;
  color: #409EFF;
  font-weight: bold;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  z-index: 1;
  pointer-events: none; /* 允许点击穿透到下面的select */
}

/* 覆盖Element Plus的下拉箭头样式 */
:deep(.custom-select-component .el-input__wrapper) {
  z-index: 2;
  opacity: 0.01; /* 几乎透明但仍可交互 */
}

:deep(.custom-select-component .el-input__inner) {
  opacity: 0;
}

/* 添加自定义下拉箭头 */
.custom-select-wrapper::after {
  content: '▼';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #409EFF;
  font-size: 14px;
  z-index: 3;
  pointer-events: none;
}

/* 上传提示样式 */
.upload-tip {
  color: #909399;
  font-size: 14px;
}

/* 约束条件样式 */
.constraint-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 10px;
}

.constraint-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.constraint-item label {
  min-width: 110px;
  text-align: right;
  font-size: 14px;
  color: #606266;
}

.constraint-item .el-select {
  flex: 1;
}

/* 传输控制操作样式 */
.custom-multi-select-wrapper {
  position: relative;
  width: 100%;
  min-height: 40px;
  display: flex;
  flex-direction: column;
}

.custom-multi-select {
  width: 100%;
  min-width: 180px; /* 确保选择框足够宽 */
}
</style> 