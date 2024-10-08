---
layout: post
title: "How to make a self-retrigger DAG in Airflow"
category: Framework
tags: [Airflow]
date: 2024-09-29
---

## Background

I have a DAG which may run several hours to finish. The DAG is used to run a Spark job and generate some data. Now I want to do some data backfill - run the DAG about 500 times.  
Of course, I can write a script to do so. But I will need to deploy that script to a place which can continuously run it without failure - otherwise I need to check it time by time and restart the script when unexpected error happens. As putting the script to a production env is not easy, I need to use a proxy to trigger the production Airflow. The Proxy token expired every 12 hours, which means I need to refresh it manually (use my Yubikey) - twice a day!

## Solution

I've used `TriggerDagRunOperator` to trigger other DAGs in Airflow. So why not use this operator to trigger the DAG itself when last run finished?

This is the final DAG:

```py
with DAG(
        'self_reterigger_backfill',
        default_args={
            'depends_on_past': False,
            'email': EMAIL_LIST,
            'email_on_failure': True,
            'email_on_retry': False,
            'retries': 0,
            'execution_timeout': timedelta(hours=12),
        },
        params={
            'date': (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'),
            'end_date': (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'),
        },
        dagrun_timeout=timedelta(hours=12),
        description='Backfill job',
        schedule_interval=None,
        start_date=datetime(2023, 12, 10),
        catchup=False,
        # Make sure only one backfill task is running
        max_active_runs=1,
        tags=['recstrk'],
) as dag:
    trigger_gmb_attribution = TriggerDagRunOperator(
        task_id='trigger_gmb_attribution',
        trigger_dag_id='gmb_attribution',
        conf={
            'date': "{{ params.date }}",
            'isProduction': 'true',
        },
        wait_for_completion=True,
        trigger_rule=TriggerRule.NONE_FAILED,
    )

    trigger_backfill = TriggerDagRunOperator(
        task_id='trigger_backfill',
        trigger_dag_id='self_reterigger_backfill',
        conf={
            'date': "{{ macros.ds_add(params.date,1) }}",
            'end_date': "{{ params.end_date }}",
        },
        wait_for_completion=False,
        trigger_rule=TriggerRule.ALL_DONE,
        trigger_run_id="self_reterigger_backfill_{{ macros.ds_add(params.date,1) }}",
        # Use different execution date to bypass exist DAG run check
        execution_date="{{ (macros.datetime.now() + macros.timedelta(minutes=1)).isoformat() }}",
    )

    stop_task = DummyOperator(
        task_id='stop_task',
        dag=dag,
    )


    def should_continue(**kwargs):
        # Define the target end date
        end_date = datetime.strptime(kwargs['params']['end_date'], '%Y-%m-%d')

        # Get the current params.date
        current_date_str = kwargs['params']['date']
        current_date = datetime.strptime(current_date_str, '%Y-%m-%d')

        # Compare dates
        if current_date >= end_date:
            return 'stop_task'
        else:
            return 'trigger_backfill'


    check_date_task = BranchPythonOperator(
        task_id='check_date_task',
        provide_context=True,
        python_callable=should_continue,
        dag=dag,
        trigger_rule=TriggerRule.ALL_DONE,
    )

    trigger_gmb_attribution >> check_date_task >> [trigger_backfill, stop_task]
```

The DAG will add the `date` parameter by 1 day after each run, and stops until reaching the `end_date`.

The 2nd `TriggerDagRunOperator` is used to trigger the DAG itself:

- In `conf`, the `date` parameter is added for next run
- `wait_for_completion` is set to `False` to make the current DAG finished before next run
- `trigger_rule` is set to `all_done` - means no matter before tasks are success, failed or skipped, the next run should always be triggered
- `trigger_run_id` is set to a new value, otherwise the Airflow will raise `DagRunAlreadyExists` exception
- `execution_date` is also set to a new value to avoid the `DagRunAlreadyExists` exception (checked the [Airflow source code](https://github.com/apache/airflow/blob/509f15eab1436233368a2297c89efc1d5881c44a/airflow/models/dagrun.py#L520), it uses run id **or** execute date for the SQL query)

It's also very easy to cancel/stop the backfill task. You can just mark the current running task as success/failed state when the last sub task is running. In this way, the sub task will still run to finish as we only mark the outside task as sucess/failed.

<!--break-->

## Enhancement - Run on given dates

Sometimes, we may need to backfill some specific dates (e.g. the job is not stable, and failed in some dates) instead of a date range. To do so, let's add an extra parameter `select_dates` and make the backfill DAG run on given dates when this parameter is provided (and ignore the `end_date` parameter).

Here're the changed parts:

```py
    trigger_backfill = TriggerDagRunOperator(
        task_id='trigger_backfill',
        trigger_dag_id='self_reterigger_backfill',
        conf={
            'date': "{{ ti.xcom_pull(task_ids='check_date_task', key='next_date') }}",
            'end_date': "{{ params.end_date }}",
            'select_dates': "{{ params.select_dates }}",
            'pageIds': "{{ params.pageIds }}",
            'skipIdlParquet': "{{ params.skipIdlParquet }}",
            'skipIfExist': "{{ params.skipIfExist }}",
        },
        wait_for_completion=False,
        trigger_rule=TriggerRule.ALL_DONE,
        trigger_run_id="self_reterigger_backfill_{{ ti.xcom_pull(task_ids='check_date_task', key='next_date') }}_{{ macros.uuid.uuid4() }}",
        # Use different execution date to bypass exist DAG run check
        execution_date="{{ (macros.datetime.now() + macros.timedelta(minutes=1)).isoformat() }}",
    )


    def should_continue(**kwargs):
        # Define the target end date
        end_date = datetime.strptime(kwargs['params']['end_date'], '%Y-%m-%d')

        # Get the current params.date
        current_date_str = kwargs['params']['date']
        current_date = datetime.strptime(current_date_str, '%Y-%m-%d')

        select_dates = kwargs['params']['select_dates'].split(',')
        # If select_dates is not empty, we only run the selected dates
        if select_dates:
            index = 0
            for s in select_dates:
                index += 1
                if s == current_date_str:
                    break
            next_date = select_dates[index] if index < len(select_dates) else ''
            kwargs['ti'].xcom_push(key='next_date', value=next_date)
            return 'trigger_backfill' if next_date else 'stop_task'
        else:
            next_date = (current_date + timedelta(days=1)).strftime('%Y-%m-%d')
            kwargs['ti'].xcom_push(key='next_date', value=next_date)
            # Compare dates
            if current_date >= end_date:
                return 'stop_task'
            else:
                return 'trigger_backfill'
```

In `should_continue`, I checked the `selected_dates` and if it is provided, I tried to find the position of current `date` in it. And then specify the next running date from the `selected_date`. If it is the last one in the `selected_dates`, the `stop_task` will be triggered instead. Since there's easy way to use macros function to handle the logic. I put it in the Python code and pass the calculated next date by Airflow xcom state.