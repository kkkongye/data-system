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
      
      <!-- 元数据区域 -->
      <el-form-item label="数据名称：" prop="metadata.dataName" class="metadata-form-item">
        <el-input v-model="form.metadata.dataName" placeholder="请输入数据名称" style="width: 300px;"></el-input>
      </el-form-item>
      <el-form-item label="来源单位：" prop="metadata.sourceUnit" class="metadata-form-item">
        <el-input v-model="form.metadata.sourceUnit" placeholder="请输入来源单位" style="width: 300px;"></el-input>
      </el-form-item>
      <el-form-item label="联系人：" prop="metadata.contactPerson" class="metadata-form-item">
        <el-input v-model="form.metadata.contactPerson" placeholder="请输入联系人" style="width: 300px;"></el-input>
      </el-form-item>
      <el-form-item label="联系电话：" prop="metadata.contactPhone" class="metadata-form-item">
        <el-input v-model="form.metadata.contactPhone" placeholder="请输入联系电话" style="width: 300px;"></el-input>
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
                <el-option label="广播" value="广播"></el-option>
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
            <el-option label="可共享" value="可共享"></el-option>
            <el-option label="可委托" value="可委托"></el-option>
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
import excelUploadService from '@/services/excelUploadService'

const props = defineProps({
  // 是否显示对话框
  visible: {
    type: Boolean,
    default: false
  },
  // 对话框标题
  title: {
    type: String,
    default: '新建数字对象'
  },
  // 表单数据
  modelValue: {
    type: Object,
    default: () => ({
      entity: '',
      locationInfo: {
        row: '',
        col: ''
      },
      constraint: [],
      transferControl: [],
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
  entity: '',
  locationInfo: {
    row: '',
    col: ''
  },
  metadata: {
    dataName: '',
    sourceUnit: '',
    contactPerson: '',
    contactPhone: ''
  },
  constraint: [],
  formatConstraint: '',
  accessConstraint: '',
  pathConstraint: '',
  regionConstraint: '',
  shareConstraint: '',
  transferControl: ['可读', '可修改', '可销毁', '可共享', '可委托'],
  excelData: null
})

// 表单校验规则
const formRules = {
  entity: [
    { required: false, message: '请上传Excel文件', trigger: 'change' }
  ],
  'metadata.dataName': [
    { required: false, message: '请输入数据名称', trigger: 'blur' }
  ],
  'metadata.sourceUnit': [
    { required: false, message: '请输入来源单位', trigger: 'blur' }
  ],
  'metadata.contactPerson': [
    { required: false, message: '请输入联系人', trigger: 'blur' }
  ],
  'metadata.contactPhone': [
    { required: false, message: '请输入联系电话', trigger: 'blur' }
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
  if (newVal) {
    // 当对话框打开时，重置表单数据
    resetForm()
  }
})

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  if (!newVal) return
  
  // 深拷贝对象，避免直接修改props
  form.entity = newVal.entity || ''
  if (newVal.locationInfo && typeof newVal.locationInfo === 'object') {
    form.locationInfo.row = newVal.locationInfo.row || ''
    form.locationInfo.col = newVal.locationInfo.col || ''
  }
  
  // 设置元数据
  if (newVal.metadata && typeof newVal.metadata === 'object') {
    form.metadata.dataName = newVal.metadata.dataName || newVal.entity || ''
    form.metadata.sourceUnit = newVal.metadata.sourceUnit || ''
    form.metadata.contactPerson = newVal.metadata.contactPerson || ''
    form.metadata.contactPhone = newVal.metadata.contactPhone || ''
  } else {
    // 如果没有元数据，则使用实体名称和默认值
    form.metadata.dataName = newVal.entity || ''
    form.metadata.sourceUnit = ''
    form.metadata.contactPerson = ''
    form.metadata.contactPhone = ''
  }
  
  // 设置约束条件数组
  form.constraint = Array.isArray(newVal.constraint) ? [...newVal.constraint] : (newVal.constraint ? [newVal.constraint] : [])
  
  // 设置各个约束条件字段
  if (newVal.formatConstraint) form.formatConstraint = newVal.formatConstraint
  if (newVal.accessConstraint) form.accessConstraint = newVal.accessConstraint
  if (newVal.pathConstraint) form.pathConstraint = newVal.pathConstraint
  if (newVal.regionConstraint) form.regionConstraint = newVal.regionConstraint
  if (newVal.shareConstraint) form.shareConstraint = newVal.shareConstraint
  
  // 传输控制
  form.transferControl = Array.isArray(newVal.transferControl) ? [...newVal.transferControl] : (newVal.transferControl ? [newVal.transferControl] : ['可读', '可修改', '可销毁', '可共享', '可委托'])
  
  form.excelData = newVal.excelData
}, { deep: true })

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
    excelData: newVal.excelData
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
  
  // 显示上传中提示
  ElMessage.info('正在上传Excel文件，请稍候...')
  
  try {
    // 1. 上传文件到后端
    const uploadResult = await excelUploadService.uploadExcelFile(file.raw)
    
    if (uploadResult.success) {
      ElMessage.success(`已成功上传Excel表格"${fileName}"`)
      
      // 2. 同时保存本地副本用于前端预览
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          // 保存文件的二进制数据用于前端预览
          form.excelData = e.target.result
        } catch (error) {
          console.error('读取Excel文件失败:', error)
        }
      }
      reader.onerror = () => {
        console.error('读取文件失败')
      }
      reader.readAsBinaryString(file.raw)
      
      // 3. 如果后端返回了文件URL或base64数据，也可以保存
      if (uploadResult.data && uploadResult.data.excelData) {
        // 如果后端返回的是URL或base64，可以在这里处理
        console.log('后端返回的Excel数据:', uploadResult.data.excelData)
      }
    } else {
      ElMessage.error(`上传失败: ${uploadResult.message}`)
    }
  } catch (error) {
    console.error('Excel文件上传过程出错:', error)
    ElMessage.error('上传Excel文件过程中出错')
    
    // 上传失败时，仍然尝试本地读取用于预览
    const reader = new FileReader()
    reader.onload = (e) => {
      form.excelData = e.target.result
    }
    reader.readAsBinaryString(file.raw)
  }
}

// 保存按钮处理
const handleSave = () => {
  // 简单验证
  if (!form.entity) {
    ElMessage.warning('请上传Excel表格文件')
    return
  }
  
  if (!form.locationInfo.row || !form.locationInfo.col) {
    ElMessage.warning('请输入定位信息（行和列）')
    return
  }
  
  if (!form.excelData) {
    ElMessage.warning('请上传Excel表格文件')
    return
  }

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
      
      // 构建传播控制对象，与transferControl数组对应
      const propagationControl = {
        canRead: form.transferControl.includes('可读'),
        canModify: form.transferControl.includes('可修改'),
        canDestroy: form.transferControl.includes('可销毁'),
        canShare: form.transferControl.includes('可共享'),
        canDelegate: form.transferControl.includes('可委托')
      }
      
      // 构建新对象
      const newObject = {
        entity: form.entity,
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
        propagationControl: propagationControl,
        excelData: form.excelData
      }
      
      // 发送保存事件
      emit('save', newObject)
      dialogVisible.value = false
      
      // 重置表单
      resetForm()
    } else {
      ElMessage.warning('请填写必填字段')
      return false
    }
  })
}

// 重置表单
const resetForm = () => {
  form.entity = ''
  form.locationInfo.row = ''
  form.locationInfo.col = ''
  form.metadata.dataName = ''
  form.metadata.sourceUnit = ''
  form.metadata.contactPerson = ''
  form.metadata.contactPhone = ''
  form.constraint = []
  form.formatConstraint = ''
  form.accessConstraint = ''
  form.pathConstraint = ''
  form.regionConstraint = ''
  form.shareConstraint = ''
  form.transferControl = ['可读', '可修改', '可销毁', '可共享', '可委托']
  form.excelData = null
  
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 取消按钮处理
const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
  resetForm()
}

// 对话框关闭处理
const handleDialogClosed = () => {
  resetForm()
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

/* 添加元数据相关样式 */
.metadata-form-title {
  margin-bottom: 10px;
}

.metadata-form-item {
  margin-left: 20px;
  margin-bottom: 15px;
}

.metadata-form-item :deep(.el-form-item__label) {
  font-weight: normal;
  color: #606266;
}

:deep(.el-divider__text) {
  font-size: 14px;
  color: #409eff;
  background-color: #f5f7fa;
}
</style> 