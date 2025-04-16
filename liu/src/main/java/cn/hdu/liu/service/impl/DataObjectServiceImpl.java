package cn.hdu.liu.service.impl;

import cn.hdu.liu.mapper.DataMapper;
import cn.hdu.liu.obj.*;
import cn.hdu.liu.service.DataObjectService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.InputStream;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class DataObjectServiceImpl implements DataObjectService {

    private final DataMapper dataMapper;
    private final ObjectMapper objectMapper;

    public DataObjectServiceImpl(DataMapper dataMapper, ObjectMapper objectMapper) {
        this.dataMapper = dataMapper;
        this.objectMapper = objectMapper;
    }

    //---------------------- 核心方法 ----------------------
    @Override
    public boolean saveDataObject(DataObject dataObject) {
        try {
            // 手动处理对象到JSON的转换
            dataObject.setDataContent(objectMapper.writeValueAsString(dataObject.getDataEntity()));
            dataObject.setMetadataJson(objectMapper.writeValueAsString(dataObject.getDataEntity().getMetadata()));
            dataObject.setLocationInfoJson(objectMapper.writeValueAsString(dataObject.getLocationInfo()));
            dataObject.setConstraintSetJson(objectMapper.writeValueAsString(dataObject.getConstraintSet()));
            dataObject.setPropagationControlJson(objectMapper.writeValueAsString(dataObject.getPropagationControl()));
            dataObject.setAuditInfoJson(objectMapper.writeValueAsString(dataObject.getAuditInfo()));

            dataMapper.insert(dataObject);
            return true;
        } catch (Exception e) {
            throw new RuntimeException("保存数据对象失败", e);
        }
    }

    @Override
    public DataObject findById(String id) {
        DataObject dataObject = dataMapper.selectById(id);
        if (dataObject != null) {
            // 手动处理JSON到对象的转换
            try {
                dataObject.setDataEntity(objectMapper.readValue(dataObject.getDataContent(), DataEntity.class));
                dataObject.getDataEntity().setMetadata(objectMapper.readValue(dataObject.getMetadataJson(), Metadata.class));
                dataObject.setLocationInfo(objectMapper.readValue(dataObject.getLocationInfoJson(), LocationInfo.class));
                dataObject.setConstraintSet(objectMapper.readValue(dataObject.getConstraintSetJson(), ConstraintSet.class));
                dataObject.setPropagationControl(objectMapper.readValue(dataObject.getPropagationControlJson(), PropagationControl.class));
                dataObject.setAuditInfo(objectMapper.readValue(dataObject.getAuditInfoJson(), AuditInfo.class));
            } catch (Exception e) {
                throw new RuntimeException("解析数据对象失败", e);
            }
        }
        return dataObject;
    }

    @Override
    public List<DataObject> findAll() {
        List<DataObject> list = dataMapper.selectAll();
        list.forEach(dataObject -> {
            try {
                // 为每个对象反序列化JSON字段
                dataObject.setDataEntity(objectMapper.readValue(dataObject.getDataContent(), DataEntity.class));
                dataObject.getDataEntity().setMetadata(objectMapper.readValue(dataObject.getMetadataJson(), Metadata.class));
                dataObject.setLocationInfo(objectMapper.readValue(dataObject.getLocationInfoJson(), LocationInfo.class));
                dataObject.setConstraintSet(objectMapper.readValue(dataObject.getConstraintSetJson(), ConstraintSet.class));
                dataObject.setPropagationControl(objectMapper.readValue(dataObject.getPropagationControlJson(), PropagationControl.class));
                dataObject.setAuditInfo(objectMapper.readValue(dataObject.getAuditInfoJson(), AuditInfo.class));
            } catch (Exception e) {
                throw new RuntimeException("解析数据对象列表失败", e);
            }
        });
        return list;
    }

    //---------------------- 辅助方法 ----------------------
    @Override
    public List<DataObject> importFromExcel(InputStream excelInputStream) {
        return importFromExcel(excelInputStream, "unknown.xlsx");
    }

    @Override
    public List<DataObject> importFromExcel(InputStream excelInputStream, String fileName) {
        // 原有Excel解析逻辑（需确保不依赖JDBC连接）
        List<DataObject> dataObjects = new ArrayList<>();
        // ... 解析逻辑 ...
        return dataObjects;
    }




    public Map<String, String> getAvailablePropagationOperations() {
        // 返回传播控制选项
        Map<String, String> operations = new LinkedHashMap<>();
        operations.put("read", "可读");
        operations.put("modify", "可修改");
        operations.put("share", "可共享");
        operations.put("delegate", "可委托");
        operations.put("destroy", "可销毁");
        return operations;
    }

    @Override
    public void delete(String id) {
        dataMapper.delete(id);
    }

    @Override
    public void update(String id, DataObject dataObject) {
        // 校验数据是否存在
        DataObject existing = dataMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("ID为 " + id + " 的数据不存在");
        }

        // 设置更新时间并更新
        dataObject.setUpdatedAt(Timestamp.valueOf(LocalDateTime.now()));
        dataMapper.update(dataObject);
    }
}