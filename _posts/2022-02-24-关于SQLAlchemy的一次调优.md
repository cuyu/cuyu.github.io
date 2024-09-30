---
layout: post
title: "关于SQLAlchemy的一次调优"
category: Database
tags: [MySQL, ORM]
date: 2022-02-24
---

## Issue

写了一个后端的api会通过mysql join两张表，然后返回一个list结果，发现在读取近一个月的数据时这个api就已经比较慢了（大概需要8s）。记录下是如何发现问题及优化的。  
api是用Python3的flask加上flask-restful来写的，数据库的ORM使用的是flask-sqlalchemy。以下是原始的代码：

```py
class AlertCollection(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('priority')
    parser.add_argument('status')
    parser.add_argument('type')
    parser.add_argument('start')
    parser.add_argument('end')
    parser.add_argument('rule_id')
    parser.add_argument('rule_name')
    parser.add_argument('offset', type=int, default=0)
    parser.add_argument('limit', type=int, default=20)

    def get(self):
        args = self.parser.parse_args()
        logger.info('Get alert notification collection with params: {}'.format(args))
        alert_query = AggAlertModel.query
        if args.get('rule_id'):
            alert_query = alert_query.filter(AggAlertModel.rule_id == args['rule_id'])
        if args.get('status'):
            alert_query = alert_query.filter(AggAlertModel.status.in_(args['status'].split(',')))
        if args.get('start'):
            alert_query = alert_query.filter(AggAlertModel.last_trigger_time >= int(args['start']))
        if args.get('end'):
            alert_query = alert_query.filter(AggAlertModel.last_trigger_time <= int(args['end']))
        alert_query = alert_query.join(AlertRuleMeta, AggAlertModel.rule_id == AlertRuleMeta.id)
        if args.get('rule_name'):
            alert_query = alert_query.filter(AlertRuleMeta.name == args['rule_name'])
        if args.get('priority'):
            alert_query = alert_query.filter(AlertRuleMeta.priority.in_(args['priority'].split(',')))
        if args.get('type'):
            alert_query = alert_query.filter(AlertRuleMeta.type.in_(args['type'].split(',')))
        alert_query = alert_query.order_by(AggAlertModel.last_trigger_time.desc())
        try:
            alert_count = alert_query.count()
            if args['limit'] != -1:
                alert_query = alert_query.limit(args['limit']).offset(args['offset'])
            alert_result = alert_query.all()
            data = {'items': [item.row_to_dict() for item in alert_result], 'total': alert_count}
        except Exception as e:
            return {'status': 'failed', 'message': getattr(e, 'message', repr(e))}, 500
        return {'status': 'success', 'data': data}, 200
```

ORM的model：

```py
class AggAlertModel(db.Model):
    __tablename__ = 'agg_alert'

    id = db.Column(db.Integer, primary_key=True)
    rule_id = db.Column(db.Integer, db.ForeignKey('alert_rules_meta.id'), nullable=False)
    rule = db.relationship("AlertRuleMeta", lazy="joined")
    count = db.Column(db.SmallInteger, nullable=False, default=0)
    status = db.Column(db.String(32), nullable=False, default='Triggered',
                       comment='Enum: Triggered, Acknowledged, Resolved')
    follower = db.Column(db.String(64), default='', nullable=False)
    rca = db.Column(db.TEXT, nullable=False, default='')
    first_trigger_time = db.Column(db.Integer, default=time.time, nullable=False)
    last_trigger_time = db.Column(db.Integer, default=time.time, nullable=False)
    resolve_time = db.Column(db.Integer, nullable=True)
    update_time = db.Column(db.Integer, default=time.time,
                            onupdate=time.time, nullable=False, comment='update time')
    labels = db.Column(db.String(1024), nullable=False, default='{}')
    channel_id = db.Column(db.String(64), nullable=False, default='')
    alert_ts = db.Column(db.String(64), nullable=False, default='')

    def row_to_dict(self):
        """Return object data in serializeable format"""
        return {
            'id': self.id,
            'count': self.count,
            'status': self.status,
            'follower': self.follower,
            'rca': self.rca,
            'first_trigger_time': self.first_trigger_time,
            'last_trigger_time': self.last_trigger_time,
            'resolve_time': self.resolve_time,
            'update_time': self.update_time,
            'priority': self.rule.priority,
            'summary': self.rule.name,
            'type': self.rule.type,
            'team': self.rule.team,
            'owner': self.rule.owner,
            'domain': self.rule.domain,
            'labels': {**json.loads(self.rule.labels), **(json.loads(self.labels) if self.labels else {})},
            'sop': self.rule.sop,
            'channel_id': self.channel_id,
            'alert_ts': self.alert_ts,
        }
```

`AlertRuleMeta`这个ORM的model就不贴了，反正就是通过`rule_id`这个外键来join的。

## Debugging

flask可以通过添加这个设置来把实际使用的sql语句打印出来，然后我们可以再通过对sql的性能做进一步分析：

```py
app.config['SQLALCHEMY_ECHO'] = True
```

然后我们来看一下具体使用了哪些sql，以及每个sql的耗时：

````
2022-02-23 11:51:46,635 INFO sqlalchemy.engine.base.Engine SELECT count(*) AS count_1 
FROM (SELECT agg_alert.id AS agg_alert_id, agg_alert.rule_id AS agg_alert_rule_id, agg_alert.count AS agg_alert_count, agg_alert.`status` AS agg_alert_status, agg_alert.follower AS agg_alert_follower, agg_alert.rca AS agg_alert_rca, agg_alert.first_trigger_time AS agg_alert_first_trigger_time, agg_alert.last_trigger_time AS agg_alert_last_trigger_time, agg_alert.resolve_time AS agg_alert_resolve_time, agg_alert.update_time AS agg_alert_update_time, agg_alert.labels AS agg_alert_labels, agg_alert.channel_id AS agg_alert_channel_id, agg_alert.alert_ts AS agg_alert_alert_ts 
FROM agg_alert INNER JOIN alert_rules_meta ON agg_alert.rule_id = alert_rules_meta.id 
WHERE agg_alert.last_trigger_time >= %(last_trigger_time_1)s AND agg_alert.last_trigger_time <= %(last_trigger_time_2)s AND alert_rules_meta.priority IN (%(priority_1)s, %(priority_2)s) ORDER BY agg_alert.last_trigger_time DESC) AS anon_1
2022-02-23 11:51:46,635 INFO sqlalchemy.engine.base.Engine {'last_trigger_time_1': 1642928019, 'last_trigger_time_2': 1645520019, 'priority_1': 'p1', 'priority_2': 'p2'}
2022-02-23 11:51:47,076 INFO sqlalchemy.engine.base.Engine SELECT agg_alert.id AS agg_alert_id, agg_alert.rule_id AS agg_alert_rule_id, agg_alert.count AS agg_alert_count, agg_alert.`status` AS agg_alert_status, agg_alert.follower AS agg_alert_follower, agg_alert.rca AS agg_alert_rca, agg_alert.first_trigger_time AS agg_alert_first_trigger_time, agg_alert.last_trigger_time AS agg_alert_last_trigger_time, agg_alert.resolve_time AS agg_alert_resolve_time, agg_alert.update_time AS agg_alert_update_time, agg_alert.labels AS agg_alert_labels, agg_alert.channel_id AS agg_alert_channel_id, agg_alert.alert_ts AS agg_alert_alert_ts 
FROM agg_alert INNER JOIN alert_rules_meta ON agg_alert.rule_id = alert_rules_meta.id 
WHERE agg_alert.last_trigger_time >= %(last_trigger_time_1)s AND agg_alert.last_trigger_time <= %(last_trigger_time_2)s AND alert_rules_meta.priority IN (%(priority_1)s, %(priority_2)s) ORDER BY agg_alert.last_trigger_time DESC 
 LIMIT %(param_1)s, %(param_2)s
2022-02-23 11:51:47,076 INFO sqlalchemy.engine.base.Engine {'last_trigger_time_1': 1642928019, 'last_trigger_time_2': 1645520019, 'priority_1': 'p1', 'priority_2': 'p2', 'param_1': 0, 'param_2': 20}
2022-02-23 11:51:47,563 INFO sqlalchemy.engine.base.Engine SELECT alert_rules_meta.id AS alert_rules_meta_id, alert_rules_meta.name AS alert_rules_meta_name, alert_rules_meta.description AS alert_rules_meta_description, alert_rules_meta.type AS alert_rules_meta_type, alert_rules_meta.sub_type AS alert_rules_meta_sub_type, alert_rules_meta.team AS alert_rules_meta_team, alert_rules_meta.domain AS alert_rules_meta_domain, alert_rules_meta.labels AS alert_rules_meta_labels, alert_rules_meta.enabled AS alert_rules_meta_enabled, alert_rules_meta.owner AS alert_rules_meta_owner, alert_rules_meta.sop AS alert_rules_meta_sop, alert_rules_meta.priority AS alert_rules_meta_priority, alert_rules_meta.create_time AS alert_rules_meta_create_time, alert_rules_meta.update_time AS alert_rules_meta_update_time 
FROM alert_rules_meta 
WHERE alert_rules_meta.id = %(param_1)s
2022-02-23 11:51:47,563 INFO sqlalchemy.engine.base.Engine {'param_1': 2442}
````

可以看到很神奇的，ORM进行了三次sql查询。前两次都是正常的，一次查count数目，一次查具体的分页后的各字段值，第三次就很诡异了，它去查了某个具体的`AlertRuleMeta`的记录。  
再仔细看第二次查询，可以看到它虽然做了join操作，但并没有把需要的`AlertRuleMeta`中的字段加到查询语句中，这也就导致了ORM不得不再去查一次所需要的具体的`AlertRuleMeta`表中的记录。因此，如果第二次查询的记录包含N个相关的`AlertRuleMeta`记录的话，它就会额外多查询N次！即使`alert_rules_meta.id`是有索引的，那也禁不住查询数量大啊。  
另外，还可以优化的地方是：

- 当`limit=-1`时，可以不用再查询一次count，因为不分页的查询结果总数就是所要的count值
- `AlertRuleMeta`表中有一些字段其实是不需要查询出来的，过滤掉可以节省数据传输的时间

## Optimization

优化后的api代码：

```py
class AlertCollection(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('priority')
    parser.add_argument('status')
    parser.add_argument('type')
    parser.add_argument('start')
    parser.add_argument('end')
    parser.add_argument('rule_id')
    parser.add_argument('rule_name')
    parser.add_argument('offset', type=int, default=0)
    parser.add_argument('limit', type=int, default=20)

    def get(self):
        args = self.parser.parse_args()
        logger.info('Get alert notification collection with params: {}'.format(args))
        # Only fetch the fields we want
        fields = [AggAlertModel.id, AggAlertModel.count, AggAlertModel.status, AggAlertModel.follower,
                  AggAlertModel.rca, AggAlertModel.first_trigger_time, AggAlertModel.last_trigger_time,
                  AggAlertModel.resolve_time, AggAlertModel.update_time, AggAlertModel.labels, AlertRuleMeta.name,
                  AlertRuleMeta.priority, AlertRuleMeta.type, AlertRuleMeta.team, AlertRuleMeta.owner,
                  AlertRuleMeta.domain, AlertRuleMeta.labels]
        alert_query = AggAlertModel.query.join(AlertRuleMeta, AggAlertModel.rule_id == AlertRuleMeta.id).add_columns(
            *fields)
        if args.get('rule_id'):
            alert_query = alert_query.filter(AggAlertModel.rule_id == args['rule_id'])
        if args.get('status'):
            alert_query = alert_query.filter(AggAlertModel.status.in_(args['status'].split(',')))
        if args.get('start'):
            alert_query = alert_query.filter(AggAlertModel.last_trigger_time >= int(args['start']))
        if args.get('end'):
            alert_query = alert_query.filter(AggAlertModel.last_trigger_time <= int(args['end']))
        if args.get('rule_name'):
            alert_query = alert_query.filter(AlertRuleMeta.name == args['rule_name'])
        if args.get('priority'):
            alert_query = alert_query.filter(AlertRuleMeta.priority.in_(args['priority'].split(',')))
        if args.get('type'):
            alert_query = alert_query.filter(AlertRuleMeta.type.in_(args['type'].split(',')))
        alert_query = alert_query.order_by(AggAlertModel.last_trigger_time.desc())
        try:
            alert_count = -1
            if args['limit'] != -1:
                # No need to query count when limit=-1
                alert_count = alert_query.count()
                alert_query = alert_query.limit(args['limit']).offset(args['offset'])
            alert_result = alert_query.all()
            if alert_count == -1:
                alert_count = len(alert_result)
            data = {'items': [item.AggAlert.row_to_dict() for item in alert_result], 'total': alert_count}
        except Exception as e:
            return {'status': 'failed', 'message': getattr(e, 'message', repr(e))}, 500
        return {'status': 'success', 'data': data}, 200
```

优化之后sql语句：

````
2022-02-23 10:43:10,926 INFO sqlalchemy.engine.base.Engine SELECT count(*) AS count_1 
FROM (SELECT agg_alert.id AS agg_alert_id, agg_alert.rule_id AS agg_alert_rule_id, agg_alert.count AS agg_alert_count, agg_alert.`status` AS agg_alert_status, agg_alert.follower AS agg_alert_follower, agg_alert.rca AS agg_alert_rca, agg_alert.first_trigger_time AS agg_alert_first_trigger_time, agg_alert.last_trigger_time AS agg_alert_last_trigger_time, agg_alert.resolve_time AS agg_alert_resolve_time, agg_alert.update_time AS agg_alert_update_time, agg_alert.labels AS agg_alert_labels, agg_alert.channel_id AS agg_alert_channel_id, agg_alert.alert_ts AS agg_alert_alert_ts, alert_rules_meta.name AS alert_rules_meta_name, alert_rules_meta.priority AS alert_rules_meta_priority, alert_rules_meta.type AS alert_rules_meta_type, alert_rules_meta.team AS alert_rules_meta_team, alert_rules_meta.owner AS alert_rules_meta_owner, alert_rules_meta.domain AS alert_rules_meta_domain, alert_rules_meta.labels AS alert_rules_meta_labels 
FROM agg_alert INNER JOIN alert_rules_meta ON agg_alert.rule_id = alert_rules_meta.id 
WHERE agg_alert.last_trigger_time >= %(last_trigger_time_1)s AND agg_alert.last_trigger_time <= %(last_trigger_time_2)s AND alert_rules_meta.priority IN (%(priority_1)s, %(priority_2)s) ORDER BY agg_alert.last_trigger_time DESC) AS anon_1
2022-02-23 10:43:10,926 INFO sqlalchemy.engine.base.Engine {'last_trigger_time_1': 1642928019, 'last_trigger_time_2': 1645520019, 'priority_1': 'p1', 'priority_2': 'p2'}
2022-02-23 10:43:11,380 INFO sqlalchemy.engine.base.Engine SELECT agg_alert.id AS agg_alert_id, agg_alert.rule_id AS agg_alert_rule_id, agg_alert.count AS agg_alert_count, agg_alert.`status` AS agg_alert_status, agg_alert.follower AS agg_alert_follower, agg_alert.rca AS agg_alert_rca, agg_alert.first_trigger_time AS agg_alert_first_trigger_time, agg_alert.last_trigger_time AS agg_alert_last_trigger_time, agg_alert.resolve_time AS agg_alert_resolve_time, agg_alert.update_time AS agg_alert_update_time, agg_alert.labels AS agg_alert_labels, agg_alert.channel_id AS agg_alert_channel_id, agg_alert.alert_ts AS agg_alert_alert_ts, alert_rules_meta.name AS alert_rules_meta_name, alert_rules_meta.priority AS alert_rules_meta_priority, alert_rules_meta.type AS alert_rules_meta_type, alert_rules_meta.team AS alert_rules_meta_team, alert_rules_meta.owner AS alert_rules_meta_owner, alert_rules_meta.domain AS alert_rules_meta_domain, alert_rules_meta.labels AS alert_rules_meta_labels, alert_rules_meta_1.id AS alert_rules_meta_1_id, alert_rules_meta_1.name AS alert_rules_meta_1_name, alert_rules_meta_1.description AS alert_rules_meta_1_description, alert_rules_meta_1.type AS alert_rules_meta_1_type, alert_rules_meta_1.sub_type AS alert_rules_meta_1_sub_type, alert_rules_meta_1.team AS alert_rules_meta_1_team, alert_rules_meta_1.domain AS alert_rules_meta_1_domain, alert_rules_meta_1.labels AS alert_rules_meta_1_labels, alert_rules_meta_1.enabled AS alert_rules_meta_1_enabled, alert_rules_meta_1.owner AS alert_rules_meta_1_owner, alert_rules_meta_1.sop AS alert_rules_meta_1_sop, alert_rules_meta_1.priority AS alert_rules_meta_1_priority, alert_rules_meta_1.create_time AS alert_rules_meta_1_create_time, alert_rules_meta_1.update_time AS alert_rules_meta_1_update_time 
FROM agg_alert INNER JOIN alert_rules_meta ON agg_alert.rule_id = alert_rules_meta.id LEFT OUTER JOIN alert_rules_meta AS alert_rules_meta_1 ON alert_rules_meta_1.id = agg_alert.rule_id 
WHERE agg_alert.last_trigger_time >= %(last_trigger_time_1)s AND agg_alert.last_trigger_time <= %(last_trigger_time_2)s AND alert_rules_meta.priority IN (%(priority_1)s, %(priority_2)s) ORDER BY agg_alert.last_trigger_time DESC 
 LIMIT %(param_1)s, %(param_2)s
2022-02-23 10:43:11,380 INFO sqlalchemy.engine.base.Engine {'last_trigger_time_1': 1642928019, 'last_trigger_time_2': 1645520019, 'priority_1': 'p1', 'priority_2': 'p2', 'param_1': 0, 'param_2': 20}
````

耗时从8s减少到了2.6s，性能提示了3倍。