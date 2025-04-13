package cn.hdu.liu.mapper;

import cn.hdu.liu.obj.Tuple;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface SourceMapper {
    @Delete("delete from tuples where id = #{id}")
    void delete(Integer id);

    @Insert("INSERT INTO tuples (id, constraint, transfer_control, audit_info, status, create_time, update_time) " +
            "VALUES (#{id}, #{constraint}, #{transferControl}, #{auditInfo}, #{status}, #{createTime}, #{updateTime})")
    void insert(Tuple tuple);

    @Select("select * from table where id = #{id}")
    Tuple search(Integer id);

    @Update("UPDATE tuples SET " +
            "constraint = #{constraint}, " +
            "transfer_control = #{transferControl}, " +
            "audit_info = #{auditInfo}, " +
            "status = #{status}, " +
            "update_time = #{updateTime} " +
            "WHERE id = #{id}")
    void update(Tuple tuple);

    @Select("select * from table")
    List<Tuple> list();
}
