<template>
  <el-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    :title="course.name || '课程详情'"
    width="85%"
    top="5vh"
    class="course-detail-dialog"
  >
    <el-container style="height: 75vh;">
      <!-- Left Chapter Navigation -->
      <el-aside width="280px" class="chapter-aside">
        <div class="chapter-header">
          <el-button type="primary" @click="showNewChapterModal = true" style="width: 100%;">
            <el-icon><Plus /></el-icon>添加章节
          </el-button>
        </div>
        <el-menu :default-active="currentChapter?.id.toString()" @select="handleChapterSelect" class="chapter-menu">
          <el-menu-item v-for="chapter in course.chapters" :key="chapter.id" :index="chapter.id.toString()">
            <el-icon><Document /></el-icon>
            <template #title>
              <div class="chapter-menu-item">
                <span>{{ chapter.title }}</span>
                <el-tag size="small" type="info">{{ chapter.resources?.length || 0 }}个资源</el-tag>
              </div>
            </template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <!-- Right Content Area -->
      <el-main class="content-main">
        <div v-if="currentChapter">
          <el-header class="content-header">
            <div>
              <h3 class="content-title">{{ currentChapter.title }}</h3>
              <p class="content-description">{{ currentChapter.description }}</p>
            </div>
            <el-button type="primary" @click="showUploadModal = true">
              <el-icon><Upload /></el-icon>上传资源
            </el-button>
          </el-header>
          <div class="resource-grid">
            <el-card v-for="resource in currentChapter.resources" :key="resource.id" shadow="hover" class="resource-card">
              <div class="resource-content">
                <div :class="['resource-icon', getResourceTypeClass(resource.type)]">
                  <el-icon size="24"><component :is="getResourceIcon(resource.type)" /></el-icon>
                </div>
                <div class="resource-info">
                  <h4 class="resource-name">{{ resource.name }}</h4>
                  <div class="resource-meta">
                    <span><el-icon><Calendar /></el-icon>{{ resource.uploadTime }}</span>
                    <span><el-icon><Files /></el-icon>{{ resource.size }}</span>
                  </div>
                  <div class="resource-actions">
                    <el-button type="primary" link size="small">预览</el-button>
                    <el-button type="primary" link size="small">下载</el-button>
                    <el-button type="danger" link size="small" @click="deleteResource(resource)">删除</el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
        <el-empty v-else description="请从左侧选择一个章节以查看资源"></el-empty>
      </el-main>
    </el-container>
  </el-dialog>

  <!-- 新增章节模态框 -->
  <el-dialog
    v-model="showNewChapterModal"
    title="添加章节"
    width="500px"
    append-to-body
  >
    <el-form :model="newChapter" label-position="top">
      <el-form-item label="章节标题" required>
        <el-input v-model="newChapter.title" placeholder="请输入章节标题" />
      </el-form-item>
      <el-form-item label="章节描述">
        <el-input 
          v-model="newChapter.description" 
          type="textarea" 
          rows="3"
          placeholder="请输入章节描述" 
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showNewChapterModal = false">取消</el-button>
        <el-button type="primary" @click="addNewChapter">确认添加</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 上传资源模态框 -->
  <el-dialog
    v-model="showUploadModal"
    title="上传资源"
    width="500px"
    append-to-body
  >
    <div v-if="currentChapter">
      <h3 class="text-lg font-medium mb-4">上传到：{{ currentChapter.title }}</h3>
      
      <!-- 上传组件 -->
      <el-upload
        class="upload-container"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持常见文档、图片和视频格式，单个文件不超过500MB
          </div>
        </template>
      </el-upload>

      <!-- 资源信息 -->
      <el-form :model="newResource" label-position="top" class="mt-4">
        <el-form-item label="资源名称" required>
          <el-input v-model="newResource.name" placeholder="请输入资源名称" />
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="newResource.type" placeholder="请选择资源类型" class="w-full">
            <el-option label="PDF文档" value="pdf" />
            <el-option label="Word文档" value="doc" />
            <el-option label="视频" value="video" />
            <el-option label="图片" value="image" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showUploadModal = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="uploadResource" 
          :loading="uploading"
          :disabled="!selectedFile"
        >
          上传资源
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Document, Upload, Calendar, Files } from '@element-plus/icons-vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  course: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:show', 'update:course']);

// 当前选中的章节
const currentChapter = ref(null);
// 新增章节对话框显示状态
const showNewChapterModal = ref(false);
// 上传资源对话框显示状态
const showUploadModal = ref(false);
// 上传状态
const uploading = ref(false);
// 选中的文件
const selectedFile = ref(null);

// 新章节表单数据
const newChapter = ref({
  title: '',
  description: '',
});

// 新资源表单数据
const newResource = ref({
  name: '',
  type: 'pdf',
});

// 监听课程变化，重置当前选中的章节
watch(() => props.course, (newVal) => {
  if (newVal && newVal.chapters && newVal.chapters.length > 0) {
    currentChapter.value = newVal.chapters[0];
  } else {
    currentChapter.value = null;
  }
}, { deep: true, immediate: true });

// 根据资源类型获取样式类
const getResourceTypeClass = (type) => {
  const classes = {
    'pdf': 'pdf-icon-bg',
    'doc': 'doc-icon-bg',
    'video': 'video-icon-bg',
    'image': 'image-icon-bg'
  };
  return classes[type] || 'other-icon-bg';
};

// 根据资源类型获取图标
const getResourceIcon = (type) => {
  const icons = {
    'pdf': IconDoc,
    'doc': IconDoc,
    'video': IconVideo,
    'image': IconImage
  };
  return icons[type];
};

// 选择章节
const selectChapter = (chapter) => {
  currentChapter.value = chapter;
};

// 关闭课程详情弹窗
const closeModal = () => {
  emit('update:show', false);
};

// 处理文件变更
const handleFileChange = (file) => {
  selectedFile.value = file;
  
  // 如果没有设置资源名称，则使用文件名
  if (!newResource.value.name && file.name) {
    newResource.value.name = file.name;
    
    // 根据文件扩展名推断类型
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'pdf') {
      newResource.value.type = 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      newResource.value.type = 'doc';
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      newResource.value.type = 'video';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      newResource.value.type = 'image';
    } else {
      newResource.value.type = 'other';
    }
  }
};

// 添加新章节
const addNewChapter = () => {
  // 表单验证
  if (!newChapter.value.title) {
    ElMessage.warning('请输入章节标题');
    return;
  }
  
  // 创建新章节对象
  const chapter = {
    id: Date.now(), // 使用时间戳作为临时ID
    title: newChapter.value.title,
    description: newChapter.value.description,
    resources: []
  };
  
  // 添加新章节到课程中
  const updatedCourse = { 
    ...props.course,
    chapters: [...(props.course.chapters || []), chapter]
  };
  
  // 更新课程数据
  emit('update:course', updatedCourse);
  
  // 选择新创建的章节
  currentChapter.value = chapter;
  
  // 关闭对话框并重置表单
  showNewChapterModal.value = false;
  newChapter.value = {
    title: '',
    description: ''
  };
  
  ElMessage.success('章节添加成功');
};

// 上传资源
const uploadResource = () => {
  // 表单验证
  if (!newResource.value.name) {
    ElMessage.warning('请输入资源名称');
    return;
  }
  
  if (!selectedFile.value) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }
  
  // 开始上传
  uploading.value = true;
  
  // 模拟上传过程
  setTimeout(() => {
    // 创建新资源对象
    const resource = {
      id: Date.now(), // 使用时间戳作为临时ID
      name: newResource.value.name,
      type: newResource.value.type,
      size: formatFileSize(selectedFile.value.size || 0),
      uploadTime: new Date().toISOString().split('T')[0],
      file: selectedFile.value
    };
    
    // 添加资源到当前章节
    if (currentChapter.value) {
      // 创建章节的副本
      const updatedChapter = {
        ...currentChapter.value,
        resources: [...(currentChapter.value.resources || []), resource]
      };
      
      // 更新课程中的章节
      const updatedChapters = props.course.chapters.map(chapter => 
        chapter.id === currentChapter.value.id ? updatedChapter : chapter
      );
      
      // 更新课程数据
      const updatedCourse = { 
        ...props.course,
        chapters: updatedChapters
      };
      
      emit('update:course', updatedCourse);
      
      // 更新当前章节引用
      currentChapter.value = updatedChapter;
    }
    
    // 关闭对话框并重置表单
    showUploadModal.value = false;
    newResource.value = {
      name: '',
      type: 'pdf'
    };
    selectedFile.value = null;
    
    ElMessage.success('资源上传成功');
    uploading.value = false;
  }, 1500);
};

// 删除资源
const deleteResource = (resource) => {
  ElMessageBox.confirm('确定要删除该资源吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (currentChapter.value) {
      // 创建章节的副本，移除指定资源
      const updatedChapter = {
        ...currentChapter.value,
        resources: currentChapter.value.resources.filter(r => r.id !== resource.id)
      };
      
      // 更新课程中的章节
      const updatedChapters = props.course.chapters.map(chapter => 
        chapter.id === currentChapter.value.id ? updatedChapter : chapter
      );
      
      // 更新课程数据
      const updatedCourse = { 
        ...props.course,
        chapters: updatedChapters
      };
      
      emit('update:course', updatedCourse);
      
      // 更新当前章节引用
      currentChapter.value = updatedChapter;
      
      ElMessage.success('资源删除成功');
    }
  }).catch(() => {
    // 用户取消删除操作
  });
};

// 格式化文件大小
const formatFileSize = (size) => {
  if (size < 1024) {
    return size + 'B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + 'KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(1) + 'MB';
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
  }
};

const handleChapterSelect = (index) => {
  currentChapter.value = props.course.chapters.find(c => c.id.toString() === index);
};
</script>

<style scoped>
.course-detail-dialog .el-dialog__body {
  padding: 0;
}
.chapter-aside {
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
}
.chapter-header {
  padding: 1rem;
  border-bottom: 1px solid var(--el-border-color-light);
}
.chapter-menu {
  border-right: none;
  flex-grow: 1;
  overflow-y: auto;
}
.chapter-menu-item {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}
.content-main {
  padding: 0;
}
.content-header {
  height: auto;
  padding: 1.5rem;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.content-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}
.content-description {
  color: var(--el-text-color-secondary);
  margin-top: 0.5rem;
}
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  height: calc(75vh - 120px); /* Adjust height based on header */
  overflow-y: auto;
}
.resource-card .resource-content {
  display: flex;
  align-items: flex-start;
}
.resource-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
}
.pdf-icon-bg { background-color: #f56c6c; }
.doc-icon-bg { background-color: #409eff; }
.video-icon-bg { background-color: #9370db; }
.image-icon-bg { background-color: #67c23a; }
.other-icon-bg { background-color: #909399; }

.resource-info {
  flex-grow: 1;
}
.resource-name {
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}
.resource-meta {
  display: flex;
  gap: 1rem;
  color: var(--el-text-color-secondary);
  font-size: 0.8rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
.resource-meta span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.resource-actions {
  text-align: right;
}
</style> 