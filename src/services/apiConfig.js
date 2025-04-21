import axios from 'axios';

// 基础API URL
export const API_BASE_URL = 'http://localhost:8080';  // 确保这里的端口与后端服务端口一致
export const API_URL = `${API_BASE_URL}/api`;

// 在生产环境可能需要切换到真实服务器地址
// export const API_BASE_URL = process.env.NODE_ENV === 'production' 
//   ? 'http://your-production-server:8080' 
//   : 'http://localhost:8080';

// Mock模式配置
export const MOCK_ENABLED = false; // 如果后端不可用，是否启用模拟响应
export const AUTO_FALLBACK_TO_MOCK = false; // 在API请求失败时自动回退到模拟模式

// 创建一个预配置的axios实例
export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10秒超时
  withCredentials: false, // 默认不携带跨域凭证
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  config => {
    // 在每个请求中添加mock模式支持，方便测试
    if (MOCK_ENABLED && config.mock !== false) {
      config.headers['X-Mock-Mode'] = 'enabled';
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  response => {
    // 直接返回响应数据
    return response;
  },
  error => {
    // 统一处理错误
    if (error.response) {
      // 服务器返回了错误状态码
      console.error('API请求错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('API请求未收到响应:', error.request);
    } else {
      // 请求配置出错
      console.error('API请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// 测试API连接是否可用
export const testApiConnection = async () => {
  try {
    console.log('开始测试API连接，目标URL:', `${API_URL}/objects/list`);
    
    // 使用列表API测试连接 - 这是一个可能较为稳定的端点
    const response = await axiosInstance.get('/objects/list', { 
      timeout: 5000,  // 增加超时时间
      validateStatus: function (status) {
        // 任何响应码都视为"连接成功"，因为我们只是测试连接
        return status >= 200 && status < 600;
      }
    });
    
    console.log('API连接测试成功，状态码:', response.status, '响应数据:', response.data);
    return true;
  } catch (error) {
    console.warn('API连接测试失败:', error.message);
    
    // 更详细地记录错误信息
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    
    if (error.config) {
      console.error('请求配置:', {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        timeout: error.config.timeout
      });
    }
    
    // 尝试检查错误是否是由于网络问题，而不是服务器返回的错误
    if (!error.response && error.code === 'ECONNREFUSED') {
      console.error('无法连接到服务器，可能服务器未启动或地址错误');
      return false;
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('连接超时，服务器响应时间过长');
      return false;
    }
    
    // 如果有响应但状态码不是2xx，也算连接成功（服务器活着但返回了错误）
    if (error.response) {
      console.warn('服务器返回了错误状态码，但连接是有效的:', error.response.status);
      return true;
    }
    
    return false;
  }
};

export default {
  axiosInstance,
  API_URL,
  API_BASE_URL,
  MOCK_ENABLED,
  AUTO_FALLBACK_TO_MOCK,
  testApiConnection
}; 