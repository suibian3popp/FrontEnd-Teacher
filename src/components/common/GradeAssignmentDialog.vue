<template>
  <el-dialog
    v-model="dialogVisible"
    title="作业批改"
    width="70%"
    :before-close="handleClose"
  >
    <div class="grade-dialog-content" v-loading="loading">
      <!-- 学生信息 -->
      <el-descriptions title="学生信息" :column="3" border>
        <el-descriptions-item label="姓名">{{ submission.studentName }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ submission.studentId }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ submission.submitTime }}</el-descriptions-item>
      </el-descriptions>

      <!-- 作业内容 -->
      <div class="assignment-content">
        <h3>作业内容</h3>
        
        <!-- 文本内容部分 -->
        <div v-if="submission.textContent" class="content-section">
          <div class="section-title">
            <span>文本内容</span>
          </div>
          <div class="text-preview content-preview">
            <pre>{{ submission.textContent }}</pre>
          </div>
        </div>
        
        <!-- 附件部分 -->
        <div v-if="submission.attachments && submission.attachments.length > 0" class="content-section">
          <div class="section-title">
            <span>附件列表</span>
          </div>
          <div class="attachments-list">
            <el-table :data="submission.attachments" style="width: 100%">
              <el-table-column prop="name" label="文件名" />
              <el-table-column prop="size" label="大小" width="120" />
              <el-table-column prop="type" label="类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getFileTagType(row.type)">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="downloadFile(row)">
                    <el-icon><Download /></el-icon> 下载
                  </el-button>
                  <el-button type="info" link size="small" v-if="canPreview(row.type)" @click="previewFile(row)">
                    <el-icon><View /></el-icon> 预览
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        
        <!-- 传统内容预览(兼容旧数据) -->
        <div v-if="!submission.textContent && !submission.attachments?.length && submission.content" class="content-preview">
          <template v-if="submission.fileType === 'pdf'">
            <div class="pdf-preview">
              <p>PDF文件预览 (实际项目中接入PDF预览组件)</p>
              <div class="mock-pdf">{{ submission.content }}</div>
            </div>
          </template>
          <template v-else-if="submission.fileType === 'image'">
            <div class="image-preview">
              <p>图片预览</p>
              <img :src="submission.content" alt="作业图片" class="preview-image" />
            </div>
          </template>
          <template v-else>
            <div class="text-preview">
              <pre>{{ submission.content }}</pre>
            </div>
          </template>
        </div>
      </div>

      <!-- 批改表单 -->
      <div class="grade-form">
        <h3>批改评分</h3>
        <el-form :model="gradeForm" label-width="100px" :rules="rules" ref="gradeFormRef">
          <el-form-item label="得分" prop="score">
            <el-input-number 
              v-model="gradeForm.score" 
              :min="0" 
              :max="maxScore" 
              :step="1"
              :precision="1"
            />
            <span class="score-total">/ {{ maxScore }}</span>
          </el-form-item>
          
          <el-form-item label="评语" prop="comment">
            <el-input 
              type="textarea" 
              v-model="gradeForm.comment"
              :rows="4"
              placeholder="请输入评语"
            />
          </el-form-item>
          
          <el-form-item label="批改详情">
            <div class="grade-details">
              <el-collapse>
                <el-collapse-item title="评分细则" name="1">
                  <el-form-item 
                    v-for="(item, index) in gradeForm.details" 
                    :key="index"
                    :label="item.name"
                  >
                    <el-input-number 
                      v-model="item.score" 
                      :min="0" 
                      :max="item.maxScore" 
                      :step="0.5"
                      :precision="1"
                      size="small"
                    />
                    <span class="score-total">/ {{ item.maxScore }}</span>
                  </el-form-item>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="submitGrade" :loading="submitting">
          提交批改
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, View } from '@element-plus/icons-vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  submission: {
    type: Object,
    default: () => ({})
  },
  maxScore: {
    type: Number,
    default: 100
  }
});

const emit = defineEmits(['update:visible', 'graded']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

const loading = ref(false);
const submitting = ref(false);
const gradeFormRef = ref(null);

// 评分表单
const gradeForm = reactive({
  score: 0,
  comment: '',
  details: [
    { name: '内容完整性', score: 0, maxScore: 30 },
    { name: '逻辑性', score: 0, maxScore: 30 },
    { name: '表达清晰度', score: 0, maxScore: 20 },
    { name: '格式规范', score: 0, maxScore: 20 }
  ]
});

// 表单验证规则
const rules = {
  score: [
    { required: true, message: '请输入分数', trigger: 'blur' },
    { type: 'number', message: '分数必须为数字', trigger: 'blur' }
  ],
  comment: [
    { required: true, message: '请输入评语', trigger: 'blur' },
    { min: 5, message: '评语不能少于5个字符', trigger: 'blur' }
  ]
};

// 监听细则评分变化，自动计算总分
watch(
  () => gradeForm.details,
  () => {
    gradeForm.score = gradeForm.details.reduce((sum, item) => sum + item.score, 0);
  },
  { deep: true }
);

// 加载作业内容
const loadSubmissionContent = () => {
  loading.value = true;
  
  // 模拟API调用，加载作业内容
  setTimeout(() => {
    // 在实际项目中，这里会调用API获取作业内容
    if (!props.submission.content && !props.submission.textContent) {
      // 添加模拟数据，包括文本内容和附件
      props.submission.textContent = "这是学生提交的作业文本内容\n\n软件工程需求分析报告\n\n1. 引言\n本文档描述了XX系统的需求分析...\n\n2. 功能需求\n2.1 用户管理\n系统应支持用户注册、登录...\n\n3. 非功能需求\n系统应具有良好的可用性和性能...";
      
      props.submission.attachments = [
        { id: 1, name: "需求文档.pdf", size: "1.2MB", type: "PDF", url: "#" },
        { id: 2, name: "系统设计图.png", size: "540KB", type: "图片", url: "#" },
        { id: 3, name: "源代码.zip", size: "3.5MB", type: "压缩文件", url: "#" },
      ];
    }
    
    loading.value = false;
  }, 500);
};

// 获取文件类型的标签样式
const getFileTagType = (fileType) => {
  const typeMap = {
    'PDF': 'danger',
    'Word文档': 'primary',
    'Excel表格': 'success',
    'PPT演示文稿': 'warning',
    '图片': 'info',
    '压缩文件': 'default',
    '文本文件': 'success',
  };
  return typeMap[fileType] || '';
};

// 判断文件是否可以预览
const canPreview = (fileType) => {
  const previewableTypes = ['PDF', '图片', '文本文件'];
  return previewableTypes.includes(fileType);
};

// 下载文件
const downloadFile = (file) => {
  ElMessage.success(`开始下载: ${file.name}`);
  // 实际项目中应调用后端API进行文件下载
  console.log('下载文件:', file);
};

// 预览文件
const previewFile = (file) => {
  ElMessage.info(`预览文件: ${file.name}`);
  // 实际项目中可以使用相应的预览组件或打开新窗口预览
  console.log('预览文件:', file);
};

// 提交批改
const submitGrade = async () => {
  if (!gradeFormRef.value) return;
  
  try {
    await gradeFormRef.value.validate();
    
    submitting.value = true;
    
    // 模拟API调用，提交批改结果
    setTimeout(() => {
      // 在实际项目中，这里会调用API提交批改结果
      console.log('提交批改结果:', {
        submissionId: props.submission.id,
        studentId: props.submission.studentId,
        score: gradeForm.score,
        comment: gradeForm.comment,
        details: gradeForm.details
      });
      
      submitting.value = false;
      ElMessage.success('批改成功');
      
      // 通知父组件批改完成
      emit('graded', {
        ...props.submission,
        score: gradeForm.score,
        comment: gradeForm.comment,
        status: '已批改'
      });
      
      // 关闭对话框
      dialogVisible.value = false;
    }, 1000);
  } catch (error) {
    console.error('表单验证失败', error);
    ElMessage.error('请完成所有必填项');
  }
};

// 关闭对话框
const handleClose = () => {
  ElMessage.warning('已取消批改');
  dialogVisible.value = false;
};

// 当对话框打开时加载作业内容
watch(
  () => dialogVisible.value,
  (val) => {
    if (val) {
      loadSubmissionContent();
    }
  }
);
</script>

<style scoped>
.grade-dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

.assignment-content {
  margin-top: 20px;
}

.content-preview {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
  background-color: #f9f9f9;
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
}

.mock-pdf {
  background-color: #fff;
  padding: 20px;
  border: 1px solid #ddd;
  min-height: 200px;
}

.preview-image {
  max-width: 100%;
  max-height: 280px;
  display: block;
  margin: 0 auto;
}

.text-preview pre {
  white-space: pre-wrap;
  font-family: monospace;
}

.grade-form {
  margin-top: 20px;
}

.score-total {
  margin-left: 8px;
  color: #909399;
}

.grade-details {
  margin-top: 10px;
}

.content-section {
  margin-bottom: 20px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 16px;
  color: #333;
}

.attachments-list {
  background: white;
  border-radius: 4px;
  padding: 5px;
}
</style> 