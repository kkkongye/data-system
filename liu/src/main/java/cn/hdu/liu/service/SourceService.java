package cn.hdu.liu.service;

import cn.hdu.liu.obj.PageBean;
import cn.hdu.liu.obj.Tuple;

import java.time.LocalDate;
import java.util.List;

public interface SourceService {

    void delete(Integer id);

    Tuple search(Integer id);

    void update(Integer id,Tuple tuple);

    void add(Tuple tuple);

    List<Tuple> list();
}
