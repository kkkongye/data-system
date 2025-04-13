package cn.hdu.liu.obj;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tuple {
    private Integer id;
    private Emp[] emps;
    private int[] array = new int[5];
    private String constraint;  //访问权限
    private String transferControl;    //可读
    private String auditInfo;      //查看日志
    private String status;//是否合格
    private LocalDateTime createTime; //创建时间
    private LocalDateTime updateTime; //修改时间

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }

}
