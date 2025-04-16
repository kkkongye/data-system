package cn.hdu.liu.obj;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.util.*;


/**
 * 数据实体类 - 表示数据实体集合I=(M,i1,i2,….,ik,…,in)
 */
@Data
public class DataEntity {
    private String entity;      // 实体名称/表名
    private String status;      // 状态
    private String feedback;    // 反馈信息
    private Metadata metadata;  // 元数据M

    // 数据内容集合(i1,i2,...,ik,...,in)，每个Map表示一行数据的键值对
    private List<Map<String, String>> dataItems = new ArrayList<>();

    // 保留原始内容字段，用于兼容性
    private String content;     // 原始数据内容 - 纯文本形式
    private Map<String, String> contentMap = new HashMap<>(); // 兼容旧版键值对形式的数据内容

    // 行数据 - 保存整个表的实际数据，行号为键
    private Map<Integer, Map<String, Object>> data = new LinkedHashMap<>();


    public Metadata getMetadata(){
        return this.metadata;
    }

    public void setMetadata(Metadata metadata){
        this.metadata = metadata;
    }

    public DataEntity() {
        // 构造函数保持不变
    }


    /**
     * 添加表头信息 - 不再使用此方法，表头信息已移除
     * 此方法仅用于向后兼容
     * @param columnIndex 列索引，例如 "A", "B", "C"
     * @param columnName 列名
     */
    @Deprecated
    public void addHeader(String columnIndex, String columnName) {
        // 此方法已废弃，但为了兼容性保留
    }

    /**
     * 获取所有表头 - 不再使用此方法，表头信息已移除
     * 此方法仅用于向后兼容
     * @return 表头列表
     */
    @Deprecated
    public List<Object> getHeaders() {
        // 返回空列表
        return new ArrayList<>();
    }

    /**
     * 添加行数据
     * @param rowNumber 行号
     * @param rowData 行数据
     */
    public void addData(int rowNumber, Map<String, Object> rowData) {
        data.put(rowNumber, rowData);
    }

    /**
     * 获取所有行数据
     * @return 行数据映射
     */
    public Map<Integer, Map<String, Object>> getData() {
        return data;
    }

    /**
     * 获取行数
     * @return 行数
     */
    public int getRowCount() {
        return data.size();
    }

    /**
     * 获取列数 - 不再依赖于表头数量
     * @return 列数
     */
    public int getColumnCount() {
        if (dataItems.isEmpty()) {
            return 0;
        }
        // 获取第一行数据的列数
        return dataItems.get(0).size();
    }

    /**
     * 获取指定行号的数据
     * @param rowNumber 行号
     * @return 行数据
     */
    public Map<String, Object> getRow(int rowNumber) {
        return data.get(rowNumber);
    }

    /**
     * 添加一个数据项（一行数据）
     * @param dataItem 数据项，表示一行数据的键值对集合
     */
    public void addDataItem(Map<String, String> dataItem) {
        this.dataItems.add(dataItem);
    }

    /**
     * 获取指定索引的数据项
     * @param index 数据项索引
     * @return 数据项（一行数据）
     */
    public Map<String, String> getDataItem(int index) {
        if (index >= 0 && index < dataItems.size()) {
            return dataItems.get(index);
        }
        return null;
    }

    /**
     * 获取数据项总数
     * @return 数据项数量
     */
    public int getDataItemCount() {
        return dataItems.size();
    }

    /**
     * 设置键值对形式的数据内容（用于向后兼容）
     * @param key 字段名
     * @param value 字段值
     */
    public void addContentItem(String key, String value) {
        contentMap.put(key, value);

        // 如果还没有数据项，创建一个新的数据项
        if (dataItems.isEmpty()) {
            Map<String, String> firstItem = new HashMap<>();
            dataItems.add(firstItem);
        }

        // 同时更新到第一个数据项
        dataItems.get(0).put(key, value);
    }

    /**
     * 获取指定字段的值（从第一个数据项中获取，用于向后兼容）
     * @param key 字段名
     * @return 字段值，如果不存在则返回null
     */
    public String getContentItem(String key) {
        return contentMap.get(key);
    }

    /**
     * 将内容Map转换为字符串格式
     * @return 格式化的内容字符串
     */
    @JsonIgnore
    public String getFormattedContent() {
        if (dataItems.isEmpty()) {
            return content; // 如果没有数据项，返回原始内容
        }

        StringBuilder sb = new StringBuilder();
        sb.append("[");

        for (int i = 0; i < dataItems.size(); i++) {
            if (i > 0) {
                sb.append(", ");
            }

            Map<String, String> item = dataItems.get(i);
            sb.append("{");

            boolean first = true;
            for (Map.Entry<String, String> entry : item.entrySet()) {
                if (!first) {
                    sb.append(", ");
                }
                sb.append("\"").append(entry.getKey()).append("\": \"")
                        .append(entry.getValue()).append("\"");
                first = false;
            }

            sb.append("}");
        }

        sb.append("]");
        return sb.toString();
    }

    @Override
    public String toString() {
        return String.format("表名: %s, 状态: %s, 反馈: %s, 数据项数量: %d",
                entity, status, feedback, dataItems.size());
    }

    /**
     * 从字符串解析数据内容
     * 支持格式:
     * 1. 单个对象: {"key1":"value1","key2":"value2"}
     * 2. 数组格式: [{"key1":"value1"},{"key1":"value2"}]
     * @param contentStr 内容字符串
     */
    public void parseContent(String contentStr) {
        if (contentStr == null || contentStr.trim().isEmpty()) {
            return;
        }

        // 保存原始内容
        this.content = contentStr;

        try {
            String str = contentStr.trim();

            // 检查是否为数组格式
            if (str.startsWith("[") && str.endsWith("]")) {
                // 解析数组格式
                str = str.substring(1, str.length() - 1);

                // 简单分割对象（注意：这种简单解析不能处理复杂的嵌套JSON）
                List<String> objStrings = new ArrayList<>();
                int depth = 0;
                StringBuilder currentObj = new StringBuilder();

                for (char c : str.toCharArray()) {
                    if (c == '{') depth++;
                    else if (c == '}') depth--;

                    currentObj.append(c);

                    if (depth == 0 && c == '}') {
                        objStrings.add(currentObj.toString().trim());
                        currentObj = new StringBuilder();
                        // 跳过逗号
                        continue;
                    }
                }

                // 解析每个对象
                for (String objStr : objStrings) {
                    Map<String, String> dataItem = parseObjectString(objStr);
                    if (!dataItem.isEmpty()) {
                        addDataItem(dataItem);
                    }
                }
            } else if (str.startsWith("{") && str.endsWith("}")) {
                // 单个对象格式
                Map<String, String> dataItem = parseObjectString(str);
                if (!dataItem.isEmpty()) {
                    addDataItem(dataItem);
                }
            }
        } catch (Exception e) {
            // 解析失败，记录异常信息
            System.err.println("解析内容失败: " + e.getMessage());
        }
    }

    /**
     * 解析对象字符串为Map
     * 简单解析，不支持嵌套对象
     * @param objStr 对象字符串
     * @return 解析后的Map
     */
    private Map<String, String> parseObjectString(String objStr) {
        Map<String, String> result = new HashMap<>();

        if (objStr == null || objStr.trim().isEmpty() || !objStr.startsWith("{") || !objStr.endsWith("}")) {
            return result;
        }

        // 去除花括号
        String content = objStr.substring(1, objStr.length() - 1).trim();
        if (content.isEmpty()) {
            return result;
        }

        // 简单分割键值对（注意：这种简单解析不能处理复杂的嵌套JSON）
        int pos = 0;
        while (pos < content.length()) {
            // 找到键的起始位置 (去除前导空格和引号)
            while (pos < content.length() && (content.charAt(pos) == ' ' || content.charAt(pos) == ',' || content.charAt(pos) == '"')) {
                pos++;
            }

            if (pos >= content.length()) break;

            // 找到键的结束位置
            int keyEnd = content.indexOf("\":", pos);
            if (keyEnd == -1) break;

            String key = content.substring(pos, keyEnd);
            if (key.startsWith("\"")) {
                key = key.substring(1);
            }

            // 移动到值的起始位置
            pos = keyEnd + 2;
            while (pos < content.length() && content.charAt(pos) == ' ') {
                pos++;
            }

            if (pos >= content.length()) break;

            // 找到值的结束位置
            boolean inQuote = content.charAt(pos) == '"';
            int valueStart = inQuote ? pos + 1 : pos;
            int valueEnd = -1;

            if (inQuote) {
                valueEnd = content.indexOf("\"", valueStart);
                if (valueEnd == -1) break;
                pos = valueEnd + 1;
            } else {
                valueEnd = content.indexOf(",", valueStart);
                if (valueEnd == -1) {
                    valueEnd = content.length();
                }
                pos = valueEnd;
            }

            String value = content.substring(valueStart, valueEnd);
            result.put(key, value);
        }

        return result;
    }

    // 重新实现获取和设置内容的方法，适配新的数据结构
    public String getContent() {
        if (content == null || content.isEmpty()) {
            return getFormattedContent();
        }
        return content;
    }

    /**
     * 该方法已过时，由于表头信息已移除
     * 为保持接口兼容性而保留
     */
    @Deprecated
    public void setHeaders(List<String> headers) {
        // 此方法已废弃，但为了兼容性保留
    }
}