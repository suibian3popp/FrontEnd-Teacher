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

            <el-form-item label="院系" prop="departmentId" v-if="activeTab === 'register'">
              <el-select v-model="registerForm.departmentId" placeholder="请选择院系">
                <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
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
import { login, register } from '../api/auth'
import { setToken, setUser } from '../utils/auth'

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
  role: '',
  departmentId: '',
})

const roles = ['院系管理员', '教师', '助教']

// 静态院系列表（实际可用API获取）
const departments = [
  { id: 1, name: '计算机科学与技术学院' },
  { id: 2, name: '外国语学院' },
  { id: 3, name: '数学与统计学院' }
]
// 角色映射
const roleMap = {
  '院系管理员': 'department_admin',
  '教师': 'teacher',
  '助教': 'ta'
}

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
  ],
  departmentId: [
    { required: true, message: '请选择院系', trigger: 'change' }
  ]
}

// 填充测试账号
const useTestAccount = () => {
  loginForm.username = 'teacher'
  loginForm.password = '123456'
  ElMessage.info('已填充测试账号，点击登录即可进入系统')
}

// 处理登录成功
const handleLoginSuccess = (res) => {
  // 获取token，可能在不同位置，优先检查accessToken(JWT标准名称)
  const token = res.accessToken || res.data?.token || res.token
  const user = {
    userId: res.userId,
    username: res.username,
    userType: res.userType,
    realName: res.realName,
    departmentId: res.departmentId,
    departmentName: res.department
  }
  
  if (token) {
    setToken(token)
    setUser(user)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } else {
    ElMessage.warning('登录成功但未获取到令牌，请联系管理员')
    console.error('登录未获取到令牌:', res)
  }
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    // 只使用标准JSON格式
    const loginData = {
      username: loginForm.username,
      password: loginForm.password
    }
    
    console.log('登录请求数据:', loginData)
    let res = await login(loginData)
    loading.value = false
    
    console.log('登录响应数据:', res)
    
    // 更灵活的成功判断 - 检查accessToken或其他token形式
    if (res && (res.code === 200 || res.token || res.accessToken)) {
      handleLoginSuccess(res)
    } else {
      ElMessage.error(res?.message || '登录失败')
      console.error('登录失败详情:', res)
    }
  } catch (error) {
    loading.value = false
    ElMessage.error(error.message || '登录异常')
    console.error('登录异常详情:', error)
  }
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return
  try {
    await registerFormRef.value.validate()
    loading.value = true
    
    // 添加调试日志
    const requestData = {
      username: registerForm.username,
      password: registerForm.password,
      realName: registerForm.realName,
      userType: roleMap[registerForm.role],
      departmentId: registerForm.departmentId,
      email: registerForm.email
    }
    console.log('注册请求数据:', requestData)
    
    const res = await register(requestData)
    loading.value = false
    
    // 修改判断逻辑：只要返回了userId就认为成功
    if (res && res.userId) {
      ElMessage.success('注册成功，请登录')
      activeTab.value = 'login'
      Object.keys(registerForm).forEach(key => {
        registerForm[key] = ''
      })
    } else if (res && res.code === 200) {
      // 保留原有逻辑作为备选
      ElMessage.success('注册成功，请登录')
      activeTab.value = 'login'
      Object.keys(registerForm).forEach(key => {
        registerForm[key] = ''
      })
    } else {
      ElMessage.error(res.message || '注册失败')
      console.error('注册失败详情:', res)
    }
  } catch (error) {
    loading.value = false
    ElMessage.error(error.message || '注册异常')
    console.error('注册异常详情:', error)
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