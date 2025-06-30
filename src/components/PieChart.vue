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
      title: { text: '各班级课程数量占比', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '课程数量',
          type: 'pie',
          radius: '65%',
          center: ['55%', '50%'],
          data: [
            { value: 6, name: '班级一' },
            { value: 4, name: '班级二' },
            { value: 5, name: '班级三' }
          ]
        }
      ]
    })
  })
  </script>