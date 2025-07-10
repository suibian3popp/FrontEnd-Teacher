import axios from "axios";
import { getToken } from '../utils/auth';
import { ElMessage } from 'element-plus';
import router from '../router';

// 使用空字符串作为基础URL，让请求走Vite代理
axios.defaults.baseURL = "";

// 添加请求拦截器，统一处理token
axios.interceptors.request.use(
    config => {
        const token = getToken();
        if (token) {
            // 尝试不同的认证头格式
            // 1. 不使用Bearer前缀的格式
            config.headers['Authorization'] = `${token}`;
            
            // 也可以尝试其他格式的认证头
            // config.headers['X-Auth-Token'] = token;
            
            // 调试信息
            console.log(`发送请求到 ${config.url}，已附加Token认证，格式：${config.headers['Authorization'].substring(0, 15)}...`);
        } else {
            console.warn(`发送请求到 ${config.url}，未检测到Token`);
        }
        return config;
    },
    error => {
        console.error("请求拦截器错误", error);
        return Promise.reject(error);
    }
);

// 响应拦截器，处理401错误和其他错误
axios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        // 详细记录错误信息
        const errorInfo = {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        };
        
        console.error("请求响应错误:", errorInfo);
        
        // 如果是401未授权错误，提示用户并跳转登录页面
        if (error.response && error.response.status === 401) {
            ElMessage.error("登录已过期，请重新登录");
            // 记录当前路径，登录后可返回
            const currentPath = router.currentRoute.value.fullPath;
            router.push({
                path: '/login',
                query: { redirect: currentPath }
            });
        }
        // 如果是403禁止访问错误
        else if (error.response && error.response.status === 403) {
            ElMessage.error("没有访问权限，请检查登录状态");
            console.error("403错误详情:", error.response.data);
        }
        // 网络错误或服务器错误
        else if (!error.response) {
            ElMessage.error(`网络错误或服务器无响应: ${error.message || '未知错误'}`);
        }
        return Promise.reject(error);
    }
);

/*
    axios发送get请求
    @param url '/api/resources'
    @param params{
            ID:1234
        }
 */

export function doGet(url, params) {
    // 确保URL以/api开头
    if (!url.startsWith('/api')) {
        url = '/api' + url;
        console.warn('自动添加/api前缀到URL:', url);
    }
    
    return axios.get(url, { params })
        .then(response => {
            // 检查响应状态码
            if (response.status !== 200) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }
            
            // 检查响应体是否为空
            if (!response.data) {
                console.error('API响应体为空:', url);
                throw new Error('服务器返回了空响应');
            }
            
            // 检查响应格式
            if (typeof response.data !== 'object') {
                console.error('API响应格式错误:', url, response.data);
                throw new Error('服务器返回了无效的数据格式');
            }
            
            // 打印原始响应数据用于调试
            console.log(`API响应数据(${url}):`, JSON.stringify(response.data).substring(0, 200) + '...');
            
            // 兼容处理：如果后端返回的不是标准格式（没有code字段），则包装为标准格式
            if (response.data && response.data.list !== undefined && response.data.code === undefined) {
                console.log('检测到非标准API响应格式，进行兼容处理');
                // 包装为标准格式
                const wrappedResponse = {
                    ...response,
                    data: {
                        code: 200,
                        message: 'OK',
                        data: response.data
                    }
                };
                return wrappedResponse;
            }
            
            // 检查业务状态码
            if (response.data.code === 200 || response.data.code === undefined) {
                return response;
            } else {
                const errorMsg = response.data.message || '未知错误';
                console.error(`业务错误: ${response.data.code} - ${errorMsg}`, response.data);
                throw new Error(errorMsg);
            }
        })
        .catch(error => {
            // 增强错误信息
            if (error.response) {
                // 服务器返回了错误响应
                const status = error.response.status;
                const message = error.response.data?.message || error.message || '未知错误';
                console.error(`请求失败 [${status}]: ${url}`, message);
                throw new Error(`服务器错误 [${status}]: ${message}`);
            } else if (error.request) {
                // 请求已发送但没有收到响应
                console.error(`请求无响应: ${url}`, error.message);
                throw new Error(`服务器无响应: ${error.message}`);
            } else {
                // 请求配置出错
                console.error(`请求配置错误: ${url}`, error.message);
                throw error;
            }
        });
}

export function doPost(url, params, config = {}) {
    // 确保URL以/api开头
    if (!url.startsWith('/api')) {
        url = '/api' + url;
        console.warn('自动添加/api前缀到URL:', url);
    }
    
    // 检查是否为FormData，如果是，则设置Content-Type
    if (params instanceof FormData) {
        config.headers = {
            ...config.headers,
            'Content-Type': 'multipart/form-data'
        };
    } else if (typeof params === 'object' && params !== null) {
        // 对于普通对象，默认使用 application/json
        config.headers = {
            ...config.headers,
            'Content-Type': 'application/json;charset=UTF-8'
        };
    }

    return axios.post(url, params, config)
        .then(response => {
            // 检查响应状态码
            if (response.status !== 200) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }

            // 检查响应体是否为空
            if (!response.data) {
                console.error('API响应体为空:', url);
                throw new Error('服务器返回了空响应');
            }

            // 检查响应格式, 如果不是对象但请求成功，也直接返回，以兼容返回ID等简单类型数据的场景
            if (typeof response.data !== 'object') {
                console.log(`API响应为非对象格式 (${url}):`, response.data, '将直接返回响应。');
                return response;
            }

            // 检查业务状态码, 允许响应中没有 code 字段
            if (response.data.code === 200 || response.data.code === undefined) {
                return response;
            } else {
                // 如果业务失败，直接拒绝Promise并传递整个错误对象
                console.error(`业务错误: ${response.data.code} - ${response.data.msg}`, response.data);
                return Promise.reject(response.data);
            }
        })
        .catch(error => {
            // 如果已经是后端业务错误对象，直接重新抛出
            if (error && error.code && error.msg) {
                throw error;
            }
            // 增强HTTP错误信息
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || error.message || '未知错误';
                console.error(`请求失败 [${status}]: ${url}`, message);
                throw new Error(`服务器错误 [${status}]: ${message}`);
            } else if (error.request) {
                console.error(`请求无响应: ${url}`, error.message);
                throw new Error(`服务器无响应: ${error.message}`);
            } else {
                console.error(`请求配置错误: ${url}`, error.message);
                throw new Error(`请求配置错误: ${error.message || '未知错误'}`);
            }
        });
}

export function doPut(url, params) {
    // 确保URL以/api开头
    if (!url.startsWith('/api')) {
        url = '/api' + url;
        console.warn('自动添加/api前缀到URL:', url);
    }
    
    return axios.put(url, params)
        .then(response => {
            // 检查响应状态码
            if (response.status !== 200) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }
            
            // 检查业务状态码
            if (response.data.code === 200) {
                return response;
            } else {
                const errorMsg = response.data.message || '未知错误';
                console.error(`业务错误: ${response.data.code} - ${errorMsg}`, response.data);
                throw new Error(errorMsg);
            }
        })
        .catch(error => {
            // 增强错误信息
            if (error.response) {
                // 服务器返回了错误响应
                const status = error.response.status;
                const message = error.response.data?.message || error.message || '未知错误';
                console.error(`请求失败 [${status}]: ${url}`, message);
                throw new Error(`服务器错误 [${status}]: ${message}`);
            } else if (error.request) {
                // 请求已发送但没有收到响应
                console.error(`请求无响应: ${url}`, error.message);
                throw new Error(`服务器无响应: ${error.message}`);
            } else {
                // 请求配置出错
                console.error(`请求配置错误: ${url}`, error.message);
                throw error;
            }
        });
}

export function doDelete(url, params) {
    // 确保URL以/api开头
    if (!url.startsWith('/api')) {
        url = '/api' + url;
        console.warn('自动添加/api前缀到URL:', url);
    }
    
    return axios.delete(url, { params })
        .then(response => {
            // 检查响应状态码
            if (response.status !== 200) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }
            
            // 检查业务状态码
            if (response.data.code === 200) {
                return response;
            } else {
                const errorMsg = response.data.message || '未知错误';
                console.error(`业务错误: ${response.data.code} - ${errorMsg}`, response.data);
                throw new Error(errorMsg);
            }
        })
        .catch(error => {
            // 增强错误信息
            if (error.response) {
                // 服务器返回了错误响应
                const status = error.response.status;
                const message = error.response.data?.message || error.message || '未知错误';
                console.error(`请求失败 [${status}]: ${url}`, message);
                throw new Error(`服务器错误 [${status}]: ${message}`);
            } else if (error.request) {
                // 请求已发送但没有收到响应
                console.error(`请求无响应: ${url}`, error.message);
                throw new Error(`服务器无响应: ${error.message}`);
            } else {
                // 请求配置出错
                console.error(`请求配置错误: ${url}`, error.message);
                throw error;
            }
        });
}