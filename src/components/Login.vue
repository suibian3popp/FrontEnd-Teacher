<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-transparent">
    <div class="w-[480px] bg-white/95 backdrop-blur-sm shadow-xl rounded-xl p-8">
      <!-- logo -->
      <div class="font-['Pacifico'] text-3xl text-center mb-8 text-primary">logo</div>

      <!-- 内容 -->
      <div class="flex mb-6">
        <button class="flex-1 py-2 border-b-2 !rounded-button whitespace-nowrap"
                :class="{ 'text-primary border-primary': activeTab === 'login', 'text-gray-500 border-gray-200': activeTab === 'register' }"
                @click="activeTab = 'login'">登录</button>
        <button class="flex-1 py-2 border-b-2 !rounded-button whitespace-nowrap"
                :class="{ 'text-primary border-primary': activeTab === 'register', 'text-gray-500 border-gray-200': activeTab === 'login' }"
                @click="activeTab = 'register'">注册</button>
      </div>

      <div v-if="activeTab === 'login'" class="space-y-6">
        <div class="relative">
          <i class="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input v-model="loginForm.username" type="text" placeholder="请输入账号"
                 class="w-full pl-10 pr-4 py-3 border rounded-button focus:outline-none"
                 :class="{'border-gray-200': !loginErrors.username, 'border-red-500': loginErrors.username}">
          <span v-if="loginErrors.username" class="absolute left-0 -bottom-5 text-xs text-red-500">{{ loginErrors.username }}</span>
        </div>

        <div class="relative">
          <i class="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input v-model="loginForm.password" :type="showLoginPassword ? 'text' : 'password'" placeholder="请输入密码"
                 class="w-full pl-10 pr-4 py-3 border rounded-button focus:outline-none"
                 :class="{'border-gray-200': !loginErrors.password, 'border-red-500': loginErrors.password}">
          <button class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary !rounded-button whitespace-nowrap"
                  @click="showLoginPassword = !showLoginPassword">
            <i :class="showLoginPassword ? 'far fa-eye-slash' : 'far fa-eye'"></i>
          </button>
          <span v-if="loginErrors.password" class="absolute left-0 -bottom-5 text-xs text-red-500">{{ loginErrors.password }}</span>
        </div>

        <div class="flex justify-between items-center">
          <label class="flex items-center">
            <input v-model="loginForm.remember" type="checkbox"
                   class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary">
            <span class="ml-2 text-sm text-gray-600">记住密码</span>
          </label>
          <a href="#" class="text-sm text-primary hover:text-primary/80">忘记密码？</a>
        </div>

        <!-- 登录按钮 -->
        <button @click="handleLogin"
                class="w-full py-3 bg-primary text-white font-medium !rounded-button hover:bg-primary/90 transition-colors whitespace-nowrap">
          登录
        </button>
      </div>

      <div v-else class="space-y-6">
        <div v-for="(field, index) in registerFields" :key="index" class="relative">
          <i :class="field.icon" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <template v-if="field.type === 'select'">
            <div class="relative">
              <button :id="field.id" class="w-full pl-10 pr-4 py-3 border rounded-button focus:outline-none text-left bg-white whitespace-nowrap"
                      :class="{'border-gray-200': !registerErrors.role, 'border-red-500': registerErrors.role}"
                      @click="toggleDropdown">
                {{ registerForm.role || '请选择角色' }}
              </button>
              <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <span v-if="field.required" class="absolute -top-2 left-2 text-red-500 text-xs">*</span>
              <div v-show="showRoleDropdown" class="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div v-for="role in roles" :key="role"
                     class="py-2 px-4 hover:bg-gray-50 cursor-pointer"
                     @click="selectRole(role)">
                  {{ role }}
                </div>
              </div>
              <span v-if="registerErrors.role" class="absolute left-0 -bottom-5 text-xs text-red-500">{{ registerErrors.role }}</span>
            </div>
          </template>
          <template v-else>
            <input v-model="registerForm[field.name]"
                   :type="field.type === 'password' && !field.show ? 'password' : 'text'"
                   :placeholder="field.placeholder"
                   @input="clearError(field.name)"
                   @blur="validateField(field.name)"
                   class="w-full pl-10 pr-4 py-3 border rounded-button focus:outline-none"
                   :class="{'border-gray-200': !registerErrors[field.name], 'border-red-500': registerErrors[field.name]}">
            <span v-if="field.required" class="absolute -top-2 left-2 text-red-500 text-xs">*</span>
            <button v-if="field.type === 'password'"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary !rounded-button whitespace-nowrap"
                    @click="field.show = !field.show">
              <i :class="field.show ? 'far fa-eye-slash' : 'far fa-eye'"></i>
            </button>
            <!-- 密码不一致的错误提示只显示在确认密码框下面 -->
            <span v-if="registerErrors[field.name] && field.name !== 'confirmPassword'"
                  class="absolute left-0 -bottom-5 text-xs text-red-500">{{ registerErrors[field.name] }}</span>
            <span v-if="field.name === 'confirmPassword' && passwordMismatch"
                  class="absolute left-0 -bottom-5 text-xs text-red-500">两次密码不一致</span>
          </template>
        </div>

        <!-- 注册按钮 -->
        <button @click="handleRegister"
                class="w-full py-3 bg-primary text-white font-medium !rounded-button hover:bg-primary/90 transition-colors whitespace-nowrap">
          注册
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';

const activeTab = ref('login');
const showLoginPassword = ref(false);
const showRoleDropdown = ref(false);

// 登录表单
const loginForm = ref({
  username: '',
  password: '',
  remember: false
});

// 登录表单错误
const loginErrors = ref({
  username: '',
  password: ''
});

// 注册表单
const registerForm = ref({
  username: '',
  realName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: ''
});

// 注册表单错误
const registerErrors = ref({
  username: '',
  realName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: ''
});

const roles = ['院系管理员', '教师', '助教'];

// 注册字段配置
const registerFields = ref([
  { name: 'username', type: 'text', icon: 'fas fa-user', placeholder: '请输入用户名', required: true },
  { name: 'realName', type: 'text', icon: 'fas fa-id-card', placeholder: '请输入真实姓名', required: true },
  { name: 'email', type: 'email', icon: 'fas fa-envelope', placeholder: '请输入邮箱', required: true },
  { name: 'phone', type: 'tel', icon: 'fas fa-phone', placeholder: '请输入电话号码（选填）' },
  { name: 'password', type: 'password', icon: 'fas fa-lock', placeholder: '请输入密码', required: true, show: false },
  { name: 'confirmPassword', type: 'password', icon: 'fas fa-lock', placeholder: '请确认密码', required: true, show: false },
  { name: 'role', type: 'select', icon: 'fas fa-user-tag', id: 'roleSelect', placeholder: '请选择角色', required: true }
]);

// 计算属性：检查密码是否一致
const passwordMismatch = computed(() => {
  return registerForm.value.password &&
      registerForm.value.confirmPassword &&
      registerForm.value.password !== registerForm.value.confirmPassword;
});

// 清除错误
const clearError = (fieldName: string) => {
  if (registerForm.value[fieldName as keyof typeof registerForm.value]) {
    registerErrors.value[fieldName as keyof typeof registerErrors.value] = '';
  }

  // 特殊处理密码确认框
  if (fieldName === 'password' || fieldName === 'confirmPassword') {
    if (registerForm.value.password && registerForm.value.confirmPassword) {
      if (registerForm.value.password === registerForm.value.confirmPassword) {
        registerErrors.value.confirmPassword = '';
      }
    }
  }
};

// 验证单个字段
const validateField = (fieldName: string) => {
  if (!registerForm.value[fieldName as keyof typeof registerForm.value] &&
      registerFields.value.find(f => f.name === fieldName)?.required) {
    registerErrors.value[fieldName as keyof typeof registerErrors.value] = `${registerFields.value.find(f => f.name === fieldName)?.placeholder}不能为空`;
    return;
  }

  switch (fieldName) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.value.email)) {
        registerErrors.value.email = '请输入有效的邮箱地址';
      } else {
        registerErrors.value.email = '';
      }
      break;
    case 'phone':
      if (registerForm.value.phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(registerForm.value.phone)) {
          registerErrors.value.phone = '请输入有效的手机号码';
        } else {
          registerErrors.value.phone = '';
        }
      }
      break;
    case 'confirmPassword':
      if (registerForm.value.password !== registerForm.value.confirmPassword) {
        registerErrors.value.confirmPassword = '两次密码不一致';
      } else {
        registerErrors.value.confirmPassword = '';
      }
      break;
    default:
      if (registerForm.value[fieldName as keyof typeof registerForm.value]) {
        registerErrors.value[fieldName as keyof typeof registerErrors.value] = '';
      }
      break;
  }
};

// 验证登录表单
const validateLoginForm = () => {
  let isValid = true;

  if (!loginForm.value.username) {
    loginErrors.value.username = '用户名不能为空';
    isValid = false;
  } else {
    loginErrors.value.username = '';
  }

  if (!loginForm.value.password) {
    loginErrors.value.password = '密码不能为空';
    isValid = false;
  } else {
    loginErrors.value.password = '';
  }

  return isValid;
};

// 验证注册表单
const validateRegisterForm = () => {
  let isValid = true;

  // 验证必填字段
  registerFields.value.forEach(field => {
    if (field.required && !registerForm.value[field.name as keyof typeof registerForm.value]) {
      registerErrors.value[field.name as keyof typeof registerErrors.value] = `${field.placeholder}不能为空`;
      isValid = false;
    }
  });

  // 验证邮箱格式
  if (registerForm.value.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.value.email)) {
      registerErrors.value.email = '请输入有效的邮箱地址';
      isValid = false;
    }
  }

  // 验证手机号格式
  if (registerForm.value.phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(registerForm.value.phone)) {
      registerErrors.value.phone = '请输入有效的手机号码';
      isValid = false;
    }
  }

  // 验证密码一致性
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerErrors.value.confirmPassword = '两次密码不一致';
    isValid = false;
  }

  return isValid;
};

const toggleDropdown = () => {
  showRoleDropdown.value = !showRoleDropdown.value;
};

const selectRole = (role: string) => {
  registerForm.value.role = role;
  showRoleDropdown.value = false;
  registerErrors.value.role = '';
};

// 登录事件
const handleLogin = () => {
  if (validateLoginForm()) {
    console.log('Login form submitted:', loginForm.value);
    // 这里添加实际的登录逻辑
  }
};

// 注册事件
const handleRegister = () => {
  if (validateRegisterForm()) {
    console.log('Register form submitted:', registerForm.value);
    // 这里添加实际的注册逻辑
  }
};

onMounted(() => {
  document.addEventListener('click', (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('#roleSelect')) {
      showRoleDropdown.value = false;
    }
  });
});
</script>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.rounded-button {
  border-radius: 6px;
}
</style>

<!-- 添加Font Awesome CSS链接 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">