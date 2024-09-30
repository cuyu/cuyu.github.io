***

layout: post
title: "Handle Option type in Scala"
category: Scala
tags: [语法糖]
date: 2024-06-21
----------------

## match

The basic way to handle Option type is using `match`:

```scala
val nameMaybe: Option[String] = Some("Yu")
val newName: Option[String] = nameMaybe match {
  case Some(name) =>
    Some(name.trim.toUppercase)
  case None =>
    None
}
```

## map, flatMap, filter

If we use `map`, `flatMap`, `filter` for an Option type, it transforms the content of the `Option` if it is `Some(value)`, leaving it unchanged if it is `None`. The result of these functions is still an Option type.

The above example could simply be like this:

```scala
val nameMaybe: Option[String] = Some("Yu")
val newName: Option[String] = nameMaybe.map(_.trim.toUppercase)
```

Another complex example:

```scala
val maybeListOfStrings: Option[List[String]] = Some(List("Hello", "World", "!"))

val joinedStringOption: Option[String] = maybeListOfStrings.map(_.mkString(" "))
```

Here, the `_.mkString(" ")` is applied to the List in the Option type. **The** **`map`**  **is not used for iterate the List, but process the value in the Option type.**

To iterate the elements, we need to use another `map` function in the first `map`:

```scala
val processedListOfStrings: Option[List[String]] = maybeListOfStrings.map(_.map(_.toUpperCase))
```
