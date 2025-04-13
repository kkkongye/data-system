package cn.hdu.liu.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import cn.hdu.liu.obj.PageBean;
import cn.hdu.liu.obj.Result;
import cn.hdu.liu.obj.Tuple;
import cn.hdu.liu.service.SourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SourceController {

    private static final Logger log = LoggerFactory.getLogger(SourceController.class);

    @Autowired
    private SourceService SourceService;
    private String encryptedData;
    private String token;


    @DeleteMapping("/{id}")
    public Result delete(@PathVariable Integer id) {
        log.info("根据id删除数字对象:{}",id);
        SourceService.delete(id);
        return Result.success();
    }

    @GetMapping("/objects/{id}")
    public Result search(@PathVariable Integer id) {
        Tuple tuple =  SourceService.search(id);
        return Result.success(tuple);
    }

    @PostMapping("/objects")
    public Result add(@RequestBody Tuple tuple) {
        log.info("新增数字对象: {}" , tuple);
        SourceService.add(tuple);
        return Result.success();
    }

    @PutMapping("/objects/{id}")
    public Result update(@PathVariable Integer id, @RequestBody Tuple tuple) {
        log.info("根据ID修改数字对象: {}, 数据: {}", id, tuple);
        SourceService.update(id, tuple);
        return Result.success();
    }
    @GetMapping("/objects/list")
    public Result list() {
        log.info("查询全部数据对象信息");
        List<Tuple> tupleList=SourceService.list();
        return Result.success(tupleList);
    }

    @PostMapping("/encrypt")
    public Result encryptData() {
        String rawData = "Sensitive data to be encrypted";
//jiami
        this.encryptedData = "ENCRYPTED_" + rawData + "_DATA";
        this.token = "GENERATED_TOKEN_" + System.currentTimeMillis();
//
        Map<String, String> response = new HashMap<>();
        response.put("status", "Encryption successful");
        response.put("data_length", String.valueOf(encryptedData.length()));
        return Result.success(response);
    }


    @PostMapping("/objects/submit")
    public ResponseEntity<String> sendData() {
        if (encryptedData == null || token == null) {
            return ResponseEntity.badRequest().body("No encrypted data available. Call /encrypt first.");
        }


        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("data", encryptedData);
        requestBody.put("token", token);

        // 发送到数据治理方（假设治理方服务地址为http://localhost:8081）
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "http://localhost:8081/receive-data",
                new HttpEntity<>(requestBody, headers),
                String.class
        );

        this.encryptedData = null;
        this.token = null;

        return ResponseEntity.ok("Data sent to governance system. Response: " + response.getBody());
    }
}
