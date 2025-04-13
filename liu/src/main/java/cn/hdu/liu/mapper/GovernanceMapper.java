package cn.hdu.liu.mapper;

import cn.hdu.liu.obj.Tuple;
import org.apache.ibatis.annotations.Select;

public interface GovernanceMapper {
    @Select("select * from emp where id = #{id}")
    Tuple search(Integer id);
}
