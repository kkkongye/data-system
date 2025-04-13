package cn.hdu.liu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web配置类
 * 主要用于配置跨域资源共享(CORS)设置
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    /**
     * 配置全局CORS策略
     * 允许前端应用(http://localhost:5173)访问后端API
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")  // 对所有路径应用CORS配置
                .allowedOrigins("http://localhost:5173")  // 允许的前端地址
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // 允许的HTTP方法
                .allowedHeaders("*")  // 允许所有请求头
                .allowCredentials(true)  // 允许发送凭据(cookies等)
                .maxAge(3600);  // 预检请求缓存时间(秒)
    }
} 