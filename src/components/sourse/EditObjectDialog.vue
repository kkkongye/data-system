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
              <el-select 
                v-model="form.formatConstraint" 
                placeholder="请选择格式" 
                class="custom-select-component"
              >
                <el-option label="jpg" value="jpg"></el-option>
                <el-option label="xlsx" value="xlsx"></el-option>
              </el-select>
              <div v-if="form.formatConstraint" class="selected-value">{{ form.formatConstraint }}</div>
            </div>
          </div>
          
          <div class="constraint-item">
            <label>访问权限：</label>
            <div class="custom-select-wrapper">
              <el-select 
                v-model="form.accessConstraint" 
                placeholder="请选择访问权限" 
                class="custom-select-component"
              >
                <el-option label="只允许管理方获取" value="只允许管理方获取"></el-option>
                <el-option label="全部允许" value="全部允许"></el-option>
              </el-select>
              <div v-if="form.accessConstraint" class="selected-value">{{ form.accessConstraint }}</div>
            </div>
          </div>
          
          <div class="constraint-item">
            <label>传输路径约束：</label>
            <div class="custom-select-wrapper">
              <el-select 
                v-model="form.pathConstraint" 
                placeholder="请选择传输路径" 
                class="custom-select-component"
              >
                <el-option label="点对点" value="点对点"></el-option>
                <el-option label="面对面" value="面对面"></el-option>
              </el-select>
              <div v-if="form.pathConstraint" class="selected-value">{{ form.pathConstraint }}</div>
            </div>
          </div>
          
          <div class="constraint-item">
            <label>地域性约束：</label>
            <div class="custom-select-wrapper">
              <el-select 
                v-model="form.regionConstraint" 
                placeholder="请选择地域性约束" 
                class="custom-select-component"
              >
                <el-option label="内网" value="内网"></el-option>
                <el-option label="外网" value="外网"></el-option>
              </el-select>
              <div v-if="form.regionConstraint" class="selected-value">{{ form.regionConstraint }}</div>
            </div>
          </div>
          
          <div class="constraint-item">
            <label>共享约束：</label>
            <div class="custom-select-wrapper">
              <el-select 
                v-model="form.shareConstraint" 
                placeholder="请选择共享约束" 
                class="custom-select-component"
              >
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
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'

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
  if (newVal.locationInfo && typeof newVal.locationInfo === 'object') {
    form.locationInfo.row = newVal.locationInfo.row || ''
    form.locationInfo.col = newVal.locationInfo.col || ''
  } else if (typeof newVal.locationInfo === 'string') {
    // 处理定位信息格式（如果是字符串）
    const matches = newVal.locationInfo.match(/\((.*?),\s*(.*?),\s*(.*?)\)/)
    if (matches && matches.length > 3) {
      form.locationInfo.row = matches[2].trim()
      form.locationInfo.col = matches[3].trim()
    }
  }

  // 设置约束条件数组
  form.constraint = Array.isArray(newVal.constraint) ? [...newVal.constraint] : (newVal.constraint ? [newVal.constraint] : [])
  
  // 处理约束条件字段
  // 如果有明确设置的各约束字段值，则直接使用
  form.formatConstraint = newVal.formatConstraint || ''
  form.accessConstraint = newVal.accessConstraint || ''
  form.pathConstraint = newVal.pathConstraint || ''
  form.regionConstraint = newVal.regionConstraint || ''
  form.shareConstraint = newVal.shareConstraint || ''
  
  // 如果没有明确设置的各约束字段值，尝试从数组中解析
  if ((!form.formatConstraint || !form.accessConstraint || !form.pathConstraint || !form.regionConstraint || !form.shareConstraint) && Array.isArray(newVal.constraint)) {
    newVal.constraint.forEach(item => {
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
  form.auditInfo = newVal.auditInfo || ''
  form.status = newVal.status || ''
  form.feedback = newVal.feedback || ''
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
    excelData: newVal.excelData
  })
}, { deep: true })

// 处理文件变更
const handleFileChange = (file) => {
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
  
  // 读取并保存Excel文件内容
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      // 保存文件的二进制数据
      form.excelData = e.target.result
      ElMessage.success(`已选择Excel表格"${fileName}"`)
    } catch (error) {
      console.error('读取Excel文件失败:', error)
      ElMessage.error('读取Excel文件失败')
    }
  }
  reader.onerror = () => {
    ElMessage.error('读取文件失败')
  }
  reader.readAsBinaryString(file.raw)
}

// 保存按钮处理
const handleSave = () => {
  // 验证约束条件
  if (!form.formatConstraint.length) {
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
        excelData: form.excelData
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

/* 上传提示样式 */
.upload-tip {
  color: #909399;
  font-size: 14px;
}
</style> 