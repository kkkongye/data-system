<template>
  <el-dialog
    v-model="dialogVisible"
    title="分类分级值"
    width="500px"
    :close-on-click-modal="false"
    :append-to-body="true"
    :destroy-on-close="false"
    :modal-append-to-body="true"
    draggable
    :before-close="handleClose"
  >
    <el-tabs v-model="activeTab" class="classification-tabs">
      <el-tab-pane label="分类" name="classification">
        <div class="classification-content">
          <!-- 行业领域分类值 -->
          <div class="classification-item">
            <span class="label">行业领域分类值：</span>
            <el-select 
              v-model="industryCategory" 
              class="select-box" 
              placeholder="请选择"
              @change="calculateClassificationValue"
            >
              <el-option
                v-for="(value, key) in industryCategoryMap"
                :key="key"
                :label="key"
                :value="key"
              />
            </el-select>
            <span class="value-display">对应分类值为：{{ getIndustryValue() }}</span>
          </div>

          <!-- 处理时效分类值 -->
          <div class="classification-item">
            <span class="label">处理时效分类值：</span>
            <el-select 
              v-model="timeliness" 
              class="select-box" 
              placeholder="请选择"
              @change="calculateClassificationValue"
            >
              <el-option
                v-for="(value, key) in timelinessMap"
                :key="key"
                :label="key"
                :value="key"
              />
            </el-select>
            <span class="value-display">对应分类值为：{{ getTimelinessValue() }}</span>
          </div>

          <!-- 数据来源分类值 -->
          <div class="classification-item">
            <span class="label">数据来源分类值：</span>
            <el-select 
              v-model="dataSource" 
              class="select-box" 
              placeholder="请选择"
              @change="calculateClassificationValue"
            >
              <el-option
                v-for="(value, key) in sourceMap"
                :key="key"
                :label="key"
                :value="key"
              />
            </el-select>
            <span class="value-display">对应分类值为：{{ getSourceValue() }}</span>
          </div>

          <!-- 文件分类值计算结果 -->
          <div class="classification-result">
            <span class="result-label">文件分类值计算得：</span>
            <span class="result-value">{{ totalClassificationValue }}</span>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="分级" name="level">
        <div class="level-content">
          <!-- 分级内容 -->
          <div class="level-item">
            <span class="label">库分级值：</span>
            <span class="value-display-fixed">{{ levelData.dbLevel || 0 }}</span>
            <el-link type="primary" class="detail-link">说明</el-link>
          </div>

          <div class="level-item">
            <span class="label">表分级值：</span>
            <span class="value-display-fixed">{{ levelData.tableLevel || 0 }}</span>
            <el-link type="primary" class="detail-link">说明</el-link>
          </div>

          <div class="level-item">
            <span class="label">行分级值：</span>
            <span class="value-display-fixed">{{ levelData.rowLevel || 0 }}</span>
            <el-link type="primary" class="detail-link">查看详情</el-link>
          </div>

          <div class="level-item">
            <span class="label">列分级值：</span>
            <span class="value-display-fixed">{{ levelData.columnLevel || 0 }}</span>
            <el-link type="primary" class="detail-link">查看详情</el-link>
          </div>

          <!-- 分级值计算结果 -->
          <div class="classification-result">
            <span class="result-label">分级值计算得：</span>
            <span class="result-value">{{ calculateTotalLevelValue() }}</span>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  // 添加现有的分类分级数据，用于回显
  existingData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:visible', 'confirm']);

// 对话框可见状态 - 修改为直接使用prop
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

// 标签页状态
const activeTab = ref('classification');

// 分类值选择
const industryCategory = ref('');
const timeliness = ref('');
const dataSource = ref('');
const totalClassificationValue = ref('');

// 分级值数据结构修改
const levelData = ref({
  dbLevel: 0,     // 库分级值
  tableLevel: 0,  // 表分级值
  rowLevel: 0,    // 行分级值
  columnLevel: 0  // 列分级值
});
const totalLevelValue = ref(0);

// 分类值映射表
const industryCategoryMap = reactive({
  "交通运输": 90,
  "金融": 90,
  "卫生社会工作": 90,
  "教育": 60,
  "制造业": 60,
  "建筑业": 60,
  "餐饮": 30,
  "居民服务": 30,
  "个人组织": 30
});

const timelinessMap = reactive({
  "实时": 9,
  "近实时": 6,
  "历史": 3
});

const sourceMap = reactive({
  "政府": 0.9,
  "企业": 0.6,
  "个人": 0.3
});

// 获取各项分类值的方法
const getIndustryValue = () => {
  return industryCategory.value ? industryCategoryMap[industryCategory.value] : 0;
};

const getTimelinessValue = () => {
  return timeliness.value ? timelinessMap[timeliness.value] : 0;
};

const getSourceValue = () => {
  return dataSource.value ? sourceMap[dataSource.value] : 0;
};

// 计算总分类值
const calculateClassificationValue = () => {
  const industryValue = getIndustryValue();
  const timelinessValue = getTimelinessValue();
  const sourceValue = getSourceValue();
  
  const sum = industryValue + timelinessValue + sourceValue;
  totalClassificationValue.value = sum.toFixed(1);
};

// 总分级值计算
const calculateTotalLevelValue = () => {
  const total = levelData.value.dbLevel + 
                levelData.value.tableLevel + 
                levelData.value.rowLevel + 
                levelData.value.columnLevel;
  totalLevelValue.value = total;
  return total;
};

// 重新定义计算分级值的方法
const calculateLevelValue = () => {
  calculateTotalLevelValue();
};

// 监听对话框可见性变化，当对话框显示时，初始化数据
watch(() => dialogVisible.value, (isVisible) => {
  if (isVisible) {
    initializeData();
  }
});

// 初始化数据，用于回显已有值
const initializeData = () => {
  if (props.existingData) {
    // 恢复分类数据
    if (props.existingData.industryCategory) {
      industryCategory.value = props.existingData.industryCategory;
    }
    if (props.existingData.timeliness) {
      timeliness.value = props.existingData.timeliness;
    }
    if (props.existingData.dataSource) {
      dataSource.value = props.existingData.dataSource;
    }
    
    // 恢复分级数据
    if (props.existingData.dbLevel !== undefined) {
      levelData.value.dbLevel = props.existingData.dbLevel;
    }
    if (props.existingData.tableLevel !== undefined) {
      levelData.value.tableLevel = props.existingData.tableLevel;
    }
    if (props.existingData.rowLevel !== undefined) {
      levelData.value.rowLevel = props.existingData.rowLevel;
    }
    if (props.existingData.columnLevel !== undefined) {
      levelData.value.columnLevel = props.existingData.columnLevel;
    }
    
    // 计算初始值
    calculateClassificationValue();
    calculateLevelValue();
  }
};

// 重置所有选择
const resetAllSelections = () => {
  // 重置分类
  industryCategory.value = '';
  timeliness.value = '';
  dataSource.value = '';
  totalClassificationValue.value = '';
  
  // 重置分级
  levelData.value = {
    dbLevel: 0,
    tableLevel: 0,
    rowLevel: 0,
    columnLevel: 0
  };
  totalLevelValue.value = 0;
};

// 切换标签页时自动计算当前标签页的值
watch(activeTab, (newTab) => {
  if (newTab === 'classification') {
    calculateClassificationValue();
  } else if (newTab === 'level') {
    calculateLevelValue();
  }
});

// 处理关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};

// 获取最终分类结果文本
const getClassificationText = (value) => {
  if (value >= 90) return '绝密';
  if (value >= 60) return '机密';
  if (value >= 30) return '秘密';
  if (value > 0) return '内部';
  return '公开';
};

// 获取最终分级结果文本
const getLevelText = (value) => {
  if (value >= 9) return '高';
  if (value >= 6) return '中';
  if (value > 0) return '低';
  return '低';
};

// 处理确认
const handleConfirm = () => {
  // 计算最终的分类分级值
  calculateClassificationValue();
  calculateLevelValue();
  
  // 获取分类文本
  const classification = getClassificationText(parseFloat(totalClassificationValue.value));
  
  // 获取分级文本
  const level = getLevelText(totalLevelValue.value);
  
  // 构建结果数据
  const result = {
    // 分类分级最终值
    classification,
    level,
    // 保留原始数据用于回显
    industryCategory: industryCategory.value,
    timeliness: timeliness.value,
    dataSource: dataSource.value,
    dbLevel: levelData.value.dbLevel,
    tableLevel: levelData.value.tableLevel,
    rowLevel: levelData.value.rowLevel,
    columnLevel: levelData.value.columnLevel,
    // 计算值
    totalClassificationValue: totalClassificationValue.value,
    totalLevelValue: totalLevelValue.value
  };
  
  // 发出确认事件
  emit('confirm', result);
  
  // 关闭对话框
  dialogVisible.value = false;
};
</script>

<style scoped>
.classification-tabs {
  width: 100%;
}

.classification-content,
.level-content {
  padding: 20px 0;
}

.classification-item,
.level-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.label {
  width: 140px;
  text-align: right;
  margin-right: 10px;
  font-size: 14px;
  color: #606266;
}

.select-box {
  width: 150px;
}

.value-display {
  margin-left: 15px;
  font-size: 14px;
  color: #303133;
}

.classification-result {
  margin-top: 30px;
  text-align: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.result-label {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-right: 10px;
}

.result-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.placeholder-text {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-style: italic;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 添加一些过渡效果 */
.el-select {
  transition: all 0.3s ease;
}

.el-select:hover {
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.5);
}

.result-value {
  transition: all 0.3s ease;
  display: inline-block;
}

/* 添加数值显示动画 */
@keyframes highlight {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); color: #1890ff; }
  100% { transform: scale(1); }
}

.result-value.updated {
  animation: highlight 0.5s ease;
}

.value-display-fixed {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 15px;
  min-width: 40px;
  display: inline-block;
}

.detail-link {
  font-size: 13px;
}
</style> 