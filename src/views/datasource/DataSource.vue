<template>
  <div class="datasource-container">
    <div class="header">
      <div class="title">数据要素流转系统</div>
      <div class="user-info">
        <span>数源方</span>
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="main-content">
      <div class="placeholder">这是数源方页面</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  localStorage.removeItem('role')
  router.push('/login')
}
</script>

<style scoped>
.datasource-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background-color: #409EFF;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
}

.placeholder {
  font-size: 24px;
  color: #666;
}
</style> 