package cn.hdu.liu.obj;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result {
    private Integer code;  // 使用 Integer 类型
    private String msg;     // 字段名严格为 msg
    private Object data;    // 通用数据类型

    public Result(Integer code, String msg, Object data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }
    // 增删改成功响应
    public static Result success() {
        return new Result(1, "success", null);  // int 自动装箱为 Integer
    }

    // 查询成功响应（带数据）
    public static Result success(Object data) {
        return new Result(1, "success", data);
    }

    // 失败响应
    public static Result error(String msg) {
        return new Result(0, msg, null);  // int 自动装箱为 Integer
    }
}