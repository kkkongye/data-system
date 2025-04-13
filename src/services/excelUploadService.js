import { ElMessage } from 'element-plus';
import { API_URL, axiosInstance, MOCK_ENABLED, AUTO_FALLBACK_TO_MOCK, testApiConnection } from './apiConfig';

/**
 * 详细测试与后端API的连接并返回更多信息
 * @returns {Promise<Object>} 连接测试结果
 */
const checkApiConnection = async () => {
  try {
    // 使用导入的testApiConnection进行基础连接测试
    const isConnected = await testApiConnection();
    
    if (isConnected) {
      return {
        success: true,
        message: '与后端API连接正常',
        details: { isConnected }
      };
    } else {
      return {
        success: false,
        message: '与后端API连接失败',
        details: { isConnected }
      };
    }
  } catch (error) {
    console.error('API连接测试失败:', error);
    
    // 详细记录错误信息
    let errorDetails = {
      message: error.message || '未知错误'
    };
    
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.data = error.response.data;
    } else if (error.request) {
      errorDetails.request = '已发送请求但未收到响应';
      errorDetails.requestInfo = error.request;
    }
    
    return {
      success: false,
      message: '与后端API连接失败',
      details: errorDetails
    };
  }
};

/**
 * 创建模拟成功响应
 * @param {File} file - 上传的文件
 * @returns {Object} 模拟的成功响应
 */
const createMockSuccessResponse = (file) => {
  console.log('[Mock模式] 创建模拟上传成功响应');
  
  return {
    success: true,
    message: '[模拟] 文件上传成功',
    data: {
      id: Math.floor(Math.random() * 1000),
      filename: file.name,
      size: file.size,
      mimetype: file.type,
      uploadTime: new Date().toISOString(),
      isMock: true
    }
  };
};

/**
 * 上传Excel文件到服务器
 * @param {File} file - 要上传的Excel文件
 * @returns {Promise<Object>} - 包含上传结果的Promise
 */
const uploadExcelFile = async (file) => {
  // 验证文件
  if (!file) {
    return {
      success: false,
      message: '未提供文件',
      data: null
    };
  }
  
  // 如果启用了mock模式，直接返回模拟数据
  if (MOCK_ENABLED) {
    try {
      // 使用导入的testApiConnection函数测试API连接
      const isApiAvailable = await testApiConnection();
      
      // 如果API不可用或设置了自动回退，返回模拟数据
      if (!isApiAvailable || AUTO_FALLBACK_TO_MOCK) {
        console.log('[Mock模式] 后端API不可用，使用模拟数据');
        return createMockSuccessResponse(file);
      }
    } catch (error) {
      console.warn('测试API连接时出错:', error);
      if (AUTO_FALLBACK_TO_MOCK) {
        return createMockSuccessResponse(file);
      }
    }
  }

  // 正常上传流程
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('准备上传文件:', file.name, '大小:', file.size, '类型:', file.type);
    
    // 发送上传请求 - 注意这里不需要/api前缀，因为axiosInstance已经配置了baseURL
    const response = await axiosInstance.post('/objects/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: false, // 跨域请求不携带凭证
      // 添加上传进度处理
      onUploadProgress: progressEvent => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`上传进度: ${percentCompleted}%`);
      }
    });
    
    console.log('上传请求响应:', response);
    
    // 检查响应状态
    if (response.data && (response.data.code === 200 || response.data.code === 1)) { // 注意后端可能返回code=1作为成功
      return {
        success: true,
        message: '文件上传成功',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || response.data?.msg || '上传失败', // 兼容不同的响应格式
        data: null,
        details: response.data
      };
    }
  } catch (error) {
    console.error('Excel文件上传错误详情:', error);
    
    // 如果启用了自动回退到模拟模式，在错误时返回模拟成功响应
    if (MOCK_ENABLED && AUTO_FALLBACK_TO_MOCK) {
      console.log('[Mock模式] 上传失败，回退到模拟数据');
      return createMockSuccessResponse(file);
    }
    
    // 详细记录错误信息
    let errorMessage = '上传过程中发生错误';
    let errorDetails = {
      message: error.message || '未知错误'
    };
    
    if (error.response) {
      // 服务器返回了错误状态码
      errorMessage = `服务器返回错误(${error.response.status}): ${error.response.data?.message || error.response.data?.msg || error.response.statusText}`;
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.data = error.response.data;
    } else if (error.request) {
      // 请求已发送但未收到响应
      errorMessage = '服务器未响应请求，请检查后端服务是否运行';
      errorDetails.request = '已发送请求但未收到响应';
    } else {
      // 请求配置出错
      errorMessage = `请求配置错误: ${error.message}`;
    }
    
    return {
      success: false,
      message: errorMessage,
      data: null,
      details: errorDetails
    };
  }
};

/**
 * 上传Excel文件并关联到特定数字对象ID
 * @param {Number} objectId - 数字对象ID
 * @param {File} file - 要上传的Excel文件
 * @returns {Promise<Object>} - 包含上传结果的Promise
 */
const uploadExcelFileWithObjectId = async (objectId, file) => {
  // 验证参数
  if (!objectId) {
    return {
      success: false,
      message: '未提供对象ID',
      data: null
    };
  }
  
  if (!file) {
    return {
      success: false,
      message: '未提供文件',
      data: null
    };
  }
  
  // 如果启用了mock模式，直接返回模拟数据
  if (MOCK_ENABLED) {
    try {
      // 使用导入的testApiConnection函数测试API连接
      const isApiAvailable = await testApiConnection();
      
      // 如果API不可用或设置了自动回退，返回模拟数据
      if (!isApiAvailable || AUTO_FALLBACK_TO_MOCK) {
        console.log('[Mock模式] 后端API不可用，使用模拟数据');
        const mockResponse = createMockSuccessResponse(file);
        mockResponse.data.objectId = objectId; // 添加对象ID信息
        return mockResponse;
      }
    } catch (error) {
      console.warn('测试API连接时出错:', error);
      if (AUTO_FALLBACK_TO_MOCK) {
        const mockResponse = createMockSuccessResponse(file);
        mockResponse.data.objectId = objectId;
        return mockResponse;
      }
    }
  }

  // 正常上传流程
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('准备上传文件到对象ID:', objectId, '文件名:', file.name, '大小:', file.size);
    
    // 发送上传请求
    const response = await axiosInstance.post(`/objects/${objectId}/excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: false, // 跨域请求不携带凭证
      // 添加上传进度处理
      onUploadProgress: progressEvent => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`上传进度: ${percentCompleted}%`);
      }
    });
    
    console.log('上传请求响应:', response);
    
    // 检查响应状态
    if (response.data && response.data.code === 200) {
      return {
        success: true,
        message: '文件上传成功',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || '上传失败',
        data: null,
        details: response.data
      };
    }
  } catch (error) {
    console.error('Excel文件上传错误详情:', error);
    
    // 如果启用了自动回退到模拟模式，在错误时返回模拟成功响应
    if (MOCK_ENABLED && AUTO_FALLBACK_TO_MOCK) {
      console.log('[Mock模式] 上传失败，回退到模拟数据');
      const mockResponse = createMockSuccessResponse(file);
      mockResponse.data.objectId = objectId;
      return mockResponse;
    }
    
    // 详细记录错误信息
    let errorMessage = '上传过程中发生错误';
    let errorDetails = {
      message: error.message || '未知错误'
    };
    
    if (error.response) {
      // 服务器返回了错误状态码
      errorMessage = `服务器返回错误(${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.data = error.response.data;
    } else if (error.request) {
      // 请求已发送但未收到响应
      errorMessage = '服务器未响应请求，请检查后端服务是否运行';
      errorDetails.request = '已发送请求但未收到响应';
    } else {
      // 请求配置出错
      errorMessage = `请求配置错误: ${error.message}`;
    }
    
    return {
      success: false,
      message: errorMessage,
      data: null,
      details: errorDetails
    };
  }
};

export default {
  checkApiConnection,
  testApiConnection,
  uploadExcelFile,
  uploadExcelFileWithObjectId
}; 