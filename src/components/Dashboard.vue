<template>
    <div style="padding: 24px;">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card>
            <div>班级数量</div>
            <div style="font-size: 28px; font-weight: bold;">3</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <div>课程数量</div>
            <div style="font-size: 28px; font-weight: bold;">6</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <div>学生数量</div>
            <div style="font-size: 28px; font-weight: bold;">120</div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 24px;">
        <el-col :span="12">
          <el-card>
            <BarChart />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <PieChart />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 24px;">
        <el-col :span="12">
          <el-card>
            <TodoList title="待批改作业" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <TodoList title="待批改考试" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </template>
  
  <script setup>
  import BarChart from './BarChart.vue'
  import PieChart from './PieChart.vue'
  import TodoList from './TodoList.vue'
  </script>