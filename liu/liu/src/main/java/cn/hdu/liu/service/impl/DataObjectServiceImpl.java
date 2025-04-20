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
            // 确保Metadata的完整序列化
            if (dataObject.getDataEntity() != null && dataObject.getDataEntity().getMetadata() != null) {
                dataObject.setMetadataJson(objectMapper.writeValueAsString(dataObject.getDataEntity().getMetadata()));
            }

        } catch (Exception e) {
            throw new RuntimeException("保存数据对象失败", e);
        }

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
        // 1. 获取数据库中的现有对象
        DataObject existing = dataMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("ID为 " + id + " 的数据不存在");
        }

        // 2. 合并字段（仅更新非空字段）
        if (dataObject.getDataEntity() != null) {
            existing.setDataEntity(dataObject.getDataEntity());
        }
        if (dataObject.getLocationInfo() != null) {
            existing.setLocationInfo(dataObject.getLocationInfo());
        }
        if (dataObject.getConstraintSet() != null) {
            existing.setConstraintSet(dataObject.getConstraintSet());
        }
        if (dataObject.getPropagationControl() != null) {
            existing.setPropagationControl(dataObject.getPropagationControl());
        }
        if (dataObject.getAuditInfo() != null) {
            existing.setAuditInfo(dataObject.getAuditInfo());
        }

        // 3. 重新序列化对象到JSON字段（关键修改点）
        try {
            if (existing.getDataEntity() != null) {
                existing.setDataContent(objectMapper.writeValueAsString(existing.getDataEntity()));
                existing.setMetadataJson(objectMapper.writeValueAsString(existing.getDataEntity().getMetadata()));
            }
            if (existing.getLocationInfo() != null) {
                existing.setLocationInfoJson(objectMapper.writeValueAsString(existing.getLocationInfo()));
            }
            if (existing.getConstraintSet() != null) {
                existing.setConstraintSetJson(objectMapper.writeValueAsString(existing.getConstraintSet()));
            }
            if (existing.getPropagationControl() != null) {
                existing.setPropagationControlJson(objectMapper.writeValueAsString(existing.getPropagationControl()));
            }
            if (existing.getAuditInfo() != null) {
                existing.setAuditInfoJson(objectMapper.writeValueAsString(existing.getAuditInfo()));
            }
        } catch (Exception e) {
            throw new RuntimeException("序列化更新字段失败", e);
        }

        // 4. 触发更新
        existing.setUpdatedAt(Timestamp.valueOf(LocalDateTime.now()));
        dataMapper.update(existing);  // 更新合并后的对象
    }
}