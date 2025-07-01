import { createRouter, createWebHistory } from 'vue-router'

// 组件懒加载
const Home = () => import('../views/Home.vue')
const Dashboard = () => import('../components/Dashboard.vue')
const CourseManagement = () => import('../views/CourseManagement.vue')
// 你可以根据实际情况添加其他页面组件
// const Course = () => import('../views/Course.vue')
// const Assignment = () => import('../views/Assignment.vue')
// const Exam = () => import('../views/Exam.vue')
// const ResourcePersonal = () => import('../views/ResourcePersonal.vue')
// const ResourcePublic = () => import('../views/ResourcePublic.vue')
// const Student = () => import('../views/Student.vue')
// const Class = () => import('../views/Class.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/',
    component: Home,
    children: [
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'course',
        component: CourseManagement
      },
      {
        path: 'analytics',
        component: () => import('../components/Analytics.vue')
      },
      {
        path: 'task/assignment',
        component: () => import('../components/TaskAssignment.vue')
      },
      {
        path: 'task/exam',
        component: () => import('../components/TaskExam.vue')
      },
      {
        path: 'assignment/:id',
        name: 'AssignmentDetail',
        component: () => import('../views/AssignmentDetail.vue')
      },
      // 添加一个临时的资源路由，指向另一个组件，避免404错误
      {
        path: 'resource',
        component: Dashboard // 临时使用Dashboard作为资源页面
      },
     
      // 下面是示例，实际可根据你的页面继续添加
      // {
      //   path: 'course',
      //   component: Course
      // },
      // {
      //   path: 'assignment/:course',
      //   component: Assignment
      // },
      // {
      //   path: 'exam/:course',
      //   component: Exam
      // },
      // {
      //   path: 'resource/personal',
      //   component: ResourcePersonal
      // },
      // {
      //   path: 'resource/public',
      //   component: ResourcePublic
      // },
      // {
      //   path: 'student/:class',
      //   component: Student
      // },
      // {
      //   path: 'class',
      //   component: Class
      // }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
