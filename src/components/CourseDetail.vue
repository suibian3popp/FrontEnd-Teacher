<template>
  <div>
    <el-container style="height: 75vh;">
      <!-- 左侧章节导航 -->
      <el-aside width="260px" class="chapter-aside">
        <div class="chapter-header">
          <el-button type="primary" @click="handleAddChapter()" style="width: 100%;">
            <el-icon><Plus /></el-icon>添加主章节
          </el-button>
        </div>
        
        <!-- 使用支持层级的菜单 -->
        <el-menu 
          :default-active="currentChapter?.chapter_id?.toString()" 
          class="chapter-menu"
          @select="handleMenuSelect"
        >
          <template v-for="chapter in chapterTree" :key="chapter.chapter_id">
            <!-- 有子章节的顶级章节，渲染为子菜单 -->
            <el-sub-menu v-if="chapter.children && chapter.children.length > 0" :index="chapter.chapter_id.toString()">
              <template #title>
                <div class="chapter-menu-item">
                  <span>{{ chapter.title }}</span>
                  <div class="actions">
                    <el-button link type="success" size="small" @click.stop="handleAddChapter(chapter)">
                      <el-icon><FolderAdd /></el-icon>
                    </el-button>
                    <el-button link type="primary" size="small" @click.stop="handleEditChapter(chapter, $event)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button link type="danger" size="small" @click.stop="handleDeleteChapter(chapter, $event)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </template>
              <!-- 子章节列表 -->
              <el-menu-item 
                v-for="child in chapter.children" 
                :key="child.chapter_id"
                :index="child.chapter_id.toString()"
              >
                <div class="chapter-menu-item">
                  <span>{{ child.title }}</span>
                  <div class="actions">
                    <el-button link type="primary" size="small" @click.stop="handleEditChapter(child, $event)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button link type="danger" size="small" @click.stop="handleDeleteChapter(child, $event)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 没有子章节的顶级章节 -->
            <el-menu-item v-else :index="chapter.chapter_id.toString()">
              <div class="chapter-menu-item">
                <span>{{ chapter.title }}</span>
                <div class="actions">
                  <el-button link type="success" size="small" @click.stop="handleAddChapter(chapter)">
                    <el-icon><FolderAdd /></el-icon>
                  </el-button>
                  <el-button link type="primary" size="small" @click.stop="handleEditChapter(chapter, $event)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button link type="danger" size="small" @click.stop="handleDeleteChapter(chapter, $event)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>
      
      <!-- 右侧内容区域 -->
      <el-main class="content-main">
        <div v-if="currentChapter">
          <el-header class="content-header">
            <div>
              <h3 class="content-title">{{ currentChapter.title }}</h3>
              <p v-if="currentChapter.description" class="content-description">{{ currentChapter.description }}</p>
            </div>
            <div class="header-actions" v-if="currentChapter && currentChapter.level !== 0">
              <el-button type="primary" @click="showUploadModal = true">
                <el-icon><Upload /></el-icon>上传资源
              </el-button>
              <el-button type="primary" @click="showResourceList">
                <el-icon><Tickets /></el-icon>资源列表
              </el-button>
            </div>
          </el-header>
          
          <div v-if="currentChapter.level === 0" class="resource-list">
             <el-empty description="这是一个主章节容器，请选择其下的具体章节以管理资源"></el-empty>
          </div>
          <div v-else class="resource-list">
            <el-empty v-if="!currentChapter.resources || currentChapter.resources.length === 0" description="该章节下暂无资源" />
            <div v-else class="resource-row" v-for="resource in currentChapter.resources" :key="resource.resource_id">
              <div class="resource-icon" :class="getResourceTypeClass(resource.type)">
                <el-icon><component :is="getResourceIcon(resource.type)" /></el-icon>
              </div>
              <div class="resource-info">
                <div class="resource-name">{{ resource.name }}</div>
                <div class="resource-meta">
                  <span v-if="resource.uploadTime">{{ resource.uploadTime }}</span>
                  <span v-if="resource.size">{{ resource.size }}</span>
                </div>
              </div>
              <div class="resource-actions">
                <el-button type="primary" link size="small" @click="viewResource(resource)">
                  <el-icon><View /></el-icon>预览
                </el-button>
                <el-button type="primary" link size="small" @click="downloadResource(resource)">
                  <el-icon><Download /></el-icon>下载
                </el-button>
                <el-button type="danger" link size="small" @click="deleteResource(resource)">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
            </div>
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
          <el-input v-model="chapterModel.title" placeholder='请输入章节标题' />
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
        <h3 class="text-lg font-medium mb-4">上传到：{{ currentChapter.title }}</h3>
        
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
        </el-upload>

        <el-form :model="newResource" label-position="top" class="mt-4">
          <el-form-item label="资源名称" required>
            <el-input v-model="newResource.name" placeholder="请输入资源名称" />
          </el-form-item>
          <el-form-item label="资源类型">
            <el-select v-model="newResource.type" placeholder="请选择资源类型" class="w-full">
              <el-option label="PDF文档" value="pdf" />
              <el-option label="Word文档" value="doc" />
              <el-option label="视频" value="video" />
              <el-option label="案例" value="case" />
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
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, Document, Upload, Edit, Delete, 
  VideoCamera, Picture, View, Download, VideoPlay, Tickets, FolderAdd, Files
} from '@element-plus/icons-vue';

const props = defineProps({
  course: {
    type: Object,
    required: true,
    default: () => ({ chapters: [] }),
  },
});

const emit = defineEmits(['update:course', 'add-chapter', 'edit-chapter', 'delete-chapter', 'upload-resource']);

const currentChapter = ref(null);
const showChapterModal = ref(false);
const isEditMode = ref(false);
const isSaving = ref(false);
const showUploadModal = ref(false);
const uploading = ref(false);
const selectedFile = ref(null);

const chapterModel = ref({
  chapter_id: null,
  title: '',
});

const newResource = ref({
  name: '',
  type: 'pdf',
});

// Use computed property for chapterTree to ensure reactivity
const chapterTree = computed(() => {
  return props.course.chapters || [];
});

// Watch for changes in the course prop or its chapters
watch(() => props.course, (newCourse) => {
  if (newCourse && newCourse.chapters && newCourse.chapters.length > 0) {
    const chapterExists = newCourse.chapters.flatMap(c => [c, ...(c.children || [])]).some(c => c.chapter_id === currentChapter.value?.chapter_id);
    
    if (!currentChapter.value || !chapterExists) {
      const firstChapter = newCourse.chapters[0];
      currentChapter.value = firstChapter?.children?.[0] || firstChapter || null;
    }
  } else {
    currentChapter.value = null;
  }
}, { deep: true, immediate: true });

const getResourceTypeClass = (type) => ({
  'pdf': 'pdf-icon', 'doc': 'doc-icon', 'video': 'video-icon',
  'case': 'image-icon', 'other': 'other-icon'
}[type] || 'other-icon');

const getResourceIcon = (type) => ({
  'pdf': Document, 'doc': Document, 'video': VideoCamera,
  'case': Picture, 'other': Files
}[type] || Files);

const handleMenuSelect = (index) => {
  const findChapter = (chapters) => {
    for (const chapter of chapters) {
      if (chapter.chapter_id.toString() === index) return chapter;
      if (chapter.children) {
        const found = findChapter(chapter.children);
        if (found) return found;
      }
    }
    return null;
  };
  const chapter = findChapter(props.course.chapters);
  if (chapter) {
    currentChapter.value = chapter;
  }
};

const handleAddChapter = (parentChapter = null) => {
  isEditMode.value = false;
  chapterModel.value = {
    chapter_id: null,
    title: '',
    parent_id: parentChapter ? parentChapter.chapter_id : 0, // Set parent_id to 0 for top-level chapters
  };
  showChapterModal.value = true;
};

const handleEditChapter = (chapter, event) => {
  event.stopPropagation();
  isEditMode.value = true;
  chapterModel.value = { 
    chapter_id: chapter.chapter_id,
    title: chapter.title,
  };
  showChapterModal.value = true;
};

const handleDeleteChapter = (chapter, event) => {
  event.stopPropagation();
  ElMessageBox.confirm(`确定要删除章节 "${chapter.title}" 吗？`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    emit('delete-chapter', chapter.chapter_id);
    if (currentChapter.value?.chapter_id === chapter.chapter_id) {
        currentChapter.value = null;
    }
  }).catch(() => ElMessage.info('已取消删除操作'));
};

const saveChapter = () => {
  if (!chapterModel.value.title?.trim()) {
    ElMessage.warning('请输入章节名称');
    return;
  }
  
  isSaving.value = true;
  const eventName = isEditMode.value ? 'edit-chapter' : 'add-chapter';
  emit(eventName, { ...chapterModel.value }, (success) => {
    isSaving.value = false;
    if (success) {
      showChapterModal.value = false;
    }
  });
};

const showResourceList = () => {
  ElMessage.info('功能待实现：显示资源列表');
};

const handleFileChange = (file) => {
  selectedFile.value = file;
  if (!newResource.value.name) {
    newResource.value.name = file.name;
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'pdf') newResource.value.type = 'pdf';
    else if (['doc', 'docx'].includes(extension)) newResource.value.type = 'doc';
    else if (['mp4', 'mov'].includes(extension)) newResource.value.type = 'video';
    else if (['zip', 'rar'].includes(extension)) newResource.value.type = 'case';
    else newResource.value.type = 'other';
  }
};

const uploadResource = () => {
  if (!newResource.value.name || !selectedFile.value) {
    ElMessage.warning('请填写资源名称并选择文件');
    return;
  }
  
  uploading.value = true;
  emit('upload-resource', {
    chapterId: currentChapter.value.chapter_id,
    file: selectedFile.value.raw,
    name: newResource.value.name,
    type: newResource.value.type,
  }, (success) => {
    uploading.value = false;
    if (success) {
      showUploadModal.value = false;
      newResource.value = { name: '', type: 'pdf' };
      selectedFile.value = null;
    }
  });
};

const viewResource = (resource) => window.open(resource.url, '_blank');
const downloadResource = (resource) => {
  const link = document.createElement('a');
  link.href = resource.url;
  link.setAttribute('download', resource.name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const deleteResource = (resource) => {
  // This should also emit an event to the parent
  ElMessage.info('删除资源功能待实现');
};
</script>

<style scoped>
/* Styles are simplified for brevity, assuming they are correct */
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
.chapter-menu-item > span {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}
.chapter-menu-item .actions {
  display: none;
}
.el-menu-item:hover .actions,
.el-sub-menu__title:hover .actions {
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
}
.resource-meta {
  display: flex;
  gap: 16px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style> 