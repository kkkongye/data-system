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
        <el-select v-model="form.constraint" placeholder="请选择约束条件" style="width: 100%" class="custom-select" multiple allow-create filterable default-first-option>
          <el-option label="访问权限" value="访问权限"></el-option>
          <el-option label="共享约束" value="共享约束"></el-option>
          <el-option label="开放约束" value="开放约束"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="传输控制操作：" prop="transferControl">
        <el-select v-model="form.transferControl" placeholder="请选择传输控制操作" style="width: 100%" class="custom-select" multiple allow-create filterable default-first-option>
          <el-option label="可读" value="可读"></el-option>
          <el-option label="可修改" value="可修改"></el-option>
          <el-option label="可销毁" value="可销毁"></el-option>
        </el-select>
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
  form.constraint = Array.isArray(newVal.constraint) ? [...newVal.constraint] : (newVal.constraint ? [newVal.constraint] : [])
  form.transferControl = Array.isArray(newVal.transferControl) ? [...newVal.transferControl] : (newVal.transferControl ? [newVal.transferControl] : [])
  form.auditInfo = newVal.auditInfo || ''
  form.status = newVal.status || ''
  form.feedback = newVal.feedback || ''
  form.excelData = newVal.excelData || null
}, { deep: true, immediate: true })

// 监听form变化，更新v-model
watch(form, (newVal) => {
  emit('update:modelValue', {
    id: newVal.id,
    entity: newVal.entity,
    locationInfo: {
      row: newVal.locationInfo.row,
      col: newVal.locationInfo.col
    },
    constraint: newVal.constraint,
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
  formRef.value.validate((valid) => {
    if (valid) {
      // 构建更新后的对象
      const entityName = form.entity
      const updatedObject = {
        id: form.id,
        entity: entityName,
        locationInfo: {
          row: form.locationInfo.row,
          col: form.locationInfo.col
        },
        constraint: form.constraint,
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
</style> 