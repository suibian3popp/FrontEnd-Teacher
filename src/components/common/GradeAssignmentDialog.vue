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

const loading = computed(() => props.submission?.loading || false);
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

// 重置表单
const resetForm = () => {
  gradeForm.score = 0;
  gradeForm.comment = '';
  gradeForm.details.forEach(detail => {
    detail.score = 0;
  });
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
  if (!file.url) {
    ElMessage.warning('文件下载链接不存在');
    return;
  }
  
  ElMessage.success(`开始下载: ${file.name}`);
  
  // 创建一个隐藏的a标签，模拟点击下载
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = file.url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 预览文件
const previewFile = (file) => {
  if (!file.url) {
    ElMessage.warning('文件预览链接不存在');
    return;
  }
  
  // 对于可以在浏览器中预览的文件类型，直接在新窗口打开
  window.open(file.url, '_blank');
};

// 提交批改
const submitGrade = async () => {
  if (!gradeFormRef.value) return;
  
  try {
    await gradeFormRef.value.validate();
    
    submitting.value = true;
    
    // 准备提交的批阅数据
    const gradeData = {
      submissionId: props.submission.id,
      score: gradeForm.score,
      comments: gradeForm.comment || ''
    };
    
    console.log('提交的批阅数据:', gradeData);
    
    // 调用API提交批阅结果
    const response = await doPost(`/api/service/assignment/submission/${props.submission.id}/grade`, gradeData);
    
    if (response.data.code === 200) {
      ElMessage.success('批阅成功');
      emit('graded', {
        ...props.submission,
        score: gradeForm.score,
        comment: gradeForm.comment,
        status: '已批改'
      });
      dialogVisible.value = false;
    } else {
      ElMessage.error(`批阅失败: ${response.data.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('批阅提交异常:', error);
    ElMessage.error(`批阅失败: ${error.message || '未知错误'}`);
  } finally {
    submitting.value = false;
  }
};

// 获取提交详情
const fetchSubmissionDetail = async (submissionId) => {
  if (!submissionId) return;
  
  try {
    loading.value = true;
    const response = await doGet(`/api/service/assignment/submission/${submissionId}`);
    
    if (response.data.code === 200) {
      submissionDetail.value = response.data.data || {};
      
      // 如果已经批改过，加载之前的批改信息
      if (submissionDetail.value.score) {
        gradeForm.score = submissionDetail.value.score;
        gradeForm.comment = submissionDetail.value.comments || '';
      }
    } else {
      ElMessage.error(`获取提交详情失败: ${response.data.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('获取提交详情异常:', error);
  } finally {
    loading.value = false;
  }
};

// 查看提交的作业内容
const viewSubmissionContent = async (submissionId) => {
  if (!submissionId) return;
  
  try {
    const response = await doGet(`/api/service/assignment/submission/${submissionId}/content`);
    if (response.data.code === 200) {
      window.open(response.data.data.url, '_blank');
    } else {
      ElMessage.error(`无法查看提交内容: ${response.data.message || '未知错误'}`);
    }
  } catch (error) {
    console.error('查看提交内容异常:', error);
    ElMessage.error('无法查看提交内容');
  }
};

// 关闭对话框
const handleClose = () => {
  ElMessage.warning('已取消批改');
  dialogVisible.value = false;
};

// 当对话框打开时重置表单
watch(
  () => dialogVisible.value,
  (val) => {
    if (val) {
      resetForm();
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