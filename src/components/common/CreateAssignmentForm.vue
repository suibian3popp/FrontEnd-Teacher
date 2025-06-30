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
      <el-form-item label="作业附件" prop="fileList">
        <el-upload
          v-model:file-list="form.fileList"
          class="upload-demo"
          action="#"
          :auto-upload="false"
          :limit="1"
        >
          <el-button type="primary">选择文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              只能上传一份文件，大小不超过 10MB
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  
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
    fileList: [],
  });
  
  const classes = ref(['软件2101', '计算机2102', '人工智能2103']);
  let oldSelectedClasses = []; // 用于跟踪上一次的选择
  
  watch(() => props.initialData, (newData) => {
    if (newData) {
      form.value.name = newData.name;
      form.value.course = newData.course;
      form.value.class = newData.class.split(', '); // 将字符串转回数组
      // 注意：日期和文件需要更复杂的逻辑来回填，这里暂时简化
      form.value.score = newData.score || 100;
    } else {
      // 重置表单
      form.value = { name: '', course: '', class: [], dates: [], score: 100, fileList: [] };
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
    oldSelectedClasses = form.value.class;
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
          resolve(form.value);
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
  