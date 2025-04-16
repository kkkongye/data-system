package cn.hdu.liu.obj;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class Metadata {
    private String dataName;            // 数据名称
    private String sourceUnit;          // 数源单位
    private String contactPerson;       // 数源单位联系人
    private String contactPhone;        // 联系人电话
    private String resourceSummary;     // 信息资源摘要
    private String fieldClassification; // 重点领域分类
    private List<String> headers = new ArrayList<>(); // 表头列表

    /**
     * 获取表头列表
     * @return 表头列表
     */
    public List<String> getHeaders() {
        return headers;
    }

    /**
     * 设置表头列表
     * @param headers 表头列表
     */
    public void setHeaders(List<String> headers) {
        this.headers = headers;
    }
}