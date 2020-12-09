import axios from 'axios'
import store from '@/store'
import JSONbig from 'json-bigint'
import { Toast } from 'vant'
import router from '@/router'

const request = axios.create({
  baseURL: 'http://ttapi.research.itcast.cn/', // 接口的基准路径
  transformResponse: [function (data) {
    try {
      return JSONbig.parse(data)
    } catch (err) {
      // 非 JSON 格式的字符串，直接返回即可
      return data
    }
  }]
})

const refreshTokenReq = axios.create({
  baseURL: 'http://ttapi.research.itcast.cn/'
})

// 请求拦截器
request.interceptors.request.use(config => {
  const {
    user
  } = store.state
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
}, error => {
  // 如果请求出错了（还没发出去）
  return Promise.reject(error)
})

// Add a response interceptor
request.interceptors.response.use(function (response) {
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  return response
}, async function (error) {
  // console.dir(error)
  const status = error.response.status
  if (status === 400) {
    // 客户端请求参数错误
    Toast.fail('客户端请求参数异常')
  } else if (status === 401) {
    // token 无效
    // #1 如果没有 user 或 user.token 直接去登录
    const { user } = store.state
    if (!user || !user.token) {
      return redirectLogin()
    }
    // #2 如果有 refresh_token，则使用 refresh_token 请求获取新的 token
    try {
      const { data } = await refreshTokenReq({
        url: '/app/v1_0/authorizations',
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user.refresh_token}`
        }
      })
      // #3 拿到新的 token 之后更新到 store
      user.token = data.data.token
      store.commit('setUser', user)
      // #4 把失败的请求重新发出去，error.config 是本次请求的配置对象
      // request 发出的请求，会走自己的拦截器，它的请求拦截器中又通过 store 获取到最新的 token
      return request(error.config)
    } catch (err) {
      // 刷新 token 失败，直接跳转登录页
      redirectLogin()
    }
  } else if (status === 403) {
    // 没有权限
    Toast.fail('没有权限')
  } else if (status >= 500) {
    // 服务端异常
    Toast.fail('服务器抽风了')
  }
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  return Promise.reject(error)
})

function redirectLogin() {
  // router.replace('/login')
  router.replace({
    name: 'login',
    // 查询参数会以 ? 号作为分隔符放到 url 后面
    // router.currentRoute 等价于组件中的 this.$route
    // router.currentRoute.fullPath 就是当前路由路径
    query: {
      redirect: router.currentRoute.fullPath
    }
  })
}

export default request
