package cn.hdu.liu.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import cn.hdu.liu.obj.Result;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
public class UploadController {
    private static final Logger log = LoggerFactory.getLogger(SourceController.class);
    
    // 使用相对路径，可以在不同环境下工作
    private static final String UPLOAD_DIR = "./uploaded-files/";

    @PostMapping("/api/objects/excel")
    public Result upload(MultipartFile file) throws IOException {
        log.info("文件上传: {}", file.getOriginalFilename());
        
        if (file.isEmpty()) {
            return Result.error("上传的文件为空");
        }
        
        try {
            // 确保目录存在
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }
            
            // 获取文件名和扩展名
            String filename = file.getOriginalFilename();
            int index = filename.lastIndexOf(".");
            String extname = index > 0 ? filename.substring(index + 1) : "";
            String newFileName = UUID.randomUUID().toString() + "." + extname;
            
            log.info("新的文件名: {}", newFileName);
            
            // 保存文件
            Path path = Paths.get(UPLOAD_DIR + newFileName);
            Files.copy(file.getInputStream(), path);
            
            return Result.success();
        } catch (Exception e) {
            log.error("文件上传失败", e);
            return Result.error("文件上传失败: " + e.getMessage());
        }
    }
}
