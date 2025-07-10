<!--资源上传页面,没有加其他板块内容 后续整合-->
<!--目前用户id写死为1000，后续根据登陆传入-->

<template>
  <div class="upload-container">
    <h3 class="page-title">上传教学资源</h3>

    <!-- 表单区域 -->
    <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px">

      <!-- 资源类型 -->
      <el-form-item label="资源类型" prop="type">
        <el-select
            v-model="form.type"
            placeholder="请选择资源类型"
            style="width: 200px"
        >
          <el-option label="课件" value="courseware" />
          <el-option label="案例" value="case" />
          <el-option label="作业" value="assignment" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <!-- 资源难度 -->
      <el-form-item label="资源难度" prop="difficulty">
        <el-select
            v-model="form.difficulty"
            placeholder="请选择难度"
            style="width: 200px"
        >
          <el-option label="初级" value="beginner" />
          <el-option label="中级" value="intermediate" />
          <el-option label="高级" value="advanced" />
        </el-select>
      </el-form-item>

      <!-- 访问权限 -->
      <el-form-item label="访问权限" prop="permission">
        <el-radio-group v-model="form.permission">
          <el-radio value="private">私人</el-radio>
          <el-radio value="department">院系可见</el-radio>
          <el-radio value="public">公开</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 文件上传 -->
      <el-form-item label="上传文件">
        <el-upload
            ref="uploadImageRef"
            class="avatar-uploader"
            :limit="1"
            :on-success="resSuccess"
            :on-error="resError"
            :file-list="resFileList"
            :on-change="handleFileChange"
            :action="`http://localhost:8080/api/service/resource/upload`"
            :auto-upload="false"
            :show-file-list="true">
          <img v-if="imageUrl" :src="imageUrl" class="avatar"  alt="上传的文件预览"/>
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          <div class="el-upload__tip">支持常见文件格式上传</div>
        </el-upload>
        <!--      插值表达式-->
        <div>{{resTip}}</div>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item label="&nbsp">
        <!--        <el-button type="primary" @click="submitUpload" :disabled="nameExists">提交</el-button>-->
        <el-button type="primary" @click="submitUpload" >提交</el-button>
        <el-button type="success" plain @click="goBack">返回</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>

    </el-form>

    <!--    跳转到资源列表（暂定放这）-->
    <el-button
        type="primary"
        class="goto-resourcesList"
        @click="gotoResourcesList"
    >
      跳转到资源列表
    </el-button>
  </div>
</template>

<script setup>
import {ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from "vue-router";
import { Plus } from "@element-plus/icons-vue";
import { doPost } from "@/http/httpRequest";
import { getUser } from '../utils/auth';

const router = useRouter()
const route = useRoute()

let resTip=ref("")

//响应式表单数据
const form = reactive({
  type: '',
  difficulty: 'intermediate', //默认中级
  permission: 'private',       //默认私人
  file: null                   //存储文件对象
})

//表单校验规则
const rules = {

  type: [
    {
      required: true,
      message: '请选择资源类型',
      trigger: 'change'
    }
  ],
  permission: [
    {
      required: true,
      message: '请选择访问权限',
      trigger: 'change'
    }
  ]
}

//文件列表（用于el-upload组件展示）
const resFileList = ref([])
const imageUrl = ref('')
//表单引用（用于校验）
const formRef = ref(null)

//文件变化处理
const handleFileChange = (file, currentResFileList) => {
  form.file = file.raw //存储原始文件对象
  resFileList.value = currentResFileList //更新文件列表展示

  //如果是图片文件，显示预览图
  if(file.raw.type.indexOf('image/')!==-1){
    imageUrl.value = URL.createObjectURL(file.raw)
  }else{
    imageUrl.value = ''
  }

}


//提交按钮
function submitUpload () {
  //表单校验
  formRef.value.validate((valid) => {
    if (!valid) {
      ElMessage.error('表单校验未通过，请检查！')
      return
    }
    if (!form.file) {
      ElMessage.error('请先选择文件！')
      return
    }

    const userInfo = getUser();
    if (!userInfo || !userInfo.userId) {
      ElMessage.error('无法获取用户信息，请重新登录');
      return;
    }

    //构造 FormData
    const formData = new FormData()
    formData.append('ownerId', userInfo.userId)
    formData.append('file', form.file)
    // formData.append('name', form.name)
    formData.append('type', form.type)
    formData.append('difficulty', form.difficulty)
    formData.append('permission', form.permission)

    //调用上传接口
    doPost('/api/service/resource/upload', formData)
        .then((res) => {
          if (res.data.code === 200) { //后端返回code=200为成功
            ElMessage.success('资源上传成功！')
            resetForm() //上传成功后重置表单
          } else {
            // 此分支基本不会进入，因为非200的业务错误会在httpRequest.js中被reject
            ElMessage.error('上传失败：' + res.data.msg)
          }
        })
        .catch((err) => {
          // 现在err是后端返回的完整错误对象，例如 { code: 5001, msg: '系统繁忙...' }
          console.error('上传请求异常：', err)
          ElMessage.error(`上传失败: ${err.msg || '未知错误'}`)
        })
  })
}

function resSuccess() {
  resFileList.value = []
  resTip = "资源上传成功"
}
function resError(){
  resFileList.value=[]
  resTip = "资源上传失败"
}

//重置表单
const resetForm = () => {
  form.type = ''
  form.difficulty = 'intermediate'
  form.permission = 'private'
  form.file = null
  resFileList.value = []
  imageUrl.value = ''
  formRef.value.resetFields() //重置表单校验状态
}

function goBack(){
  router.go (-1)
}

function gotoResourcesList() {
  const userInfo = getUser();
  if (!userInfo || !userInfo.userId) {
    ElMessage.error('无法获取用户信息，请重新登录');
    return;
  }
  router.push('/resource/list/' + userInfo.userId);
}

</script>


<style scoped>
/* 容器布局：让页面占满父容器剩余空间，适配右侧区域 */
.upload-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px 30px; /* 加大内边距，让内容不那么贴边 */
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 120px);
  position: relative; /* 为绝对定位的按钮做参考 */
}

/* 标题样式优化 */
.page-title {
  margin: 0 0 30px; /* 加大与下方间距 */
  font-size: 24px; /* 加大标题字体 */
  font-weight: 700;
  border-left: 4px solid #409eff;
  padding-left: 15px;
}

/* 表单标签字体调整 */
.el-form-item__label {
  font-size: 16px; /* 加大表单标签字体 */
}

/* 下拉框、单选框等组件字体调整（根据 Element Plus 类名适配） */
.el-select,
.el-radio {
  font-size: 16px;
}

/* 文件上传组件样式优化 */
.avatar-uploader {
  width: 100%;
  max-width: 400px;
  margin-bottom: 30px; /* 加大与下方间距 */
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.2);
}

.avatar-uploader-icon {
  font-size: 40px; /* 加大上传图标 */
  color: #8c939d;
  width: 220px;
  height: 220px;
  line-height: 220px;
  text-align: center;
}

.avatar {
  width: 220px;
  height: 220px;
  display: block;
  object-fit: cover;
}

.el-upload__tip {
  font-size: 14px;
}

/* 操作按钮区域布局优化 */
.el-form-item--button {
  display: flex;
  gap: 15px; /* 加大按钮间距 */
  justify-content: flex-start;
  margin-top: 20px; /* 与上方间距 */
}

.el-button {
  font-size: 16px; /* 加大按钮文字 */
}

/* 跳转按钮布局调整：固定在右下角但不超出 */
.goto-resourcesList {
  position: absolute;
  bottom: 30px; /* 加大与底部间距 */
  right: 30px; /* 加大与右侧间距 */
  z-index: 1;
  font-size: 16px; /* 加大按钮文字 */
}

/* 响应式适配：小屏幕下调整间距 */
@media (max-width: 768px) {
  .upload-container {
    padding: 25px 20px;
  }
  .page-title {
    font-size: 20px;
  }
  .avatar-uploader-icon {
    width: 180px;
    height: 180px;
    font-size: 32px;
    line-height: 180px;
  }
  .avatar {
    width: 180px;
    height: 180px;
  }
  .goto-resourcesList {
    bottom: 20px;
    right: 20px;
    font-size: 14px;
  }
}
</style>

