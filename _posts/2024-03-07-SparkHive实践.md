---
layout: post
title: "Spark/Hive实践"
category: Framework
tags: [Spark, Hive, 心得, debug]
date: 2024-03-07
---

## How to Debug in local

### Prerequisites

Download Spark 3.1.1 (use the same version of your production env) with Hadoop 3.2 in [https://archive.apache.org/dist/spark/spark-3.1.1/](https://archive.apache.org/dist/spark/spark-3.1.1/) to local.

### Debug

1. Go into `sbt` shell. For any code change, just type `assembly`, it will compile and assemble the jar package
2. Since it's hard to read production Hive table from local, we can use some intermediate result to test our Spark job logic. To do so, generate some data in the production env, save as parquet file and then download to local. In the Spark job, comment the reading data logic and read it from a local file instead like:

   ```scala
   val result = spark.read.parquet("""/your/local/path/test.parquet""")
   ```

   You can also save the results as csv files, read it like:

   ```scala
   val nameMappingTable: Dataset[NameMapping] = spark.read
     .option("header", "true")
     .schema(Encoders.product[NameMapping].schema)
     .csv("/you/local/path/test.csv").as[NameMapping]
   ```

3. Submit job using local Spark binary:

   ```bash
   ./bin/spark-submit \
   --class your.job.EntryClass \
   /your/local/path/your-spark-job.jar \
   --params1 xxx \
   --params2 xxx
   ```

4. Check the result:

   **Note**: to inspect parquet file, you can install [parquet-cli](https://github.com/apache/parquet-mr/tree/master/parquet-cli), by:

   ```bash
   brew install parquet-cli
   ```

   Then:

   ```bash
   parquet meta /path/to/your/target.gz.parquet
   ```


## How to load data from parquet file to Hive table

### Solution 1

一种方式是用load命令：

```sql
LOAD DATA INPATH '/my/path/parquet' INTO TABLE my_table;
```

实测下来load在我们那会报错，所以最后用了insert：

```sql
INSERT OVERWRITE TABLE my_table PARTITION(DT='20240403') 
SELECT * FROM parquet.`viewfs://my/path/parquet`
```

其中，使用`INSERT OVERWRITE`会覆盖相同partition下的数据，而`INSERT INTO`则不会覆盖。后面的select语句需要保证column的顺序和table创建时的schema一致，缺少的字段可以手动添加为`NULL`，因为insert是通过位置来写入的。

**Note:**  
Spark SQL里面的`saveAsTable`在overwrite模式下是会先drop table再根据data frame的schema重新创建table，所以不能用于这里的数据加载。

### Solution 2

使用scala来insert，如果希望是按照partition来覆盖的话，需要在spark conf里面配置：

```scala
val sparkConf: SparkConf = new SparkConf().setAppName(AppName)
 .setAll(Seq(
   "spark.sql.sources.partitionOverwriteMode" -> "dynamic",
   "hive.exec.dynamic.partition.mode" -> "nonstrict",
 ))
```

然后再insert到指定的Hive table：

```scala
resultDf.write.mode(SaveMode.Overwrite).format("parquet")
  .insertInto(targetTable)
```

<!--break-->

## How to troubleshoot when no results are saved

I have a spark job which execute some pure sql using `SparkSession.sql` function, the final sql is to insert into a table. However the result count is 0. The sql works when executing them in sql Client like Kyuubi.

### Solution

1. Check error log
2. If there's no error, check spark job in spark history server, e.g. https://your-spark-host:8080/history/application_1714733275733_966743/1/
3. Check sql execution DAG in: 

   <img title="2024-10-08-SparkHive实践-1.png" src="/images/2024-10-08-SparkHive实践-1.png" width="1648" />

   <span class="caption">Check sql execution DAG</span>

   In the DAG, it will show the result count of each stage, you can check after which stage, there's no result count, e.g.

   <img title="2024-10-08-SparkHive实践.png" src="/images/2024-10-08-SparkHive实践.png" width="1156" />

   <span class="caption">Spark SQL execution DAG</span>


## How to read csv file with array type column

For example, the column value could be:

````
["a", "b", "c"]
````

默认情况下，由于逗号的存在，column的值会被截断，比如成为：

````
"[\"a\""
````

所以我们需要对csv文件做一些预处理，比如:

### Solution1：把默认的分隔符从`,` 改为`|`

读取时也同样增加一些配置：

```scala
val df = spark.read
.option("header", "true") // Use first line of all files as header
.option("inferSchema", "true") // Automatically infer schemas
.option("delimiter", "|") // Use the custom delimiter
.csv(filePath)
```

### Solution2：把包含逗号的值放在引号中

### Solution3：把包含逗号的列中的逗号用其他符号代替，比如`|`

处理完之后变成：

````
["a"|"b"|"c"]
````

读取后再对相关列做额外处理：

```scala
df = df.withColumn("target_column", split(regexp_replace(col("target_column"), "\\[|\\]|\"", ""), "\\|"))
```