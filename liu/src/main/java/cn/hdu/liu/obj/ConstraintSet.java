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


    // Getter for constraints
    public List<Constraint> getConstraints() {
        return new ArrayList<>(constraints); // 返回防御性拷贝
    }

    // Setter for constraints（带数据校验）
    public void setConstraints(List<Constraint> constraints) {
        this.constraints = new ArrayList<>(constraints); // 防御性拷贝

        // 自动选择逻辑：当设置新列表且当前无选中项时，选择第一个约束
        if (this.selectedConstraint == null && !this.constraints.isEmpty()) {
            this.selectedConstraint = this.constraints.get(0);
        }
    }

    // Getter for selectedConstraint
    public Constraint getSelectedConstraint() {
        return selectedConstraint; // 直接返回引用（根据业务需求决定是否拷贝）
    }

    // Setter for selectedConstraint（带数据校验）
    public void setSelectedConstraint(Constraint selectedConstraint) {
        // 校验约束是否存在于列表中
        if (selectedConstraint != null && !this.constraints.contains(selectedConstraint)) {
            throw new IllegalArgumentException("Selected constraint must exist in the constraints list");
        }
        this.selectedConstraint = selectedConstraint;
    }

}