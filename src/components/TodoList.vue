<template>
    <div>
      <h4>{{ title }}</h4>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="课程/考试名称" />
        <el-table-column prop="class" label="班级" />
        <el-table-column prop="count" label="待批改数量" />
        <el-table-column prop="deadline" label="截止时间" />
      </el-table>
    </div>
  </template>
  
  <script setup>
  import { defineProps } from 'vue'
  const props = defineProps({
    title: String
  })
  
  const tableData = [
    { name: '作业1', class: '班级一', count: 5, deadline: '2024-06-20' },
    { name: '作业2', class: '班级二', count: 3, deadline: '2024-06-21' },
    { name: '作业3', class: '班级三', count: 2, deadline: '2024-06-22' }
  ]
  </script>