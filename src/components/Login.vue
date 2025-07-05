<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <!-- 标题/Logo -->
      <div class="login-logo">智慧教学支持平台</div>
      
      <!-- 切换登录/注册标签 -->
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
            </el-form-item>
            
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" :type="showLoginPassword ? 'text' : 'password'" 
                        placeholder="请输入密码" prefix-icon="Lock" show-password />
            </el-form-item>
            
            <div class="login-options">
              <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
              <el-button text type="primary">忘记密码？</el-button>
            </div>
            
            <el-button type="primary" :loading="loading" class="login-button" @click="handleLogin">登录</el-button>
            
            <!-- 测试用户按钮 -->
            <div class="demo-user">
              <el-button link type="info" @click="useTestAccount">使用测试账号</el-button>
            </div>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-position="top">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="registerForm.username" placeholder="请输入用户名" prefix-icon="User" />
            </el-form-item>
            
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="registerForm.realName" placeholder="请输入真实姓名" prefix-icon="User" />
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="registerForm.email" placeholder="请输入邮箱" prefix-icon="Message" />
            </el-form-item>
            
            <el-form-item label="电话号码" prop="phone">
              <el-input v-model="registerForm.phone" placeholder="请输入电话号码（选填）" prefix-icon="Phone" />
            </el-form-item>
            
            <el-form-item label="密码" prop="password">
              <el-input v-model="registerForm.password" type="password" 
                        placeholder="请输入密码" prefix-icon="Lock" show-password />
            </el-form-item>
            
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="registerForm.confirmPassword" type="password" 
                        placeholder="请确认密码" prefix-icon="Lock" show-password />
            </el-form-item>
            
            <el-form-item label="角色" prop="role">
              <el-select v-model="registerForm.role" placeholder="请选择角色" class="register-select">
                <el-option v-for="role in roles" :key="role" :label="role" :value="role" />
              </el-select>
            </el-form-item>
            
            <el-button type="primary" :loading="loading" class="login-button" @click="handleRegister">注册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { User, Lock, Message, Phone } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('login')
const showLoginPassword = ref(false)
const loading = ref(false)

// 表单引用
const loginFormRef = ref(null)
const registerFormRef = ref(null)

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 注册表单
const registerForm = reactive({
  username: '',
  realName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: ''
})

const roles = ['院系管理员', '教师', '助教']

// 验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ]
}

// 密码匹配验证器
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 邮箱验证
const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (value === '') {
    callback(new Error('请输入邮箱'))
  } else if (!emailRegex.test(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

// 手机号验证
const validatePhone = (rule, value, callback) => {
  if (value === '') {
    callback() // 手机号可选
  } else {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(value)) {
      callback(new Error('请输入有效的手机号码'))
    } else {
      callback()
    }
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少需要3个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, validator: validateEmail, trigger: 'blur' }
  ],
  phone: [
    { validator: validatePhone, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 填充测试账号
const useTestAccount = () => {
  loginForm.username = 'teacher'
  loginForm.password = '123456'
  ElMessage.info('已填充测试账号，点击登录即可进入系统')
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    
    loading.value = true
    
    // 模拟登录API调用
    setTimeout(() => {
      loading.value = false
      // 简单的账号密码验证
      if (loginForm.username === 'teacher' && loginForm.password === '123456') {
        localStorage.setItem('user', JSON.stringify({
          username: loginForm.username,
          role: '教师'
        }))
        
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } else {
        ElMessage.error('用户名或密码错误')
      }
    }, 1000)
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
    
    loading.value = true
    
    // 模拟注册API调用
    setTimeout(() => {
      loading.value = false
      ElMessage.success('注册成功，请登录')
      activeTab.value = 'login'
      // 清空注册表单
      Object.keys(registerForm).forEach(key => {
        registerForm[key] = ''
      })
    }, 1500)
  } catch (error) {
    console.error('表单验证失败', error)
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: transparent;
}

.login-card {
  width: 480px;
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
}

.login-logo {
  font-size: 28px;
  text-align: center;
  margin-bottom: 20px;
  font-weight: bold;
  color: var(--el-color-primary);
  letter-spacing: 2px;
}

.login-tabs {
  width: 100%;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.login-button {
  width: 100%;
  margin-top: 10px;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 16px;
}

.register-select {
  width: 100%;
}

.demo-user {
  text-align: center;
  margin-top: 15px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 20px 10px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>