<template>
    <div ref="chartRef" style="width: 100%; height: 400px;"></div>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue'
  import * as echarts from 'echarts'
  
  const chartRef = ref(null)
  
  onMounted(() => {
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      title: { text: '各班级最近一次考试平均分' },
      tooltip: {},
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        data: ['班级一', '班级二', '班级三']
      },
      yAxis: {},
      series: [{
        name: '平均分',
        type: 'bar',
        data: [85, 78, 92]
      }]
    })
  })
  </script>