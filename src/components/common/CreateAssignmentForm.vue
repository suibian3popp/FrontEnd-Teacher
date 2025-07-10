<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
    <el-form-item label="作业标题" prop="title">
      <el-input v-model="form.title" placeholder="请输入作业标题" />
    </el-form-item>
    
    <el-form-item label="关联班级" prop="classIds">
      <el-select
        v-model="form.classIds"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        placeholder="请选择班级 (可多选)"
        style="width: 100%;"
        :loading="loading.classes"
        @change="handleClassChange"
      >
        <el-option
          v-if="classes.length > 0"
          key="all"
          label="全选"
          value="all"
        />
        <el-option 
          v-for="c in classes" 
          :key="c.classId" 
          :label="c.className" 
          :value="c.classId" 
        />
      </el-select>
    </el-form-item>

    <el-form-item label="截止日期" prop="deadline">
      <el-date-picker
        v-model="form.deadline"
        type="datetime"
        placeholder="请选择作业截止日期"
        style="width: 100%;"
      />
    </el-form-item>

    <el-form-item label="作业总分" prop="totalScore">
      <el-input-number v-model="form.totalScore" :min="0" :max="1000" />
    </el-form-item>

    <el-form-item label="作业描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        placeholder="请输入作业的详细要求和说明"
      />
    </el-form-item>

    <el-form-item label="作业附件" prop="resourceId">
      <el-button 
        type="primary" 
        @click="openResourceLibrary"
      >
        <el-icon><Files /></el-icon>
        从资源库选择
      </el-button>
      <div v-if="selectedResource" class="selected-resource">
        <el-tag closable @close="handleRemoveResource" style="margin-top: 10px;">
          {{ selectedResource.name }}
        </el-tag>
      </div>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm" :loading="loading.submitting">提交</el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>

  <!-- 资源库选择对话框 -->
  <el-dialog
    v-model="showResourceLibrary"
    title="从资源库选择附件"
    width="70%"
    top="5vh"
  >
    <div class="resource-toolbar">
      <el-input
        v-model="resourceFilter.keyword"
        placeholder="搜索资源名称"
        clearable
        class="search-input"
        @keyup.enter="handleResourceSearch"
      >
        <template #append>
          <el-button @click="handleResourceSearch"><el-icon><Search /></el-icon></el-button>
        </template>
      </el-input>
    </div>
    
    <el-table
      v-loading="loading.resources"
      :data="resourceLibrary"
      stripe
      style="width: 100%; margin-top: 15px;"
      height="400px"
      highlight-current-row
      @current-change="handleResourceSelectionChange"
      :row-key="(row) => row.resourceId"
    >
      <el-table-column type="index" width="50" label="序号" />
      <el-table-column prop="name" label="资源名称" />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column prop="difficulty" label="难度" width="120" />
      <el-table-column prop="uploadTime" label="上传时间" width="180" />
    </el-table>
    
    <el-pagination
      v-if="resourcePagination.total > 0"
      style="margin-top: 20px; justify-content: flex-end;"
      layout="total, sizes, prev, pager, next, jumper"
      :total="resourcePagination.total"
      :current-page="resourcePagination.page"
      :page-size="resourcePagination.pageSize"
      :page-sizes="[10, 20, 50]"
      @current-change="handleResourcePageChange"
      @size-change="handleResourceSizeChange"
    />
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showResourceLibrary = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmResourceSelection"
          :disabled="!tempSelectedResource"
        >
          确认选择
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Search, Files } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { doGet, doPost } from '../../http/httpRequest.js';
import { getUser } from '../../utils/auth.js';
import dayjs from "dayjs";

const emit = defineEmits(['form-submit', 'form-cancel']);

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
});

const formRef = ref(null);

const form = ref({
  title: '',
  description: '',
  deadline: '',
  totalScore: 100,
  classIds: [],
  resourceId: null,
});

const rules = ref({
  title: [{ required: true, message: '请输入作业标题', trigger: 'blur' }],
  classIds: [{ required: true, message: '请至少选择一个班级', trigger: 'change', type: 'array' }],
  deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
  totalScore: [{ required: true, message: '请输入作业总分', trigger: 'blur' }],
  resourceId: [{ required: true, message: '请从资源库选择一个附件', trigger: 'change' }],
});

const classes = ref([]);
let oldSelectedClasses = [];

const loading = ref({
  classes: false,
  resources: false,
  submitting: false,
});

// --- 资源库相关 ---
const showResourceLibrary = ref(false);
const resourceLibrary = ref([]);
const selectedResource = ref(null);
const tempSelectedResource = ref(null);

const resourceFilter = reactive({
  keyword: '',
  type: '',
  difficulty: '',
  permission: '',
  sortBy: 'uploadTime',
  sortDir: 'desc',
});

const resourcePagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const openResourceLibrary = () => {
  showResourceLibrary.value = true;
  fetchResources();
};

const fetchResources = async () => {
  loading.value.resources = true;
  const userInfo = getUser();
  if (!userInfo || !userInfo.userId) {
    ElMessage.error("无法获取教师信息，请重新登录");
    loading.value.resources = false;
    return;
  }
  
  const params = {
    page: resourcePagination.page,
    pageSize: resourcePagination.pageSize,
    ...resourceFilter
  };

  try {
    const response = await doGet(`/api/service/resource/list/${userInfo.userId}`, params);
    if (response.data.code === 200) {
      resourceLibrary.value = response.data.data.records.map(r => ({
          ...r,
          uploadTime: dayjs(r.uploadTime).format('YYYY-MM-DD HH:mm:ss')
      }));
      resourcePagination.total = response.data.data.total;
    } else {
      ElMessage.error("获取资源列表失败");
    }
  } catch (error) {
    console.error("获取资源列表失败:", error);
    ElMessage.error("获取资源列表失败");
  } finally {
    loading.value.resources = false;
  }
};

const handleResourceSearch = () => {
  resourcePagination.page = 1;
  fetchResources();
};

const handleResourcePageChange = (newPage) => {
  resourcePagination.page = newPage;
  fetchResources();
};

const handleResourceSizeChange = (newSize) => {
  resourcePagination.pageSize = newSize;
  resourcePagination.page = 1;
  fetchResources();
};

const handleResourceSelectionChange = (currentRow) => {
  tempSelectedResource.value = currentRow;
};

const confirmResourceSelection = () => {
  if (tempSelectedResource.value) {
    selectedResource.value = tempSelectedResource.value;
    form.value.resourceId = selectedResource.value.resourceId;
    showResourceLibrary.value = false;
  } else {
    ElMessage.warning("请先选择一个资源");
  }
};

const handleRemoveResource = () => {
  selectedResource.value = null;
  form.value.resourceId = null;
};
// --- 资源库相关结束 ---


const fetchClasses = async () => {
  loading.value.classes = true;
  try {
    const userInfo = getUser();
    if (!userInfo || !userInfo.userId) {
      ElMessage.error('无法获取教师信息，请重新登录后再试');
      throw new Error('获取教师ID失败');
    }
    const teacherId = userInfo.userId;
    const coursesResponse = await doGet(`/api/service/courses/teacher/${teacherId}`);
    
    if (coursesResponse.data.code !== 200 || !coursesResponse.data.data) {
      classes.value = [];
      return;
    }

    const courses = coursesResponse.data.data;
    if (courses.length === 0) {
      classes.value = [];
      return;
    }

    const classRequests = courses
      .filter(course => course && typeof course.course_id === 'number')
      .map(course => doGet(`/api/service/classes/course/${course.course_id}`));
    
    if (classRequests.length === 0) {
      classes.value = [];
      return;
    }

    const classResponses = await Promise.all(classRequests);
    
    const allClassMap = new Map();
    classResponses.forEach(response => {
      const classArray = response.data; 
      if (Array.isArray(classArray)) {
        classArray.forEach(cls => {
          if (!allClassMap.has(cls.classId)) {
            allClassMap.set(cls.classId, cls);
          }
        });
      }
    });
    classes.value = Array.from(allClassMap.values());
  } catch (error) {
    console.error('获取班级列表失败:', error);
    ElMessage.error(`获取班级列表失败: ${error.message}`);
    classes.value = [];
  } finally {
    loading.value.classes = false;
  }
};


const handleClassChange = (selected) => {
  const allClassIds = classes.value.map(c => c.classId);
  if (selected.includes('all')) {
    form.value.classIds = allClassIds;
    oldSelectedClasses = allClassIds;
  } else if (oldSelectedClasses.includes('all') && selected.length < allClassIds.length) {
    form.value.classIds = [];
    oldSelectedClasses = [];
  } else {
    oldSelectedClasses = selected;
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value.submitting = true;
      
      const payload = {
        title: form.value.title,
        description: form.value.description,
        deadline: form.value.deadline,
        totalScore: form.value.totalScore,
        classIds: form.value.classIds,
        resourceId: form.value.resourceId,
      };

      try {
        const response = await doPost('/api/service/assignment', payload);
        if (response.data) {
            ElMessage.success('作业创建成功！');
            emit('form-submit', response.data);
        } else {
            ElMessage.error('创建作业失败，未收到确认ID');
        }
      } catch (error) {
        console.error('创建作业失败:', error);
        ElMessage.error(`创建作业失败: ${error.message || '未知错误'}`);
      } finally {
        loading.value.submitting = false;
      }
    } else {
      ElMessage.error('请检查表单项是否填写完整');
    }
  });
};

const handleCancel = () => {
  emit('form-cancel');
};

onMounted(() => {
  fetchClasses();
  if (props.initialData) {
    Object.assign(form.value, props.initialData);
  }
});

defineExpose({
  submitForm
});
</script>

<style scoped>
.selected-resource {
  margin-left: 10px;
}
.resource-toolbar {
  margin-bottom: 15px;
}
.search-input {
  width: 300px;
}
</style>
  