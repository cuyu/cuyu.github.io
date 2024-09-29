---
layout: post
title: "How to trigger tasks conditionally in Airflow"
category: Framework
tags: [Airflow]
date: 2024-09-29
---

I have 3 tasks, and I want to trigger `[t1, t2] >> t3` in condition A, and `t2 >> t3` for condition B, i.e. skip `t1` conditionally.

## Solution

1. Add params in DAG:

   ```py
   with DAG(
       params={
           'skipTask1': 'false',
       },
   ) as dag:
   ```

2. Add a branching task as we cannot check params dynamically in DAGs declaration. And set `trigger_rule` to `none_failed` or `none_failed_min_one_success` for task `t3`, otherwise `t3` will also be skipped as it only be triggered when all upstream tasks in `success` state by default. For `NONE_FAILED`, the task will be triggered if all upstream tasks not in `failed` state (i.e. `success` or `skipped`).

   ```py
   from airflow.operators.python import BranchPythonOperator
   from airflow.operators.dummy_operator import DummyOperator
   from airflow.utils.trigger_rule import TriggerRule
   
   with DAG(
       params={
           'skipTask1': 'false',
       },
   ) as dag:
   
       t1 = DummyOperator(task_id='t1')
       t2 = DummyOperator(task_id='t2')
       t3 = DummyOperator(task_id='t3', trigger_rule=TriggerRule.NONE_FAILED)
   
       def branch_func(**kwargs):
           if kwargs['params']['skipTask1'] == 'false':
               return ['t1', 't2', 't3']
           else:
               return ['t2', 't3']
   
       branching = BranchPythonOperator(
       task_id='branching',
       python_callable=branch_func,
       dag=dag)
       branching >> [t1, t2] >> t3
       branching >> t2 >> t3
   ```


Refer to [https://airflow.apache.org/docs/apache-airflow/2.9.1/core-concepts/dags.html](https://airflow.apache.org/docs/apache-airflow/2.9.1/core-concepts/dags.html)