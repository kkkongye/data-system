CREATE DATABASE IF NOT EXISTS data_management 
    DEFAULT CHARACTER SET utf8mb4 
    DEFAULT COLLATE utf8mb4_unicode_ci;
    
    USE data_management;
    
    CREATE TABLE IF NOT EXISTS data_objects (
    id VARCHAR(36) PRIMARY KEY COMMENT '唯一标识符',
    numeric_id BIGINT AUTO_INCREMENT COMMENT '数据库自增长ID',
    data_content TEXT COMMENT '数据实体JSON',
    metadata_json TEXT COMMENT '元数据JSON',
    location_info_json TEXT COMMENT '位置信息JSON',
    constraint_set_json TEXT COMMENT '约束集合JSON',
    propagation_control_json TEXT COMMENT '传播控制JSON',
    audit_info_json TEXT COMMENT '审计信息JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY (numeric_id)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

-- 插入第一条数据
INSERT INTO data_objects (
    id, 
    data_content, 
    metadata_json, 
    location_info_json, 
    constraint_set_json, 
    propagation_control_json, 
    audit_info_json
) VALUES (
    UUID(),
    '{"entity":"用户表","status":"未审核","feedback":"","metadata":null,"dataItems":[{"name":"张三","age":"25"},{"name":"李四","age":"30"}]}',
    '{"dataName":"用户数据","sourceUnit":"数据部","contactPerson":"王主任","contactPhone":"123-456789","resourceSummary":"用户基本信息","fieldClassification":"个人信息","headers":["name","age"]}',
    '{"locations":[{"sheet":"Sheet1","startRow":"2","endRow":"3","startColumn":"A","endColumn":"B"}]}',
    '{"constraints":[{"formatConstraint":"xlsx","accessConstraint":"全部允许","pathConstraint":"点对点","regionConstraint":"内网","shareConstraint":"允许共享"}]}',
    '{"operations":{"modify":1,"read":1,"share":0,"delegate":0,"destroy":0}}',
    '{"auditRecords":[{"subject":"admin","object":"用户表","operationType":"创建","timestamp":"2023-10-01 10:00:00","blockHash":"0x1234","previousHash":"genesis"}]}'
);

-- 插入第二条数据
INSERT INTO data_objects (
    id, 
    data_content, 
    metadata_json, 
    location_info_json, 
    constraint_set_json, 
    propagation_control_json, 
    audit_info_json
) VALUES (
    UUID(),
    '{"entity":"订单表","status":"已审核","feedback":"数据完整","metadata":null,"dataItems":[{"orderId":"1001","amount":"200"},{"orderId":"1002","amount":"300"}]}',
    '{"dataName":"订单数据","sourceUnit":"财务部","contactPerson":"李会计","contactPhone":"987-654321","resourceSummary":"订单交易记录","fieldClassification":"财务信息","headers":["orderId","amount"]}',
    '{"locations":[{"sheet":"Sheet1","startRow":"5","endRow":"6","startColumn":"C","endColumn":"D"}]}',
    '{"constraints":[{"formatConstraint":"xlsx","accessConstraint":"管理方获取","pathConstraint":"广播","regionConstraint":"外网","shareConstraint":"不允许共享"}]}',
    '{"operations":{"modify":0,"read":1,"share":0,"delegate":1,"destroy":0}}',
    '{"auditRecords":[{"subject":"auditor","object":"订单表","operationType":"审核","timestamp":"2023-10-02 14:30:00","blockHash":"0x5678","previousHash":"0x1234"}]}'
);

 select * from data_objects;