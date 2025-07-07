<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
    <el-form-item label="考试名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入考试名称" />
    </el-form-item>
    <el-form-item label="所属课程" prop="course">
      <el-select v-model="form.course" placeholder="请选择课程">
        <el-option label="软件工程" value="软件工程" />
        <el-option label="计算机网络" value="计算机网络" />
        <el-option label="操作系统" value="操作系统" />
      </el-select>
    </el-form-item>
    <el-form-item label="所属班级" prop="class">
      <el-select
        v-model="form.class"
        multiple
        collapse-tags
        collapse-tags-tooltip
        placeholder="请选择班级 (可多选)"
        style="width: 100%;"
        @change="handleClassChange"
      >
        <el-option
          key="all"
          label="全选"
          value="all"
        />
        <el-option v-for="c in classes" :key="c" :label="c" :value="c" />
      </el-select>
    </el-form-item>
    <el-form-item label="考试时间" prop="examTime">
      <el-date-picker
        v-model="form.examTime"
        type="datetime"
        placeholder="选择考试开始时间"
        style="width: 100%;"
      />
    </el-form-item>
    <el-form-item label="考试时长" prop="duration">
      <el-input-number v-model="form.duration" :min="1" :max="240" />
      <span class="duration-unit">分钟</span>
    </el-form-item>
    <el-form-item label="总分数" prop="score">
      <el-input-number v-model="form.score" :min="1" :max="150" />
    </el-form-item>
    <el-form-item label="考试说明" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        placeholder="请输入考试说明内容"
      />
    </el-form-item>
    <el-form-item label="考试类型" prop="type">
      <el-radio-group v-model="form.type">
        <el-radio label="online">线上考试</el-radio>
        <el-radio label="offline">线下考试</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="form.type === 'online'" label="试卷附件" prop="fileList">
      <div class="attachment-options">
        <div class="upload-option">
          <el-upload
            v-model:file-list="form.fileList"
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :limit="1"
          >
            <el-button type="primary">从电脑选择</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传一份试卷，大小不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>
        <div class="or-divider">或</div>
        <div class="resource-option">
          <el-button type="success" @click="showResourceLibrary = true">
            从题库选择
          </el-button>
          <div v-if="form.selectedResource" class="selected-resource">
            已选择: {{ form.selectedResource.name }}
          </div>
        </div>
      </div>
    </el-form-item>
  </el-form>

  <!-- 题库选择对话框 -->
  <el-dialog
    v-model="showResourceLibrary"
    title="选择试卷"
    width="680px"
  >
    <div class="resource-search">
      <el-input
        v-model="resourceSearchQuery"
        placeholder="搜索试卷名称"
        clearable
        class="resource-search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    
    <el-table
      :data="filteredResources"
      stripe
      style="width: 100%; margin-top: 15px;"
      @row-click="handleResourceSelect"
      highlight-current-row
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="试卷名称" />
      <el-table-column prop="type" label="类型">
        <template #default="{ row }">
          <el-tag :type="getTagType(row.type)">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="questionCount" label="题目数量" />
      <el-table-column prop="updateTime" label="更新时间" />
    </el-table>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showResourceLibrary = false">取消</el-button>
        <el-button type="primary" @click="confirmResourceSelection">
          确认选择
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { Search } from '@element-plus/icons-vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
});

const formRef = ref(null);
const form = ref({
  name: '',
  course: '',
  class: [],
  examTime: '',
  duration: 120, // 默认120分钟
  score: 100,
  description: '',
  type: 'online', // 默认线上考试
  fileList: [],
  selectedResource: null,
});

const classes = ref(['软件2101', '计算机2102', '人工智能2103']);
let oldSelectedClasses = []; // 用于跟踪上一次的选择

// 题库相关
const showResourceLibrary = ref(false);
const resourceSearchQuery = ref('');
const selectedResourceId = ref(null);

// 模拟题库数据
const resourceLibrary = ref([
  { id: 1, name: '软件工程期中试卷A', type: '选择题+简答题', questionCount: 20, updateTime: '2024-07-20' },
  { id: 2, name: '软件工程期中试卷B', type: '选择题+编程题', questionCount: 15, updateTime: '2024-07-18' },
  { id: 3, name: '计算机网络测验', type: '选择题', questionCount: 30, updateTime: '2024-07-15' },
  { id: 4, name: '操作系统期末考试', type: '综合试卷', questionCount: 25, updateTime: '2024-07-10' },
  { id: 5, name: '软件测试练习卷', type: '编程题', questionCount: 5, updateTime: '2024-07-05' },
  { id: 6, name: '数据结构与算法期末', type: '综合试卷', questionCount: 22, updateTime: '2024-06-30' },
]);

// 根据搜索条件过滤题库
const filteredResources = computed(() => {
  if (!resourceSearchQuery.value) {
    return resourceLibrary.value;
  }
  const query = resourceSearchQuery.value.toLowerCase();
  return resourceLibrary.value.filter(resource => 
    resource.name.toLowerCase().includes(query) || 
    resource.type.toLowerCase().includes(query)
  );
});

// 根据资源类型获取标签类型
const getTagType = (type) => {
  const typeMap = {
    '选择题': 'success',
    '编程题': 'danger',
    '选择题+简答题': 'primary',
    '选择题+编程题': 'warning',
    '综合试卷': 'info'
  };
  return typeMap[type] || '';
};

// 选择资源行
const handleResourceSelect = (row) => {
  selectedResourceId.value = row.id;
};

// 确认资源选择
const confirmResourceSelection = () => {
  if (selectedResourceId.value) {
    const selectedResource = resourceLibrary.value.find(r => r.id === selectedResourceId.value);
    if (selectedResource) {
      form.value.selectedResource = selectedResource;
      // 如果已经选择了上传文件，清空它
      form.value.fileList = [];
    }
  }
  showResourceLibrary.value = false;
};

watch(() => props.initialData, (newData) => {
  if (newData) {
    // 填充表单数据
    form.value.name = newData.name || '';
    form.value.course = newData.course || '';
    
    // 处理班级数据
    if (Array.isArray(newData.class)) {
      form.value.class = [...newData.class];
    } else if (typeof newData.class === 'string') {
      form.value.class = [newData.class];
    } else {
      form.value.class = [];
    }
    
    // 设置考试时间
    if (newData.examTime) {
      form.value.examTime = new Date(newData.examTime);
    }

    // 设置考试时长
    form.value.duration = newData.duration || 120;
    
    // 设置分数
    form.value.score = newData.score || 100;
    
    // 设置考试说明
    form.value.description = newData.description || '';

    // 设置考试类型
    form.value.type = newData.type || 'online';
    
    // 更新旧班级选择，以便全选功能正常工作
    oldSelectedClasses = [...form.value.class];
  } else {
    // 重置表单
    form.value = { 
      name: '', 
      course: '', 
      class: [], 
      examTime: '', 
      duration: 120,
      score: 100, 
      description: '',
      type: 'online',
      fileList: [],
      selectedResource: null 
    };
    oldSelectedClasses = [];
  }
}, { immediate: true });

const handleClassChange = (selected) => {
  // 检查是否是点击了"全选"
  const isSelectAll = selected.includes('all');
  const wasSelectAll = oldSelectedClasses.includes('all');

  if (isSelectAll && !wasSelectAll) {
    // 如果本次点击了全选，且上次没有全选，则全选所有班级
    form.value.class = ['all', ...classes.value];
  } else if (!isSelectAll && wasSelectAll) {
    // 如果本次取消了全选，则清空所有选择
    form.value.class = [];
  } else if (isSelectAll && selected.length - 1 < classes.value.length) {
    // 如果在全选状态下取消了某个班级，则取消全选状态
    form.value.class = selected.filter(item => item !== 'all');
  } else if (!isSelectAll && selected.length === classes.value.length) {
    // 如果手动选满了所有班级，则自动勾选上全选
    form.value.class = ['all', ...selected];
  }
  
  // 更新旧选择
  oldSelectedClasses = [...form.value.class];
};

const rules = {
  name: [{ required: true, message: '请输入考试名称', trigger: 'blur' }],
  course: [{ required: true, message: '请选择所属课程', trigger: 'change' }],
  class: [{ required: true, message: '请选择所属班级', trigger: 'change' }],
  examTime: [{ required: true, message: '请选择考试时间', trigger: 'change' }],
  duration: [{ required: true, message: '请输入考试时长', trigger: 'change' }],
  type: [{ required: true, message: '请选择考试类型', trigger: 'change' }],
};

// 暴露 submit 方法，供父组件调用
const submit = () => {
  return new Promise((resolve, reject) => {
    formRef.value.validate((valid) => {
      if (valid) {
        // 添加资源信息到提交数据中
        const submitData = { ...form.value };
        if (submitData.selectedResource) {
          submitData.resourceInfo = {
            id: submitData.selectedResource.id,
            name: submitData.selectedResource.name,
            type: submitData.selectedResource.type
          };
        }
        resolve(submitData);
      } else {
        reject('表单验证失败');
      }
    });
  });
};

defineExpose({
  submit
});
</script>

<style scoped>
.attachment-options {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.upload-option {
  min-width: 200px;
}

.or-divider {
  color: #909399;
  font-size: 14px;
  margin-top: 10px;
}

.resource-option {
  min-width: 200px;
  display: flex;
  flex-direction: column;
  margin-top: 0;
}

.selected-resource {
  margin-top: 8px;
  font-size: 14px;
  color: #409EFF;
}

.resource-search {
  margin-bottom: 15px;
}

.resource-search-input {
  width: 100%;
}

.duration-unit {
  margin-left: 8px;
  color: #606266;
}
</style> 