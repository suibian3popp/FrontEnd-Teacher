<template>
  <el-container style="height: 75vh;">
    <!-- 左侧章节导航 -->
    <el-aside width="260px" class="chapter-aside">
      <div class="chapter-header">
        <el-button type="primary" @click="handleAddChapter()" style="width: 100%;">
          <el-icon><Plus /></el-icon>添加章节
        </el-button>
      </div>
      
      <!-- 使用菜单代替树形组件 -->
      <el-menu 
        :default-active="currentChapter?.chapter_id?.toString()" 
        class="chapter-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item 
          v-for="chapter in sortedChapters" 
          :key="chapter.chapter_id"
          :index="chapter.chapter_id.toString()"
        >
          <div class="chapter-menu-item">
            <span>{{ getChapterTitle(chapter) }}</span>
            <div class="actions">
              <el-button link type="primary" size="small" @click.stop="handleEditChapter(chapter, $event)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button link type="danger" size="small" @click.stop="handleDeleteChapter(chapter, $event)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 右侧内容区域 -->
    <el-main class="content-main">
      <div v-if="currentChapter">
        <el-header class="content-header">
          <div>
            <h3 class="content-title">{{ getChapterTitle(currentChapter) }}</h3>
            <p v-if="currentChapter.description" class="content-description">{{ currentChapter.description }}</p>
          </div>
          <el-button type="primary" @click="showUploadModal = true">
            <el-icon><Upload /></el-icon>上传资源
          </el-button>
        </el-header>
        
        <!-- 资源列表 -->
        <div class="resource-list">
          <div class="resource-row" v-for="resource in currentChapter.resources" :key="resource.id">
            <!-- PDF资源 -->
            <template v-if="resource.type === 'pdf'">
              <div class="resource-icon pdf-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="resource-info">
                <div class="resource-name">{{ resource.name }}</div>
                <div class="resource-meta">
                  <span>{{ resource.uploadTime }}</span>
                  <span>{{ resource.size }}</span>
                </div>
              </div>
              <div class="resource-actions">
                <el-button type="primary" link size="small">
                  <el-icon><View /></el-icon>预览
                </el-button>
                <el-button type="primary" link size="small">
                  <el-icon><Download /></el-icon>下载
                </el-button>
                <el-button type="danger" link size="small" @click="deleteResource(resource)">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </template>
            
            <!-- 视频资源 -->
            <template v-else-if="resource.type === 'video'">
              <div class="resource-icon video-icon">
                <el-icon><VideoCamera /></el-icon>
              </div>
              <div class="resource-info">
                <div class="resource-name">{{ resource.name }}</div>
                <div class="resource-meta">
                  <span>{{ resource.uploadTime }}</span>
                  <span>{{ resource.size }}</span>
                </div>
              </div>
              <div class="resource-actions">
                <el-button type="primary" link size="small">
                  <el-icon><VideoPlay /></el-icon>播放
                </el-button>
                <el-button type="primary" link size="small">
                  <el-icon><Download /></el-icon>下载
                </el-button>
                <el-button type="danger" link size="small" @click="deleteResource(resource)">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </template>
            
            <!-- 其他资源类型 -->
            <template v-else>
              <div class="resource-icon" :class="getResourceTypeClass(resource.type)">
                <el-icon><component :is="getResourceIcon(resource.type)" /></el-icon>
              </div>
              <div class="resource-info">
                <div class="resource-name">{{ resource.name }}</div>
                <div class="resource-meta">
                  <span>{{ resource.uploadTime }}</span>
                  <span>{{ resource.size }}</span>
                </div>
              </div>
              <div class="resource-actions">
                <el-button type="primary" link size="small">
                  <el-icon><Download /></el-icon>下载
                </el-button>
                <el-button type="danger" link size="small" @click="deleteResource(resource)">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </template>
          </div>
          
          <el-empty v-if="!currentChapter.resources || currentChapter.resources.length === 0" description="该章节下暂无资源" />
        </div>
      </div>
      <el-empty v-else description="请从左侧选择一个章节以查看资源"></el-empty>
    </el-main>
  </el-container>

  <!-- 新增/编辑章节模态框 -->
  <el-dialog
    v-model="showChapterModal"
    :title="isEditMode ? '编辑章节' : '添加章节'"
    width="500px"
    append-to-body
  >
    <el-form :model="chapterModel" label-position="top">
      <el-form-item label="章节标题" required>
        <el-input v-model="chapterModel.chapter_name" placeholder='请输入章节标题，如"课程介绍"' />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showChapterModal = false">取消</el-button>
        <el-button type="primary" @click="saveChapter" :loading="isSaving">确认</el-button>
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
      <h3 class="text-lg font-medium mb-4">上传到：{{ getChapterTitle(currentChapter) }}</h3>
      
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
import { ref, defineProps, defineEmits, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, Document, Upload, Calendar, Files, Edit, Delete, 
  VideoCamera, Picture, View, Download, VideoPlay 
} from '@element-plus/icons-vue';

const props = defineProps({
  course: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:course']);

// 当前选中的章节
const currentChapter = ref(null);
// 章节对话框显示状态
const showChapterModal = ref(false);
// 是否为编辑模式
const isEditMode = ref(false);
// 保存章节的加载状态
const isSaving = ref(false);
// 上传资源对话框显示状态
const showUploadModal = ref(false);
// 上传状态
const uploading = ref(false);
// 选中的文件
const selectedFile = ref(null);

// 章节表单数据
const chapterModel = ref({
  chapter_id: null,
  chapter_name: '',
  course_id: null
});

// 新资源表单数据
const newResource = ref({
  name: '',
  type: 'pdf',
});

// 监听课程变化，重置当前选中的章节
watch(() => props.course, (newCourse) => {
  if (newCourse && newCourse.chapters && newCourse.chapters.length > 0) {
    if (!currentChapter.value || !newCourse.chapters.some(c => c.chapter_id === currentChapter.value.chapter_id)) {
      currentChapter.value = newCourse.chapters[0];
    } else {
      // 如果当前选中的章节仍然存在，则更新它的引用
      currentChapter.value = newCourse.chapters.find(c => c.chapter_id === currentChapter.value.chapter_id);
    }
  } else {
    currentChapter.value = null;
  }
}, { deep: true, immediate: true });

// 生成章节标题
const getChapterTitle = (chapter) => {
  if (!chapter) return '';
  
  // 如果章节名称已包含"第X章"格式，则直接返回
  if (chapter.chapter_name.match(/^第[\d一二三四五六七八九十]+章/)) {
    return chapter.chapter_name;
  }
  
  // 找出章节在数组中的位置
  const index = props.course.chapters.findIndex(c => c.chapter_id === chapter.chapter_id);
  if (index === -1) return chapter.chapter_name;
  
  // 生成"第X章"格式的标题
  return `第${index + 1}章：${chapter.chapter_name}`;
};

// 获取排序后的章节
const sortedChapters = computed(() => {
  if (!props.course.chapters || props.course.chapters.length === 0) {
    return [];
  }
  
  // 按照章节ID进行排序，确保稳定的顺序
  return [...props.course.chapters].sort((a, b) => {
    // 假设 chapter_id 是递增的，可以代表创建顺序
    return a.chapter_id - b.chapter_id;
  });
});

// 获取下一个可用的章节序号
const getNextChapterNumber = () => {
  return props.course.chapters.length + 1;
};

// 根据资源类型获取样式类
const getResourceTypeClass = (type) => {
  const classes = {
    'pdf': 'pdf-icon',
    'doc': 'doc-icon',
    'video': 'video-icon',
    'image': 'image-icon',
    'other': 'other-icon'
  };
  return classes[type] || 'other-icon';
};

// 根据资源类型获取图标
const getResourceIcon = (type) => {
  const icons = {
    'pdf': Document,
    'doc': Document,
    'video': VideoCamera,
    'image': Picture,
    'other': Files
  };
  return icons[type] || Files;
};

const handleMenuSelect = (index) => {
  const chapter = props.course.chapters.find(c => c.chapter_id.toString() === index);
  if (chapter) {
    currentChapter.value = chapter;
  }
};

const handleAddChapter = () => {
  isEditMode.value = false;
  chapterModel.value = {
    chapter_id: null,
    chapter_name: '', // 让用户输入纯标题
    course_id: props.course.id,
    resources: []
  };
  showChapterModal.value = true;
};

const handleEditChapter = (chapter, event) => {
  if (!chapter || !chapter.chapter_id) {
    ElMessage.warning('章节数据不完整，无法编辑');
    return;
  }
  
  isEditMode.value = true;
  chapterModel.value = { ...chapter };
  showChapterModal.value = true;
  
  // 阻止事件冒泡，防止触发菜单项选择
  if (event) event.stopPropagation();
};

const handleDeleteChapter = (chapter, event) => {
  // 验证是否可以删除
  if (!chapter || !chapter.chapter_id) {
    ElMessage.warning('章节数据不完整，无法删除');
    return;
  }

  // 阻止事件冒泡，防止触发菜单项选择
  if (event) event.stopPropagation();

  // 确认删除
  ElMessageBox.confirm(
    `确定要删除章节 "${getChapterTitle(chapter)}" 吗？`,
    '警告', 
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    console.log(`删除章节 ${chapter.chapter_id}`);
    
    // 从课程章节列表中过滤掉要删除的章节
    const updatedChapters = props.course.chapters.filter(c => c.chapter_id !== chapter.chapter_id);
    
    // 发送更新事件
    emit('update:course', { ...props.course, chapters: updatedChapters });
    
    // 如果删除的是当前选中的章节，则自动选择第一个章节
    if (currentChapter.value && currentChapter.value.chapter_id === chapter.chapter_id) {
      currentChapter.value = updatedChapters.length > 0 ? updatedChapters[0] : null;
    }
    
    ElMessage.success('章节已成功删除');
  }).catch(() => {
    ElMessage.info('已取消删除操作');
  });
};

// 保存（新增或编辑）章节
const saveChapter = async () => {
  // 表单验证
  if (!chapterModel.value.chapter_name?.trim()) {
    ElMessage.warning('请输入章节名称');
    return;
  }

  if (chapterModel.value.chapter_name.length > 50) {
    ElMessage.warning('章节名称不能超过50个字符');
    return;
  }

  try {
    // 开始保存，显示加载状态
    isSaving.value = true;

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (isEditMode.value) {
      // 编辑章节
      if (!chapterModel.value.chapter_id) {
        throw new Error('章节ID不存在，无法更新');
      }
      
      console.log('更新章节', chapterModel.value);
      
      // 确保章节名称已经被去除了首尾空格
      const updatedChapterName = chapterModel.value.chapter_name.trim();
      
      // 创建更新后的章节数组
      const updatedChapters = props.course.chapters.map(c => 
        c.chapter_id === chapterModel.value.chapter_id 
          ? { ...c, chapter_name: updatedChapterName } 
          : c
      );
      
      // 发送更新事件
      emit('update:course', { ...props.course, chapters: updatedChapters });
      
      // 更新当前选中的章节
      if (currentChapter.value && currentChapter.value.chapter_id === chapterModel.value.chapter_id) {
        currentChapter.value = { ...currentChapter.value, chapter_name: updatedChapterName };
      }
      
      ElMessage.success('章节更新成功');
    } else {
      // 新增章节
      const nextNumber = getNextChapterNumber();
      const finalChapterName = `第${nextNumber}章：${chapterModel.value.chapter_name.trim()}`;

      // 创建新章节数据对象
      const newChapterData = {
        chapter_id: Date.now(), // 生成唯一ID
        chapter_name: finalChapterName,
        course_id: props.course.id,
        resources: [] // 初始为空资源列表
      };
      
      console.log('新增章节', newChapterData);
      
      // 添加到章节数组
      const updatedChapters = [...props.course.chapters, newChapterData];
      
      // 发送更新事件
      emit('update:course', { ...props.course, chapters: updatedChapters });
      
      // 自动选中新创建的章节
      currentChapter.value = newChapterData;
      
      ElMessage.success('章节添加成功');
    }
    
    // 关闭对话框
    showChapterModal.value = false;
  } catch (error) {
    console.error('保存章节时出错:', error);
    ElMessage.error(`操作失败: ${error.message || '未知错误'}`);
  } finally {
    // 无论成功还是失败，都重置加载状态
    isSaving.value = false;
  }
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
        chapter.chapter_id === currentChapter.value.chapter_id ? updatedChapter : chapter
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
        chapter.chapter_id === currentChapter.value.chapter_id ? updatedChapter : chapter
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
</script>

<style scoped>
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
  flex-grow: 1;
  overflow-y: auto;
  border-right: none;
}

.chapter-menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.chapter-menu-item .actions {
  display: none;
}

.el-menu-item:hover .actions {
  display: flex;
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

.resource-list {
  padding: 1.5rem;
  height: calc(75vh - 120px);
  overflow-y: auto;
}

.resource-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.resource-row:hover {
  background-color: var(--el-fill-color-light);
}

.resource-icon {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
  font-size: 20px;
}

.pdf-icon { background-color: #f56c6c; }
.doc-icon { background-color: #409eff; }
.video-icon { background-color: #9370db; }
.image-icon { background-color: #67c23a; }
.other-icon { background-color: #909399; }

.resource-info {
  flex-grow: 1;
}

.resource-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.resource-meta {
  display: flex;
  gap: 16px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.resource-actions {
  display: flex;
  gap: 8px;
}
</style> 