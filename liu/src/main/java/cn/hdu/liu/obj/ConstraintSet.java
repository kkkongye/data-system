package cn.hdu.liu.obj;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ConstraintSet {
    private List<Constraint> constraints = new ArrayList<>();
    private Constraint selectedConstraint;

    // 添加约束
    public void addConstraint(Constraint constraint) {
        constraints.add(constraint);
        if (selectedConstraint == null) {
            selectedConstraint = constraint;
        }
    }

    // 选择约束
    public void selectConstraint(int index) {
        if (index >= 0 && index < constraints.size()) {
            selectedConstraint = constraints.get(index);
        }
    }

    // 获取约束数组格式
    @JsonIgnore
    public List<String> getConstraintArray() {
        if (selectedConstraint != null) {
            return selectedConstraint.getConstraintArray();
        }
        return new ArrayList<>();
    }

    // 设置约束数组
    public void setConstraintArray(List<String> constraintValues) {
        Constraint constraint = new Constraint();
        constraint.parseFromArray(constraintValues);
        addConstraint(constraint);
    }

    @Override
    public String toString() {
        return constraints.toString();
    }

    // 获取可读的中文描述
    @JsonIgnore
    public String getDescription() {
        if (selectedConstraint != null) {
            return selectedConstraint.getDescription();
        }
        return "约束条件集合：空";
    }


}