<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">数据要素流转系统</div>
      <el-form :model="loginForm" class="login-form" ref="loginFormRef">
        <el-form-item>
          <el-input v-model="loginForm.username" placeholder="用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="loginForm.password" type="password" placeholder="密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-radio-group v-model="loginForm.role" class="login-role-select">
            <el-radio label="datasource">数源方</el-radio>
            <el-radio label="governor">治理方</el-radio>
            <el-radio label="user">使用方</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loginFormRef = ref(null)

const loginForm = reactive({
  username: '',
  password: '',
  role: 'datasource' // 默认选中数源方
})

const handleLogin = () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  // 模拟登录成功，根据角色跳转到不同页面
  localStorage.setItem('role', loginForm.role)
  
  console.log('登录成功，角色:', loginForm.role)
  
  try {
    switch (loginForm.role) {
      case 'datasource':
        console.log('跳转到数源方页面')
        router.push('/datasource')
        break
      case 'governor':
        console.log('跳转到治理方页面')
        router.push('/governor')
        break
      case 'user':
        console.log('跳转到使用方页面')
        router.push('/user')
        break
      default:
        console.log('默认跳转到数源方页面')
        router.push('/datasource')
    }
  } catch (error) {
    console.error('路由跳转错误:', error)
    ElMessage.error('页面跳转失败，请查看控制台错误信息')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-box {
  width: 400px;
  padding: 30px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #409EFF;
}

.login-form {
  margin-top: 20px;
}

.login-role-select {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.login-btn {
  width: 100%;
}
</style> 