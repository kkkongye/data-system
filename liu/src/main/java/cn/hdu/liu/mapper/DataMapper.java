package cn.hdu.liu.mapper;

import cn.hdu.liu.obj.DataObject;
import org.apache.ibatis.annotations.*;
import org.apache.ibatis.type.JdbcType;
import java.util.List;

@Mapper
public interface DataMapper {
    @Insert({
            "INSERT INTO data_objects (id, data_content, metadata_json, location_info_json,",
            "constraint_set_json, propagation_control_json, audit_info_json, created_at, updated_at)",
            "VALUES (#{id}, #{dataContent}, #{metadataJson}, #{locationInfoJson},",
            "#{constraintSetJson}, #{propagationControlJson}, #{auditInfoJson}, NOW(), NOW())"
    })
    @Options(useGeneratedKeys = true, keyProperty = "numericId")
    void insert(DataObject dataObject);

    @Select("SELECT * FROM data_objects WHERE id = #{id}")
    DataObject selectById(String id);

    @Update({
            "UPDATE data_objects SET",
            "data_content = #{dataContent},",
            "metadata_json = #{metadataJson},",
            "location_info_json = #{locationInfoJson},",
            "constraint_set_json = #{constraintSetJson},",
            "propagation_control_json = #{propagationControlJson},",
            "audit_info_json = #{auditInfoJson},",
            "updated_at = NOW()",
            "WHERE id = #{id}"
    })
    void update(DataObject dataObject);

    @Delete("DELETE FROM data_objects WHERE id = #{id}")
    void delete(String id);

    @Select("SELECT " +
            "id, numeric_id, " +
            "CONVERT(data_content USING utf8) as data_content, " +
            "CONVERT(metadata_json USING utf8) as metadata_json, " +
            "CONVERT(location_info_json USING utf8) as location_info_json, " +
            "CONVERT(constraint_set_json USING utf8) as constraint_set_json, " +
            "CONVERT(propagation_control_json USING utf8) as propagation_control_json, " +
            "CONVERT(audit_info_json USING utf8) as audit_info_json, " +
            "created_at, updated_at " +
            "FROM data_objects")
    @Results(value = {
            @Result(column = "data_content", property = "dataContent", jdbcType = JdbcType.VARCHAR,javaType = String.class),
            @Result(column = "metadata_json", property = "metadataJson", jdbcType = JdbcType.VARCHAR,javaType = String.class),
            @Result(column = "location_info_json", property = "locationInfoJson", jdbcType = JdbcType.VARCHAR,javaType = String.class),
            @Result(column = "constraint_set_json", property = "constraintSetJson", jdbcType = JdbcType.VARCHAR,javaType = String.class),
            @Result(column = "propagation_control_json", property = "propagationControlJson", jdbcType = JdbcType.VARCHAR,javaType = String.class),
            @Result(column = "audit_info_json", property = "auditInfoJson", jdbcType = JdbcType.VARCHAR,javaType = String.class)
    })
    List<DataObject> selectAll();
}