package cn.hdu.liu.service;

import cn.hdu.liu.obj.DataObject;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

public interface DataObjectService {
    List<DataObject> importFromExcel(InputStream excelInputStream);
    List<DataObject> importFromExcel(InputStream excelInputStream, String fileName);
    boolean saveDataObject(DataObject dataObject);
    List<DataObject> findAll();
    DataObject findById(String id);
    void update(String id, DataObject dataObject);
    void delete(String id);
}