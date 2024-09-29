---
layout: post
title: "Escape % in pymysql"
category: Database
tags: [MySQL]
date: 2024-09-29
---

想要用pymysql执行类似如下的sql查询，却碰到这样的error：

```sql
select * from rules where `sql` LIKE '%dad%'
```

````
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 3, in exec_sql
  File "/usr/local/lib/python3.8/site-packages/sqlalchemy/engine/base.py", line 1003, in execute
    return self._execute_text(object_, multiparams, params)
  File "/usr/local/lib/python3.8/site-packages/sqlalchemy/engine/base.py", line 1172, in _execute_text
    ret = self._execute_context(
  File "/usr/local/lib/python3.8/site-packages/sqlalchemy/engine/base.py", line 1316, in _execute_context
    self._handle_dbapi_exception(
  File "/usr/local/lib/python3.8/site-packages/sqlalchemy/engine/base.py", line 1514, in _handle_dbapi_exception
    util.raise_(exc_info[1], with_traceback=exc_info[2])
  File "/usr/local/lib/python3.8/site-packages/sqlalchemy/util/compat.py", line 182, in raise_
    raise exception
  File "/usr/local/lib/python3.8/site-packages/sqlalchemy/engine/base.py", line 1276, in _execute_context
    self.dialect.do_execute(
  File "/usr/local/lib/python3.8/site-packages/sqlalchemy/engine/default.py", line 609, in do_execute
    cursor.execute(statement, parameters)
  File "/usr/local/lib/python3.8/site-packages/pymysql/cursors.py", line 146, in execute
    query = self.mogrify(query, args)
  File "/usr/local/lib/python3.8/site-packages/pymysql/cursors.py", line 125, in mogrify
    query = query % self._escape_args(args, conn)
TypeError: %d format: a number is required, not dict
````

原因是%在pymysql有特别的含义，可以通过增加一个`%`来escape：

```sql
select * from rules where `sql` LIKE '%%dad%%'
```