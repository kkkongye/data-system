package cn.hdu.liu.service.impl;

import cn.hdu.liu.mapper.SourceMapper;
import cn.hdu.liu.obj.Tuple;
import cn.hdu.liu.service.SourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SourceServiceimpl implements SourceService {
    @Autowired
    private SourceMapper sourceMapper;

    @Override
    public void delete(Integer id) {
        sourceMapper.delete(id);
    }


    @Override
    public Tuple search(Integer id) {
        return sourceMapper.search(id);
    }


    @Override
    public void add(Tuple tuple) {
        tuple.setCreateTime(LocalDateTime.now());
        tuple.setUpdateTime(LocalDateTime.now());
        sourceMapper.insert(tuple);
    }

    @Override
    public void update(Integer id, Tuple tuple) {
        // 校验数据是否存在
        Tuple existing = sourceMapper.search(id);
        if (existing == null) {
            throw new RuntimeException("ID为 " + id + " 的数据不存在");
        }

        // 设置更新时间并更新
        tuple.setUpdateTime(LocalDateTime.now());
        sourceMapper.update(tuple);
    }

    @Override
    public List<Tuple> list(){
        return sourceMapper.list();
    }
}
