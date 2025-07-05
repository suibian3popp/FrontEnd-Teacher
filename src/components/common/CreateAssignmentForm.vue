<template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="作业名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入作业名称" />
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
      <el-form-item label="起止日期" prop="dates">
        <el-date-picker
          v-model="form.dates"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="截止日期"
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item label="总分数" prop="score">
        <el-input-number v-model="form.score" :min="1" :max="150" />
      </el-form-item>
      <el-form-item label="作业描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入作业描述内容"
        />
      </el-form-item>
      <el-form-item label="作业附件" prop="fileList">
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
                  只能上传一份文件，大小不超过 10MB
                </div>
              </template>
            </el-upload>
          </div>
          <div class="or-divider">或</div>
          <div class="resource-option">
            <el-button type="success" @click="showResourceLibrary = true">
              从资源库选择
            </el-button>
            <div v-if="form.selectedResource" class="selected-resource">
              已选择: {{ form.selectedResource.name }}
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <!-- 资源库选择对话框 -->
    <el-dialog
      v-model="showResourceLibrary"
      title="选择资源"
      width="680px"
    >
      <div class="resource-search">
        <el-input
          v-model="resourceSearchQuery"
          placeholder="搜索资源名称"
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
        <el-table-column prop="name" label="资源名称" />
        <el-table-column prop="type" label="类型">
          <template #default="{ row }">
            <el-tag :type="getTagType(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" />
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
    dates: [],
    score: 100,
    description: '',
    fileList: [],
    selectedResource: null, // 新增：存储选中的资源
  });
  
  const classes = ref(['软件2101', '计算机2102', '人工智能2103']);
  let oldSelectedClasses = []; // 用于跟踪上一次的选择
  
  // 资源库相关
  const showResourceLibrary = ref(false);
  const resourceSearchQuery = ref('');
  const selectedResourceId = ref(null);
  
  // 模拟资源库数据
  const resourceLibrary = ref([
    { id: 1, name: '第一章习题集.pdf', type: 'PDF', size: '2.5MB', updateTime: '2024-07-20' },
    { id: 2, name: '函数图像绘制工具.exe', type: '可执行文件', size: '5.1MB', updateTime: '2024-07-18' },
    { id: 3, name: '矩阵计算公式.docx', type: 'Word文档', size: '1.2MB', updateTime: '2024-07-15' },
    { id: 4, name: '课程思维导图.xmind', type: '思维导图', size: '0.8MB', updateTime: '2024-07-10' },
    { id: 5, name: '软件工程案例分析.pptx', type: 'PPT演示文稿', size: '3.6MB', updateTime: '2024-07-05' },
    { id: 6, name: '实验操作视频.mp4', type: '视频', size: '15.2MB', updateTime: '2024-06-30' },
    { id: 7, name: '编程练习题.zip', type: '压缩包', size: '4.7MB', updateTime: '2024-06-25' },
  ]);
  
  // 根据搜索条件过滤资源
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
      'PDF': 'danger',
      'Word文档': 'primary',
      'PPT演示文稿': 'warning',
      '压缩包': 'info',
      '视频': 'success'
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
        form.value.class = [...newData.class]; // 直接使用数组
      } else if (typeof newData.class === 'string') {
        form.value.class = newData.class.split(', '); // 将字符串转回数组
      } else {
        form.value.class = [];
      }
      
      // 处理日期数据
      if (newData.startDate && newData.deadline) {
        form.value.dates = [
          new Date(newData.startDate),
          new Date(newData.deadline)
        ];
      } else {
        form.value.dates = [];
      }
      
      // 设置分数
      form.value.score = newData.score || 100;
      
      // 设置描述
      form.value.description = newData.description || '';
      
      // 更新旧班级选择，以便全选功能正常工作
      oldSelectedClasses = [...form.value.class];
    } else {
      // 重置表单
      form.value = { 
        name: '', 
        course: '', 
        class: [], 
        dates: [], 
        score: 100, 
        description: '',
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
    name: [{ required: true, message: '请输入作业名称', trigger: 'blur' }],
    course: [{ required: true, message: '请选择所属课程', trigger: 'change' }],
    class: [{ required: true, message: '请选择所属班级', trigger: 'change' }],
    dates: [{ required: true, message: '请选择起止日期', trigger: 'change' }],
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
  </style>
  