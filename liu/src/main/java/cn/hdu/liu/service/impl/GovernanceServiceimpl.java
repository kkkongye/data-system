package cn.hdu.liu.service.impl;
import cn.hdu.liu.mapper.GovernanceMapper;
import cn.hdu.liu.obj.Tuple;
import cn.hdu.liu.service.GovernanceService;
import org.springframework.beans.factory.annotation.Autowired;

public class GovernanceServiceimpl implements GovernanceService {
    @Autowired
    private GovernanceMapper GovernanceMapper;
    @Override
    public Tuple search(Integer id) {
        return GovernanceMapper.search(id);
    }
}
